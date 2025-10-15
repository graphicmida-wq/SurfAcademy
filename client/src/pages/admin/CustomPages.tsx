import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CustomPage } from "@shared/schema";

export default function AdminCustomPages() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: pages, isLoading } = useQuery<CustomPage[]>({
    queryKey: ['/api/custom-pages'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/custom-pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages'] });
      toast({
        title: "Eliminato!",
        description: "La pagina è stata eliminata con successo.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la pagina.",
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const page = pages?.find(p => p.id === id);
      if (!page) throw new Error("Page not found");
      
      await apiRequest("PUT", `/api/custom-pages/${id}`, {
        ...page,
        published: !published
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages'] });
      toast({
        title: "Aggiornato!",
        description: "Lo stato di pubblicazione è stato modificato.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile modificare lo stato.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Pagine Custom</h1>
          <p className="text-muted-foreground">
            Gestisci le pagine personalizzate con sistema a blocchi
          </p>
        </div>
        <Button 
          data-testid="button-new-page" 
          onClick={() => window.location.href = '/admin/pages/new'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuova Pagina
        </Button>
      </div>

      {pages && pages.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground mb-4">
              Nessuna pagina custom creata. Clicca "Nuova Pagina" per iniziare.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pages?.map((page) => (
            <Card key={page.id} className="hover-elevate active-elevate-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{page.title}</CardTitle>
                      <Badge variant={page.published === true ? "default" : "secondary"}>
                        {page.published === true ? "Pubblicata" : "Bozza"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Slug: <span className="font-mono">/p/{page.slug}</span></p>
                      {page.seoTitle && (
                        <p>SEO Title: {page.seoTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => togglePublishMutation.mutate({ 
                        id: page.id, 
                        published: page.published === true 
                      })}
                      disabled={togglePublishMutation.isPending}
                      data-testid={`button-toggle-publish-${page.id}`}
                    >
                      {page.published === true ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.location.href = `/admin/pages/${page.id}/edit`}
                      data-testid={`button-edit-${page.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(page.id)}
                      data-testid={`button-delete-${page.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {page.seoDescription && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {page.seoDescription}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. La pagina e tutti i suoi blocchi verranno eliminati permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
