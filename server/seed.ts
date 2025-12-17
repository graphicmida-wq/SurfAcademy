import { storage } from "./storage";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, customPages, pageBlocks } from "../shared/schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

export async function seedProductionDatabase() {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set, skipping seed");
    return;
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log("🌱 Checking if production database needs seeding...");

    // Check if database is already seeded
    const existingSlides = await db.select().from(heroSlides);
    if (existingSlides.length > 0) {
      console.log("✅ Database already seeded");
      await pool.end();
      return;
    }

    // Check if data file exists (use process.cwd() to work in both dev and production)
    const dataPath = join(process.cwd(), "scripts", "production-seed-data.json");
    if (!existsSync(dataPath)) {
      console.log("⚠️  No seed data file found, skipping seed");
      await pool.end();
      return;
    }

    // Read seed data
    const seedData = JSON.parse(readFileSync(dataPath, "utf-8"));
    console.log(`📦 Loading seed data from ${seedData.exportedAt}`);

    // Helper function to convert timestamp strings to Date objects
    const convertDates = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }
      const result: any = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        // Check if value looks like an ISO timestamp string
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          result[key] = new Date(value);
        } else if (typeof value === 'object') {
          result[key] = convertDates(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    // Convert all timestamp strings to Date objects
    if (seedData.heroSlides) seedData.heroSlides = convertDates(seedData.heroSlides);
    if (seedData.pageHeaders) seedData.pageHeaders = convertDates(seedData.pageHeaders);
    if (seedData.courses) seedData.courses = convertDates(seedData.courses);
    if (seedData.customPages) seedData.customPages = convertDates(seedData.customPages);
    if (seedData.pageBlocks) seedData.pageBlocks = convertDates(seedData.pageBlocks);

    // Seed hero slides
    if (seedData.heroSlides?.length > 0) {
      await db.insert(heroSlides).values(seedData.heroSlides);
      console.log(`✅ Seeded ${seedData.heroSlides.length} hero slides`);
    }

    // Seed page headers
    if (seedData.pageHeaders?.length > 0) {
      await db.insert(pageHeaders).values(seedData.pageHeaders);
      console.log(`✅ Seeded ${seedData.pageHeaders.length} page headers`);
    }

    // Seed courses
    if (seedData.courses?.length > 0) {
      await db.insert(courses).values(seedData.courses);
      console.log(`✅ Seeded ${seedData.courses.length} courses`);
    }

    // Seed custom pages
    if (seedData.customPages?.length > 0) {
      await db.insert(customPages).values(seedData.customPages);
      console.log(`✅ Seeded ${seedData.customPages.length} custom pages`);
    }

    // Seed page blocks (depends on custom pages)
    if (seedData.pageBlocks?.length > 0) {
      await db.insert(pageBlocks).values(seedData.pageBlocks);
      console.log(`✅ Seeded ${seedData.pageBlocks.length} page blocks`);
    }

    console.log("✨ Production database seeded successfully!");

    await pool.end();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await pool.end();
  }
}

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create sample courses
    const beginnerCourse = await storage.createCourse({
      title: "Surf per Principianti",
      description: "Impara le basi del surf con questo corso completo per principianti. Scopri come scegliere la tavola giusta, come remare efficacemente e come prendere le tue prime onde.",
      level: "beginner",
      isFree: true,
      price: 0,
      instructorName: "Marco Rossi",
      duration: 120,
    });

    const intermediateCourse = await storage.createCourse({
      title: "Tecniche Intermedie di Surf",
      description: "Perfeziona la tua tecnica con manovre avanzate come il cutback, il floater e il bottom turn. Corso per surfisti con esperienza di base.",
      level: "intermediate",
      isFree: false,
      price: 4900, // €49
      instructorName: "Laura Bianchi",
      duration: 180,
    });

    const advancedCourse = await storage.createCourse({
      title: "Surf Avanzato e Performance",
      description: "Porta il tuo surf al livello successivo con tecniche di performance avanzate, aerial tricks e surfing in onde grandi.",
      level: "advanced",
      isFree: false,
      price: 9900, // €99
      instructorName: "Alessio Marino",
      duration: 240,
    });

    console.log("✅ Created 3 courses");

    // Create modules for beginner course
    const module1 = await storage.createModule({
      courseId: beginnerCourse.id,
      title: "Introduzione al Surf",
      description: "Le basi fondamentali del surf",
      orderIndex: 1,
    });

    const module2 = await storage.createModule({
      courseId: beginnerCourse.id,
      title: "La Tua Prima Onda",
      description: "Come prendere e cavalcare la tua prima onda",
      orderIndex: 2,
    });

    console.log("✅ Created modules");

    // Create lessons for module 1
    await storage.createLesson({
      moduleId: module1.id,
      title: "Benvenuto al Mondo del Surf",
      description: "Un'introduzione al meraviglioso sport del surf",
      videoUrl: "https://example.com/video1",
      duration: 15,
      orderIndex: 1,
      isFree: true,
    });

    await storage.createLesson({
      moduleId: module1.id,
      title: "Scegliere la Tavola Giusta",
      description: "Guida alla scelta della prima tavola da surf",
      videoUrl: "https://example.com/video2",
      duration: 20,
      orderIndex: 2,
      isFree: true,
    });

    await storage.createLesson({
      moduleId: module2.id,
      title: "La Tecnica del Paddle",
      description: "Come remare efficacemente",
      videoUrl: "https://example.com/video3",
      duration: 25,
      orderIndex: 1,
      isFree: false,
    });

    console.log("✅ Created lessons");

    // Create exercises
    await storage.createExercise({
      title: "Plank per Core Stability",
      description: "Rafforza il core con il plank, essenziale per mantenere l'equilibrio sulla tavola",
      exerciseType: "timer",
      targetValue: 60, // 60 seconds
      level: "beginner",
    });

    await storage.createExercise({
      title: "Push-up per la Remata",
      description: "Aumenta la forza delle braccia per remare più efficacemente",
      exerciseType: "counter",
      targetValue: 20,
      level: "beginner",
    });

    await storage.createExercise({
      title: "Squat per le Gambe",
      description: "Rafforza le gambe per il pop-up e il controllo sulla tavola",
      exerciseType: "counter",
      targetValue: 30,
      level: "intermediate",
    });

    console.log("✅ Created exercises");

    // Create surf days (waiting period events)
    await storage.createSurfDay({
      title: "SurfDay Liguria",
      description: "Giornata di surf in base alle condizioni delle onde. Il waiting period indica quando potremmo chiamarti per la sessione perfetta!",
      location: "Varazze, Liguria",
      startDate: new Date("2025-07-01"), // Waiting period start
      endDate: new Date("2025-07-07"), // Waiting period end
      price: 5900, // €59
      totalSpots: 12,
      availableSpots: 12,
    });

    await storage.createSurfDay({
      title: "SurfDay Sardegna",
      description: "Aspetta la mareggiata perfetta in Sardegna! Ti contatteremo quando le onde saranno al massimo.",
      location: "Capo Mannu, Sardegna",
      startDate: new Date("2025-08-15"), // Waiting period start
      endDate: new Date("2025-08-22"), // Waiting period end
      price: 7900, // €79
      totalSpots: 8,
      availableSpots: 3,
    });

    await storage.createSurfDay({
      title: "SurfDay Toscana",
      description: "Prenota il tuo posto per la prossima mareggiata in Toscana. Aspettiamo le onde giuste per te!",
      location: "Marina di Pisa, Toscana",
      startDate: new Date("2025-06-20"), // Waiting period start
      endDate: new Date("2025-06-26"), // Waiting period end
      price: 4900, // €49
      totalSpots: 10,
      availableSpots: 0, // Full
    });

    console.log("✅ Created surf days");

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Legacy seed() function is available but not auto-executed
// To run it manually: tsx server/seed.ts
// Note: In production, seedProductionDatabase() is used instead
