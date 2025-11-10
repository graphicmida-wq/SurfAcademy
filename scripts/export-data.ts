#!/usr/bin/env tsx

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, clinics, customPages, pageBlocks } from "../shared/schema";
import { writeFileSync } from "fs";
import { join } from "path";

neonConfig.webSocketConstructor = ws;

async function exportData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("🔄 Exporting data from development database...");

  // Export hero slides
  const heroSlidesData = await db.select().from(heroSlides);
  console.log(`✅ Exported ${heroSlidesData.length} hero slides`);

  // Export page headers
  const pageHeadersData = await db.select().from(pageHeaders);
  console.log(`✅ Exported ${pageHeadersData.length} page headers`);

  // Export courses
  const coursesData = await db.select().from(courses);
  console.log(`✅ Exported ${coursesData.length} courses`);

  // Export clinics
  const clinicsData = await db.select().from(clinics);
  console.log(`✅ Exported ${clinicsData.length} clinics`);

  // Export custom pages
  const customPagesData = await db.select().from(customPages);
  console.log(`✅ Exported ${customPagesData.length} custom pages`);

  // Export page blocks
  const pageBlocksData = await db.select().from(pageBlocks);
  console.log(`✅ Exported ${pageBlocksData.length} page blocks`);

  // Create export object
  const exportData = {
    heroSlides: heroSlidesData,
    pageHeaders: pageHeadersData,
    courses: coursesData,
    clinics: clinicsData,
    customPages: customPagesData,
    pageBlocks: pageBlocksData,
    exportedAt: new Date().toISOString(),
  };

  // Write to JSON file
  const outputPath = join(process.cwd(), "scripts", "production-seed-data.json");
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\n✨ Data exported successfully to ${outputPath}`);
  console.log("\nSummary:");
  console.log(`  - ${heroSlidesData.length} hero slides`);
  console.log(`  - ${pageHeadersData.length} page headers`);
  console.log(`  - ${coursesData.length} courses`);
  console.log(`  - ${clinicsData.length} clinics`);
  console.log(`  - ${customPagesData.length} custom pages`);
  console.log(`  - ${pageBlocksData.length} page blocks`);

  await pool.end();
}

exportData().catch((error) => {
  console.error("❌ Export failed:", error);
  process.exit(1);
});
