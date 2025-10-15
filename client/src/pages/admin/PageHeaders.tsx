import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { PageHeader } from "@shared/schema";

const PAGE_KEYS = [
  { key: 'courses', label: 'Corsi' },
  { key: 'surf-camp', label: 'Surf Camp' },
  { key: 'community', label: 'Community' },
  { key: 'dashboard', label: 'Dashboard' }
];

export default function AdminPageHeaders() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<string>('courses');
  
  const { data: pageHeaders, isLoading } = useQuery<PageHeader[]>({
    queryKey: ['/api/page-headers'],
  });

  const currentHeader = pageHeaders?.find(h => h.page === selectedPage);

  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  // Sync form data when pageHeaders or selectedPage changes
  useEffect(() => {
    if (currentHeader) {
      setFormData({
        imageUrl: currentHeader.imageUrl || '',
        title: currentHeader.title || '',
        subtitle: currentHeader.subtitle || ''
      });
    }
  }, [currentHeader]);

  const updateMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; title: string; subtitle: string }) => {
      await apiRequest("PUT", `/api/page-headers/${selectedPage}`, data);
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
    setFormData({
      imageUrl: header?.imageUrl || '',
      title: header?.title || '',
      subtitle: header?.subtitle || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
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
          Gestisci le intestazioni hero delle pagine esistenti (Corsi, Surf Camp, Community, Dashboard)
        </p>
      </div>

      <div className="grid gap-6">
        {/* Page Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleziona Pagina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PAGE_KEYS.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedPage === key ? 'default' : 'outline'}
                  onClick={() => handlePageChange(key)}
                  data-testid={`button-page-${key}`}
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
              Modifica Intestazione: {PAGE_KEYS.find(p => p.key === selectedPage)?.label}
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

              <Button
                type="submit"
                disabled={updateMutation.isPending || !formData.title}
                className="w-full"
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
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
