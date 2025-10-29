import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { GiPalmTree, GiTrophy, GiWaveSurfer } from "react-icons/gi";
import { HeroSlider } from "@/components/HeroSlider";
import { CourseCard } from "@/components/CourseCard";
import { useQuery } from "@tanstack/react-query";
import type { Course } from "@shared/schema";

export default function Landing() {
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Get only the first 3 main courses (REMATA, TAKEOFF, NOSERIDE)
  const mainCourses = courses.filter(c => 
    c.courseCategory === 'remata' || 
    c.courseCategory === 'takeoff' || 
    c.courseCategory === 'noseride'
  ).slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Dynamic Hero Slider */}
      <HeroSlider />

      {/* Main Courses Section */}
      <section className="py-16 sm:py-24 bg-background" data-testid="section-main-courses">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-main-courses-title">
              I Nostri Corsi Principali
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Scegli il percorso perfetto per migliorare le tue abilità nel longboard surf
            </p>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-96 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {mainCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 sm:py-24 bg-card" data-testid="section-featured-courses">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-4">
              Corsi in Evidenza
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Inizia subito con i nostri corsi più popolari. Alcuni sono completamente gratuiti!
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Link href="/corsi">
              <Button size="lg" data-testid="button-view-all-courses">
                Vedi Tutti i Corsi
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Snapshot */}
      <section className="py-16 sm:py-24 bg-background" data-testid="section-community">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Community</Badge>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-6">
                Unisciti alla Community
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Condividi la tua passione per il surf con altri surfisti. Chiedi consigli, 
                mostra i tuoi progressi e partecipa alle discussioni.
              </p>
              <Link href="/community">
                <Button size="lg" variant="outline" data-testid="button-join-community">
                  Esplora la Community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center hover-elevate transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
                  <GiWaveSurfer className="h-10 w-10 text-primary" />
                </div>
                <div className="font-display font-bold text-3xl mb-1">1000+</div>
                <div className="text-sm text-muted-foreground">Surfisti</div>
              </Card>
              <Card className="p-6 text-center hover-elevate transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-4/20 to-chart-4/5 flex items-center justify-center mx-auto mb-3">
                  <GiTrophy className="h-10 w-10 text-chart-4" />
                </div>
                <div className="font-display font-bold text-3xl mb-1">500+</div>
                <div className="text-sm text-muted-foreground">Badge Ottenuti</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Surf Camp CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-primary to-chart-2 text-white" data-testid="section-surf-camp">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 hover:scale-105 transition-transform duration-300">
              <GiPalmTree className="h-16 w-16 opacity-90" />
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-6">
              Vivi l'Esperienza Surf Camp
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Settimane intensive nelle più belle location italiane. Spiagge della Liguria, 
              Sardegna e Toscana ti aspettano.
            </p>
            <Link href="/surf-camp">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-full" data-testid="button-view-camps">
                Scopri i Surf Camp
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
