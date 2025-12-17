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
  certificates,
  purchases,
  memberships,
  referralCodes,
  referralEarnings,
  heroSlides,
  pageHeaders,
  customPages,
  pageBlocks,
  newsletterContacts,
  newsletterCampaigns,
  newsletterEvents,
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
  type Certificate,
  type InsertCertificate,
  type Purchase,
  type InsertPurchase,
  type Membership,
  type InsertMembership,
  type ReferralCode,
  type InsertReferralCode,
  type ReferralEarning,
  type InsertReferralEarning,
  type HeroSlide,
  type InsertHeroSlide,
  type PageHeader,
  type InsertPageHeader,
  type CustomPage,
  type InsertCustomPage,
  type PageBlock,
  type InsertPageBlock,
  type NewsletterContact,
  type InsertNewsletterContact,
  type NewsletterCampaign,
  type InsertNewsletterCampaign,
  type NewsletterEvent,
  type InsertNewsletterEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth + local auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profile: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>>): Promise<User>;

  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  // Module operations
  getModulesByCourse(courseId: string): Promise<(Module & { lessons: Lesson[] })[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<InsertModule>): Promise<Module>;
  deleteModule(id: string): Promise<void>;
  
  // Lesson operations
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  
  // Exercise operations
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  
  // Enrollment operations
  getEnrollmentsBySortedByUser(userId: string): Promise<(Enrollment & { course: Course })[]>;
  getEnrollmentByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollmentProgress(id: string, progress: number): Promise<void>;
  getAllEnrollmentsWithDetails(): Promise<(Enrollment & { user: User; course: Course })[]>;
  
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
  
  // Certificate operations
  getCertificateByUserAndCourse(userId: string, courseId: string): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificatesByUser(userId: string): Promise<(Certificate & { course: Course })[]>;
  
  // Purchase operations
  getPurchasesByUser(userId: string): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  hasPurchasedCourse(userId: string, courseId: string): Promise<boolean>;
  
  // Membership operations
  getMembershipByUser(userId: string): Promise<Membership | undefined>;
  getActiveMembershipByUser(userId: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembershipStatus(id: string, status: string, endDate?: Date, cancelAtPeriodEnd?: boolean): Promise<Membership>;
  
  // Referral operations
  getReferralCodeByUser(userId: string): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  createReferralCode(code: InsertReferralCode): Promise<ReferralCode>;
  getReferralEarningsByUser(userId: string): Promise<ReferralEarning[]>;
  createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning>;
  getWavePointsBalance(userId: string): Promise<number>;
  
  // Access control
  canAccessCourse(userId: string, courseId: string): Promise<boolean>;
  
  // Hero slide operations
  getAllHeroSlides(): Promise<HeroSlide[]>;
  getActiveHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: string): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide>;
  deleteHeroSlide(id: string): Promise<void>;
  reorderHeroSlides(slides: { id: string; orderIndex: number }[]): Promise<void>;
  
  // Page header operations (for existing pages)
  getAllPageHeaders(): Promise<PageHeader[]>;
  getPageHeader(page: string): Promise<PageHeader | undefined>;
  upsertPageHeader(header: InsertPageHeader): Promise<PageHeader>;
  deletePageHeader(page: string): Promise<void>;
  
  // Image URL migration helper
  updateImageUrls(fileId: string, newUrl: string): Promise<void>;
  
  // Custom page operations
  getAllCustomPages(publishedOnly?: boolean): Promise<CustomPage[]>;
  getCustomPageBySlug(slug: string): Promise<CustomPage | undefined>;
  getCustomPage(id: string): Promise<CustomPage | undefined>;
  createCustomPage(page: InsertCustomPage): Promise<CustomPage>;
  updateCustomPage(id: string, page: Partial<InsertCustomPage>): Promise<CustomPage>;
  deleteCustomPage(id: string): Promise<void>;
  
  // Page block operations
  getBlocksByCustomPage(customPageId: string): Promise<PageBlock[]>;
  createPageBlock(block: InsertPageBlock): Promise<PageBlock>;
  updatePageBlock(id: string, block: Partial<InsertPageBlock>): Promise<PageBlock>;
  deletePageBlock(id: string): Promise<void>;
  reorderPageBlocks(blocks: { id: string; orderIndex: number }[]): Promise<void>;
  
  // Newsletter contact operations
  getAllNewsletterContacts(status?: string): Promise<NewsletterContact[]>;
  getNewsletterContactByEmail(email: string): Promise<NewsletterContact | undefined>;
  getNewsletterContactById(id: string): Promise<NewsletterContact | undefined>;
  getNewsletterContactByToken(token: string, tokenType: 'confirm' | 'unsubscribe'): Promise<NewsletterContact | undefined>;
  createNewsletterContact(contact: InsertNewsletterContact): Promise<NewsletterContact>;
  updateNewsletterContact(id: string, contact: Partial<NewsletterContact>): Promise<NewsletterContact>;
  confirmNewsletterContact(token: string): Promise<NewsletterContact | undefined>;
  unsubscribeNewsletterContact(token: string): Promise<NewsletterContact | undefined>;
  deleteNewsletterContact(id: string): Promise<void>;
  getContactsByTags(tags: string[]): Promise<NewsletterContact[]>;
  
  // Newsletter campaign operations
  getAllNewsletterCampaigns(): Promise<NewsletterCampaign[]>;
  getNewsletterCampaign(id: string): Promise<NewsletterCampaign | undefined>;
  createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign>;
  updateNewsletterCampaign(id: string, campaign: Partial<NewsletterCampaign>): Promise<NewsletterCampaign>;
  deleteNewsletterCampaign(id: string): Promise<void>;
  getScheduledCampaigns(): Promise<NewsletterCampaign[]>;
  
  // Newsletter event operations
  createNewsletterEvent(event: InsertNewsletterEvent): Promise<NewsletterEvent>;
  getEventsByCampaign(campaignId: string): Promise<NewsletterEvent[]>;
  getEventsByContact(contactId: string): Promise<NewsletterEvent[]>;
}

export class DatabaseStorage implements IStorage {
  // ========== User Operations ==========
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateUserProfile(id: string, profile: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // ========== Course Operations ==========
  async getAllCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(
        sql`CASE 
          WHEN ${courses.courseCategory} = 'remata' THEN 1
          WHEN ${courses.courseCategory} = 'takeoff' THEN 2
          WHEN ${courses.courseCategory} = 'noseride' THEN 3
          WHEN ${courses.courseCategory} = 'gratuiti' THEN 4
          WHEN ${courses.courseCategory} = 'special' THEN 5
          ELSE 6
        END`
      );
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, courseData: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
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

  async updateModule(id: string, module: Partial<InsertModule>): Promise<Module> {
    const [updatedModule] = await db
      .update(modules)
      .set(module)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  // ========== Lesson Operations ==========
  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.orderIndex);
  }
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lessonData: Partial<InsertLesson>): Promise<Lesson> {
    const [updatedLesson] = await db
      .update(lessons)
      .set({ ...lessonData, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
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

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise> {
    const [updatedExercise] = await db
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, id))
      .returning();
    return updatedExercise;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
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

  async getAllEnrollmentsWithDetails(): Promise<(Enrollment & { user: User; course: Course })[]> {
    const allEnrollments = await db
      .select({
        enrollment: enrollments,
        user: users,
        course: courses,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.enrolledAt));

    return allEnrollments.map(({ enrollment, user, course }) => ({
      ...enrollment,
      user,
      course,
    }));
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

  // ========== Purchase Operations ==========
  async getPurchasesByUser(userId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.userId, userId))
      .orderBy(desc(purchases.purchasedAt));
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    const [newPurchase] = await db.insert(purchases).values(purchase).returning();
    return newPurchase;
  }

  async hasPurchasedCourse(userId: string, courseId: string): Promise<boolean> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.courseId, courseId)))
      .limit(1);
    return !!purchase;
  }

  // ========== Membership Operations ==========
  async getMembershipByUser(userId: string): Promise<Membership | undefined> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .orderBy(desc(memberships.createdAt))
      .limit(1);
    return membership;
  }

  async getActiveMembershipByUser(userId: string): Promise<Membership | undefined> {
    const now = new Date();
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.status, 'active'),
          sql`${memberships.endDate} IS NULL OR ${memberships.endDate} > ${now}`
        )
      )
      .limit(1);
    return membership;
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [newMembership] = await db.insert(memberships).values(membership).returning();
    return newMembership;
  }

  async updateMembershipStatus(
    id: string,
    status: string,
    endDate?: Date,
    cancelAtPeriodEnd?: boolean
  ): Promise<Membership> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    if (endDate !== undefined) updateData.endDate = endDate;
    if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;

    const [updatedMembership] = await db
      .update(memberships)
      .set(updateData)
      .where(eq(memberships.id, id))
      .returning();
    return updatedMembership;
  }

  // ========== Referral Operations ==========
  async getReferralCodeByUser(userId: string): Promise<ReferralCode | undefined> {
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);
    return code;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1);
    return referralCode;
  }

  async createReferralCode(codeData: InsertReferralCode): Promise<ReferralCode> {
    const [newCode] = await db.insert(referralCodes).values(codeData).returning();
    return newCode;
  }

  async getReferralEarningsByUser(userId: string): Promise<ReferralEarning[]> {
    return await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.userId, userId))
      .orderBy(desc(referralEarnings.createdAt));
  }

  async createReferralEarning(earning: InsertReferralEarning): Promise<ReferralEarning> {
    const [newEarning] = await db.insert(referralEarnings).values(earning).returning();
    return newEarning;
  }

  async getWavePointsBalance(userId: string): Promise<number> {
    const earnings = await this.getReferralEarningsByUser(userId);
    return earnings.reduce((total, earning) => total + earning.wavePoints, 0);
  }

  // ========== Access Control ==========
  async canAccessCourse(userId: string, courseId: string): Promise<boolean> {
    // Check if course is free
    const course = await this.getCourse(courseId);
    if (course?.isFree) return true;

    // Check if user purchased this course
    const hasPurchased = await this.hasPurchasedCourse(userId, courseId);
    if (hasPurchased) return true;

    // Check if user has active membership
    const membership = await this.getActiveMembershipByUser(userId);
    if (!membership) return false;

    // Membership includes REMATA, TAKEOFF, NOSERIDE
    const membershipCourses = ['remata', 'takeoff', 'noseride'];
    return membershipCourses.includes(course?.courseCategory || '');
  }

  // ========== Hero Slide Operations ==========
  async getAllHeroSlides(): Promise<HeroSlide[]> {
    return await db.select().from(heroSlides).orderBy(heroSlides.orderIndex);
  }

  async getActiveHeroSlides(): Promise<HeroSlide[]> {
    return await db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.isActive, true))
      .orderBy(heroSlides.orderIndex);
  }

  async getHeroSlide(id: string): Promise<HeroSlide | undefined> {
    const [slide] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    return slide;
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const [newSlide] = await db.insert(heroSlides).values(slide).returning();
    return newSlide;
  }

  async updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide> {
    const [updatedSlide] = await db
      .update(heroSlides)
      .set({ ...slide, updatedAt: new Date() })
      .where(eq(heroSlides.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteHeroSlide(id: string): Promise<void> {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  async reorderHeroSlides(slides: { id: string; orderIndex: number }[]): Promise<void> {
    await Promise.all(
      slides.map(({ id, orderIndex }) =>
        db.update(heroSlides).set({ orderIndex, updatedAt: new Date() }).where(eq(heroSlides.id, id))
      )
    );
  }

  // ========== Page Header Operations ==========
  async getAllPageHeaders(): Promise<PageHeader[]> {
    return await db.select().from(pageHeaders);
  }

  async getPageHeader(page: string): Promise<PageHeader | undefined> {
    const [header] = await db.select().from(pageHeaders).where(eq(pageHeaders.page, page));
    return header;
  }

  async upsertPageHeader(header: InsertPageHeader): Promise<PageHeader> {
    const [upserted] = await db
      .insert(pageHeaders)
      .values({ ...header, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pageHeaders.page,
        set: { ...header, updatedAt: new Date() },
      })
      .returning();
    return upserted;
  }

  async deletePageHeader(page: string): Promise<void> {
    await db.delete(pageHeaders).where(eq(pageHeaders.page, page));
  }

  async updateImageUrls(fileId: string, newUrl: string): Promise<void> {
    const oldPattern = `/objects/uploads/${fileId}`;
    
    // Update page_headers
    await db.update(pageHeaders)
      .set({ imageUrl: newUrl })
      .where(eq(pageHeaders.imageUrl, oldPattern));
    
    // Update hero_slides
    await db.update(heroSlides)
      .set({ mediaUrl: newUrl })
      .where(eq(heroSlides.mediaUrl, oldPattern));
  }

  // ========== Custom Page Operations ==========
  async getAllCustomPages(publishedOnly?: boolean): Promise<CustomPage[]> {
    if (publishedOnly) {
      return await db
        .select()
        .from(customPages)
        .where(eq(customPages.published, true))
        .orderBy(desc(customPages.createdAt));
    }
    return await db.select().from(customPages).orderBy(desc(customPages.createdAt));
  }

  async getCustomPageBySlug(slug: string): Promise<CustomPage | undefined> {
    const [page] = await db.select().from(customPages).where(eq(customPages.slug, slug));
    return page;
  }

  async getCustomPage(id: string): Promise<CustomPage | undefined> {
    const [page] = await db.select().from(customPages).where(eq(customPages.id, id));
    return page;
  }

  async createCustomPage(page: InsertCustomPage): Promise<CustomPage> {
    const [newPage] = await db.insert(customPages).values(page).returning();
    return newPage;
  }

  async updateCustomPage(id: string, page: Partial<InsertCustomPage>): Promise<CustomPage> {
    const [updatedPage] = await db
      .update(customPages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(customPages.id, id))
      .returning();
    return updatedPage;
  }

  async deleteCustomPage(id: string): Promise<void> {
    await db.delete(customPages).where(eq(customPages.id, id));
  }

  // ========== Page Block Operations ==========
  async getBlocksByCustomPage(customPageId: string): Promise<PageBlock[]> {
    return await db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.customPageId, customPageId))
      .orderBy(pageBlocks.orderIndex);
  }

  async createPageBlock(block: InsertPageBlock): Promise<PageBlock> {
    const [newBlock] = await db.insert(pageBlocks).values(block).returning();
    return newBlock;
  }

  async updatePageBlock(id: string, block: Partial<InsertPageBlock>): Promise<PageBlock> {
    const [updatedBlock] = await db
      .update(pageBlocks)
      .set({ ...block, updatedAt: new Date() })
      .where(eq(pageBlocks.id, id))
      .returning();
    return updatedBlock;
  }

  async deletePageBlock(id: string): Promise<void> {
    await db.delete(pageBlocks).where(eq(pageBlocks.id, id));
  }

  async reorderPageBlocks(blocks: { id: string; orderIndex: number }[]): Promise<void> {
    await Promise.all(
      blocks.map(({ id, orderIndex }) =>
        db.update(pageBlocks).set({ orderIndex, updatedAt: new Date() }).where(eq(pageBlocks.id, id))
      )
    );
  }

  // ========== Newsletter Contact Operations ==========
  async getAllNewsletterContacts(status?: string): Promise<NewsletterContact[]> {
    if (status) {
      return await db.select().from(newsletterContacts).where(eq(newsletterContacts.status, status)).orderBy(desc(newsletterContacts.createdAt));
    }
    return await db.select().from(newsletterContacts).orderBy(desc(newsletterContacts.createdAt));
  }

  async getNewsletterContactByEmail(email: string): Promise<NewsletterContact | undefined> {
    const [contact] = await db.select().from(newsletterContacts).where(eq(newsletterContacts.email, email));
    return contact;
  }

  async getNewsletterContactById(id: string): Promise<NewsletterContact | undefined> {
    const [contact] = await db.select().from(newsletterContacts).where(eq(newsletterContacts.id, id));
    return contact;
  }

  async getNewsletterContactByToken(token: string, tokenType: 'confirm' | 'unsubscribe'): Promise<NewsletterContact | undefined> {
    const column = tokenType === 'confirm' ? newsletterContacts.confirmToken : newsletterContacts.unsubscribeToken;
    const [contact] = await db.select().from(newsletterContacts).where(eq(column, token));
    return contact;
  }

  async createNewsletterContact(contact: InsertNewsletterContact): Promise<NewsletterContact> {
    const [newContact] = await db.insert(newsletterContacts).values(contact).returning();
    return newContact;
  }

  async updateNewsletterContact(id: string, contact: Partial<NewsletterContact>): Promise<NewsletterContact> {
    const [updatedContact] = await db
      .update(newsletterContacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(newsletterContacts.id, id))
      .returning();
    return updatedContact;
  }

  async confirmNewsletterContact(token: string): Promise<NewsletterContact | undefined> {
    const [contact] = await db
      .update(newsletterContacts)
      .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
      .where(eq(newsletterContacts.confirmToken, token))
      .returning();
    return contact;
  }

  async unsubscribeNewsletterContact(token: string): Promise<NewsletterContact | undefined> {
    const [contact] = await db
      .update(newsletterContacts)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date(), updatedAt: new Date() })
      .where(eq(newsletterContacts.unsubscribeToken, token))
      .returning();
    return contact;
  }

  async deleteNewsletterContact(id: string): Promise<void> {
    await db.delete(newsletterContacts).where(eq(newsletterContacts.id, id));
  }

  async getContactsByTags(tags: string[]): Promise<NewsletterContact[]> {
    if (tags.length === 0) {
      return await db.select().from(newsletterContacts).where(eq(newsletterContacts.status, 'confirmed'));
    }
    // Get confirmed contacts that have at least one of the specified tags
    return await db
      .select()
      .from(newsletterContacts)
      .where(
        and(
          eq(newsletterContacts.status, 'confirmed'),
          sql`${newsletterContacts.tags} && ${tags}`
        )
      );
  }

  // ========== Newsletter Campaign Operations ==========
  async getAllNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
    return await db.select().from(newsletterCampaigns).orderBy(desc(newsletterCampaigns.createdAt));
  }

  async getNewsletterCampaign(id: string): Promise<NewsletterCampaign | undefined> {
    const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
    return campaign;
  }

  async createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign> {
    const [newCampaign] = await db.insert(newsletterCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateNewsletterCampaign(id: string, campaign: Partial<NewsletterCampaign>): Promise<NewsletterCampaign> {
    const [updatedCampaign] = await db
      .update(newsletterCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(newsletterCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteNewsletterCampaign(id: string): Promise<void> {
    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
  }

  async getScheduledCampaigns(): Promise<NewsletterCampaign[]> {
    return await db
      .select()
      .from(newsletterCampaigns)
      .where(
        and(
          eq(newsletterCampaigns.status, 'scheduled'),
          sql`${newsletterCampaigns.scheduledFor} <= NOW()`
        )
      );
  }

  // ========== Newsletter Event Operations ==========
  async createNewsletterEvent(event: InsertNewsletterEvent): Promise<NewsletterEvent> {
    const [newEvent] = await db.insert(newsletterEvents).values(event).returning();
    return newEvent;
  }

  async getEventsByCampaign(campaignId: string): Promise<NewsletterEvent[]> {
    return await db.select().from(newsletterEvents).where(eq(newsletterEvents.campaignId, campaignId));
  }

  async getEventsByContact(contactId: string): Promise<NewsletterEvent[]> {
    return await db.select().from(newsletterEvents).where(eq(newsletterEvents.contactId, contactId));
  }
}

export const storage = new DatabaseStorage();
