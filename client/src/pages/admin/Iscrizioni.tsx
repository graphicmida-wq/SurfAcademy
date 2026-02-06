import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Users, BookOpen, UserPlus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Enrollment, Course, User } from "@shared/schema";

type EnrollmentWithDetails = Enrollment & { user: User; course: Course };

export default function Iscrizioni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const { toast } = useToast();

  const { data: enrollments, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/admin/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string }) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      toast({ title: `Utente ${user.firstName} ${user.lastName} creato` });
      setShowAddUserDialog(false);
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
    },
    onError: (error: any) => {
      const msg = error.message || "Errore nella creazione";
      if (msg.includes("già registrata")) {
        toast({ 
          title: "Utente già presente nel sistema", 
          description: "Cerca l'utente nella lista qui sotto e iscrivilo al corso con il pulsante 'Iscrivi a Corso'.",
        });
        setShowAddUserDialog(false);
        setNewUserEmail("");
        setNewUserFirstName("");
        setNewUserLastName("");
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { userId: string; courseId: string }) => {
      const res = await apiRequest("POST", "/api/admin/enroll", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Studente iscritto al corso" });
      setShowEnrollDialog(false);
      setSelectedUserId("");
      setSelectedCourseId("");
    },
    onError: (error: any) => {
      toast({ title: error.message || "Errore durante l'iscrizione", variant: "destructive" });
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/enroll/${enrollmentId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      toast({ title: "Iscrizione rimossa" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Errore nella rimozione", variant: "destructive" });
    },
  });

  const enrollmentsByUser = enrollments?.reduce((acc, enrollment) => {
    const userId = enrollment.user.id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(enrollment);
    return acc;
  }, {} as Record<string, EnrollmentWithDetails[]>) || {};

  const allUserItems = (allUsers || []).map(user => ({
    user,
    enrollments: enrollmentsByUser[user.id] || [],
  }));

  const filteredUsers = allUserItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      item.user.firstName?.toLowerCase().includes(q) ||
      item.user.lastName?.toLowerCase().includes(q) ||
      item.user.email?.toLowerCase().includes(q);

    const matchesCourse =
      courseFilter === "all" || item.enrollments.some((e) => e.course.id === courseFilter);

    return matchesSearch && matchesCourse;
  });

  const getAverageProgress = (enrollments: EnrollmentWithDetails[]) => {
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
    return Math.round(total / enrollments.length);
  };

  const getEnrolledCourseIds = (userId: string) => {
    return enrollments?.filter(e => e.userId === userId).map(e => e.courseId) || [];
  };

  const getAvailableCoursesForUser = (userId: string) => {
    const enrolledIds = getEnrolledCourseIds(userId);
    return courses?.filter(c => !enrolledIds.includes(c.id)) || [];
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Gestione Studenti</h1>
          <p className="text-muted-foreground">
            Visualizza, aggiungi studenti e gestisci le iscrizioni ai corsi
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <UserPlus className="h-4 w-4 mr-2" />
                Aggiungi Utente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Aggiungi Studente</DialogTitle>
                <DialogDescription>
                  Inserisci i dati dello studente. Usa la stessa email che ha su WordPress: quando farà login, tutto verrà collegato automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@esempio.it"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    data-testid="input-user-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve essere la stessa email usata su WordPress
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      placeholder="Mario"
                      value={newUserFirstName}
                      onChange={(e) => setNewUserFirstName(e.target.value)}
                      data-testid="input-user-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome</Label>
                    <Input
                      id="lastName"
                      placeholder="Rossi"
                      value={newUserLastName}
                      onChange={(e) => setNewUserLastName(e.target.value)}
                      data-testid="input-user-lastname"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createUserMutation.mutate({
                    email: newUserEmail,
                    firstName: newUserFirstName,
                    lastName: newUserLastName,
                  })}
                  disabled={!newUserEmail || createUserMutation.isPending}
                  data-testid="button-create-user"
                >
                  {createUserMutation.isPending ? "Creazione..." : "Crea Studente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-enroll-user">
                <Plus className="h-4 w-4 mr-2" />
                Iscrivi a Corso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iscrivi Studente a un Corso</DialogTitle>
                <DialogDescription>
                  Seleziona uno studente e il corso a cui iscriverlo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Studente</Label>
                  <Select value={selectedUserId} onValueChange={(val) => { setSelectedUserId(val); setSelectedCourseId(""); }}>
                    <SelectTrigger data-testid="select-enroll-user">
                      <SelectValue placeholder="Seleziona uno studente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corso</Label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger data-testid="select-enroll-course">
                      <SelectValue placeholder="Seleziona un corso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedUserId ? getAvailableCoursesForUser(selectedUserId) : courses)?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedUserId && getAvailableCoursesForUser(selectedUserId).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Questo studente è già iscritto a tutti i corsi disponibili.
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => enrollMutation.mutate({ userId: selectedUserId, courseId: selectedCourseId })}
                  disabled={!selectedUserId || !selectedCourseId || enrollMutation.isPending}
                  data-testid="button-confirm-enroll"
                >
                  {enrollMutation.isPending ? "Iscrizione..." : "Iscrivi al Corso"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            <Select value={courseFilter} onValueChange={setCourseFilter}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold" data-testid="stat-total-users">
              {allUsers?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Studenti e Corsi</CardTitle>
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
                  className="border rounded-md p-4 hover-elevate transition-all"
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
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold" data-testid={`text-user-name-${user.id}`}>
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id}
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
                          {userEnrolls.length === 0 && (
                            <p className="text-xs text-muted-foreground">Nessuna iscrizione</p>
                          )}
                          {userEnrolls.map((enrollment) => (
                            <Badge
                              key={enrollment.id}
                              variant={enrollment.progress === 100 ? "default" : "secondary"}
                              className="flex items-center gap-2"
                              data-testid={`badge-course-${enrollment.course.id}`}
                            >
                              <span>{enrollment.course.title}</span>
                              <span className="text-xs">({enrollment.progress}%)</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Rimuovere ${user.firstName} dal corso ${enrollment.course.title}?`)) {
                                    removeEnrollmentMutation.mutate(enrollment.id);
                                  }
                                }}
                                className="ml-1 opacity-60 hover:opacity-100"
                                data-testid={`button-remove-enrollment-${enrollment.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
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
