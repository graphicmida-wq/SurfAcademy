import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, Users, Award, Calendar, ArrowRight, Play } from "lucide-react";
import logoUrl from "@assets/web_logo_1760523001836.webp";

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
      {/* Fullscreen Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="section-hero">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-chart-2 to-primary/80" />
        
        {/* Overlay Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img 
            src={logoUrl} 
            alt="Scuola di Longboard" 
            className="mx-auto mb-8 h-32 sm:h-40 md:h-48 w-auto drop-shadow-2xl"
            data-testid="img-logo"
          />
          
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-lg" data-testid="text-hero-title">
            Diventa un Maestro<br />del Longboard
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md" data-testid="text-hero-subtitle">
            Corsi online, esercizi propedeutici, community appassionata e surf camp in Italia
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="default" asChild className="bg-chart-3 hover:bg-chart-3/90 text-white border-0 text-lg px-8 py-6 rounded-full shadow-2xl" data-testid="button-start-free">
              <Link href="/corsi" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Inizia Gratis
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="backdrop-blur-md bg-white/20 border-white/40 text-white hover:bg-white/30 text-lg px-8 py-6 rounded-full shadow-xl no-default-hover-elevate" data-testid="button-explore-courses">
              <Link href="/corsi">Scopri i Corsi</Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/60 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/60 rounded-full" />
          </div>
        </div>
      </section>

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
