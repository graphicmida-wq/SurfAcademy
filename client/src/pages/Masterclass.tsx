import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Video } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Course } from "@shared/schema";

export default function MasterclassPage() {
  const { isAuthenticated } = useAuth();
  const { data: pageHeader, isLoading: headerLoading } = usePageHeader('masterclass');

  const { data: masterclasses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/masterclasses"],
    enabled: isAuthenticated,
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Masterclass Gratuite"}
        subtitle={pageHeader?.subtitle || "Contenuti esclusivi accessibili a tutti gli utenti registrati"}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
        isLoading={headerLoading}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : masterclasses.length === 0 ? (
          <Card className="p-16 text-center">
            <Video className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-xl mb-2">
              Nessuna masterclass disponibile
            </h3>
            <p className="text-muted-foreground">
              Le masterclass gratuite verranno pubblicate presto. Torna a controllare!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterclasses.map((masterclass) => (
              <Card
                key={masterclass.id}
                className="hover-elevate active-elevate-2 transition-all overflow-hidden"
                data-testid={`masterclass-card-${masterclass.id}`}
              >
                {masterclass.thumbnailUrl ? (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={masterclass.thumbnailUrl}
                      alt={masterclass.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Video className="h-12 w-12 text-primary/40" />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-display font-semibold text-lg leading-tight"
                      data-testid={`text-masterclass-title-${masterclass.id}`}
                    >
                      {masterclass.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      Gratuita
                    </Badge>
                  </div>

                  {masterclass.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {masterclass.description}
                    </p>
                  )}

                  {masterclass.instructorName && (
                    <p className="text-sm text-muted-foreground">
                      con {masterclass.instructorName}
                    </p>
                  )}

                  <Link href={`/corsi/${masterclass.id}/player`}>
                    <Button
                      className="w-full mt-2"
                      data-testid={`button-watch-${masterclass.id}`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Guarda ora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
