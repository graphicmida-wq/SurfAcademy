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
import type { SurfDay as SurfDayType, SurfDayRegistration } from "@shared/schema";

export default function SurfDay() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: surfDays, isLoading } = useQuery<SurfDayType[]>({
    queryKey: ["/api/surf-days"],
  });

  const { data: registrations } = useQuery<SurfDayRegistration[]>({
    queryKey: ["/api/surf-day-registrations"],
    enabled: isAuthenticated,
  });

  const { data: pageHeader } = usePageHeader('surf-day');

  const registerMutation = useMutation({
    mutationFn: async (surfDayId: string) => {
      await apiRequest("POST", "/api/surf-day-registrations", { surfDayId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surf-day-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/surf-days"] });
      toast({
        title: "Prenotazione completata!",
        description: "Sei stato aggiunto alla lista per il SurfDay. Ti contatteremo quando le condizioni saranno perfette!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Accesso richiesto",
          description: "Effettua il login per prenotare il SurfDay.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Errore",
        description: "Impossibile completare la prenotazione. Riprova.",
        variant: "destructive",
      });
    },
  });

  const isRegistered = (surfDayId: string) => {
    return registrations?.some((reg) => reg.surfDayId === surfDayId);
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "SurfDay"}
        subtitle={pageHeader?.subtitle || "Prenota la tua giornata di surf in base alle condizioni perfette. Ti contatteremo durante il waiting period quando le onde saranno al massimo!"}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* SurfDays Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : surfDays && surfDays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-surf-days">
            {surfDays.map((surfDay) => {
              const isLowAvailability = surfDay.availableSpots <= 5 && surfDay.availableSpots > 0;
              const isFull = surfDay.availableSpots === 0;
              const registered = isRegistered(surfDay.id);

              return (
                <Card
                  key={surfDay.id}
                  className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 flex flex-col"
                  data-testid={`card-surf-day-${surfDay.id}`}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {surfDay.imageUrl ? (
                      <img
                        src={surfDay.imageUrl}
                        alt={surfDay.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    {isLowAvailability && !isFull && (
                      <Badge className="absolute top-3 right-3 bg-chart-3 text-white border-0">
                        Ultimi {surfDay.availableSpots} posti!
                      </Badge>
                    )}
                    {isFull && (
                      <Badge className="absolute top-3 right-3 bg-destructive text-white border-0">
                        Esaurito
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-primary transition-colors" data-testid={`text-surfday-title-${surfDay.id}`}>
                      {surfDay.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-surfday-description-${surfDay.id}`}>
                      {surfDay.description}
                    </p>

                    <div className="space-y-2 text-sm mt-auto">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{surfDay.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Waiting Period:</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground pl-6">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(surfDay.startDate), "d MMM", { locale: it })} -{" "}
                          {format(new Date(surfDay.endDate), "d MMM yyyy", { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                          {surfDay.availableSpots} / {surfDay.totalSpots} posti disponibili
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex items-center justify-between gap-4">
                    <div className="text-2xl font-display font-bold text-primary" data-testid={`text-surfday-price-${surfDay.id}`}>
                      €{(surfDay.price / 100).toFixed(0)}
                    </div>

                    {registered ? (
                      <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20 px-4 py-2">
                        Prenotato
                      </Badge>
                    ) : isFull ? (
                      <Button
                        disabled={!isAuthenticated || registerMutation.isPending}
                        onClick={() => registerMutation.mutate(surfDay.id)}
                        variant="outline"
                        data-testid={`button-join-waitlist-${surfDay.id}`}
                      >
                        {!isAuthenticated ? "Accedi" : "Lista d'Attesa"}
                      </Button>
                    ) : (
                      <Button
                        disabled={!isAuthenticated || registerMutation.isPending}
                        onClick={() => registerMutation.mutate(surfDay.id)}
                        data-testid={`button-register-${surfDay.id}`}
                      >
                        {!isAuthenticated ? "Accedi per Prenotare" : "Prenota"}
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
            <h3 className="font-display font-semibold text-xl mb-2">Nessun SurfDay disponibile</h3>
            <p className="text-muted-foreground">
              Nuove giornate SurfDay saranno aggiunte presto. Torna a trovarci!
            </p>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Waiting Period</h3>
            <p className="text-sm text-muted-foreground">
              Ti contattiamo quando le condizioni sono perfette
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Users className="h-12 w-12 text-chart-4 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Gruppi Piccoli</h3>
            <p className="text-sm text-muted-foreground">
              Massimo 12 partecipanti per sessione
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
