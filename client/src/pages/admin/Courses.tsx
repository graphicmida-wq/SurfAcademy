import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, Book, Users } from "lucide-react";
import type { Course, InsertCourse } from "@shared/schema";
import { insertCourseSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  'remata': 'REMATA',
  'takeoff': 'TAKEOFF',
  'noseride': 'NOSERIDE',
  'gratuiti': 'CONTENUTI GRATUITI',
  'special': 'SPECIAL',
};

const LEVEL_LABELS: Record<string, string> = {
  'beginner': 'Principiante',
  'intermediate': 'Intermedio',
  'advanced': 'Avanzato',
};

export default function AdminCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const form = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema.extend({
      description: insertCourseSchema.shape.description.transform(v => v || ""),
      thumbnailUrl: insertCourseSchema.shape.thumbnailUrl.transform(v => v || ""),
      trailerUrl: insertCourseSchema.shape.trailerUrl.transform(v => v || ""),
      instructorName: insertCourseSchema.shape.instructorName.transform(v => v || ""),
      instructorAvatar: insertCourseSchema.shape.instructorAvatar.transform(v => v || ""),
    })),
    defaultValues: {
      title: "",
      description: "",
      courseCategory: "remata",
      level: "beginner",
      duration: 0,
      price: 0,
      isFree: false,
      thumbnailUrl: "",
      trailerUrl: "",
      instructorName: "",
      instructorAvatar: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      const res = await apiRequest("POST", "/api/admin/courses", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Corso creato con successo" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCourse> }) => {
      const res = await apiRequest("PATCH", `/api/admin/courses/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Corso aggiornato con successo" });
      form.reset();
      setEditingCourse(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Corso eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description || "",
      courseCategory: course.courseCategory || "remata",
      level: course.level,
      duration: course.duration || 0,
      price: course.price || 0,
      isFree: course.isFree,
      thumbnailUrl: course.thumbnailUrl || "",
      trailerUrl: course.trailerUrl || "",
      instructorName: course.instructorName || "",
      instructorAvatar: course.instructorAvatar || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewCourse = () => {
    setEditingCourse(null);
    form.reset({
      title: "",
      description: "",
      courseCategory: "remata",
      level: "beginner",
      duration: 0,
      price: 0,
      isFree: false,
      thumbnailUrl: "",
      trailerUrl: "",
      instructorName: "",
      instructorAvatar: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertCourse) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-courses-admin-title">
            Gestione Corsi
          </h1>
          <p className="text-muted-foreground">Crea e gestisci i corsi della scuola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCourse} data-testid="button-create-course">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Corso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Modifica Corso" : "Nuovo Corso"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome del corso" data-testid="input-course-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Descrizione del corso" 
                          rows={3}
                          data-testid="input-course-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "remata"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-course-category">
                              <SelectValue placeholder="Seleziona categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="remata">REMATA</SelectItem>
                            <SelectItem value="takeoff">TAKEOFF</SelectItem>
                            <SelectItem value="noseride">NOSERIDE</SelectItem>
                            <SelectItem value="gratuiti">CONTENUTI GRATUITI</SelectItem>
                            <SelectItem value="special">SPECIAL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Livello *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-course-level">
                              <SelectValue placeholder="Seleziona livello" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Principiante</SelectItem>
                            <SelectItem value="intermediate">Intermedio</SelectItem>
                            <SelectItem value="advanced">Avanzato</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durata (minuti)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-course-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prezzo (centesimi)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="es. 9900 = €99.00"
                            data-testid="input-course-price"
                          />
                        </FormControl>
                        <FormDescription>Inserisci il prezzo in centesimi (9900 = €99.00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel>Corso Gratuito</FormLabel>
                        <FormDescription>Rendi il corso accessibile gratuitamente</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-course-free"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immagine Copertina</FormLabel>
                      <FormControl>
                        <MediaUploadZone
                          currentUrl={field.value || ""}
                          onUploadComplete={(url) => field.onChange(url)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trailerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Trailer</FormLabel>
                      <FormControl>
                        <MediaUploadZone
                          currentUrl={field.value || ""}
                          onUploadComplete={(url) => field.onChange(url)}
                        />
                      </FormControl>
                      <FormDescription>Video di presentazione del corso</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instructorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Istruttore</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Mario Rossi" data-testid="input-instructor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructorAvatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar Istruttore</FormLabel>
                        <FormControl>
                          <MediaUploadZone
                            currentUrl={field.value || ""}
                            onUploadComplete={(url) => field.onChange(url)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isPending}
                    data-testid="button-cancel-course"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-course">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : editingCourse ? (
                      "Aggiorna Corso"
                    ) : (
                      "Crea Corso"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} data-testid={`course-card-${course.id}`}>
            <CardHeader className="space-y-2">
              {course.thumbnailUrl && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" data-testid={`badge-category-${course.id}`}>
                  {CATEGORY_LABELS[course.courseCategory || 'remata']}
                </Badge>
                <Badge variant="secondary" data-testid={`badge-level-${course.id}`}>
                  {LEVEL_LABELS[course.level]}
                </Badge>
                {course.isFree && (
                  <Badge className="bg-chart-4 text-white">Gratis</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {LEVEL_LABELS[course.level]}
                  </span>
                </div>
                <div className="font-semibold" data-testid={`text-price-${course.id}`}>
                  {course.isFree ? "Gratis" : `€${((course.price || 0) / 100).toFixed(2)}`}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(course)}
                  data-testid={`button-edit-${course.id}`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Sei sicuro di voler eliminare il corso "${course.title}"?`)) {
                      deleteMutation.mutate(course.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${course.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card className="p-12 text-center">
          <Book className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Nessun corso disponibile</h3>
          <p className="text-muted-foreground mb-4">
            Inizia creando il tuo primo corso
          </p>
          <Button onClick={handleNewCourse}>
            <Plus className="h-4 w-4 mr-2" />
            Crea Primo Corso
          </Button>
        </Card>
      )}
    </div>
  );
}
