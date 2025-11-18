import { useState, useEffect } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Lock,
  Folder
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
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

  const { data: lessonProgress = [] } = useQuery<{ lessonId: string; completed: boolean }[]>({
    queryKey: [`/api/lesson-progress/course/${id}`],
    enabled: isAuthenticated && !!id,
  });

  const toggleLessonCompleteMutation = useMutation({
    mutationFn: async ({ lessonId, completed }: { lessonId: string; completed: boolean }) => {
      await apiRequest("POST", "/api/lesson-progress", { lessonId, completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lesson-progress/course/${id}`] });
    },
  });

  // Initialize expanded modules based on defaultExpanded field
  useEffect(() => {
    if (modules && modules.length > 0 && expandedModules.length === 0) {
      const defaultExpanded = modules
        .filter(m => m.defaultExpanded)
        .map(m => m.id);
      setExpandedModules(defaultExpanded);
    }
  }, [modules, expandedModules.length]);

  // Auto-select first lesson when modules load
  useEffect(() => {
    if (modules && modules.length > 0 && !selectedLessonId) {
      const firstModule = modules.find(m => m.lessons && m.lessons.length > 0);
      if (firstModule && firstModule.lessons && firstModule.lessons.length > 0) {
        const sortedLessons = [...firstModule.lessons].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        setSelectedLessonId(sortedLessons[0].id);
      }
    }
  }, [modules, selectedLessonId]);

  if (courseLoading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isEnrolled = !!enrollment;
  const canAccess = course.isFree || isEnrolled;

  // Get selected lesson details
  const selectedLesson = modules
    ?.flatMap(m => m.lessons || [])
    .find(l => l.id === selectedLessonId);

  const renderContent = () => {
    if (!canAccess) {
      return (
        <Card className="p-12 text-center">
          <Lock className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Contenuto Riservato</h3>
          <p className="text-muted-foreground mb-4">
            Questo contenuto è disponibile solo per chi ha acquistato il corso
          </p>
          <Button onClick={() => setLocation(`/corsi/${id}`)}>
            Vai alla Pagina del Corso
          </Button>
        </Card>
      );
    }

    if (!selectedLesson) {
      return (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Benvenuto/a!</h3>
          <p className="text-muted-foreground">
            Seleziona una lezione dal menu laterale per iniziare
          </p>
        </Card>
      );
    }

    const lesson = selectedLesson;
    const isCompleted = lessonProgress.some(p => p.lessonId === lesson.id && p.completed);

    return (
      <div className="space-y-6">
        <Card data-testid={`lesson-card-${lesson.id}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{lesson.title}</CardTitle>
              {isCompleted && (
                <Badge className="bg-chart-4 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completata
                </Badge>
              )}
            </div>
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

            {/* Completion Toggle */}
            {isAuthenticated && canAccess && (
              <div className="pt-4 border-t">
                <Button
                  variant={isCompleted ? "outline" : "default"}
                  onClick={() => toggleLessonCompleteMutation.mutate({ 
                    lessonId: lesson.id, 
                    completed: !isCompleted 
                  })}
                  disabled={toggleLessonCompleteMutation.isPending}
                  data-testid={`button-toggle-complete-${lesson.id}`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Segna come non completata
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Segna come completata
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
              {!modules || modules.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">Nessun modulo disponibile</p>
              ) : (
                <Accordion 
                  type="multiple" 
                  value={expandedModules} 
                  onValueChange={setExpandedModules}
                  className="w-full"
                >
                  {modules.map((module) => (
                    <AccordionItem key={module.id} value={module.id} data-testid={`module-${module.id}`}>
                      <AccordionTrigger className="px-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{module.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1 ml-6 mt-2">
                          {(!module.lessons || module.lessons.length === 0) ? (
                            <p className="text-xs text-muted-foreground px-2 py-1">Nessuna lezione</p>
                          ) : (
                            module.lessons
                              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                              .map((lesson) => {
                                const Icon = lesson.contentType && contentIcons[lesson.contentType as ContentType] 
                                  ? contentIcons[lesson.contentType as ContentType] 
                                  : FileText;
                                const isSelected = selectedLessonId === lesson.id;
                                const isCompleted = lessonProgress.some(p => p.lessonId === lesson.id && p.completed);
                                return (
                                  <div
                                    key={lesson.id}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md transition-colors",
                                      isSelected 
                                        ? "bg-primary text-primary-foreground" 
                                        : ""
                                    )}
                                  >
                                    <button
                                      onClick={() => setSelectedLessonId(lesson.id)}
                                      className={cn(
                                        "flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left",
                                        !isSelected && "hover-elevate active-elevate-2"
                                      )}
                                      data-testid={`lesson-${lesson.id}`}
                                    >
                                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate flex-1">{lesson.title}</span>
                                    </button>
                                    {isCompleted && (
                                      <CheckCircle2 
                                        className={cn(
                                          "h-4 w-4 mr-2 flex-shrink-0",
                                          isSelected ? "text-primary-foreground" : "text-chart-4"
                                        )} 
                                        data-testid={`lesson-completed-${lesson.id}`}
                                      />
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

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
                      onClick={() => setLocation(`/corsi/${id}`)}
                      data-testid="button-go-to-course-info"
                    >
                      Vai alla Pagina del Corso
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
                {selectedLesson ? selectedLesson.title : "Corso"}
              </h1>
              <p className="text-muted-foreground">
                {canAccess 
                  ? (selectedLesson ? "Contenuto della lezione" : "Seleziona una lezione per iniziare") 
                  : "Iscriviti per accedere"}
              </p>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
