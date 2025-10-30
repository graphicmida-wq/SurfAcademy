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
import { Loader2, Plus, BookOpen, FileVideo, FileText, Edit, Trash2, PlayCircle, Book, Calendar, Dumbbell, Flame } from "lucide-react";
import type { Course, Module, Lesson, InsertLesson, InsertModule } from "@shared/schema";
import { insertLessonSchema, insertModuleSchema } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const CONTENT_TYPES = [
  { value: 'presentazione', label: 'Presentazione Corso', icon: BookOpen },
  { value: 'ebook', label: 'E-Book Corso', icon: Book },
  { value: 'planning', label: 'Planning Allenamento', icon: Calendar },
  { value: 'esercizio', label: 'Esercizio', icon: Dumbbell },
  { value: 'riscaldamento', label: 'Riscaldamento', icon: Flame },
  { value: 'settimana-1', label: 'Settimana 1', icon: Calendar },
  { value: 'settimana-2', label: 'Settimana 2', icon: Calendar },
  { value: 'settimana-3', label: 'Settimana 3', icon: Calendar },
  { value: 'settimana-4', label: 'Settimana 4', icon: Calendar },
];

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
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [preselectedContentType, setPreselectedContentType] = useState<string>("");

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<(Module & { lessons: Lesson[] })[]>({
    queryKey: [`/api/courses/${selectedCourseId}/modules`],
    enabled: !!selectedCourseId,
  });
  
  // Auto-create default module when course is selected
  const autoCreateModuleMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await apiRequest("POST", "/api/admin/modules", {
        courseId,
        title: "Contenuti Corso",
        description: "Modulo principale per i contenuti del corso",
        orderIndex: 0,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
    },
  });

  const lessonForm = useForm<InsertLesson>({
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

  const moduleForm = useForm<InsertModule>({
    resolver: zodResolver(insertModuleSchema),
    defaultValues: {
      courseId: "",
      title: "",
      description: "",
      defaultExpanded: true,
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
      toast({ title: "Contenuto creato con successo" });
      lessonForm.reset();
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
      toast({ title: "Contenuto aggiornato con successo" });
      lessonForm.reset();
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
      toast({ title: "Contenuto eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: InsertModule) => {
      const res = await apiRequest("POST", "/api/admin/modules", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Modulo creato con successo" });
      moduleForm.reset();
      setEditingModule(null);
      setIsModuleDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione del modulo", variant: "destructive" });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertModule> }) => {
      const res = await apiRequest("PATCH", `/api/admin/modules/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Modulo aggiornato con successo" });
      moduleForm.reset();
      setEditingModule(null);
      setIsModuleDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento del modulo", variant: "destructive" });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      toast({ title: "Modulo eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione del modulo", variant: "destructive" });
    },
  });

  const handleSubmitLesson = (data: InsertLesson) => {
    if (!data.moduleId) {
      toast({ title: "Seleziona un modulo", variant: "destructive" });
      return;
    }
    if (editingLesson) {
      updateLessonMutation.mutate({
        id: editingLesson.id,
        data,
      });
    } else {
      createLessonMutation.mutate(data);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    lessonForm.reset({
      moduleId: lesson.moduleId,
      title: lesson.title,
      contentType: lesson.contentType || "presentazione",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || "",
      htmlContent: lesson.htmlContent || "",
      orderIndex: lesson.orderIndex || 0,
    });
    // Explicitly set the moduleId value to ensure Select component updates
    setTimeout(() => {
      lessonForm.setValue("moduleId", lesson.moduleId);
      lessonForm.setValue("contentType", lesson.contentType || "presentazione");
    }, 0);
    setVideoUrls(lesson.videoUrls || []);
    setIsLessonDialogOpen(true);
  };

  const handleDeleteLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${lessonTitle}"?`)) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleNewLesson = async (contentType: string) => {
    // Wait for modules to load before proceeding
    if (modulesLoading) {
      toast({ 
        title: "Caricamento in corso", 
        description: "Attendere il caricamento dei moduli...",
      });
      return;
    }
    
    let moduleId = modules[0]?.id || "";
    
    // Auto-create module if none exist
    if (modules.length === 0 && selectedCourseId) {
      if (autoCreateModuleMutation.isPending) {
        toast({ 
          title: "Attendere", 
          description: "Creazione modulo in corso...",
        });
        return;
      }
      
      try {
        const newModule = await autoCreateModuleMutation.mutateAsync(selectedCourseId);
        moduleId = newModule.id;
        // Refetch to update the UI
        await queryClient.refetchQueries({ queryKey: [`/api/courses/${selectedCourseId}/modules`] });
      } catch (error) {
        toast({ 
          title: "Errore creazione modulo automatico", 
          variant: "destructive" 
        });
        return;
      }
    }
    
    setPreselectedContentType(contentType);
    setEditingLesson(null);
    lessonForm.reset({
      moduleId: moduleId,
      title: "",
      contentType: contentType,
      videoUrl: "",
      videoUrls: [],
      pdfUrl: "",
      htmlContent: "",
      orderIndex: 0,
    });
    // Explicitly set the moduleId value to ensure Select component updates
    setTimeout(() => {
      lessonForm.setValue("moduleId", moduleId);
    }, 0);
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

  const handleSubmitModule = (data: InsertModule) => {
    if (!selectedCourseId) {
      toast({ title: "Seleziona un corso", variant: "destructive" });
      return;
    }
    if (editingModule) {
      updateModuleMutation.mutate({
        id: editingModule.id,
        data: { ...data, courseId: selectedCourseId },
      });
    } else {
      createModuleMutation.mutate({
        ...data,
        courseId: selectedCourseId,
      });
    }
  };

  const handleNewModule = () => {
    if (!selectedCourseId) {
      toast({ title: "Seleziona prima un corso", variant: "destructive" });
      return;
    }
    setEditingModule(null);
    moduleForm.reset({
      courseId: selectedCourseId,
      title: "",
      description: "",
      defaultExpanded: true,
      orderIndex: modules.length,
    });
    setIsModuleDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    moduleForm.reset({
      courseId: module.courseId,
      title: module.title,
      description: module.description || "",
      defaultExpanded: module.defaultExpanded ?? true,
      orderIndex: module.orderIndex || 0,
    });
    setIsModuleDialogOpen(true);
  };

  const handleDeleteModule = (moduleId: string, moduleTitle: string) => {
    if (confirm(`Sei sicuro di voler eliminare "${moduleTitle}"? Verranno eliminate anche tutte le lezioni.`)) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  // Group lessons by content type
  const allLessons = modules.flatMap(m => m.lessons || []);
  
  // Find any custom content types not in the predefined list
  const customContentTypes = Array.from(
    new Set(allLessons.map(l => l.contentType).filter(ct => ct && !CONTENT_TYPE_LABELS[ct]))
  ).map(value => ({
    value,
    label: `Altro: ${value}`,
    icon: FileText,
  }));
  
  const allContentTypes = [...CONTENT_TYPES, ...customContentTypes];
  
  const lessonsByType = allContentTypes.map(type => ({
    ...type,
    lessons: allLessons.filter(l => l.contentType === type.value),
  }));

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2" data-testid="text-course-content-title">
          Gestione Contenuti Corso
        </h1>
        <p className="text-muted-foreground">Visualizza e gestisci i contenuti come li vedono gli studenti</p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Seleziona Corso</label>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
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

      {/* Modules Management Section */}
      {selectedCourseId && !modulesLoading && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestione Moduli</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                I moduli organizzano i contenuti del corso
              </p>
            </div>
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewModule} data-testid="button-create-module">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Modulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingModule ? "Modifica Modulo" : "Crea Nuovo Modulo"}</DialogTitle>
                </DialogHeader>
                <Form {...moduleForm}>
                  <form onSubmit={moduleForm.handleSubmit(handleSubmitModule)} className="space-y-4">
                    <FormField
                      control={moduleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titolo *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome del modulo" data-testid="input-module-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={moduleForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrizione</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="Descrizione del modulo"
                              rows={3}
                              data-testid="textarea-module-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={moduleForm.control}
                      name="orderIndex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordine</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-module-order"
                            />
                          </FormControl>
                          <FormDescription>Numero per ordinare i moduli</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={moduleForm.control}
                      name="defaultExpanded"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-module-expanded"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Espandi di default
                            </FormLabel>
                            <FormDescription>
                              Il modulo sarà aperto automaticamente nella vista studente
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModuleDialogOpen(false)}
                        disabled={createModuleMutation.isPending}
                      >
                        Annulla
                      </Button>
                      <Button
                        type="submit"
                        disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                        data-testid="button-save-module"
                      >
                        {(createModuleMutation.isPending || updateModuleMutation.isPending) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvataggio...
                          </>
                        ) : editingModule ? (
                          "Aggiorna Modulo"
                        ) : (
                          "Crea Modulo"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessun modulo disponibile. Clicca "Nuovo Modulo" per iniziare.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`module-item-${module.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{module.title}</p>
                        {module.description && (
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {module.lessons?.length || 0} contenuti
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                        data-testid={`button-edit-module-${module.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(module.id, module.title)}
                        disabled={deleteModuleMutation.isPending}
                        data-testid={`button-delete-module-${module.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content by Type Section */}
      {selectedCourseId && !modulesLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Contenuti per Tipo</CardTitle>
            <p className="text-sm text-muted-foreground">
              I contenuti sono organizzati come li vedono gli studenti
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
                {lessonsByType.map((section) => {
                  const Icon = section.icon;
                  return (
                    <AccordionItem key={section.value || ''} value={section.value || ''} data-testid={`content-section-${section.value}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{section.label}</span>
                          </div>
                          <Badge variant="secondary">
                            {section.lessons.length} contenuti
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {/* Add Content Button */}
                          <div className="flex gap-2 pb-3 border-b">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleNewLesson(section.value || "presentazione")}
                              data-testid={`button-add-content-${section.value}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Aggiungi Contenuto
                            </Button>
                          </div>

                          {/* Lessons List */}
                          {section.lessons.length > 0 ? (
                            <div className="space-y-2">
                              {section.lessons.map((lesson) => {
                                const lessonModule = modules.find(m => m.id === lesson.moduleId);
                                return (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                                    data-testid={`lesson-item-${lesson.id}`}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{lesson.title}</p>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                          {lessonModule && (
                                            <Badge variant="outline" className="text-xs">
                                              📚 {lessonModule.title}
                                            </Badge>
                                          )}
                                          {lesson.videoUrls && lesson.videoUrls.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              <FileVideo className="h-3 w-3 mr-1" />
                                              {lesson.videoUrls.length} video
                                            </Badge>
                                          )}
                                          {lesson.pdfUrl && (
                                            <Badge variant="secondary" className="text-xs">
                                              <FileText className="h-3 w-3 mr-1" />
                                              PDF
                                            </Badge>
                                          )}
                                          {lesson.htmlContent && (
                                            <Badge variant="secondary" className="text-xs">
                                              <FileText className="h-3 w-3 mr-1" />
                                              HTML
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditLesson(lesson)}
                                        data-testid={`button-edit-lesson-${lesson.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                        disabled={deleteLessonMutation.isPending}
                                        data-testid={`button-delete-lesson-${lesson.id}`}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nessun contenuto in questa sezione</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleNewLesson(section.value || "presentazione")}
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Aggiungi il primo contenuto
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Modifica Contenuto" : "Crea Nuovo Contenuto"}</DialogTitle>
          </DialogHeader>
          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(handleSubmitLesson)} className="space-y-4">
              <FormField
                control={lessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome del contenuto" data-testid="input-lesson-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modulo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-module">
                          <SelectValue placeholder="Seleziona modulo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Scegli il modulo di appartenenza</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
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
                {videoUrls.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nessun video aggiunto. Clicca "Aggiungi Video" per iniziare.</p>
                )}
                {videoUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="flex-1">
                      <MediaUploadZone
                        currentUrl={url}
                        onUploadComplete={(newUrl) => updateVideoUrl(idx, newUrl)}
                      />
                    </div>
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
                control={lessonForm.control}
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
                control={lessonForm.control}
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
                    "Aggiorna Contenuto"
                  ) : (
                    "Crea Contenuto"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
