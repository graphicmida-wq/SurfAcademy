import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users, BookOpen } from "lucide-react";
import type { Enrollment, Course, User } from "@shared/schema";

type EnrollmentWithDetails = Enrollment & { user: User; course: Course };

export default function Iscrizioni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setcourseFilter] = useState<string>("all");

  const { data: enrollments, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/admin/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Group enrollments by user
  const userEnrollments = enrollments?.reduce((acc, enrollment) => {
    const userId = enrollment.user.id;
    if (!acc[userId]) {
      acc[userId] = {
        user: enrollment.user,
        enrollments: [],
      };
    }
    acc[userId].enrollments.push(enrollment);
    return acc;
  }, {} as Record<string, { user: User; enrollments: EnrollmentWithDetails[] }>);

  // Filter users
  const filteredUsers = Object.values(userEnrollments || {}).filter((item) => {
    const matchesSearch =
      item.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse =
      courseFilter === "all" || item.enrollments.some((e) => e.course.id === courseFilter);

    return matchesSearch && matchesCourse;
  });

  // Calculate average progress for a user
  const getAverageProgress = (enrollments: EnrollmentWithDetails[]) => {
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    return Math.round(total / enrollments.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Iscrizioni Utenti</h1>
          <p className="text-muted-foreground">
            Monitora i progressi di tutti gli utenti iscritti ai corsi
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={courseFilter} onValueChange={setcourseFilter}>
                <SelectTrigger data-testid="select-course-filter">
                  <SelectValue placeholder="Filtra per corso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i Corsi</SelectItem>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-total-users">
                {Object.keys(userEnrollments || {}).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Iscrizioni Totali</CardTitle>
              <BookOpen className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-total-enrollments">
                {enrollments?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Medio</CardTitle>
              <BookOpen className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold" data-testid="stat-avg-progress">
                {enrollments && enrollments.length > 0
                  ? Math.round(
                      enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Utenti e Corsi</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nessun utente trovato</h3>
                <p className="text-muted-foreground">
                  {searchQuery || courseFilter !== "all"
                    ? "Prova a modificare i filtri di ricerca"
                    : "Non ci sono ancora utenti iscritti ai corsi"}
                </p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="list-user-enrollments">
                {filteredUsers.map(({ user, enrollments: userEnrolls }) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 hover-elevate transition-all"
                    data-testid={`user-card-${user.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profileImageUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-user-name-${user.id}`}>
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                              {user.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-display font-bold text-primary">
                              {getAverageProgress(userEnrolls)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Progresso Medio</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Corsi Iscritti ({userEnrolls.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {userEnrolls.map((enrollment) => (
                              <Badge
                                key={enrollment.id}
                                variant={enrollment.progress === 100 ? "default" : "secondary"}
                                className="flex items-center gap-2"
                                data-testid={`badge-course-${enrollment.course.id}`}
                              >
                                <span>{enrollment.course.title}</span>
                                <span className="text-xs">({enrollment.progress}%)</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
