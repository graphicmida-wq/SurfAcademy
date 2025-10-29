import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, BookOpen, FileVideo, FileText } from "lucide-react";
import type { Course, Module, Lesson, InsertLesson } from "@shared/schema";
import { insertLessonSchema } from "@shared/schema";
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  'presentazione': 'Presentazione',
  'ebook': 'E-Book',
  'planning': 'Planning',
  'esercizio': 'Esercizio',
  'riscaldamento': 'Riscaldamento',
  'settimana-1': 'Settimana 1',
  'settimana-2': 'Settimana 2',
  'settimana-3': 'Settimana 3',
  'settimana-4': 'Settimana 4',
};

export default function AdminCourseContent() {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<(Module & { lessons: Lesson[] })[]>({
    queryKey: [`/api/courses/${selectedCourseId}/modules`],
    enabled: !!selectedCourseId,
  });

  const form = useForm<InsertLesson>({
    resolver: zodResolver(insertLessonSchema),
    defaultValues: {
      moduleId: "",
      title: "",
      contentType: "presentazione",
      videoUrl: "",
      videoUrls: [],
      pdfUrl: "",
      htmlContent: "",
      orderIndex: 0,
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: InsertLesson) => {
      const res = await apiRequest("POST", "/api/admin/lessons", {
        ...data,
        videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Lezione creata con successo" });
      form.reset();
      setVideoUrls([]);
      setEditingLesson(null);
      setIsLessonDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLesson> }) => {
      const res = await apiRequest("PATCH", `/api/admin/lessons/${id}`, {
        ...data,
        videoUrls: videoUrls.length > 0 ? videoUrls : undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Lezione aggiornata con successo" });
      form.reset();
      setVideoUrls([]);
      setEditingLesson(null);
      setIsLessonDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Lezione eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleSubmitLesson = (data: InsertLesson) => {
    if (!selectedModuleId) {
      toast({ title: "Seleziona un modulo", variant: "destructive" });
      return;
    }
    if (editingLesson) {
      updateLessonMutation.mutate({
        id: editingLesson.id,
        data: { ...data, moduleId: selectedModuleId },
      });
    } else {
      createLessonMutation.mutate({
        ...data,
        moduleId: selectedModuleId,
      });
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    form.reset({
      moduleId: lesson.moduleId,
      title: lesson.title,
      contentType: lesson.contentType || "presentazione",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || "",
      htmlContent: lesson.htmlContent || "",
      orderIndex: lesson.orderIndex || 0,
    });
    setVideoUrls(lesson.videoUrls || []);
    setIsLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${lessonTitle}"?`)) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleNewLesson = () => {
    if (!selectedModuleId) {
      toast({ title: "Seleziona prima un modulo", variant: "destructive" });
      return;
    }
    setEditingLesson(null);
    form.reset({
      moduleId: selectedModuleId,
      title: "",
      contentType: "presentazione",
      videoUrl: "",
      videoUrls: [],
      pdfUrl: "",
      htmlContent: "",
      orderIndex: 0,
    });
    setVideoUrls([]);
    setIsLessonDialogOpen(true);
  };

  const addVideoUrl = () => {
    setVideoUrls([...videoUrls, ""]);
  };

  const updateVideoUrl = (index: number, url: string) => {
    const updated = [...videoUrls];
    updated[index] = url;
    setVideoUrls(updated);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2" data-testid="text-course-content-title">
          Gestione Contenuti Corso
        </h1>
        <p className="text-muted-foreground">Aggiungi e gestisci i contenuti dei tuoi corsi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Seleziona Corso</label>
          <Select value={selectedCourseId} onValueChange={(value) => {
            setSelectedCourseId(value);
            setSelectedModuleId("");
          }}>
            <SelectTrigger data-testid="select-course">
              <SelectValue placeholder="Scegli un corso" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourseId && (
          <div>
            <label className="text-sm font-medium mb-2 block">Seleziona Modulo</label>
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId} disabled={modulesLoading}>
              <SelectTrigger data-testid="select-module">
                <SelectValue placeholder="Scegli un modulo" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedModuleId && selectedModule && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lezioni - {selectedModule.title}</CardTitle>
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewLesson} data-testid="button-create-lesson">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Lezione
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingLesson ? "Modifica Lezione" : "Crea Nuova Lezione"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmitLesson)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titolo *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome della lezione" data-testid="input-lesson-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Contenuto *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "presentazione"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-content-type">
                                <SelectValue placeholder="Seleziona tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Video Multipli</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addVideoUrl}>
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Video
                        </Button>
                      </div>
                      {videoUrls.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                          <MediaUploadZone
                            currentUrl={url}
                            onUploadComplete={(newUrl) => updateVideoUrl(idx, newUrl)}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeVideoUrl(idx)}
                          >
                            Rimuovi
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="pdfUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PDF (per E-Book/Planning)</FormLabel>
                          <FormControl>
                            <MediaUploadZone
                              currentUrl={field.value || ""}
                              onUploadComplete={(url) => field.onChange(url)}
                            />
                          </FormControl>
                          <FormDescription>Carica un file PDF per questa lezione</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="htmlContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contenuto HTML</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="Inserisci contenuto HTML..."
                              rows={8}
                              data-testid="textarea-html-content"
                            />
                          </FormControl>
                          <FormDescription>Puoi inserire HTML per testi formattati</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsLessonDialogOpen(false)}
                        disabled={createLessonMutation.isPending}
                      >
                        Annulla
                      </Button>
                      <Button type="submit" disabled={createLessonMutation.isPending || updateLessonMutation.isPending} data-testid="button-save-lesson">
                        {(createLessonMutation.isPending || updateLessonMutation.isPending) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvataggio...
                          </>
                        ) : editingLesson ? (
                          "Aggiorna Lezione"
                        ) : (
                          "Crea Lezione"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedModule.lessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Nessuna lezione disponibile</p>
                  <p className="text-sm mt-2">Clicca "Nuova Lezione" per iniziare</p>
                </div>
              ) : (
                selectedModule.lessons.map((lesson) => (
                  <Card key={lesson.id} data-testid={`lesson-item-${lesson.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {CONTENT_TYPE_LABELS[lesson.contentType || 'presentazione']}
                            </Badge>
                            {lesson.videoUrls && lesson.videoUrls.length > 0 && (
                              <Badge variant="secondary">
                                <FileVideo className="h-3 w-3 mr-1" />
                                {lesson.videoUrls.length} video
                              </Badge>
                            )}
                            {lesson.pdfUrl && (
                              <Badge variant="secondary">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLesson(lesson)}
                            data-testid={`button-edit-lesson-${lesson.id}`}
                          >
                            Modifica
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            disabled={deleteLessonMutation.isPending}
                            data-testid={`button-delete-lesson-${lesson.id}`}
                          >
                            Elimina
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedCourseId && (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl mb-2">Inizia Selezionando un Corso</h3>
          <p className="text-muted-foreground">
            Scegli un corso dal menu sopra per gestire i suoi contenuti
          </p>
        </Card>
      )}
    </div>
  );
}
