import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Play, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  FileText, 
  Calendar, 
  Dumbbell, 
  Flame,
  ChevronRight,
  ChevronDown,
  Download,
  Lock
} from "lucide-react";
import type { Course, Module, Lesson } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import { cn } from "@/lib/utils";

type ContentType = 'presentazione' | 'ebook' | 'planning' | 'esercizio' | 'riscaldamento' | 'settimana-1' | 'settimana-2' | 'settimana-3' | 'settimana-4';

const contentIcons: Record<ContentType, any> = {
  'presentazione': BookOpen,
  'ebook': FileText,
  'planning': Calendar,
  'esercizio': Dumbbell,
  'riscaldamento': Flame,
  'settimana-1': Play,
  'settimana-2': Play,
  'settimana-3': Play,
  'settimana-4': Play,
};

const contentLabels: Record<ContentType, string> = {
  'presentazione': 'Presentazione Corso',
  'ebook': 'E-Book Corso',
  'planning': 'Planning Allenamento',
  'esercizio': 'Esercizio',
  'riscaldamento': 'Riscaldamento',
  'settimana-1': 'Settimana 1',
  'settimana-2': 'Settimana 2',
  'settimana-3': 'Settimana 3',
  'settimana-4': 'Settimana 4',
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<ContentType>('presentazione');
  const [settimaneExpanded, setSettimaneExpanded] = useState(true);
  
  const { data: pageHeader } = usePageHeader(`course-${id}`);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: modules } = useQuery<(Module & { lessons: Lesson[] })[]>({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: [`/api/enrollments/course/${id}`],
    enabled: isAuthenticated && !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/enrollments", { courseId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/enrollments/course/${id}`] });
      toast({
        title: "Iscrizione completata!",
        description: "Ora puoi accedere a tutte le lezioni del corso.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Accesso richiesto",
          description: "Effettua il login per iscriverti al corso.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Errore",
        description: "Impossibile completare l'iscrizione. Riprova.",
        variant: "destructive",
      });
    },
  });

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const canAccess = course.isFree || isEnrolled;

  // Get lessons filtered by contentType
  const getLessonsForContent = (contentType: ContentType): Lesson[] => {
    if (!modules) return [];
    return modules.flatMap(m => m.lessons || []).filter(l => l.contentType === contentType);
  };

  const renderContent = () => {
    const lessons = getLessonsForContent(selectedContent);

    if (!canAccess) {
      return (
        <Card className="p-12 text-center">
          <Lock className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Contenuto Riservato</h3>
          <p className="text-muted-foreground mb-4">
            Iscriviti al corso per accedere a tutti i contenuti
          </p>
          <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending ? "Iscrizione..." : "Iscriviti Ora"}
          </Button>
        </Card>
      );
    }

    if (lessons.length === 0) {
      return (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Nessun contenuto disponibile</h3>
          <p className="text-muted-foreground">
            I contenuti per questa sezione saranno presto disponibili
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {lessons.map((lesson) => (
          <Card key={lesson.id} data-testid={`lesson-card-${lesson.id}`}>
            <CardHeader>
              <CardTitle>{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video URLs */}
              {lesson.videoUrls && lesson.videoUrls.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Video</h4>
                  {lesson.videoUrls.map((videoUrl, idx) => (
                    <div key={idx} className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <video 
                        src={videoUrl} 
                        controls 
                        className="w-full h-full"
                        data-testid={`video-${lesson.id}-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Single Video URL (backward compatibility) */}
              {lesson.videoUrl && !lesson.videoUrls && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video 
                    src={lesson.videoUrl} 
                    controls 
                    className="w-full h-full"
                    data-testid={`video-${lesson.id}`}
                  />
                </div>
              )}

              {/* PDF Download */}
              {lesson.pdfUrl && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Materiale PDF</p>
                    <p className="text-sm text-muted-foreground">Scarica o visualizza il documento</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={lesson.pdfUrl} download target="_blank" rel="noopener noreferrer" data-testid={`download-pdf-${lesson.id}`}>
                      <Download className="h-4 w-4 mr-2" />
                      Scarica
                    </a>
                  </Button>
                </div>
              )}

              {/* HTML Content */}
              {lesson.htmlContent && (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.htmlContent }}
                  data-testid={`html-content-${lesson.id}`}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        imageUrl={pageHeader?.imageUrl || course.thumbnailUrl || undefined}
        title={pageHeader?.title || course.title}
        subtitle={pageHeader?.subtitle || course.description || undefined}
        paddingTop={pageHeader?.paddingTop || "py-12"}
        paddingBottom={pageHeader?.paddingBottom || "py-16"}
        minHeight={pageHeader?.minHeight || "min-h-64"}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <Card className="p-4">
              <h2 className="font-display font-semibold text-lg mb-4 px-2">Contenuti del Corso</h2>
              <nav className="space-y-1">
                {/* Main Content Categories */}
                {(['presentazione', 'ebook', 'planning', 'esercizio', 'riscaldamento'] as ContentType[]).map((type) => {
                  const Icon = contentIcons[type];
                  const isSelected = selectedContent === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedContent(type)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "hover-elevate active-elevate-2"
                      )}
                      data-testid={`nav-${type}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{contentLabels[type]}</span>
                    </button>
                  );
                })}

                {/* Settimane Section with Submenu */}
                <div>
                  <button
                    onClick={() => setSettimaneExpanded(!settimaneExpanded)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover-elevate active-elevate-2"
                    data-testid="nav-settimane-toggle"
                  >
                    {settimaneExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Calendar className="h-4 w-4" />
                    <span>Settimane</span>
                  </button>
                  {settimaneExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {(['settimana-1', 'settimana-2', 'settimana-3', 'settimana-4'] as ContentType[]).map((type) => {
                        const isSelected = selectedContent === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedContent(type)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                              isSelected 
                                ? "bg-primary text-primary-foreground" 
                                : "hover-elevate active-elevate-2"
                            )}
                            data-testid={`nav-${type}`}
                          >
                            <span>{contentLabels[type]}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>

              {/* Course Info */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration || 0} min totali</span>
                  </div>
                  {course.instructorName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Istruttore</p>
                      <p className="font-medium">{course.instructorName}</p>
                    </div>
                  )}
                  {!canAccess && (
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                      data-testid="button-enroll-sidebar"
                    >
                      {course.isFree ? "Inizia Gratis" : `Iscriviti - €${((course.price || 0) / 100).toFixed(2)}`}
                    </Button>
                  )}
                  {isEnrolled && (
                    <Badge className="w-full justify-center py-2 bg-chart-4 text-white border-0">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Iscritto
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold mb-2" data-testid="text-content-title">
                {contentLabels[selectedContent]}
              </h1>
              <p className="text-muted-foreground">
                {canAccess ? "Esplora i contenuti di questa sezione" : "Iscriviti per accedere"}
              </p>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
