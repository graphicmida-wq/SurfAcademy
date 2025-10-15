import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/LevelBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Play, Clock, Lock, CheckCircle2, Award } from "lucide-react";
import type { Course, Module, Lesson } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const isEnrolled = !!enrollment;
  const canEnroll = isAuthenticated && !isEnrolled && !course.isFree;

  return (
    <div className="min-h-screen">
      <PageHeader
        imageUrl={course.thumbnailUrl ?? undefined}
        title={course.title}
        subtitle={course.description ?? undefined}
        paddingTop="py-16"
        paddingBottom="py-24"
        minHeight="min-h-96"
      />

      {/* Course Info and Enrollment Card */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <LevelBadge level={course.level} className="text-base" />
            </div>
            <div className="flex flex-wrap gap-6 text-sm mb-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{course.duration} minuti totali</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                <span>{totalLessons} lezioni</span>
              </div>
            </div>
          </div>

          <Card className="lg:sticky lg:top-28 h-fit">
            <CardHeader>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {course.trailerUrl ? (
                  <video src={course.trailerUrl} controls className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
                    <Play className="h-16 w-16 text-primary/40" />
                  </div>
                )}
              </div>
              <CardTitle className="text-3xl font-display" data-testid="text-course-price">
                {course.isFree ? "Gratis" : `€${(course.price! / 100).toFixed(2)}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.isFree ? (
                <p className="text-sm text-muted-foreground">
                  Questo corso è completamente gratuito. Inizia subito!
                </p>
              ) : isEnrolled ? (
                <Badge className="w-full justify-center py-2 bg-chart-4 text-white border-0">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Iscritto
                </Badge>
              ) : canEnroll ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  data-testid="button-enroll-course"
                >
                  {enrollMutation.isPending ? "Iscrizione..." : "Iscriviti al Corso"}
                </Button>
              ) : !isAuthenticated ? (
                <Button className="w-full" size="lg" asChild data-testid="button-login-to-enroll">
                  <a href="/api/login">Accedi per Iscriverti</a>
                </Button>
              ) : null}

              {course.instructorName && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Istruttore</p>
                  <div className="flex items-center gap-3">
                    {course.instructorAvatar && (
                      <img
                        src={course.instructorAvatar}
                        alt={course.instructorName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{course.instructorName}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl">
          <h2 className="font-display font-bold text-3xl mb-6">Programma del Corso</h2>

          {modules && modules.length > 0 ? (
            <Accordion type="multiple" className="space-y-4" data-testid="accordion-modules">
              {modules.map((module, moduleIndex) => (
                <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-6">
                  <AccordionTrigger className="hover:no-underline" data-testid={`trigger-module-${moduleIndex}`}>
                    <div className="flex items-start gap-4 text-left">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-lg">{module.title}</h3>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-12 space-y-2 pt-2">
                      {module.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between py-3 px-4 rounded-lg hover-elevate active-elevate-2 transition-colors"
                          data-testid={`lesson-${moduleIndex}-${lessonIndex}`}
                        >
                          <div className="flex items-center gap-3">
                            {lesson.isFree || isEnrolled || course.isFree ? (
                              <Play className="h-4 w-4 text-primary" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={lesson.isFree || isEnrolled || course.isFree ? "" : "text-muted-foreground"}>
                              {lesson.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {lesson.isFree && !course.isFree && (
                              <Badge variant="outline" className="text-xs">Gratis</Badge>
                            )}
                            {lesson.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Contenuti del corso in arrivo...</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
