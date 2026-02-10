import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import DOMPurify from "dompurify";
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
  Download,
  Lock,
  Folder
} from "lucide-react";
import type { Course, Module, Lesson } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import { cn } from "@/lib/utils";

type ContentType = 'presentazione' | 'ebook' | 'planning' | 'esercizio' | 'stretching' | 'riscaldamento' | 'settimana-1' | 'settimana-2' | 'settimana-3' | 'settimana-4';

const contentIcons: Record<ContentType, any> = {
  'presentazione': BookOpen,
  'ebook': FileText,
  'planning': Calendar,
  'esercizio': Dumbbell,
  'stretching': Dumbbell,
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
  'stretching': 'Stretching',
  'riscaldamento': 'Riscaldamento',
  'settimana-1': 'Settimana 1',
  'settimana-2': 'Settimana 2',
  'settimana-3': 'Settimana 3',
  'settimana-4': 'Settimana 4',
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.isAdmin === true;
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const selectLesson = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (window.innerWidth < 1024 && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);
  
  const { data: pageHeader } = usePageHeader(`course-${id}`);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: rawModules } = useQuery<(Module & { lessons: Lesson[] })[]>({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  const modules = useMemo(() => {
    if (!rawModules) return rawModules;
    return rawModules.map(mod => ({
      ...mod,
      lessons: [...(mod.lessons || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    }));
  }, [rawModules]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      queryClient.invalidateQueries({ queryKey: [`/api/enrollments/course/${id}`] });
    },
  });


  const watchedVideosRef = useRef<Set<string>>(new Set());
  const autoCompleteTriggeredRef = useRef<Set<string>>(new Set());

  const checkAndAutoComplete = useCallback((lessonId: string, videoIndex: number, totalVideos: number) => {
    const videoKey = `${lessonId}-${videoIndex}`;
    watchedVideosRef.current.add(videoKey);
    
    const allWatched = Array.from({ length: totalVideos }, (_, i) => `${lessonId}-${i}`)
      .every(key => watchedVideosRef.current.has(key));
    
    if (allWatched && !autoCompleteTriggeredRef.current.has(lessonId)) {
      autoCompleteTriggeredRef.current.add(lessonId);
      const alreadyCompleted = lessonProgress.some(p => p.lessonId === lessonId && p.completed);
      if (!alreadyCompleted) {
        toggleLessonCompleteMutation.mutate({ lessonId, completed: true });
      }
    }
  }, [lessonProgress, toggleLessonCompleteMutation]);

  const handleVideoTimeUpdate = useCallback((lessonId: string, videoIndex: number, totalVideos: number, event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.duration > 0 && !isNaN(video.duration) && video.currentTime / video.duration >= 0.9) {
      checkAndAutoComplete(lessonId, videoIndex, totalVideos);
    }
  }, [checkAndAutoComplete]);

  const handleVideoEnded = useCallback((lessonId: string, videoIndex: number, totalVideos: number) => {
    checkAndAutoComplete(lessonId, videoIndex, totalVideos);
  }, [checkAndAutoComplete]);

  useEffect(() => {
    watchedVideosRef.current.clear();
    autoCompleteTriggeredRef.current.clear();
  }, [selectedLessonId]);

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
        setSelectedLessonId(firstModule.lessons[0].id);
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
    const hasVideo = (lesson.videoUrls && lesson.videoUrls.length > 0) || lesson.videoUrl;
    const isPdfOnly = lesson.pdfUrl && !hasVideo;

    return (
      <div className="space-y-6">
        <Card data-testid={`lesson-card-${lesson.id}`}>
          <CardHeader className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle>
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.title) }} />
              </CardTitle>
              {isCompleted && (
                <Badge className="bg-chart-4 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completata
                </Badge>
              )}
            </div>
            {lesson.description && (
              <div className="text-muted-foreground mt-1 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.description) }} />
            )}
          </CardHeader>
          <CardContent className="space-y-4 p-6 sm:p-8 pt-0 sm:pt-0">
            {/* Video URLs */}
            {lesson.videoUrls && lesson.videoUrls.length > 0 && (
              <div className="space-y-4">
                {lesson.videoUrls.map((videoUrl, idx) => (
                  <div key={idx} className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full"
                      onTimeUpdate={(e) => handleVideoTimeUpdate(lesson.id, idx, lesson.videoUrls!.length, e)}
                      onEnded={() => handleVideoEnded(lesson.id, idx, lesson.videoUrls!.length)}
                      data-testid={`video-${lesson.id}-${idx}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Single Video URL (backward compatibility) */}
            {lesson.videoUrl && !lesson.videoUrls && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  src={lesson.videoUrl} 
                  controls 
                  className="w-full h-full"
                  onTimeUpdate={(e) => handleVideoTimeUpdate(lesson.id, 0, 1, e)}
                  onEnded={() => handleVideoEnded(lesson.id, 0, 1)}
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
                  <a 
                    href={lesson.pdfUrl} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    data-testid={`download-pdf-${lesson.id}`}
                    onClick={() => {
                      if (isPdfOnly && isAuthenticated && !isCompleted) {
                        toggleLessonCompleteMutation.mutate({ lessonId: lesson.id, completed: true });
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica
                  </a>
                </Button>
              </div>
            )}

            {/* HTML Content */}
            {lesson.htmlContent && (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert py-4"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.htmlContent) }}
                data-testid={`html-content-${lesson.id}`}
              />
            )}

            {/* Completion Toggle - hidden for PDF-only lessons (auto-completed on download) */}
            {isAuthenticated && canAccess && !isPdfOnly && (
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
              <h2 className="font-display font-semibold text-lg mb-2 px-2">Contenuti del Corso</h2>
              {modules && modules.length > 0 && (() => {
                const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
                const completedLessons = modules.reduce((sum, m) => 
                  sum + (m.lessons?.filter(l => lessonProgress.some(p => p.lessonId === l.id && p.completed)).length || 0), 0);
                const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                return (
                  <div className="px-2 mb-4" data-testid="course-progress">
                    <Progress value={progressPercent} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground">{completedLessons}/{totalLessons} completate ({progressPercent}%)</p>
                  </div>
                );
              })()}
              {!modules || modules.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">Nessun modulo disponibile</p>
              ) : (
                <Accordion 
                  type="multiple" 
                  value={expandedModules} 
                  onValueChange={setExpandedModules}
                  className="w-full"
                >
                  {modules.map((module) => {
                    const moduleLessonCount = module.lessons?.length || 0;
                    const moduleCompletedCount = module.lessons?.filter(l => 
                      lessonProgress.some(p => p.lessonId === l.id && p.completed)
                    ).length || 0;
                    const moduleAllComplete = moduleLessonCount > 0 && moduleCompletedCount === moduleLessonCount;
                    return (
                    <AccordionItem key={module.id} value={module.id} data-testid={`module-${module.id}`}>
                      <div className="flex items-center">
                        <AccordionTrigger className="px-2 hover:no-underline flex-1">
                          <div className="flex items-center gap-2 flex-1">
                            {moduleAllComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-chart-4 flex-shrink-0" />
                            ) : (
                              <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm flex-1 text-left">{module.title}</span>
                            {moduleLessonCount > 0 && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {moduleCompletedCount}/{moduleLessonCount}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent>
                        <div className="space-y-1 ml-6 mt-2">
                          {(!module.lessons || module.lessons.length === 0) ? (
                            <p className="text-xs text-muted-foreground px-2 py-1">Nessuna lezione</p>
                          ) : (
                            module.lessons.map((lesson, lessonIdx) => {
                                const Icon = lesson.contentType && contentIcons[lesson.contentType as ContentType] 
                                  ? contentIcons[lesson.contentType as ContentType] 
                                  : FileText;
                                const isSelected = selectedLessonId === lesson.id;
                                const isCompleted = lessonProgress.some(p => p.lessonId === lesson.id && p.completed);
                                return (
                                  <div
                                    key={lesson.id}
                                    className={cn(
                                      "flex items-center gap-1 rounded-md transition-colors",
                                      isSelected 
                                        ? "bg-primary text-primary-foreground" 
                                        : ""
                                    )}
                                  >
                                    <button
                                      onClick={() => selectLesson(lesson.id)}
                                      className={cn(
                                        "flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left",
                                        !isSelected && "hover-elevate active-elevate-2"
                                      )}
                                      data-testid={`lesson-${lesson.id}`}
                                    >
                                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate flex-1">{lesson.title.replace(/<[^>]*>/g, '')}</span>
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
                  )})}
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
          <div ref={contentRef} className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
