import { storage } from "./storage";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, customPages, pageBlocks } from "../shared/schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

async function ensureProductionSchema(db: ReturnType<typeof drizzle>) {
  console.log("🔧 Ensuring all required tables exist in production...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS course_products (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      woo_product_id INTEGER NOT NULL UNIQUE,
      course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      product_name VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS woocommerce_webhook_logs (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id INTEGER NOT NULL,
      order_status VARCHAR,
      customer_email VARCHAR,
      product_ids TEXT[],
      processed BOOLEAN DEFAULT FALSE,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS purchases (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      stripe_payment_id VARCHAR NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      purchased_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS memberships (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id VARCHAR NOT NULL UNIQUE,
      stripe_customer_id VARCHAR,
      status VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS referral_codes (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS referral_earnings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_user_id VARCHAR NOT NULL REFERENCES users(id),
      purchase_id VARCHAR REFERENCES purchases(id),
      membership_id VARCHAR REFERENCES memberships(id),
      wave_points INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS newsletter_contacts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL UNIQUE,
      first_name VARCHAR,
      last_name VARCHAR,
      status VARCHAR DEFAULT 'active',
      source VARCHAR DEFAULT 'manual',
      subscribed_at TIMESTAMP DEFAULT NOW(),
      unsubscribed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS newsletter_campaigns (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      subject VARCHAR NOT NULL,
      content TEXT NOT NULL,
      status VARCHAR DEFAULT 'draft',
      sent_at TIMESTAMP,
      total_recipients INTEGER DEFAULT 0,
      total_opens INTEGER DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS newsletter_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id VARCHAR NOT NULL REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
      contact_id VARCHAR NOT NULL REFERENCES newsletter_contacts(id) ON DELETE CASCADE,
      event_type VARCHAR NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("✅ All required tables verified/created");
}

async function seedCourseProducts(db: ReturnType<typeof drizzle>) {
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM course_products`);
  const count = Number((result as any).rows?.[0]?.count ?? (result as any)[0]?.count ?? 0);

  if (count > 0) {
    console.log(`✅ Course products already seeded (${count} mappings)`);
    return;
  }

  const courseRows = await db.execute(sql`SELECT id, title FROM courses`);
  const rows = (courseRows as any).rows || courseRows;

  const courseMap: Record<string, string> = {};
  for (const row of rows) {
    const title = (row.title || '').toUpperCase();
    if (title.includes('REMATA') || title.includes('REMAT')) courseMap['REMATA'] = row.id;
    if (title.includes('TAKEOFF') || title.includes('TAKE OFF') || title.includes('TAKE-OFF')) courseMap['TAKEOFF'] = row.id;
    if (title.includes('NOSERIDE') || title.includes('NOSE RIDE') || title.includes('NOSE-RIDE')) courseMap['NOSERIDE'] = row.id;
  }

  if (!courseMap['REMATA'] || !courseMap['TAKEOFF'] || !courseMap['NOSERIDE']) {
    console.warn(`⚠️  Could not find all courses by title. Found: ${JSON.stringify(courseMap)}`);
    console.warn(`⚠️  Available courses: ${JSON.stringify(rows.map((r: any) => ({ id: r.id, title: r.title })))}`);
  }

  const mappings = [
    { wooProductId: 1216, courseKey: 'REMATA', name: 'REMATA' },
    { wooProductId: 1231, courseKey: 'TAKEOFF', name: 'TAKEOFF' },
    { wooProductId: 1243, courseKey: 'NOSERIDE', name: 'NOSERIDE' },
  ];

  for (const m of mappings) {
    const courseId = courseMap[m.courseKey];
    if (courseId) {
      await db.execute(sql`
        INSERT INTO course_products (woo_product_id, course_id, product_name)
        VALUES (${m.wooProductId}, ${courseId}, ${m.name})
        ON CONFLICT (woo_product_id) DO NOTHING
      `);
      console.log(`✅ Mapped WooCommerce product ${m.wooProductId} (${m.name}) -> course ${courseId}`);
    } else {
      console.warn(`⚠️  Could not find course for ${m.courseKey} - available courses: ${JSON.stringify(rows.map((r: any) => r.title))}`);
    }
  }
}

export async function seedProductionDatabase() {
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
    await ensureProductionSchema(db);
    await seedCourseProducts(db);

    console.log("🌱 Checking if production database needs content seeding...");

    const existingSlides = await db.select().from(heroSlides);
    if (existingSlides.length > 0) {
      console.log("✅ Database content already seeded");
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
    const convertDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      // Preserve existing Date instances
      if (obj instanceof Date) return obj;
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(convertDates);
      }
      // Handle plain objects only
      if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
          const value = obj[key];
          // Check if value looks like an ISO timestamp string
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            result[key] = new Date(value);
          } else if (typeof value === 'object' && value !== null) {
            result[key] = convertDates(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      return obj;
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
