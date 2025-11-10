import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Clinic as ClinicType, ClinicRegistration } from "@shared/schema";

export default function Clinic() {
  const { data: clinics, isLoading } = useQuery<ClinicType[]>({
    queryKey: ["/api/clinics"],
  });

  const { data: pageHeader } = usePageHeader('clinic');

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Clinic"}
        subtitle={pageHeader?.subtitle || "Prenota la tua giornata di surf in base alle condizioni perfette. Ti contatteremo durante il waiting period quando le onde saranno al massimo!"}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Clinics Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : clinics && clinics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-clinics">
            {clinics.map((clinic) => {
              const isLowAvailability = clinic.availableSpots <= 5 && clinic.availableSpots > 0;
              const isFull = clinic.availableSpots === 0;

              return (
                <Card
                  key={clinic.id}
                  className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 flex flex-col"
                  data-testid={`card-clinic-${clinic.id}`}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {clinic.imageUrl ? (
                      <img
                        src={clinic.imageUrl}
                        alt={clinic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    {isLowAvailability && !isFull && (
                      <Badge className="absolute top-3 right-3 bg-chart-3 text-white border-0">
                        Ultimi {clinic.availableSpots} posti!
                      </Badge>
                    )}
                    {isFull && (
                      <Badge className="absolute top-3 right-3 bg-destructive text-white border-0">
                        Esaurito
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="font-display font-semibold text-xl mb-3 group-hover:text-primary transition-colors" data-testid={`text-clinic-title-${clinic.id}`}>
                      {clinic.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-clinic-description-${clinic.id}`}>
                      {clinic.description?.replace(/<[^>]*>/g, '')}
                    </p>

                    <div className="space-y-2 text-sm mt-auto">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{clinic.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">Waiting Period:</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground pl-6">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(clinic.startDate), "d MMM", { locale: it })} -{" "}
                          {format(new Date(clinic.endDate), "d MMM yyyy", { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                          {clinic.availableSpots} / {clinic.totalSpots} posti disponibili
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 flex items-center justify-between gap-4">
                    <div className="text-2xl font-display font-bold text-primary" data-testid={`text-clinic-price-${clinic.id}`}>
                      €{(clinic.price / 100).toFixed(0)}
                    </div>

                    <Link href={`/clinic/${clinic.id}`}>
                      <Button data-testid={`button-clinic-details-${clinic.id}`}>
                        Dettagli
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">Nessuna Clinic disponibile</h3>
            <p className="text-muted-foreground">
              Nuove Clinic saranno aggiunte presto. Torna a trovarci!
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
