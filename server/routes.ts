import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCourseSchema,
  insertModuleSchema,
  insertLessonSchema,
  insertExerciseSchema,
  insertEnrollmentSchema,
  insertPostSchema,
  insertCommentSchema,
  insertSurfCampSchema,
  insertCampRegistrationSchema,
  insertCertificateSchema,
  insertHeroSlideSchema,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectAclPolicy, ObjectPermission } from "./objectAcl";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Auth Setup ==========
  await setupAuth(app);

  // ========== Middleware ==========
  const objectStorageService = new ObjectStorageService();

  const isAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(req.user.claims.sub);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  // ========== Lesson Routes ==========
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

  // ========== Enrollment Routes ==========
  app.get("/api/enrollments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const enrollments = await storage.getEnrollmentsBySortedByUser(userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/course/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  // ========== Lesson Progress Routes ==========
  app.post("/api/lesson-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const progress = await storage.getExerciseProgressByUser(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching exercise progress:", error);
      res.status(500).json({ message: "Failed to fetch exercise progress" });
    }
  });

  app.post("/api/exercise-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const badges = await storage.getBadgesByUser(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const validatedData = insertCommentSchema.parse({ ...req.body, userId });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  // ========== Surf Camp Routes ==========
  app.get("/api/surf-camps", async (req, res) => {
    try {
      const camps = await storage.getAllSurfCamps();
      res.json(camps);
    } catch (error) {
      console.error("Error fetching surf camps:", error);
      res.status(500).json({ message: "Failed to fetch surf camps" });
    }
  });

  app.post("/api/surf-camps", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSurfCampSchema.parse(req.body);
      const camp = await storage.createSurfCamp(validatedData);
      res.status(201).json(camp);
    } catch (error) {
      console.error("Error creating surf camp:", error);
      res.status(400).json({ message: "Failed to create surf camp" });
    }
  });

  // ========== Camp Registration Routes ==========
  app.get("/api/camp-registrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registrations = await storage.getCampRegistrationsByUser(userId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching camp registrations:", error);
      res.status(500).json({ message: "Failed to fetch camp registrations" });
    }
  });

  app.post("/api/camp-registrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCampRegistrationSchema.parse({ ...req.body, userId });
      
      // Update available spots
      const camp = await storage.getSurfCamp(validatedData.campId);
      if (camp && camp.availableSpots > 0) {
        await storage.updateSurfCampSpots(camp.id, camp.availableSpots - 1);
      }

      const registration = await storage.createCampRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error creating camp registration:", error);
      res.status(400).json({ message: "Failed to create camp registration" });
    }
  });

  // ========== Certificate Routes ==========
  app.get("/api/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificates = await storage.getCertificatesByUser(userId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post("/api/certificates/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  app.get("/objects/*", async (req: any, res) => {
    try {
      const objectPath = `/${req.params[0]}`;
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

  const httpServer = createServer(app);
  return httpServer;
}
