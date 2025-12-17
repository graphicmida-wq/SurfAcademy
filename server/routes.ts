import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcrypt";
import {
  insertCourseSchema,
  insertModuleSchema,
  insertLessonSchema,
  insertExerciseSchema,
  insertEnrollmentSchema,
  insertPostSchema,
  insertCommentSchema,
  insertCertificateSchema,
  insertHeroSlideSchema,
  insertPageHeaderSchema,
  insertCustomPageSchema,
  insertPageBlockSchema,
  insertNewsletterContactSchema,
  insertNewsletterCampaignSchema,
  insertNewsletterEventSchema,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";
import { z } from "zod";
import { registerNewsletterRoutes } from "./newsletterRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Auth Setup ==========
  await setupAuth(app);

  // ========== Middleware ==========
  const objectStorageService = new ObjectStorageService();

  const isAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
      // Support both Replit Auth (req.user.claims.sub) and local auth (req.user.id)
      const userId = req.user?.claims?.sub || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to verify admin status" });
    }
  };

  // ========== Auth Routes ==========
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Support both Replit Auth (req.user.claims.sub) and local auth (req.user.id)
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e password sono obbligatori" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userId = crypto.randomUUID();
      await storage.upsertUser({
        id: userId,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Create session
      (req as any).login({ id: userId }, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login" });
        }
        res.json({ success: true, message: "Registrazione completata" });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  // Local login endpoint
  app.post('/api/local-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e password sono obbligatori" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenziali non valide" });
      }

      // Create session
      (req as any).login({ id: user.id }, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Errore durante il login" });
        }
        res.json({ success: true, message: "Login effettuato" });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Errore durante il login" });
    }
  });

  // Update user profile
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate profile update data
      const profileSchema = z.object({
        firstName: z.string().min(1, "Nome richiesto").optional(),
        lastName: z.string().min(1, "Cognome richiesto").optional(),
        email: z.string().email("Email non valida").optional(),
        profileImageUrl: z.string().optional(),
      });

      const validatedData = profileSchema.parse(req.body);

      // Check email uniqueness if email is being changed
      if (validatedData.email) {
        const currentUser = await storage.getUser(userId);
        if (currentUser && validatedData.email !== currentUser.email) {
          const existingUser = await storage.getUserByEmail(validatedData.email);
          if (existingUser) {
            return res.status(400).json({ message: "Email già in uso" });
          }
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, validatedData);

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user WavePoints balance
  app.get('/api/wavepoints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const balance = await storage.getWavePointsBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching WavePoints:", error);
      res.status(500).json({ message: "Failed to fetch WavePoints" });
    }
  });

  // ========== Course Routes ==========
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.get("/api/courses/:id/info", async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const userId = req.user?.claims?.sub || req.user?.id;
      let isEnrolled = false;

      if (userId) {
        const enrollment = await storage.getEnrollmentByUserAndCourse(userId, req.params.id);
        isEnrolled = !!enrollment;
      }

      res.json({ ...course, isEnrolled });
    } catch (error) {
      console.error("Error fetching course info:", error);
      res.status(500).json({ message: "Failed to fetch course info" });
    }
  });

  app.post("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  // ========== Admin Course Routes ==========
  app.get("/api/admin/courses", isAdmin, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/admin/courses", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  app.patch("/api/admin/courses/:id", isAdmin, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(req.params.id, validatedData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(400).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/admin/courses/:id", isAdmin, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Admin auto-enrollment endpoint
  app.post("/api/admin/enroll/:courseId", isAdmin, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { courseId } = req.params;

      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Corso non trovato" });
      }

      // Check if already enrolled
      const existingEnrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
      if (existingEnrollment) {
        return res.status(400).json({ message: "Già iscritto a questo corso" });
      }

      // Create enrollment
      const enrollment = await storage.createEnrollment({
        userId,
        courseId,
        progress: 0,
      });

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling admin:", error);
      res.status(500).json({ message: "Errore durante l'iscrizione" });
    }
  });

  // ========== Module Routes ==========
  app.get("/api/courses/:id/modules", async (req, res) => {
    try {
      const modules = await storage.getModulesByCourse(req.params.id);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ message: "Failed to create module" });
    }
  });

  // Admin module CRUD
  app.post("/api/admin/modules", isAdmin, async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ message: "Failed to create module" });
    }
  });
  
  app.post("/api/admin/courses/:courseId/modules", isAdmin, async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse({
        ...req.body,
        courseId: req.params.courseId,
      });
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ message: "Failed to create module" });
    }
  });

  app.patch("/api/admin/modules/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertModuleSchema.partial().parse(req.body);
      const updatedModule = await storage.updateModule(req.params.id, validatedData);
      res.json(updatedModule);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(400).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/admin/modules/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteModule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // ========== Lesson Routes ==========
  app.get("/api/modules/:moduleId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonsByModule(req.params.moduleId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });
  app.post("/api/lessons", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(400).json({ message: "Failed to create lesson" });
    }
  });

  // ========== Admin Lesson Routes ==========
  app.post("/api/admin/lessons", isAdmin, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(400).json({ message: "Failed to create lesson" });
    }
  });

  app.patch("/api/admin/lessons/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.partial().parse(req.body);
      const updatedLesson = await storage.updateLesson(req.params.id, validatedData);
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(400).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/lessons/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // ========== Exercise Routes ==========
  app.get("/api/exercises", async (req, res) => {
    try {
      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.post("/api/exercises", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(400).json({ message: "Failed to create exercise" });
    }
  });

  // Admin exercise CRUD
  app.post("/api/admin/exercises", isAdmin, async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      res.status(400).json({ message: "Failed to create exercise" });
    }
  });

  app.patch("/api/admin/exercises/:id", isAdmin, async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.partial().parse(req.body);
      const updatedExercise = await storage.updateExercise(req.params.id, validatedData);
      res.json(updatedExercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      res.status(400).json({ message: "Failed to update exercise" });
    }
  });

  app.delete("/api/admin/exercises/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteExercise(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  // ========== Enrollment Routes ==========
  app.get("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const enrollments = await storage.getEnrollmentsBySortedByUser(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/course/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const enrollment = await storage.getEnrollmentByUserAndCourse(userId, req.params.courseId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const validatedData = insertEnrollmentSchema.parse({ ...req.body, userId });
      
      // Check if already enrolled
      const existing = await storage.getEnrollmentByUserAndCourse(userId, validatedData.courseId);
      if (existing) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      const enrollment = await storage.createEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(400).json({ message: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const { progress } = req.body;
      await storage.updateEnrollmentProgress(req.params.id, progress);
      res.json({ message: "Progress updated" });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Admin endpoint to get all enrollments with user and course details
  app.get("/api/admin/enrollments", isAdmin, async (req, res) => {
    try {
      const enrollments = await storage.getAllEnrollmentsWithDetails();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching admin enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // ========== Lesson Progress Routes ==========
  app.post("/api/lesson-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { lessonId } = req.body;
      await storage.markLessonComplete(userId, lessonId);
      res.status(201).json({ message: "Lesson marked as complete" });
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      res.status(500).json({ message: "Failed to mark lesson complete" });
    }
  });

  // ========== Exercise Progress Routes ==========
  app.get("/api/exercise-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const progress = await storage.getExerciseProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching exercise progress:", error);
      res.status(500).json({ message: "Failed to fetch exercise progress" });
    }
  });

  app.post("/api/exercise-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { exerciseId, completedValue, completed } = req.body;
      await storage.createOrUpdateExerciseProgress(userId, exerciseId, completedValue, completed);
      res.status(201).json({ message: "Exercise progress updated" });
    } catch (error) {
      console.error("Error updating exercise progress:", error);
      res.status(500).json({ message: "Failed to update exercise progress" });
    }
  });

  // ========== Badge Routes ==========
  app.get("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const badges = await storage.getBadgesByUser(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { badgeType, badgeName, badgeIcon } = req.body;
      await storage.awardBadge(userId, badgeType, badgeName, badgeIcon);
      res.status(201).json({ message: "Badge awarded" });
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // ========== Post Routes ==========
  app.get("/api/posts", async (req, res) => {
    try {
      const level = req.query.level as string | undefined;
      const posts = await storage.getAllPosts(level);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const validatedData = insertPostSchema.parse({ ...req.body, userId });
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  // ========== Comment Routes ==========
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const validatedData = insertCommentSchema.parse({ ...req.body, userId });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  // ========== Certificate Routes ==========
  app.get("/api/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const certificates = await storage.getCertificatesByUser(userId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post("/api/certificates/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { courseId } = req.params;

      // Check if enrollment exists and course is completed
      const enrollment = await storage.getEnrollmentByUserAndCourse(userId, courseId);
      if (!enrollment || enrollment.progress !== 100) {
        return res.status(400).json({ message: "Course not completed" });
      }

      // Check if certificate already exists
      const existing = await storage.getCertificateByUserAndCourse(userId, courseId);
      if (existing) {
        return res.json(existing);
      }

      // Create certificate
      const certificate = await storage.createCertificate({
        userId,
        courseId,
        certificateUrl: `/api/certificates/${courseId}/view`, // Will be rendered as HTML
      });

      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error creating certificate:", error);
      res.status(500).json({ message: "Failed to create certificate" });
    }
  });

  app.get("/api/certificates/:courseId/view", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { courseId } = req.params;

      const certificate = await storage.getCertificateByUserAndCourse(userId, courseId);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      const course = await storage.getCourse(courseId);
      const user = await storage.getUser(userId);

      if (!course || !user) {
        return res.status(404).json({ message: "Course or user not found" });
      }

      // Generate HTML certificate
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Certificato di Completamento - ${course.title}</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 40px;
              background: linear-gradient(135deg, #1DBFB0 0%, #4A6572 100%);
              min-height: 100vh;
            }
            .certificate {
              background: white;
              padding: 60px;
              border: 8px double #1DBFB0;
              position: relative;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .logo {
              font-size: 36px;
              color: #1DBFB0;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .title {
              font-size: 48px;
              color: #4A6572;
              margin: 20px 0;
            }
            .subtitle {
              font-size: 20px;
              color: #666;
            }
            .content {
              text-align: center;
              margin: 40px 0;
              line-height: 1.8;
            }
            .recipient {
              font-size: 32px;
              color: #1DBFB0;
              margin: 20px 0;
              font-style: italic;
            }
            .course-name {
              font-size: 24px;
              color: #4A6572;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding-top: 30px;
              border-top: 2px solid #1DBFB0;
            }
            .signature {
              text-align: center;
            }
            .date {
              text-align: center;
              color: #666;
              margin-top: 40px;
            }
            @media print {
              body { background: white; margin: 0; }
              .certificate { border: 4px double #1DBFB0; }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="logo">Scuola di Longboard</div>
              <div class="title">Certificato di Completamento</div>
              <div class="subtitle">questo attesta che</div>
            </div>
            <div class="content">
              <div class="recipient">${user.firstName} ${user.lastName}</div>
              <p>ha completato con successo il corso</p>
              <div class="course-name">${course.title}</div>
              <p>dimostrando dedizione e impegno nell'apprendimento del surf</p>
            </div>
            <div class="footer">
              <div class="signature">
                <div style="border-top: 2px solid #1DBFB0; width: 200px; margin: 0 auto 10px;">
                </div>
                <div>Direttore Scuola</div>
              </div>
              <div class="signature">
                <div style="border-top: 2px solid #1DBFB0; width: 200px; margin: 0 auto 10px;">
                </div>
                <div>Istruttore: ${course.instructorName || "Scuola di Longboard"}</div>
              </div>
            </div>
            <div class="date">
              Rilasciato il ${new Date(certificate.issuedAt || new Date()).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error viewing certificate:", error);
      res.status(500).json({ message: "Failed to view certificate" });
    }
  });

  // ========== Hero Slide Routes ==========
  app.get("/api/hero-slides", async (req, res) => {
    try {
      const slides = await storage.getActiveHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  app.get("/api/admin/hero-slides", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const slides = await storage.getAllHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching all hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  app.post("/api/admin/hero-slides", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(validatedData);
      res.status(201).json(slide);
    } catch (error) {
      console.error("Error creating hero slide:", error);
      res.status(400).json({ message: "Failed to create hero slide" });
    }
  });

  app.patch("/api/admin/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertHeroSlideSchema.partial().parse(req.body);
      const slide = await storage.updateHeroSlide(req.params.id, validatedData);
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(400).json({ message: "Failed to update hero slide" });
    }
  });

  app.delete("/api/admin/hero-slides/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteHeroSlide(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(400).json({ message: "Failed to delete hero slide" });
    }
  });

  app.put("/api/admin/hero-slides/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reorderSchema = z.object({
        slides: z.array(z.object({
          id: z.string(),
          orderIndex: z.number(),
        })),
      });
      const { slides } = reorderSchema.parse(req.body);
      await storage.reorderHeroSlides(slides);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering hero slides:", error);
      res.status(400).json({ message: "Failed to reorder hero slides" });
    }
  });

  // ========== Page Header Routes (for existing pages) ==========
  app.get("/api/page-headers", async (req, res) => {
    try {
      const headers = await storage.getAllPageHeaders();
      res.json(headers);
    } catch (error) {
      console.error("Error fetching page headers:", error);
      res.status(500).json({ message: "Failed to fetch page headers" });
    }
  });

  app.get("/api/page-headers/:page", async (req, res) => {
    try {
      const header = await storage.getPageHeader(req.params.page);
      if (!header) {
        return res.status(404).json({ message: "Page header not found" });
      }
      res.json(header);
    } catch (error) {
      console.error("Error fetching page header:", error);
      res.status(500).json({ message: "Failed to fetch page header" });
    }
  });

  app.put("/api/admin/page-headers/:page", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageHeaderSchema.parse({ ...req.body, page: req.params.page });
      const header = await storage.upsertPageHeader(validatedData);
      res.json(header);
    } catch (error) {
      console.error("Error upserting page header:", error);
      res.status(400).json({ message: "Failed to update page header" });
    }
  });

  app.delete("/api/admin/page-headers/:page", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePageHeader(req.params.page);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page header:", error);
      res.status(400).json({ message: "Failed to delete page header" });
    }
  });

  // ========== Custom Page Routes ==========
  app.get("/api/custom-pages", async (req, res) => {
    try {
      // Support both Replit Auth and local auth
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      let isAdmin = false;
      
      if (userId) {
        const user = await storage.getUser(userId);
        isAdmin = user?.isAdmin === true;
      }
      
      const publishedOnly = !isAdmin;
      const pages = await storage.getAllCustomPages(publishedOnly);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching custom pages:", error);
      res.status(500).json({ message: "Failed to fetch custom pages" });
    }
  });

  app.get("/api/custom-pages/slug/:slug", async (req, res) => {
    try {
      const page = await storage.getCustomPageBySlug(req.params.slug);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      if (!page.published && !req.user) {
        return res.status(403).json({ message: "Page not published" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching custom page:", error);
      res.status(500).json({ message: "Failed to fetch custom page" });
    }
  });

  app.get("/api/admin/custom-pages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = await storage.getCustomPage(req.params.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching custom page:", error);
      res.status(500).json({ message: "Failed to fetch custom page" });
    }
  });

  app.post("/api/admin/custom-pages", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCustomPageSchema.parse(req.body);
      const page = await storage.createCustomPage(validatedData);
      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating custom page:", error);
      res.status(400).json({ message: "Failed to create custom page" });
    }
  });

  app.put("/api/admin/custom-pages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCustomPageSchema.partial().parse(req.body);
      const page = await storage.updateCustomPage(req.params.id, validatedData);
      if (!page) {
        return res.status(404).json({ message: "Custom page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error updating custom page:", error);
      res.status(400).json({ message: "Failed to update custom page" });
    }
  });

  app.delete("/api/admin/custom-pages/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteCustomPage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting custom page:", error);
      res.status(400).json({ message: "Failed to delete custom page" });
    }
  });

  // ========== Page Block Routes ==========
  app.get("/api/custom-pages/:pageId/blocks", async (req, res) => {
    try {
      const blocks = await storage.getBlocksByCustomPage(req.params.pageId);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching page blocks:", error);
      res.status(500).json({ message: "Failed to fetch page blocks" });
    }
  });

  app.post("/api/admin/custom-pages/:pageId/blocks", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageBlockSchema.parse({ 
        ...req.body, 
        customPageId: req.params.pageId 
      });
      const block = await storage.createPageBlock(validatedData);
      res.status(201).json(block);
    } catch (error) {
      console.error("Error creating page block:", error);
      res.status(400).json({ message: "Failed to create page block" });
    }
  });

  app.put("/api/admin/page-blocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertPageBlockSchema.partial().parse(req.body);
      const block = await storage.updatePageBlock(req.params.id, validatedData);
      if (!block) {
        return res.status(404).json({ message: "Page block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating page block:", error);
      res.status(400).json({ message: "Failed to update page block" });
    }
  });

  app.delete("/api/admin/page-blocks/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePageBlock(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page block:", error);
      res.status(400).json({ message: "Failed to delete page block" });
    }
  });

  app.put("/api/admin/page-blocks/reorder", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reorderSchema = z.object({
        blocks: z.array(z.object({
          id: z.string(),
          orderIndex: z.number(),
        })),
      });
      const { blocks } = reorderSchema.parse(req.body);
      await storage.reorderPageBlocks(blocks);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering page blocks:", error);
      res.status(400).json({ message: "Failed to reorder page blocks" });
    }
  });

  // ========== Object Storage Routes ==========
  app.post("/api/object-storage/upload-url", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { uploadUrl, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      res.json({ url: uploadUrl, objectPath });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post("/api/object-storage/set-acl", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { objectPath, aclPolicy } = req.body;
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectPath,
        aclPolicy as ObjectAclPolicy
      );
      res.json({ path: normalizedPath });
    } catch (error) {
      console.error("Error setting ACL policy:", error);
      res.status(500).json({ message: "Failed to set ACL policy" });
    }
  });

  // Admin endpoint to migrate images from private to public directory
  app.post("/api/admin/migrate-images", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const results: { original: string; newUrl: string; success: boolean; error?: string }[] = [];
      
      // Get all image URLs from page_headers and hero_slides
      const pageHeaders = await storage.getAllPageHeaders();
      const heroSlides = await storage.getAllHeroSlides();
      
      // Extract unique file IDs from /objects/uploads/ paths
      const fileIds: string[] = [];
      
      for (const header of pageHeaders) {
        if (header.imageUrl?.startsWith('/objects/uploads/')) {
          const fileId = header.imageUrl.replace('/objects/uploads/', '');
          if (!fileIds.includes(fileId)) {
            fileIds.push(fileId);
          }
        }
      }
      
      for (const slide of heroSlides) {
        if (slide.mediaUrl?.startsWith('/objects/uploads/')) {
          const fileId = slide.mediaUrl.replace('/objects/uploads/', '');
          if (!fileIds.includes(fileId)) {
            fileIds.push(fileId);
          }
        }
      }
      
      console.log(`Found ${fileIds.length} unique files to migrate`);
      
      // Copy each file to public directory
      for (const fileId of fileIds) {
        try {
          const publicUrl = await objectStorageService.copyToPublic(fileId);
          results.push({ original: fileId, newUrl: publicUrl, success: true });
          
          // Update database references
          await storage.updateImageUrls(fileId, publicUrl);
        } catch (error: any) {
          console.error(`Error migrating ${fileId}:`, error.message);
          results.push({ original: fileId, newUrl: '', success: false, error: error.message });
        }
      }
      
      res.json({ 
        message: `Migrated ${results.filter(r => r.success).length}/${fileIds.length} files`,
        results 
      });
    } catch (error) {
      console.error("Error migrating images:", error);
      res.status(500).json({ message: "Failed to migrate images" });
    }
  });

  app.get("/objects/*", async (req: any, res) => {
    try {
      const objectPath = `/objects/${req.params[0]}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      
      const userId = req.user?.claims?.sub;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      console.error("Error downloading object:", error);
      res.status(500).json({ message: "Failed to download object" });
    }
  });

  // ========== Newsletter Routes ==========
  registerNewsletterRoutes(app, isAuthenticated, isAdmin);

  const httpServer = createServer(app);
  return httpServer;
}
