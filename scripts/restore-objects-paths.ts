#!/usr/bin/env tsx

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, clinics, customPages, pageBlocks } from "../shared/schema";
import { eq } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function restoreObjectsPaths() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("🔄 Restoring /objects/ paths for development...");

  const convertPath = (path: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith("/objects/")) return path; // Already correct
    if (path.includes("/.private/uploads/")) {
      // Extract ID from GCS URL
      const match = path.match(/\/\.private\/uploads\/([^\/]+)$/);
      if (match) {
        return `/objects/uploads/${match[1]}`;
      }
    }
    if (path.includes("/public/uploads/")) {
      // Extract ID from GCS URL
      const match = path.match(/\/public\/uploads\/([^\/]+)$/);
      if (match) {
        return `/objects/uploads/${match[1]}`;
      }
    }
    return path;
  };

  // Restore hero slides
  const slides = await db.select().from(heroSlides);
  for (const slide of slides) {
    const newMediaUrl = convertPath(slide.mediaUrl);
    const newLogoUrl = convertPath(slide.logoUrl);
    if (newMediaUrl !== slide.mediaUrl || newLogoUrl !== slide.logoUrl) {
      const updates: any = {};
      if (newMediaUrl !== undefined) updates.mediaUrl = newMediaUrl;
      if (newLogoUrl !== undefined) updates.logoUrl = newLogoUrl;
      await db.update(heroSlides)
        .set(updates)
        .where(eq(heroSlides.id, slide.id));
      console.log(`✅ Restored hero slide ${slide.id}`);
    }
  }

  // Restore page headers
  const headers = await db.select().from(pageHeaders);
  for (const header of headers) {
    const newImageUrl = convertPath(header.imageUrl);
    if (newImageUrl !== header.imageUrl) {
      await db.update(pageHeaders)
        .set({ imageUrl: newImageUrl })
        .where(eq(pageHeaders.page, header.page));
      console.log(`✅ Restored page header ${header.page}`);
    }
  }

  // Restore courses
  const coursesData = await db.select().from(courses);
  for (const course of coursesData) {
    if (course.thumbnailUrl) {
      const newThumbnailUrl = convertPath(course.thumbnailUrl);
      if (newThumbnailUrl !== course.thumbnailUrl) {
        await db.update(courses)
          .set({ thumbnailUrl: newThumbnailUrl })
          .where(eq(courses.id, course.id));
        console.log(`✅ Restored course ${course.id}`);
      }
    }
  }

  // Restore clinics
  const clinicsData = await db.select().from(clinics);
  for (const clinic of clinicsData) {
    if (clinic.imageUrl) {
      const newImageUrl = convertPath(clinic.imageUrl);
      if (newImageUrl !== clinic.imageUrl) {
        await db.update(clinics)
          .set({ imageUrl: newImageUrl })
          .where(eq(clinics.id, clinic.id));
        console.log(`✅ Restored clinic ${clinic.id}`);
      }
    }
  }

  // Restore custom pages
  const pages = await db.select().from(customPages);
  for (const page of pages) {
    if (page.headerImageUrl) {
      const newHeaderImageUrl = convertPath(page.headerImageUrl);
      if (newHeaderImageUrl !== page.headerImageUrl) {
        await db.update(customPages)
          .set({ headerImageUrl: newHeaderImageUrl })
          .where(eq(customPages.id, page.id));
        console.log(`✅ Restored custom page ${page.id}`);
      }
    }
  }

  // Restore page blocks
  const blocks = await db.select().from(pageBlocks);
  for (const block of blocks) {
    if (block.contentJson) {
      let updated = false;
      const content = block.contentJson as any;
      
      if (content.imageUrl) {
        const newImageUrl = convertPath(content.imageUrl);
        if (newImageUrl !== content.imageUrl) {
          content.imageUrl = newImageUrl;
          updated = true;
        }
      }
      
      if (content.images && Array.isArray(content.images)) {
        content.images = content.images.map((img: any) => {
          if (typeof img === 'string') {
            return convertPath(img) || img;
          } else if (img.url) {
            const newUrl = convertPath(img.url);
            if (newUrl !== img.url) {
              updated = true;
              return { ...img, url: newUrl };
            }
          }
          return img;
        });
      }

      if (updated) {
        await db.update(pageBlocks)
          .set({ contentJson: content })
          .where(eq(pageBlocks.id, block.id));
        console.log(`✅ Restored page block ${block.id}`);
      }
    }
  }

  console.log("\n✨ Restoration completed successfully!");
  await pool.end();
}

restoreObjectsPaths().catch((error) => {
  console.error("❌ Restoration failed:", error);
  process.exit(1);
});
