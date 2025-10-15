import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/LevelBadge";
import { Link } from "wouter";
import { Play, Trophy, Target, Clock, Award, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Enrollment, Course, Badge as BadgeType } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua il login per accedere alla dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: enrollments } = useQuery<(Enrollment & { course: Course })[]>({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
  });

  const { data: badges } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
    enabled: isAuthenticated,
  });

  const { data: exerciseProgress } = useQuery({
    queryKey: ["/api/exercise-progress"],
    enabled: isAuthenticated,
  });

  const { data: pageHeader } = usePageHeader('dashboard');

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completedCourses = enrollments?.filter(e => e.progress === 100) || [];
  const inProgressCourses = enrollments?.filter(e => e.progress > 0 && e.progress < 100) || [];

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || `Ciao, ${user?.firstName || "Surfista"}!`}
        subtitle={pageHeader?.subtitle || "Continua il tuo percorso di apprendimento"}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corsi Attivi</CardTitle>
              <Play className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-active-courses">
                {inProgressCourses.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completati</CardTitle>
              <Trophy className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-completed-courses">
                {completedCourses.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badge Ottenuti</CardTitle>
              <Award className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-badges">
                {badges?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livello</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <LevelBadge level={user?.userLevel || "beginner"} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* In Progress Courses */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl">Corsi in Corso</h2>
                <Link 
                  href="/corsi"
                  className="text-primary hover:underline flex items-center gap-2" 
                  data-testid="link-browse-courses"
                >
                  Esplora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {inProgressCourses && inProgressCourses.length > 0 ? (
                <div className="space-y-4" data-testid="list-in-progress-courses">
                  {inProgressCourses.map((enrollment) => (
                    <Card key={enrollment.id} className="hover-elevate active-elevate-2 transition-all">
                      <Link href={`/corsi/${enrollment.course.id}`} className="block p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <h3 className="font-display font-semibold text-lg" data-testid={`text-course-title-${enrollment.course.id}`}>
                                  {enrollment.course.title}
                                </h3>
                                <LevelBadge level={enrollment.course.level} />
                              </div>
                              <div className="space-y-2">
                                <Progress value={enrollment.progress} className="h-2" />
                                <p className="text-sm text-muted-foreground">
                                  Progresso: {enrollment.progress}%
                                </p>
                              </div>
                            </div>
                          </div>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Play className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-xl mb-2">Nessun corso attivo</h3>
                  <p className="text-muted-foreground mb-4">
                    Inizia a imparare iscrivendoti a un corso
                  </p>
                  <Link href="/corsi">
                    <Button data-testid="button-explore-courses">
                      Esplora i Corsi
                    </Button>
                  </Link>
                </Card>
              )}
            </div>

            {/* Completed Courses */}
            {completedCourses && completedCourses.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl mb-6">Corsi Completati</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="list-completed-courses">
                  {completedCourses.map((enrollment) => (
                    <Card key={enrollment.id} className="hover-elevate active-elevate-2 transition-all">
                      <Link href={`/corsi/${enrollment.course.id}`} className="block p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-5 w-5 text-chart-4" />
                          <h3 className="font-semibold line-clamp-1">{enrollment.course.title}</h3>
                        </div>
                        <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                          Completato
                        </Badge>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-chart-3" />
                  I Tuoi Badge
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badges && badges.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3" data-testid="grid-badges">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted hover-elevate active-elevate-2 transition-all"
                        data-testid={`badge-${badge.id}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-chart-3/20 to-chart-3/5 flex items-center justify-center">
                          <Award className="h-6 w-6 text-chart-3" />
                        </div>
                        <span className="text-xs text-center font-medium line-clamp-2">
                          {badge.badgeName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Completa i corsi per guadagnare badge
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/corsi">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-browse-courses">
                    <Play className="h-4 w-4 mr-2" />
                    Sfoglia Corsi
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-community">
                    <Trophy className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </Link>
                <Link href="/surf-camp">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-surf-camp">
                    <Target className="h-4 w-4 mr-2" />
                    Surf Camp
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
