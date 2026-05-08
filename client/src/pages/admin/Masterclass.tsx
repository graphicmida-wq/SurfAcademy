import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, Video, FolderOpen } from "lucide-react";
import { Link } from "wouter";
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
} from "@/components/ui/form";

export default function AdminMasterclass() {
  const { toast } = useToast();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: allCourses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const masterclasses = allCourses.filter(c => c.type === "masterclass");

  const form = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema.extend({
      description: insertCourseSchema.shape.description.transform(v => v || ""),
      thumbnailUrl: insertCourseSchema.shape.thumbnailUrl.transform(v => v || ""),
      instructorName: insertCourseSchema.shape.instructorName.transform(v => v || ""),
      instructorAvatar: insertCourseSchema.shape.instructorAvatar.transform(v => v || ""),
    })),
    defaultValues: {
      title: "",
      description: "",
      type: "masterclass",
      duration: 0,
      thumbnailUrl: "",
      instructorName: "",
      instructorAvatar: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      const res = await apiRequest("POST", "/api/admin/courses", { ...data, type: "masterclass" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/masterclasses"] });
      toast({ title: "Masterclass creata con successo" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCourse> }) => {
      const res = await apiRequest("PATCH", `/api/admin/courses/${id}`, { ...data, type: "masterclass" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/masterclasses"] });
      toast({ title: "Masterclass aggiornata con successo" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/masterclasses"] });
      toast({ title: "Masterclass eliminata con successo" });
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
      type: "masterclass",
      duration: course.duration || 0,
      thumbnailUrl: course.thumbnailUrl || "",
      instructorName: course.instructorName || "",
      instructorAvatar: course.instructorAvatar || "",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingCourse(null);
    form.reset({
      title: "",
      description: "",
      type: "masterclass",
      duration: 0,
      thumbnailUrl: "",
      instructorName: "",
      instructorAvatar: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertCourse) => {
    const payload = { ...data, type: "masterclass" as const };
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
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
          <h1 className="text-3xl font-display font-bold" data-testid="text-masterclass-admin-title">
            Gestione Masterclass
          </h1>
          <p className="text-muted-foreground">Crea e gestisci le masterclass gratuite</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew} data-testid="button-create-masterclass">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Masterclass
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Modifica Masterclass" : "Nuova Masterclass"}
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
                        <Input {...field} placeholder="Titolo della masterclass" data-testid="input-masterclass-title" />
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
                          placeholder="Descrizione della masterclass"
                          rows={3}
                          data-testid="input-masterclass-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          data-testid="input-masterclass-duration"
                        />
                      </FormControl>
                      <FormMessage />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instructorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Istruttore</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Mario Rossi" data-testid="input-masterclass-instructor-name" />
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
                    data-testid="button-cancel-masterclass"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-masterclass">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvataggio...
                      </>
                    ) : editingCourse ? (
                      "Aggiorna Masterclass"
                    ) : (
                      "Crea Masterclass"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterclasses.map((mc) => (
          <Card key={mc.id} data-testid={`masterclass-admin-card-${mc.id}`}>
            <CardHeader className="space-y-2">
              {mc.thumbnailUrl ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={mc.thumbnailUrl}
                    alt={mc.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Video className="h-10 w-10 text-primary/40" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="line-clamp-2">{mc.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mc.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{mc.description}</p>
              )}
              {mc.instructorName && (
                <p className="text-sm text-muted-foreground">con {mc.instructorName}</p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/admin/corsi/contenuti">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    data-testid={`button-manage-content-${mc.id}`}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Gestisci Contenuti
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(mc)}
                    data-testid={`button-edit-masterclass-${mc.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Sei sicuro di voler eliminare la masterclass "${mc.title}"?`)) {
                        deleteMutation.mutate(mc.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-masterclass-${mc.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {masterclasses.length === 0 && (
        <Card className="p-12 text-center">
          <Video className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Nessuna masterclass</h3>
          <p className="text-muted-foreground mb-4">
            Crea la tua prima masterclass gratuita
          </p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Crea Prima Masterclass
          </Button>
        </Card>
      )}
    </div>
  );
}
