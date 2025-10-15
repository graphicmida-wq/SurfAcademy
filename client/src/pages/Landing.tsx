import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Users, Award, Calendar, ArrowRight } from "lucide-react";
import { HeroSlider } from "@/components/HeroSlider";

export default function Landing() {
  const levels = [
    {
      id: "beginner",
      title: "Principiante",
      description: "Inizia il tuo viaggio nel surf. Impara le basi, la sicurezza in acqua e le prime tecniche di remata.",
      icon: Waves,
      color: "from-chart-4/20 to-chart-4/5",
    },
    {
      id: "intermediate",
      title: "Intermedio",
      description: "Perfeziona la tua tecnica. Manovre avanzate, lettura delle onde e stile personale.",
      icon: Users,
      color: "from-primary/20 to-primary/5",
    },
    {
      id: "advanced",
      title: "Avanzato",
      description: "Diventa un maestro del longboard. Nose riding, hang ten e competizioni.",
      icon: Award,
      color: "from-chart-3/20 to-chart-3/5",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Dynamic Hero Slider */}
      <HeroSlider />

      {/* Levels Overview Section */}
      <section className="py-16 sm:py-24 bg-background" data-testid="section-levels">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-levels-title">
              Trova il Tuo Livello
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Percorsi di apprendimento strutturati per ogni fase del tuo viaggio nel surf
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {levels.map((level) => {
              const Icon = level.icon;
              return (
                <Card key={level.id} className="group hover-elevate active-elevate-2 transition-all duration-300 border-2" data-testid={`card-level-${level.id}`}>
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-2xl mb-3">{level.title}</h3>
                    <p className="text-muted-foreground mb-4">{level.description}</p>
                    <Link 
                      href={`/corsi?level=${level.id}`}
                      className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all" 
                      data-testid={`link-explore-${level.id}`}
                    >
                      Esplora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
              <Card className="p-6 text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-3" />
                <div className="font-display font-bold text-3xl mb-1">1000+</div>
                <div className="text-sm text-muted-foreground">Surfisti</div>
              </Card>
              <Card className="p-6 text-center">
                <Award className="h-12 w-12 text-chart-4 mx-auto mb-3" />
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
            <Calendar className="h-16 w-16 mx-auto mb-6 opacity-90" />
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
