import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { heroSlides, pageHeaders, courses, modules, lessons, customPages, pageBlocks } from "../shared/schema";

neonConfig.webSocketConstructor = ws;

const NEON_DATABASE_URL = process.env.NEON_PRODUCTION_DATABASE_URL;

if (!NEON_DATABASE_URL) {
  console.error("NEON_PRODUCTION_DATABASE_URL not set");
  process.exit(1);
}

async function migrateData() {
  const pool = new Pool({ connectionString: NEON_DATABASE_URL });
  const db = drizzle(pool);

  console.log("🚀 Starting data migration to Neon production...");

  try {
    const heroSlidesData = [
      {
        id: "4c765e72-41dc-4aa5-93f1-8249b2162000",
        type: "image" as const,
        mediaUrl: "https://storage.googleapis.com/replit-objstore-995559da-3a2a-4d6f-ae83-b50a03f86426/.private/uploads/a17df403-e623-4937-8773-8f5bc32b2d79",
        title: "La prima vera scuola di SURF in Italia dedicata al LONGBOARD.",
        subtitle: "LONGBOARD ACADEMY",
        ctaText: "Inizia Gratis",
        ctaLink: "/corsi",
        logoUrl: null,
        logoSize: "medium" as const,
        logoPosition: "before" as const,
        orderIndex: 0,
        isActive: true,
      },
      {
        id: "f5b82220-11dc-450d-afeb-5e84ce53116b",
        type: "image" as const,
        mediaUrl: "https://storage.googleapis.com/replit-objstore-995559da-3a2a-4d6f-ae83-b50a03f86426/.private/uploads/d7a81ae4-bf51-477e-9d85-e18eacefe039",
        title: "La prima vera scuola di SURF in Italia dedicata al LONGBOARD.",
        subtitle: "LONGBOARD ACADEMY",
        ctaText: "Inizia Gratis",
        ctaLink: "/corsi",
        logoUrl: null,
        logoSize: "medium" as const,
        logoPosition: "before" as const,
        orderIndex: 1,
        isActive: true,
      }
    ];

    const pageHeadersData = [
      { page: "community", imageUrl: "/objects/uploads/a17df403-e623-4937-8773-8f5bc32b2d79", title: "Community", subtitle: "Unisciti alla nostra community di surfisti appassionati", paddingTop: "py-16", paddingBottom: "py-24", minHeight: "min-h-96" },
      { page: "dashboard", imageUrl: "/objects/uploads/d7a81ae4-bf51-477e-9d85-e18eacefe039", title: "Dashboard", subtitle: "Benvenuto nella tua area personale", paddingTop: "py-16", paddingBottom: "py-24", minHeight: "min-h-96" },
      { page: "courses", imageUrl: "/objects/uploads/a17df403-e623-4937-8773-8f5bc32b2d79", title: "I Nostri Corsi", subtitle: "Impara a surfare con i nostri corsi professionali per tutti i livelli", paddingTop: "py-24", paddingBottom: "py-24", minHeight: "min-h-[32rem]" },
      { page: "surf-camp", imageUrl: "/objects/uploads/d7a81ae4-bf51-477e-9d85-e18eacefe039", title: "Surf Camp", subtitle: "Vivi un'esperienza indimenticabile nelle migliori spiagge italiane", paddingTop: "py-16", paddingBottom: "py-24", minHeight: "min-h-[32rem]" }
    ];

    const coursesData = [
      { id: "2deecb7e-9946-4b01-a834-c5c839bf2d35", title: "REMATA", description: "Corso completo sulla tecnica di remata per longboard", level: "beginner" as const, isFree: false, price: 9900, instructorName: "Scuola di Longboard", courseCategory: "remata", activationStatus: "active" as const },
      { id: "61ad0b17-22be-416f-8c37-250142a1d9a2", title: "TAKEOFF", description: "Padroneggia la tecnica del takeoff perfetto", level: "intermediate" as const, isFree: false, price: 9900, instructorName: "Scuola di Longboard", courseCategory: "takeoff", activationStatus: "active" as const },
      { id: "8c5e2723-75f0-4395-ba4c-af01e96d247f", title: "NOSERIDE", description: "Impara l'arte del noseride e camminata sulla tavola", level: "advanced" as const, isFree: false, price: 12900, instructorName: "Scuola di Longboard", courseCategory: "noseride", activationStatus: "active" as const },
      { id: "fc9fee7f-5fa5-4994-bebc-046d84a13781", title: "CONTENUTI GRATUITI", description: "Video e contenuti gratuiti per tutti", level: "beginner" as const, isFree: true, price: 0, instructorName: "Scuola di Longboard", courseCategory: "gratuiti", activationStatus: "active" as const },
      { id: "7a00efdf-99c2-4a7f-b424-5068d81ce20a", title: "SPECIAL", description: "Contenuti speciali e masterclass", level: "intermediate" as const, isFree: false, price: 14900, instructorName: "Scuola di Longboard", courseCategory: "special", activationStatus: "active" as const }
    ];

    const modulesData = [
      { id: "bb4146f2-668a-4873-ac3e-a9521cacc694", courseId: "8c5e2723-75f0-4395-ba4c-af01e96d247f", title: "Contenuti Corso", description: "Modulo principale per i contenuti del corso", orderIndex: 0, defaultExpanded: true },
      { id: "d37205b5-f3fd-4afd-bbd2-ea1694a970b1", courseId: "2deecb7e-9946-4b01-a834-c5c839bf2d35", title: "Iniziamo da qui", description: "", orderIndex: 0, defaultExpanded: true },
      { id: "b9afd4e5-1491-471b-b196-b56434098387", courseId: "2deecb7e-9946-4b01-a834-c5c839bf2d35", title: "DOCUMENTI", description: "Qui troverai e-book e planning in pdf scaricabili per organizzare al meglio il tuo allenamento", orderIndex: 1, defaultExpanded: true },
      { id: "e62aad0e-3c0c-488f-9b57-aede11b04a94", courseId: "2deecb7e-9946-4b01-a834-c5c839bf2d35", title: "Allenamento", description: "", orderIndex: 2, defaultExpanded: true }
    ];

    const lessonsData = [
      { id: "49f6be0e-1039-4061-b58f-61237cdbfe15", moduleId: "d37205b5-f3fd-4afd-bbd2-ea1694a970b1", title: "Benvenuto/a!", videoUrl: "", orderIndex: 0, isFree: false, contentType: "presentazione", pdfUrl: "", htmlContent: "Lorem ipsum dolor sit amet..." },
      { id: "1e676516-fdea-4e19-aced-03fd4323aabe", moduleId: "b9afd4e5-1491-471b-b196-b56434098387", title: "E-Book", videoUrl: "", orderIndex: 0, isFree: false, contentType: "ebook", pdfUrl: "/objects/uploads/4bcec5a1-99c6-49e8-9031-ed2be497d676", htmlContent: "Lorem ipsum..." },
      { id: "ec709123-bdc5-4478-9c93-90b4dd98bf7d", moduleId: "b9afd4e5-1491-471b-b196-b56434098387", title: "Planning", videoUrl: "", orderIndex: 0, isFree: false, contentType: "planning", pdfUrl: "/objects/uploads/03065076-c5af-4862-b3ad-76411c4ec0b5", htmlContent: "Lorem ipsum..." },
      { id: "5f770d3c-2af3-422e-8896-17066c12ab66", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Esercizio", videoUrl: "", orderIndex: 0, isFree: false, contentType: "esercizio", pdfUrl: "", htmlContent: "" },
      { id: "a0a856e7-9d43-4174-9c2b-9b004a38df7f", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Riscaldamento", videoUrl: "", orderIndex: 0, isFree: false, contentType: "riscaldamento", pdfUrl: "", htmlContent: "" },
      { id: "b73386c9-67f5-4024-85bf-300502d865c4", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Settimana 1", videoUrl: "", orderIndex: 0, isFree: false, contentType: "settimana-1", pdfUrl: "", htmlContent: "" },
      { id: "30fe0be6-4311-4c5f-bbb8-2769a580a10c", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Settimana 2", videoUrl: "", orderIndex: 0, isFree: false, contentType: "settimana-2", pdfUrl: "", htmlContent: "" },
      { id: "e1a12618-7ae5-496d-83d0-1380e9d9bb15", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Settimana 3", videoUrl: "", orderIndex: 0, isFree: false, contentType: "settimana-3", pdfUrl: "", htmlContent: "" },
      { id: "3844c014-065d-4877-b506-38d0e28acede", moduleId: "e62aad0e-3c0c-488f-9b57-aede11b04a94", title: "Settimana 4", videoUrl: "", orderIndex: 0, isFree: false, contentType: "settimana-4", pdfUrl: "", htmlContent: "" }
    ];

    const customPagesData = [
      { id: "cbbe8762-5473-4041-9383-6de33a4924dc", slug: "chi-siamo", title: "Chi Siamo", headerImageUrl: "/objects/uploads/a17df403-e623-4937-8773-8f5bc32b2d79", headerTitle: "Chi Siamo", headerSubtitle: "La storia della Scuola di Longboard e la nostra passione per il surf", published: true, seoTitle: "Chi Siamo - Scuola di Longboard", seoDescription: "Scopri la storia della Scuola di Longboard...", menuLocation: "none" as const }
    ];

    const pageBlocksData = [
      { id: "b0163fab-4158-401d-9ea0-633e2d9badfb", customPageId: "cbbe8762-5473-4041-9383-6de33a4924dc", type: "text", orderIndex: 1, contentJson: { html: "<h2>La Nostra Storia</h2><p>La Scuola di Longboard nasce dalla passione per il surf...</p>" } },
      { id: "8b0096a0-078b-445a-8032-8011136570ef", customPageId: "cbbe8762-5473-4041-9383-6de33a4924dc", type: "cta", orderIndex: 3, contentJson: { title: "Inizia il Tuo Percorso", buttonUrl: "/courses", buttonText: "Vedi i Corsi", description: "Scopri i nostri corsi!" } },
      { id: "cec9ac27-79b0-4786-a8b2-74fc99131bd4", customPageId: "cbbe8762-5473-4041-9383-6de33a4924dc", type: "image", orderIndex: 2, contentJson: { alt: "Surfisti in azione", caption: "I nostri istruttori", imageUrl: "/objects/uploads/d7a81ae4-bf51-477e-9d85-e18eacefe039" } }
    ];

    console.log("📦 Inserting hero slides...");
    for (const slide of heroSlidesData) {
      try {
        await db.insert(heroSlides).values(slide).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", slide.id); }
    }
    console.log("✅ Hero slides done");

    console.log("📦 Inserting page headers...");
    for (const header of pageHeadersData) {
      try {
        await db.insert(pageHeaders).values(header).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", header.page); }
    }
    console.log("✅ Page headers done");

    console.log("📦 Inserting courses...");
    for (const course of coursesData) {
      try {
        await db.insert(courses).values(course).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", course.id); }
    }
    console.log("✅ Courses done");

    console.log("📦 Inserting modules...");
    for (const mod of modulesData) {
      try {
        await db.insert(modules).values(mod).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", mod.id); }
    }
    console.log("✅ Modules done");

    console.log("📦 Inserting lessons...");
    for (const lesson of lessonsData) {
      try {
        await db.insert(lessons).values(lesson).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", lesson.id); }
    }
    console.log("✅ Lessons done");

    console.log("📦 Inserting custom pages...");
    for (const page of customPagesData) {
      try {
        await db.insert(customPages).values(page).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", page.id); }
    }
    console.log("✅ Custom pages done");

    console.log("📦 Inserting page blocks...");
    for (const block of pageBlocksData) {
      try {
        await db.insert(pageBlocks).values(block).onConflictDoNothing();
      } catch (e) { console.log("  Skip duplicate:", block.id); }
    }
    console.log("✅ Page blocks done");

    console.log("\n🎉 Migration complete!");

    await pool.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

migrateData();
