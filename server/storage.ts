import {
  users,
  courses,
  modules,
  lessons,
  exercises,
  enrollments,
  lessonProgress,
  exerciseProgress,
  badges,
  posts,
  comments,
  surfCamps,
  campRegistrations,
  certificates,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type Module,
  type InsertModule,
  type Lesson,
  type InsertLesson,
  type Exercise,
  type InsertExercise,
  type Enrollment,
  type InsertEnrollment,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type SurfCamp,
  type InsertSurfCamp,
  type CampRegistration,
  type InsertCampRegistration,
  type Certificate,
  type InsertCertificate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Module operations
  getModulesByCourse(courseId: string): Promise<(Module & { lessons: Lesson[] })[]>;
  createModule(module: InsertModule): Promise<Module>;
  
  // Lesson operations
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Exercise operations
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Enrollment operations
  getEnrollmentsBySortedByUser(userId: string): Promise<(Enrollment & { course: Course })[]>;
  getEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(id: string, progress: number): Promise<void>;
  
  // Lesson progress operations
  getLessonProgressByUser(userId: string, lessonId: string): Promise<any>;
  markLessonComplete(userId: string, lessonId: string): Promise<void>;
  
  // Exercise progress operations
  getExerciseProgressByUser(userId: string): Promise<any[]>;
  createOrUpdateExerciseProgress(userId: string, exerciseId: string, completedValue: number, completed: boolean): Promise<void>;
  
  // Badge operations
  getBadgesByUser(userId: string): Promise<any[]>;
  awardBadge(userId: string, badgeType: string, badgeName: string, badgeIcon?: string): Promise<void>;
  
  // Post operations
  getAllPosts(level?: string): Promise<(Post & { user: User; _count: { comments: number } })[]>;
  createPost(post: InsertPost): Promise<Post>;
  
  // Comment operations
  getCommentsByPost(postId: string): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Surf camp operations
  getAllSurfCamps(): Promise<SurfCamp[]>;
  getSurfCamp(id: string): Promise<SurfCamp | undefined>;
  createSurfCamp(camp: InsertSurfCamp): Promise<SurfCamp>;
  updateSurfCampSpots(id: string, availableSpots: number): Promise<void>;
  
  // Camp registration operations
  getCampRegistrationsByUser(userId: string): Promise<CampRegistration[]>;
  createCampRegistration(registration: InsertCampRegistration): Promise<CampRegistration>;
  
  // Certificate operations
  getCertificateByUserAndCourse(userId: string, courseId: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificatesByUser(userId: string): Promise<(Certificate & { course: Course })[]>;
}

export class DatabaseStorage implements IStorage {
  // ========== User Operations ==========
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // ========== Course Operations ==========
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(desc(courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  // ========== Module Operations ==========
  async getModulesByCourse(courseId: string): Promise<(Module & { lessons: Lesson[] })[]> {
    const courseModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.orderIndex);

    const result = await Promise.all(
      courseModules.map(async (module) => {
        const moduleLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, module.id))
          .orderBy(lessons.orderIndex);
        
        return {
          ...module,
          lessons: moduleLessons,
        };
      })
    );

    return result;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  // ========== Lesson Operations ==========
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  // ========== Exercise Operations ==========
  async getAllExercises(): Promise<Exercise[]> {
    return await db.select().from(exercises).orderBy(desc(exercises.createdAt));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
    return exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  // ========== Enrollment Operations ==========
  async getEnrollmentsBySortedByUser(userId: string): Promise<(Enrollment & { course: Course })[]> {
    const userEnrollments = await db
      .select({
        enrollment: enrollments,
        course: courses,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return userEnrollments.map(({ enrollment, course }) => ({
      ...enrollment,
      course,
    }));
  }

  async getEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollmentProgress(id: string, progress: number): Promise<void> {
    await db
      .update(enrollments)
      .set({ progress, completedAt: progress === 100 ? new Date() : null })
      .where(eq(enrollments.id, id));
  }

  // ========== Lesson Progress Operations ==========
  async getLessonProgressByUser(userId: string, lessonId: string): Promise<any> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)));
    return progress;
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<void> {
    await db.insert(lessonProgress).values({
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    }).onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  // ========== Exercise Progress Operations ==========
  async getExerciseProgressByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(exerciseProgress)
      .where(eq(exerciseProgress.userId, userId))
      .orderBy(desc(exerciseProgress.createdAt));
  }

  async createOrUpdateExerciseProgress(
    userId: string,
    exerciseId: string,
    completedValue: number,
    completed: boolean
  ): Promise<void> {
    await db.insert(exerciseProgress).values({
      userId,
      exerciseId,
      completedValue,
      completed,
      completedAt: completed ? new Date() : null,
    }).onConflictDoUpdate({
      target: [exerciseProgress.userId, exerciseProgress.exerciseId],
      set: {
        completedValue,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  // ========== Badge Operations ==========
  async getBadgesByUser(userId: string): Promise<any[]> {
    return await db.select().from(badges).where(eq(badges.userId, userId)).orderBy(desc(badges.earnedAt));
  }

  async awardBadge(userId: string, badgeType: string, badgeName: string, badgeIcon?: string): Promise<void> {
    await db.insert(badges).values({
      userId,
      badgeType,
      badgeName,
      badgeIcon,
    });
  }

  // ========== Post Operations ==========
  async getAllPosts(level?: string): Promise<(Post & { user: User; _count: { comments: number } })[]> {
    const allPosts = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    // Get comment counts for each post
    const postsWithCounts = await Promise.all(
      allPosts.map(async ({ post, user }) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, post.id));
        
        return {
          ...post,
          user,
          _count: {
            comments: Number(countResult?.count || 0),
          },
        };
      })
    );

    return postsWithCounts;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  // ========== Comment Operations ==========
  async getCommentsByPost(postId: string): Promise<(Comment & { user: User })[]> {
    const postComments = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    return postComments.map(({ comment, user }) => ({
      ...comment,
      user,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  // ========== Surf Camp Operations ==========
  async getAllSurfCamps(): Promise<SurfCamp[]> {
    return await db.select().from(surfCamps).orderBy(surfCamps.startDate);
  }

  async getSurfCamp(id: string): Promise<SurfCamp | undefined> {
    const [camp] = await db.select().from(surfCamps).where(eq(surfCamps.id, id));
    return camp;
  }

  async createSurfCamp(camp: InsertSurfCamp): Promise<SurfCamp> {
    const [newCamp] = await db.insert(surfCamps).values(camp).returning();
    return newCamp;
  }

  async updateSurfCampSpots(id: string, availableSpots: number): Promise<void> {
    await db.update(surfCamps).set({ availableSpots }).where(eq(surfCamps.id, id));
  }

  // ========== Camp Registration Operations ==========
  async getCampRegistrationsByUser(userId: string): Promise<CampRegistration[]> {
    return await db
      .select()
      .from(campRegistrations)
      .where(eq(campRegistrations.userId, userId))
      .orderBy(desc(campRegistrations.registeredAt));
  }

  async createCampRegistration(registration: InsertCampRegistration): Promise<CampRegistration> {
    const [newRegistration] = await db.insert(campRegistrations).values(registration).returning();
    return newRegistration;
  }

  // ========== Certificate Operations ==========
  async getCertificateByUserAndCourse(userId: string, courseId: string): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)));
    return certificate;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values(certificate).returning();
    return newCertificate;
  }

  async getCertificatesByUser(userId: string): Promise<(Certificate & { course: Course })[]> {
    const userCertificates = await db
      .select({
        certificate: certificates,
        course: courses,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));

    return userCertificates.map(({ certificate, course }) => ({
      ...certificate,
      course,
    }));
  }
}

export const storage = new DatabaseStorage();
