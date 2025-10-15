import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, MapPin, Users, Euro, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { SurfCamp as SurfCampType, CampRegistration } from "@shared/schema";

export default function SurfCamp() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: camps, isLoading } = useQuery<SurfCampType[]>({
    queryKey: ["/api/surf-camps"],
  });

  const { data: registrations } = useQuery<CampRegistration[]>({
    queryKey: ["/api/camp-registrations"],
    enabled: isAuthenticated,
  });

  const { data: pageHeader } = usePageHeader('surf-camp');

  const registerMutation = useMutation({
    mutationFn: async (campId: string) => {
      await apiRequest("POST", "/api/camp-registrations", { campId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camp-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/surf-camps"] });
      toast({
        title: "Registrazione completata!",
        description: "Sei stato aggiunto alla waitlist del surf camp.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Accesso richiesto",
          description: "Effettua il login per registrarti al surf camp.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Errore",
        description: "Impossibile completare la registrazione. Riprova.",
        variant: "destructive",
      });
    },
  });

  const isRegistered = (campId: string) => {
    return registrations?.some((reg) => reg.campId === campId);
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Surf Camp"}
        subtitle={pageHeader?.subtitle || "Vivi un'esperienza indimenticabile nelle più belle location italiane. Settimane intensive di surf, lezioni con istruttori esperti e una community appassionata."}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Camps Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : camps && camps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-surf-camps">
            {camps.map((camp) => {
              const isLowAvailability = camp.availableSpots <= 5 && camp.availableSpots > 0;
              const isFull = camp.availableSpots === 0;
              const registered = isRegistered(camp.id);

              return (
                <Card
                  key={camp.id}
                  className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 flex flex-col"
                  data-testid={`card-surf-camp-${camp.id}`}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {camp.imageUrl ? (
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    {isLowAvailability && !isFull && (
                      <Badge className="absolute top-3 right-3 bg-chart-3 text-white border-0">
                        Ultimi {camp.availableSpots} posti!
                      </Badge>
                    )}
                    {isFull && (
                      <Badge className="absolute top-3 right-3 bg-destructive text-white border-0">
                        Esaurito
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-primary transition-colors" data-testid={`text-camp-title-${camp.id}`}>
                      {camp.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-camp-description-${camp.id}`}>
                      {camp.description}
                    </p>

                    <div className="space-y-2 text-sm mt-auto">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{camp.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(camp.startDate), "d MMM", { locale: it })} -{" "}
                          {format(new Date(camp.endDate), "d MMM yyyy", { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                          {camp.availableSpots} / {camp.totalSpots} posti disponibili
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex items-center justify-between gap-4">
                    <div className="text-2xl font-display font-bold text-primary" data-testid={`text-camp-price-${camp.id}`}>
                      €{(camp.price / 100).toFixed(0)}
                    </div>

                    {registered ? (
                      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 px-4 py-2">
                        Registrato
                      </Badge>
                    ) : isFull ? (
                      <Button
                        disabled={!isAuthenticated || registerMutation.isPending}
                        onClick={() => registerMutation.mutate(camp.id)}
                        variant="outline"
                        data-testid={`button-join-waitlist-${camp.id}`}
                      >
                        {!isAuthenticated ? "Accedi" : "Lista d'Attesa"}
                      </Button>
                    ) : (
                      <Button
                        disabled={!isAuthenticated || registerMutation.isPending}
                        onClick={() => registerMutation.mutate(camp.id)}
                        data-testid={`button-register-${camp.id}`}
                      >
                        {!isAuthenticated ? "Accedi per Registrarti" : "Registrati"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">Nessun surf camp disponibile</h3>
            <p className="text-muted-foreground">
              Nuovi surf camp saranno aggiunti presto. Torna a trovarci!
            </p>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Settimane Intensive</h3>
            <p className="text-sm text-muted-foreground">
              5-7 giorni di surf, lezioni quotidiane e teoria
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-chart-4 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Gruppi Piccoli</h3>
            <p className="text-sm text-muted-foreground">
              Massimo 8 partecipanti per istruttore
            </p>
          </Card>
          <Card className="p-6 text-center">
            <MapPin className="h-12 w-12 text-chart-3 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Location Premium</h3>
            <p className="text-sm text-muted-foreground">
              Le migliori spiagge di Liguria, Sardegna e Toscana
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
