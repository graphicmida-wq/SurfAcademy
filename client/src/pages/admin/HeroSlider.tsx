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

export default function AdminHeroSlider() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: slides = [], isLoading: slidesLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/admin/hero-slides"],
  });

  const form = useForm<InsertHeroSlide>({
    resolver: zodResolver(insertHeroSlideSchema),
    defaultValues: {
      type: "image",
      mediaUrl: "",
      title: "",
      subtitle: "",
      ctaText: "",
      ctaLink: "",
      logoUrl: "",
      logoSize: "medium",
      logoPosition: "before",
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

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    form.reset({
      type: slide.type as "image" | "video",
      mediaUrl: slide.mediaUrl,
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      ctaText: slide.ctaText || "",
      ctaLink: slide.ctaLink || "",
      logoUrl: slide.logoUrl || "",
      logoSize: slide.logoSize || "medium",
      logoPosition: slide.logoPosition || "before",
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
        logoUrl: "",
        logoSize: "medium",
        logoPosition: "before",
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSlides = [...slides];
    const draggedSlide = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedSlide);

    const reorderedSlides = newSlides.map((slide, index) => ({
      id: slide.id,
      orderIndex: index,
    }));

    reorderMutation.mutate(reorderedSlides);
    setDraggedIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-title">Gestione Hero Slides</h1>
          <p className="text-muted-foreground mt-1">Gestisci le slide della homepage</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-slide">
              <Plus className="w-4 h-4 mr-2" />
              Nuova Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Modifica Slide" : "Crea Nuova Slide"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="image">Immagine</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
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
                      <FormLabel>Media</FormLabel>
                      <FormControl>
                        <MediaUploadZone
                          currentUrl={field.value}
                          onUploadComplete={field.onChange}
                          userId={user?.id}
                        />
                      </FormControl>
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

                {/* Logo opzionale */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-4">Logo Opzionale</h3>
                  
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo (opzionale)</FormLabel>
                        <FormControl>
                          <MediaUploadZone
                            currentUrl={field.value}
                            onUploadComplete={field.onChange}
                            userId={user?.id}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="logoSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensione Logo</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-logo-size">
                                <SelectValue placeholder="Seleziona dimensione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Piccolo</SelectItem>
                              <SelectItem value="medium">Medio</SelectItem>
                              <SelectItem value="large">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logoPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posizione Logo</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-logo-position">
                                <SelectValue placeholder="Seleziona posizione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="before">Prima del testo</SelectItem>
                              <SelectItem value="after">Dopo il testo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground" data-testid="text-no-slides">
              Nessuna slide presente. Crea la prima!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <Card
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="cursor-move hover-elevate"
              data-testid={`slide-card-${slide.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg" data-testid={`slide-title-${slide.id}`}>
                        {slide.title || "Nessun titolo"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {slide.type === "image" ? "Immagine" : "Video"} • Ordine: {slide.orderIndex}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slide)}
                      data-testid={`button-edit-${slide.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(slide.id)}
                      data-testid={`button-delete-${slide.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(slide.mediaUrl || slide.logoUrl) && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {slide.mediaUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Media Preview</p>
                        {slide.type === "image" ? (
                          <img
                            src={slide.mediaUrl}
                            alt={slide.title || "Slide"}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={slide.mediaUrl}
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                    {slide.logoUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Logo ({slide.logoSize || 'medium'}) - {slide.logoPosition === 'before' ? 'Prima' : 'Dopo'}
                        </p>
                        <img
                          src={slide.logoUrl}
                          alt="Logo"
                          className="h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
