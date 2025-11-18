import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Play, User, ExternalLink, CheckCircle } from "lucide-react";
import type { Course } from "@shared/schema";

interface CourseInfoData extends Course {
  isEnrolled?: boolean;
}

export default function CourseInfo() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: course, isLoading } = useQuery<CourseInfoData>({
    queryKey: [`/api/courses/${id}/info`],
  });

  const { data: userData } = useQuery({
    queryKey: ["/api/auth/user"],
  });

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

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Corso non trovato</h1>
        <Button onClick={() => navigate("/corsi")} className="mt-4" data-testid="button-back-to-courses">
          Torna ai Corsi
        </Button>
      </div>
    );
  }

  const isPurchasable = course.activationStatus === "active";
  const hasCheckoutUrl = !!course.externalCheckoutUrl;

  const renderGallery = () => {
    if (!course.imageGallery || course.imageGallery.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.imageGallery.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Immagine ${idx + 1}`}
            className="w-full h-64 object-cover rounded-lg"
            data-testid={`gallery-image-${idx}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {course.thumbnailUrl && (
        <div className="relative h-96 w-full">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
            data-testid="course-hero-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-2">
                {course.isFree && (
                  <Badge className="bg-chart-4 text-white border-0">Gratis</Badge>
                )}
                {course.courseCategory && (
                  <Badge variant="secondary">{course.courseCategory.toUpperCase()}</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white mb-2" data-testid="course-title">
                {course.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                {course.instructorName && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {course.instructorName}
                  </span>
                )}
                {course.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {course.description && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Descrizione</h2>
                <p className="text-muted-foreground" data-testid="course-description">
                  {course.description}
                </p>
              </Card>
            )}

            {course.fullDescription && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Dettagli Completi</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.fullDescription }}
                  data-testid="course-full-description"
                />
              </Card>
            )}

            {course.programContent && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Programma del Corso</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: course.programContent }}
                  data-testid="course-program"
                />
              </Card>
            )}

            {course.imageGallery && course.imageGallery.length > 0 && (
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
                  <span className="text-3xl font-bold" data-testid="course-price">
                    {course.isFree ? "Gratis" : `€${((course.price || 0) / 100).toFixed(2)}`}
                  </span>
                  <Badge 
                    variant={isPurchasable ? "default" : "secondary"} 
                    data-testid="course-status"
                  >
                    {isPurchasable ? "Disponibile" : "Non disponibile"}
                  </Badge>
                </div>

                {course.isEnrolled ? (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/corsi/${id}/player`)}
                    data-testid="button-go-to-course"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Vai al Corso
                  </Button>
                ) : (
                  <>
                    {hasCheckoutUrl ? (
                      <Button
                        className="w-full"
                        disabled={!isPurchasable}
                        onClick={() => window.open(course.externalCheckoutUrl!, '_blank')}
                        data-testid="button-buy-course"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isPurchasable ? "Acquista su WooCommerce" : "Non ancora disponibile"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled
                        data-testid="button-buy-course-disabled"
                      >
                        URL Checkout non configurato
                      </Button>
                    )}
                  </>
                )}

                {course.isEnrolled && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-chart-4" />
                    <span>Sei già iscritto a questo corso</span>
                  </div>
                )}

                {!isPurchasable && course.purchasableFrom && (
                  <p className="text-sm text-muted-foreground text-center">
                    Disponibile dal {new Date(course.purchasableFrom).toLocaleDateString("it-IT")}
                  </p>
                )}
              </div>
            </Card>

            {course.trailerUrl && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Anteprima</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    src={course.trailerUrl}
                    controls
                    className="w-full h-full"
                    data-testid="course-trailer"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
