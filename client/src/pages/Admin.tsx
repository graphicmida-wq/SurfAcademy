import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, GripVertical } from "lucide-react";
import type { HeroSlide, InsertHeroSlide } from "@shared/schema";
import { insertHeroSlideSchema } from "@shared/schema";
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

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localSlides, setLocalSlides] = useState<HeroSlide[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: slides = [], isLoading: slidesLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/admin/hero-slides"],
    enabled: !!user?.isAdmin,
  });

  useEffect(() => {
    setLocalSlides(slides);
  }, [slides]);

  const form = useForm<InsertHeroSlide>({
    resolver: zodResolver(insertHeroSlideSchema),
    defaultValues: {
      type: "image",
      mediaUrl: "",
      title: "",
      subtitle: "",
      ctaText: "",
      ctaLink: "",
      orderIndex: slides.length,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHeroSlide) => {
      const res = await apiRequest("POST", "/api/admin/hero-slides", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide creata con successo" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHeroSlide> }) => {
      const res = await apiRequest("PATCH", `/api/admin/hero-slides/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide aggiornata con successo" });
      form.reset();
      setEditingSlide(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/hero-slides/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedSlides: { id: string; orderIndex: number }[]) => {
      const res = await apiRequest("PUT", "/api/admin/hero-slides/reorder", {
        slides: reorderedSlides,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Ordine aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante il riordino", variant: "destructive" });
    },
  });

  const handleUploadComplete = async (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadUrl = uploadedFile.uploadURL;

      try {
        const res = await apiRequest("POST", "/api/object-storage/set-acl", {
          objectPath: uploadUrl,
          aclPolicy: {
            owner: user?.id,
            visibility: "public",
          },
        });
        const aclResponse = await res.json();

        const normalizedPath = aclResponse.path;
        form.setValue("mediaUrl", normalizedPath);
        toast({ title: "Media caricato con successo" });
      } catch (error) {
        console.error("Error setting ACL:", error);
        toast({ title: "Errore durante il caricamento", variant: "destructive" });
      }
    }
  };

  const getUploadUrl = async () => {
    const res = await apiRequest("POST", "/api/object-storage/upload-url");
    const response = await res.json();
    return { method: "PUT" as const, url: response.url };
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    form.reset({
      type: slide.type as "image" | "video",
      mediaUrl: slide.mediaUrl,
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      ctaText: slide.ctaText || "",
      ctaLink: slide.ctaLink || "",
      orderIndex: slide.orderIndex,
      isActive: slide.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingSlide(null);
      form.reset({
        type: "image",
        mediaUrl: "",
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "",
        orderIndex: slides.length,
        isActive: true,
      });
    }
  };

  const handleSubmit = (data: InsertHeroSlide) => {
    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...localSlides];
    const draggedSlide = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);

    const reindexedSlides = newSlides.map((slide, idx) => ({
      ...slide,
      orderIndex: idx,
    }));

    setLocalSlides(reindexedSlides);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null) return;

    const reorderedSlides = localSlides.map((slide, index) => ({
      id: slide.id,
      orderIndex: index,
    }));

    reorderMutation.mutate(reorderedSlides);
    setDraggedIndex(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-auth" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4" data-testid="text-access-denied">Accesso Negato</h1>
        <p className="text-muted-foreground" data-testid="text-admin-required">
          Questa pagina è riservata agli amministratori.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold" data-testid="text-admin-title">Gestione Hero Slides</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-slide">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingSlide ? "Modifica Slide" : "Nuova Slide"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Media</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-media-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="image" data-testid="option-image">Immagine</SelectItem>
                          <SelectItem value="video" data-testid="option-video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mediaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="/objects/..."
                            data-testid="input-media-url"
                          />
                        </FormControl>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={52428800}
                          onGetUploadParameters={getUploadUrl}
                          onComplete={handleUploadComplete}
                          buttonClassName="shrink-0"
                        >
                          <span data-testid="button-upload">Upload</span>
                        </ObjectUploader>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sottotitolo</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-subtitle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Testo CTA</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cta-text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ctaLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link CTA</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="/corsi" data-testid="input-cta-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Attiva</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancel"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingSlide ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {slidesLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-slides" />
        </div>
      ) : localSlides.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground" data-testid="text-no-slides">
              Nessuna slide presente. Crea la prima!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localSlides.map((slide, index) => (
            <Card
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="cursor-move hover-elevate"
              data-testid={`card-slide-${slide.id}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg" data-testid={`text-slide-title-${slide.id}`}>
                    {slide.title || "Untitled"}
                  </CardTitle>
                  {!slide.isActive && (
                    <span className="text-xs bg-muted px-2 py-1 rounded" data-testid={`badge-inactive-${slide.id}`}>
                      Inattiva
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(slide)}
                    data-testid={`button-edit-${slide.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(slide.id)}
                    data-testid={`button-delete-${slide.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-48 h-32 bg-muted rounded overflow-hidden flex-shrink-0">
                    {slide.type === "image" ? (
                      <img
                        src={slide.mediaUrl}
                        alt={slide.title || ""}
                        className="w-full h-full object-cover"
                        data-testid={`img-preview-${slide.id}`}
                      />
                    ) : (
                      <video
                        src={slide.mediaUrl}
                        className="w-full h-full object-cover"
                        data-testid={`video-preview-${slide.id}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground" data-testid={`text-subtitle-${slide.id}`}>
                      {slide.subtitle}
                    </p>
                    {slide.ctaText && (
                      <p className="text-sm">
                        <span className="font-medium">CTA:</span> {slide.ctaText} → {slide.ctaLink}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ordine: {slide.orderIndex} | Tipo: {slide.type}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
