import { storage } from "./storage";

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

    // Create surf camps
    await storage.createSurfCamp({
      title: "Surf Camp Liguria",
      description: "Una settimana intensiva di surf sulle migliori onde della Liguria. Include 10 lezioni, noleggio attrezzatura e alloggio.",
      location: "Varazze, Liguria",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-07-07"),
      price: 59900, // €599
      totalSpots: 12,
      availableSpots: 12,
    });

    await storage.createSurfCamp({
      title: "Surf Camp Sardegna",
      description: "Vivi il surf nell'isola più bella d'Italia. 7 giorni di onde cristalline, spiagge paradisiache e istruttori esperti.",
      location: "Capo Mannu, Sardegna",
      startDate: new Date("2025-08-15"),
      endDate: new Date("2025-08-22"),
      price: 79900, // €799
      totalSpots: 8,
      availableSpots: 3,
    });

    await storage.createSurfCamp({
      title: "Surf Camp Toscana",
      description: "Surf e cultura nella splendida Toscana. Onde perfette per principianti e intermedi.",
      location: "Marina di Pisa, Toscana",
      startDate: new Date("2025-06-20"),
      endDate: new Date("2025-06-26"),
      price: 49900, // €499
      totalSpots: 10,
      availableSpots: 0, // Full
    });

    console.log("✅ Created surf camps");

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
