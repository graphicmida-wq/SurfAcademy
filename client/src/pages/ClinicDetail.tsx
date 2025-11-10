import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users, Clock, Euro } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AuthPrompt from "@/components/AuthPrompt";

interface Clinic {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  price: number;
  totalSpots: number;
  availableSpots: number;
  imageUrl?: string;
  imageGallery?: string[];
  galleryLayout?: string;
  galleryColumns?: number;
  galleryGap?: string;
  galleryAspectRatio?: string;
  activationStatus: string;
  purchasableFrom?: string;
}

interface ClinicRegistration {
  id: string;
  status: string;
  registeredAt: string;
}

export default function ClinicDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/clinics", id],
    enabled: !!id,
  });

  const clinic = data?.clinic as Clinic | undefined;
  const userRegistration = data?.userRegistration as ClinicRegistration | undefined;

  const joinWaitlistMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/clinics/${id}/waitlist`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", id] });
      toast({ title: "Iscritto alla lista d'attesa!", description: "Ti avviseremo quando sarà possibile prenotare." });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile iscriversi alla lista d'attesa",
        variant: "destructive",
      });
    },
  });

  const handleCheckout = () => {
    toast({
      title: "Checkout non ancora disponibile",
      description: "Il sistema di pagamento Stripe sarà configurato a breve. Per ora puoi iscriverti alla lista d'attesa!",
      variant: "default",
    });
  };

  const getButtonState = () => {
    if (!userData) {
      return { label: "Accedi per prenotare", action: null, variant: "default" as const, disabled: false };
    }

    if (clinic?.availableSpots === 0) {
      return { label: "Sold Out", action: null, variant: "secondary" as const, disabled: true };
    }

    if (clinic?.activationStatus === "active") {
      if (userRegistration?.status === "confirmed") {
        return { label: "Già prenotato", action: null, variant: "secondary" as const, disabled: true };
      }
      return { label: "Prenota Ora", action: handleCheckout, variant: "default" as const, disabled: false };
    }

    if (userRegistration?.status === "waitlist") {
      return { label: "In Lista d'Attesa", action: null, variant: "secondary" as const, disabled: true };
    }

    return { label: "Lista d'Attesa", action: () => joinWaitlistMutation.mutate(), variant: "outline" as const, disabled: false };
  };

  const renderGallery = () => {
    if (!clinic?.imageGallery || clinic.imageGallery.length === 0) return null;

    const layout = clinic.galleryLayout || "grid";
    const columns = clinic.galleryColumns || 3;
    const gap = clinic.galleryGap || "16px";
    const aspectRatio = clinic.galleryAspectRatio || "original";

    const getAspectRatioClass = () => {
      switch (aspectRatio) {
        case "1:1": return "aspect-square";
        case "4:3": return "aspect-[4/3]";
        case "16:9": return "aspect-video";
        default: return "";
      }
    };

    const getGridColumnsClass = () => {
      switch (columns) {
        case 1: return "grid-cols-1";
        case 2: return "grid-cols-2";
        case 3: return "grid-cols-3";
        case 4: return "grid-cols-4";
        case 5: return "grid-cols-5";
        case 6: return "grid-cols-6";
        default: return "grid-cols-3";
      }
    };

    if (layout === "carousel") {
      return (
        <div className="relative overflow-x-auto">
          <div className="flex gap-4">
            {clinic.imageGallery.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Gallery ${idx + 1}`}
                className={`w-80 object-cover rounded-lg ${getAspectRatioClass()}`}
                data-testid={`gallery-image-${idx}`}
              />
            ))}
          </div>
        </div>
      );
    }

    const gridClass = `grid ${getGridColumnsClass()}`;

    return (
      <div className={gridClass} style={{ gap }}>
        {clinic.imageGallery.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Gallery ${idx + 1}`}
            className={`w-full object-cover rounded-lg ${getAspectRatioClass()}`}
            data-testid={`gallery-image-${idx}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Clinic non trovata</h1>
        <Button onClick={() => navigate("/clinic")} className="mt-4" data-testid="button-back-to-clinics">
          Torna alle Clinic
        </Button>
      </div>
    );
  }

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen bg-background">
      {clinic.imageUrl && (
        <div className="relative h-96 w-full">
          <img
            src={clinic.imageUrl}
            alt={clinic.title}
            className="w-full h-full object-cover"
            data-testid="clinic-hero-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto max-w-6xl">
              <h1 className="text-4xl font-bold text-white mb-2" data-testid="clinic-title">
                {clinic.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {clinic.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {clinic.availableSpots}/{clinic.totalSpots} posti
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {clinic.description && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Descrizione</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: clinic.description }}
                  data-testid="clinic-description"
                />
              </Card>
            )}

            {clinic.imageGallery && clinic.imageGallery.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Galleria</h2>
                {renderGallery()}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold" data-testid="clinic-price">
                    €{(clinic.price / 100).toFixed(2)}
                  </span>
                  <Badge variant={clinic.activationStatus === "active" ? "default" : "secondary"} data-testid="clinic-status">
                    {clinic.activationStatus === "active" ? "Attiva" : "Lista d'attesa"}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="clinic-dates">
                      {format(new Date(clinic.startDate), "d MMMM yyyy", { locale: it })} -{" "}
                      {format(new Date(clinic.endDate), "d MMMM yyyy", { locale: it })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="clinic-spots">
                      {clinic.availableSpots}/{clinic.totalSpots} posti disponibili
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span data-testid="clinic-location">{clinic.location}</span>
                  </div>
                </div>

                {!userData ? (
                  <div className="mt-6">
                    <AuthPrompt
                      title="Prenotazione Clinic"
                      description="Per prenotare o iscriverti alla lista d'attesa, devi prima accedere"
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })}
                    />
                  </div>
                ) : (
                  <Button
                    className="w-full mt-6"
                    variant={buttonState.variant}
                    disabled={buttonState.disabled || joinWaitlistMutation.isPending}
                    onClick={buttonState.action || undefined}
                    data-testid="button-clinic-action"
                  >
                    {joinWaitlistMutation.isPending ? "Iscrizione..." : buttonState.label}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
