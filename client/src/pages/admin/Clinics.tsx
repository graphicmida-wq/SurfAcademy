import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploadZone } from "@/components/MediaUploadZone";
import { SimpleRichTextEditor } from "@/components/SimpleRichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, MapPin, Calendar, Users } from "lucide-react";
import type { Clinic, InsertClinic } from "@shared/schema";
import { insertClinicSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function AdminClinics() {
  const { toast } = useToast();
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: clinics = [], isLoading: clinicsLoading } = useQuery<Clinic[]>({
    queryKey: ["/api/admin/clinics"],
  });

  const form = useForm<InsertClinic>({
    resolver: zodResolver(insertClinicSchema.extend({
      description: insertClinicSchema.shape.description.transform(v => v || ""),
      imageUrl: insertClinicSchema.shape.imageUrl.transform(v => v || ""),
      imageGallery: insertClinicSchema.shape.imageGallery.transform(v => v || []),
    })),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
      price: 0,
      totalSpots: 10,
      availableSpots: 10,
      imageUrl: "",
      imageGallery: [],
      galleryLayout: "grid",
      galleryColumns: 3,
      galleryGap: "16px",
      galleryAspectRatio: "original",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClinic) => {
      const res = await apiRequest("POST", "/api/admin/clinics", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clinics"] });
      toast({ title: "Clinic creata con successo" });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertClinic> }) => {
      const res = await apiRequest("PATCH", `/api/admin/clinics/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clinics"] });
      toast({ title: "Clinic aggiornata con successo" });
      form.reset();
      setEditingClinic(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/clinics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clinics"] });
      toast({ title: "Clinic eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    form.reset({
      title: clinic.title,
      description: clinic.description || "",
      location: clinic.location,
      startDate: new Date(clinic.startDate),
      endDate: new Date(clinic.endDate),
      price: clinic.price,
      totalSpots: clinic.totalSpots,
      availableSpots: clinic.availableSpots,
      imageUrl: clinic.imageUrl || "",
      imageGallery: clinic.imageGallery || [],
      galleryLayout: clinic.galleryLayout || "grid",
      galleryColumns: clinic.galleryColumns || 3,
      galleryGap: clinic.galleryGap || "16px",
      galleryAspectRatio: clinic.galleryAspectRatio || "original",
    });
    setIsDialogOpen(true);
  };

  const handleNewClinic = () => {
    setEditingClinic(null);
    form.reset({
      title: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: new Date(),
      price: 0,
      totalSpots: 10,
      availableSpots: 10,
      imageUrl: "",
      imageGallery: [],
      galleryLayout: "grid",
      galleryColumns: 3,
      galleryGap: "16px",
      galleryAspectRatio: "original",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: InsertClinic) => {
    // Convert date strings to Date objects
    const formattedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    };
    
    if (editingClinic) {
      updateMutation.mutate({ id: editingClinic.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (clinicsLoading) {
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
          <h1 className="text-3xl font-display font-bold" data-testid="text-clinics-admin-title">
            Gestione Clinic
          </h1>
          <p className="text-muted-foreground">Crea e gestisci le giornate di surf della scuola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewClinic} data-testid="button-create-clinic">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Clinic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClinic ? "Modifica Clinic" : "Nuova Clinic"}
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
                        <Input {...field} placeholder="Nome della clinic" data-testid="input-clinic-title" />
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
                        <SimpleRichTextEditor
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Descrizione della clinic"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Luogo *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Es: Marina di Pisa, Toscana" data-testid="input-clinic-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waiting Period Inizio *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-clinic-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waiting Period Fine *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-clinic-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalSpots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posti Totali *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-clinic-total-spots"
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
                        <FormLabel>Prezzo (centesimi) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            placeholder="9900 = €99.00"
                            data-testid="input-clinic-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
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
                  name="imageGallery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Galleria Foto (URL separati da virgola)</FormLabel>
                      <FormControl>
                        <Textarea
                          value={field.value?.join(", ") || ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                          placeholder="https://..., https://..."
                          className="min-h-[80px]"
                          data-testid="textarea-image-gallery"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Configurazione Galleria</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="galleryLayout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Layout Galleria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "grid"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gallery-layout">
                                <SelectValue placeholder="Seleziona layout" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="grid" data-testid="option-layout-grid">Griglia</SelectItem>
                              <SelectItem value="masonry" data-testid="option-layout-masonry">Masonry</SelectItem>
                              <SelectItem value="carousel" data-testid="option-layout-carousel">Carousel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="galleryColumns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colonne ({field.value || 3})</FormLabel>
                          <FormControl>
                            <Slider
                              min={1}
                              max={6}
                              step={1}
                              value={[field.value || 3]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              data-testid="slider-gallery-columns"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="galleryGap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Spaziatura</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || "16px"}
                              placeholder="16px, 1rem, ecc."
                              data-testid="input-gallery-gap"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="galleryAspectRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aspect Ratio</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "original"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gallery-aspect-ratio">
                                <SelectValue placeholder="Seleziona aspect ratio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1:1" data-testid="option-ratio-1-1">1:1 (Quadrato)</SelectItem>
                              <SelectItem value="4:3" data-testid="option-ratio-4-3">4:3 (Standard)</SelectItem>
                              <SelectItem value="16:9" data-testid="option-ratio-16-9">16:9 (Widescreen)</SelectItem>
                              <SelectItem value="original" data-testid="option-ratio-original">Originale</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-clinic"
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-submit-clinic">
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingClinic ? "Aggiorna" : "Crea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {clinics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna clinic creata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {clinics.map((clinic) => (
            <Card key={clinic.id} data-testid={`card-clinic-${clinic.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-display">{clinic.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(clinic)}
                    data-testid={`button-edit-clinic-${clinic.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-clinic-${clinic.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Questa azione eliminerà permanentemente la clinic "{clinic.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(clinic.id)}
                          data-testid="button-confirm-delete"
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clinic.description && (
                    <p className="text-muted-foreground text-sm">{clinic.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{clinic.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(clinic.startDate), "dd MMM", { locale: it })} - {format(new Date(clinic.endDate), "dd MMM yyyy", { locale: it })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{clinic.availableSpots} / {clinic.totalSpots} posti disponibili</span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">
                    €{(clinic.price / 100).toFixed(2)}
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
