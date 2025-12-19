import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Play, Trophy, Award, ArrowRight, User, ExternalLink, Camera } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Enrollment, Course, Badge as BadgeType } from "@shared/schema";

const WORDPRESS_URL = "https://scuoladilongboard.it";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Accesso richiesto",
        description: "Effettua il login per accedere alla dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
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

  const { data: pageHeader } = usePageHeader('dashboard');

  const { data: wavePointsData } = useQuery<{ balance: number }>({
    queryKey: ["/api/wavepoints"],
    enabled: isAuthenticated,
  });

  const wavePointsBalance = wavePointsData?.balance || 0;

  const updateAvatarMutation = useMutation({
    mutationFn: async (profileImageUrl: string) => {
      const res = await apiRequest("PUT", "/api/profile", { profileImageUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Avatar aggiornato con successo!" });
      setIsEditingAvatar(false);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'avatar",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completedCourses = enrollments?.filter(e => e.progress === 100) || [];
  const inProgressCourses = enrollments?.filter(e => (e.progress || 0) >= 0 && (e.progress || 0) < 100) || [];

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || `Ciao, ${user?.firstName || "Surfista"}!`}
        subtitle={pageHeader?.subtitle || "Continua il tuo percorso di apprendimento"}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* In Progress Courses */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl">I Miei Corsi</h2>
                <a 
                  href={`${WORDPRESS_URL}/corsi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2" 
                  data-testid="link-browse-courses"
                >
                  Esplora altri corsi
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {inProgressCourses && inProgressCourses.length > 0 ? (
                <div className="space-y-4" data-testid="list-in-progress-courses">
                  {inProgressCourses.map((enrollment) => (
                    <Card key={enrollment.id} className="hover-elevate active-elevate-2 transition-all">
                      <Link href={`/corsi/${enrollment.course.id}/player`} className="block p-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-display font-semibold text-lg mb-3" data-testid={`text-course-title-${enrollment.course.id}`}>
                                {enrollment.course.title}
                              </h3>
                              <div className="space-y-2">
                                <Progress value={enrollment.progress || 0} className="h-2" />
                                <p className="text-sm text-muted-foreground">
                                  Progresso: {enrollment.progress || 0}%
                                </p>
                              </div>
                            </div>
                            <Button size="sm" data-testid={`button-continue-${enrollment.course.id}`}>
                              <Play className="h-4 w-4 mr-2" />
                              Continua
                            </Button>
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
                    Inizia a imparare iscrivendoti a un corso sul nostro sito
                  </p>
                  <a href={`${WORDPRESS_URL}/corsi`} target="_blank" rel="noopener noreferrer">
                    <Button data-testid="button-explore-courses">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Esplora i Corsi
                    </Button>
                  </a>
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
                      <Link href={`/corsi/${enrollment.course.id}/player`} className="block p-4">
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
            {/* Profile Card - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Il Tuo Profilo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.profileImageUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full"
                        onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                        data-testid="button-change-avatar"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid="text-user-fullname">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Avatar Upload Zone */}
                  {isEditingAvatar && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Carica una nuova immagine profilo:
                      </p>
                      <MediaUploadZone
                        currentUrl={user?.profileImageUrl || ""}
                        onUploadComplete={(url) => {
                          updateAvatarMutation.mutate(url);
                        }}
                        userId={user?.id}
                      />
                    </div>
                  )}

                  {/* Link to WordPress for profile editing */}
                  <a 
                    href={`${WORDPRESS_URL}/my-account`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      data-testid="button-edit-profile-wp"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Modifica Profilo su WordPress
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* WavePoints Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img 
                    src={new URL("@assets/WAVEPOINT_1761759915658.png", import.meta.url).href}
                    alt="WavePoint"
                    className="h-5 w-5"
                  />
                  WavePoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="mb-4">
                    <img 
                      src={new URL("@assets/WAVEPOINT_1761759915658.png", import.meta.url).href}
                      alt="WavePoint"
                      className="w-20 h-20 mx-auto"
                    />
                  </div>
                  <div className="text-4xl font-display font-bold text-chart-2 mb-2" data-testid="text-wavepoints-balance">
                    {wavePointsBalance}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {wavePointsBalance === 0 
                      ? "Invita amici per guadagnare WavePoints!" 
                      : "50 punti = 10% sconto!"}
                  </p>
                  {wavePointsBalance >= 50 && (
                    <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                      Hai uno sconto disponibile!
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

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
          </div>
        </div>
      </div>
    </div>
  );
}
