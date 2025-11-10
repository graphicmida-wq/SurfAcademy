#!/usr/bin/env tsx

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, clinics, customPages, pageBlocks } from "../shared/schema";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function seedProduction() {
  // Only run in production
  if (process.env.NODE_ENV !== "production") {
    console.log("⏭️  Skipping seed - not in production environment");
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("🌱 Seeding production database...");

  // Check if data file exists
  const dataPath = join(process.cwd(), "scripts", "production-seed-data.json");
  if (!existsSync(dataPath)) {
    console.log("⚠️  No seed data file found at", dataPath);
    console.log("   Run 'npm run export-data' in development first");
    await pool.end();
    return;
  }

  // Read seed data
  const seedData = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`📦 Loaded seed data from ${seedData.exportedAt}`);

  // Check if database is already seeded
  const existingSlides = await db.select().from(heroSlides);
  if (existingSlides.length > 0) {
    console.log("✅ Database already seeded, skipping");
    await pool.end();
    return;
  }

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

  // Seed clinics
  if (seedData.clinics?.length > 0) {
    await db.insert(clinics).values(seedData.clinics);
    console.log(`✅ Seeded ${seedData.clinics.length} clinics`);
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

  console.log("\n✨ Production database seeded successfully!");

  await pool.end();
}

seedProduction().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
