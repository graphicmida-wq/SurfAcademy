import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { PageHeader, CustomPage } from "@shared/schema";

const STATIC_PAGES = [
  { key: 'home', label: 'Home' },
  { key: 'courses', label: 'Corsi' },
  { key: 'surf-camp', label: 'Surf Camp' },
  { key: 'community', label: 'Community' },
  { key: 'dashboard', label: 'Dashboard' }
];

export default function AdminPageHeaders() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<string>('courses');
  
  const { data: pageHeaders, isLoading: headersLoading } = useQuery<PageHeader[]>({
    queryKey: ['/api/page-headers'],
  });

  const { data: customPages, isLoading: pagesLoading } = useQuery<CustomPage[]>({
    queryKey: ['/api/custom-pages'],
  });

  const currentHeader = pageHeaders?.find(h => h.page === selectedPage);

  // Combine static pages + custom pages
  const allPages = [
    ...STATIC_PAGES,
    ...(customPages || []).map(page => ({
      key: page.slug,
      label: `${page.title} (custom)`
    }))
  ];

  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    paddingTop: 'py-16',
    paddingBottom: 'py-24',
    minHeight: 'min-h-96'
  });

  // Sync form data when pageHeaders or selectedPage changes
  useEffect(() => {
    if (currentHeader) {
      setFormData({
        imageUrl: currentHeader.imageUrl || '',
        title: currentHeader.title || '',
        subtitle: currentHeader.subtitle || '',
        paddingTop: currentHeader.paddingTop || 'py-16',
        paddingBottom: currentHeader.paddingBottom || 'py-24',
        minHeight: currentHeader.minHeight || 'min-h-96'
      });
    } else {
      // If no header exists, check if it's a custom page
      const customPage = customPages?.find(p => p.slug === selectedPage);
      if (customPage) {
        setFormData({
          imageUrl: customPage.headerImageUrl || '',
          title: customPage.headerTitle || customPage.title || '',
          subtitle: customPage.headerSubtitle || '',
          paddingTop: 'py-16',
          paddingBottom: 'py-24',
          minHeight: 'min-h-96'
        });
      }
    }
  }, [currentHeader, customPages, selectedPage]);

  const updateMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; title: string; subtitle: string; paddingTop: string; paddingBottom: string; minHeight: string }) => {
      await apiRequest("PUT", `/api/admin/page-headers/${selectedPage}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-headers'] });
      toast({
        title: "Salvato!",
        description: "L'intestazione è stata aggiornata con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche.",
        variant: "destructive",
      });
    },
  });

  const handlePageChange = (pageKey: string) => {
    setSelectedPage(pageKey);
    const header = pageHeaders?.find(h => h.page === pageKey);
    
    // If no header exists, check if it's a custom page and use its data as defaults
    if (!header) {
      const customPage = customPages?.find(p => p.slug === pageKey);
      if (customPage) {
        setFormData({
          imageUrl: customPage.headerImageUrl || '',
          title: customPage.headerTitle || customPage.title || '',
          subtitle: customPage.headerSubtitle || '',
          paddingTop: 'py-16',
          paddingBottom: 'py-24',
          minHeight: 'min-h-96'
        });
        return;
      }
    }
    
    setFormData({
      imageUrl: header?.imageUrl || '',
      title: header?.title || '',
      subtitle: header?.subtitle || '',
      paddingTop: header?.paddingTop || 'py-16',
      paddingBottom: header?.paddingBottom || 'py-24',
      minHeight: header?.minHeight || 'min-h-96'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (headersLoading || pagesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Intestazioni Pagine</h1>
        <p className="text-muted-foreground">
          Gestisci le intestazioni hero di tutte le pagine (esistenti e custom)
        </p>
      </div>

      <div className="grid gap-6">
        {/* Page Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Pagina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allPages.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedPage === key ? 'default' : 'outline'}
                  onClick={() => handlePageChange(key)}
                  data-testid={`button-page-${key}`}
                  className="text-sm"
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              Modifica Intestazione: {allPages.find(p => p.key === selectedPage)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Immagine</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="/objects/uploads/..."
                  data-testid="input-image-url"
                />
                <p className="text-sm text-muted-foreground">
                  Lascia vuoto per usare il gradiente predefinito
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Il Titolo della Pagina"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Sottotitolo</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Una breve descrizione della pagina"
                  rows={3}
                  data-testid="input-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minHeight">Altezza Banner</Label>
                <Select
                  value={formData.minHeight}
                  onValueChange={(value) => setFormData({ ...formData, minHeight: value })}
                >
                  <SelectTrigger id="minHeight" data-testid="select-min-height">
                    <SelectValue placeholder="Seleziona altezza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="min-h-64">Piccolo (256px)</SelectItem>
                    <SelectItem value="min-h-80">Medio (320px)</SelectItem>
                    <SelectItem value="min-h-96">Grande (384px)</SelectItem>
                    <SelectItem value="min-h-[28rem]">Molto Grande (448px)</SelectItem>
                    <SelectItem value="min-h-[32rem]">Extra Grande (512px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paddingTop">Padding Superiore</Label>
                  <Select
                    value={formData.paddingTop}
                    onValueChange={(value) => setFormData({ ...formData, paddingTop: value })}
                  >
                    <SelectTrigger id="paddingTop" data-testid="select-padding-top">
                      <SelectValue placeholder="Seleziona padding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="py-8">Piccolo (32px)</SelectItem>
                      <SelectItem value="py-12">Medio (48px)</SelectItem>
                      <SelectItem value="py-16">Grande (64px)</SelectItem>
                      <SelectItem value="py-20">Molto Grande (80px)</SelectItem>
                      <SelectItem value="py-24">Extra Grande (96px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paddingBottom">Padding Inferiore</Label>
                  <Select
                    value={formData.paddingBottom}
                    onValueChange={(value) => setFormData({ ...formData, paddingBottom: value })}
                  >
                    <SelectTrigger id="paddingBottom" data-testid="select-padding-bottom">
                      <SelectValue placeholder="Seleziona padding" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="py-8">Piccolo (32px)</SelectItem>
                      <SelectItem value="py-12">Medio (48px)</SelectItem>
                      <SelectItem value="py-16">Grande (64px)</SelectItem>
                      <SelectItem value="py-20">Molto Grande (80px)</SelectItem>
                      <SelectItem value="py-24">Extra Grande (96px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.imageUrl && (
                <div className="space-y-2">
                  <Label>Anteprima Immagine</Label>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
