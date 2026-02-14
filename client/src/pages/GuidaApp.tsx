import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import DOMPurify from "dompurify";
import { FileText, PlayCircle, BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuidePage } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";

export default function GuidaApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const { data: pageHeader } = usePageHeader("guida-app");

  const { data: guidePages = [], isLoading: pagesLoading } = useQuery<GuidePage[]>({
    queryKey: ['/api/guide-pages'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (guidePages.length > 0 && !selectedPageId) {
      setSelectedPageId(guidePages[0].id);
    }
  }, [guidePages, selectedPageId]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || pagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const selectedPage = guidePages.find(p => p.id === selectedPageId);

  const renderContent = () => {
    if (!selectedPage) {
      return (
        <Card className="p-12 text-center" data-testid="guide-empty-state">
          <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Seleziona un contenuto dalla lista</p>
        </Card>
      );
    }

    const hasVideo = selectedPage.videoUrl || (selectedPage.videoUrls && selectedPage.videoUrls.length > 0);

    return (
      <div className="space-y-6">
        <Card data-testid={`guide-card-${selectedPage.id}`}>
          <CardHeader className="p-6 sm:p-8">
            <CardTitle>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPage.title) }} />
            </CardTitle>
            {selectedPage.description && (
              <div className="text-muted-foreground mt-1 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPage.description) }} />
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-6 sm:p-8 pt-0 sm:pt-0">
            {selectedPage.videoUrls && selectedPage.videoUrls.length > 0 && (
              <div className="space-y-4">
                {selectedPage.videoUrls.map((videoUrl, idx) => (
                  <div key={idx} className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full"
                      data-testid={`guide-video-${selectedPage.id}-${idx}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {selectedPage.videoUrl && !selectedPage.videoUrls?.length && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedPage.videoUrl}
                  controls
                  className="w-full h-full"
                  data-testid={`guide-video-${selectedPage.id}`}
                />
              </div>
            )}

            {selectedPage.htmlContent && (
              <div
                className="prose prose-sm max-w-none dark:prose-invert py-4"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedPage.htmlContent) }}
                data-testid={`guide-html-content-${selectedPage.id}`}
              />
            )}

            {!hasVideo && !selectedPage.htmlContent && (
              <p className="text-muted-foreground text-center py-8">Nessun contenuto disponibile per questa pagina</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Guida App"}
        subtitle={pageHeader?.subtitle || "Scopri come funziona l'app e come sfruttarla al meglio"}
        paddingTop={pageHeader?.paddingTop || "py-12"}
        paddingBottom={pageHeader?.paddingBottom || "py-16"}
        minHeight={pageHeader?.minHeight || "min-h-64"}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {guidePages.length === 0 ? (
          <Card className="p-12 text-center" data-testid="guide-no-content">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nessun contenuto disponibile</p>
            <p className="text-muted-foreground">I contenuti della guida saranno disponibili a breve</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:sticky lg:top-20 h-fit">
              <Card className="p-4">
                <h2 className="font-display font-semibold text-lg mb-4 px-2">Contenuti</h2>
                <div className="space-y-1">
                  {guidePages.map((page) => {
                    const isSelected = selectedPageId === page.id;
                    const hasVideo = page.videoUrl || (page.videoUrls && page.videoUrls.length > 0);
                    const Icon = hasVideo ? PlayCircle : FileText;
                    return (
                      <div
                        key={page.id}
                        className={cn(
                          "flex items-center gap-1 rounded-md transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : ""
                        )}
                      >
                        <button
                          onClick={() => setSelectedPageId(page.id)}
                          className={cn(
                            "flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left",
                            !isSelected && "hover-elevate active-elevate-2"
                          )}
                          data-testid={`guide-nav-${page.id}`}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate flex-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.title.replace(/<[^>]*>/g, '')) }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </aside>

            <div className="lg:col-span-3" data-testid="guide-content-area">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
