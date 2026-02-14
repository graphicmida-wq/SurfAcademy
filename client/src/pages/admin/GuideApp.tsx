import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { MiniRichTextEditor } from "@/components/MiniRichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { GuidePage, InsertGuidePage } from "@shared/schema";
import { insertGuidePageSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function AdminGuideApp() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<GuidePage | null>(null);

  const { data: guidePages = [], isLoading } = useQuery<GuidePage[]>({
    queryKey: ["/api/guide-pages"],
  });

  const sortedPages = [...guidePages].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
  );

  const form = useForm<InsertGuidePage>({
    resolver: zodResolver(insertGuidePageSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      htmlContent: "",
      orderIndex: 0,
      published: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGuidePage) => {
      const res = await apiRequest("POST", "/api/guide-pages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guide-pages"] });
      toast({ title: "Pagina creata con successo" });
      form.reset();
      setEditingPage(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<InsertGuidePage>;
    }) => {
      const res = await apiRequest("PATCH", `/api/guide-pages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guide-pages"] });
      toast({ title: "Pagina aggiornata con successo" });
      form.reset();
      setEditingPage(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/guide-pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guide-pages"] });
      toast({ title: "Pagina eliminata con successo" });
    },
    onError: () => {
      toast({
        title: "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (pages: { id: string; orderIndex: number }[]) => {
      await apiRequest("POST", "/api/guide-pages/reorder", { pages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guide-pages"] });
    },
    onError: () => {
      toast({
        title: "Errore durante il riordinamento",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertGuidePage) => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleNewPage = () => {
    setEditingPage(null);
    form.reset({
      title: "",
      description: "",
      videoUrl: "",
      htmlContent: "",
      orderIndex: sortedPages.length,
      published: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditPage = (page: GuidePage) => {
    setEditingPage(page);
    form.reset({
      title: page.title,
      description: page.description || "",
      videoUrl: page.videoUrl || "",
      htmlContent: page.htmlContent || "",
      orderIndex: page.orderIndex ?? 0,
      published: page.published ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleDeletePage = (page: GuidePage) => {
    if (confirm(`Sei sicuro di voler eliminare "${page.title}"?`)) {
      deleteMutation.mutate(page.id);
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sortedPages.length - 1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...sortedPages];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];
    const pages = reordered.map((p, i) => ({ id: p.id, orderIndex: i }));
    reorderMutation.mutate(pages);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-3xl font-display font-bold mb-2"
            data-testid="text-guide-app-title"
          >
            Guida App
          </h1>
          <p className="text-muted-foreground">
            Gestisci le pagine della guida dell'app
          </p>
        </div>
        <Button onClick={handleNewPage} data-testid="button-create-guide-page">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Pagina
        </Button>
      </div>

      {sortedPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessuna pagina guida creata. Clicca "Nuova Pagina" per iniziare.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedPages.map((page, index) => (
            <Card key={page.id} data-testid={`card-guide-page-${page.id}`}>
              <CardContent className="flex flex-row items-center justify-between gap-4 py-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm text-muted-foreground font-mono w-6 text-center shrink-0">
                    {(page.orderIndex ?? 0) + 1}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="font-medium truncate"
                      data-testid={`text-guide-title-${page.id}`}
                      dangerouslySetInnerHTML={{ __html: page.title }}
                    />
                  </div>
                  <Badge
                    variant={page.published ? "default" : "secondary"}
                    data-testid={`badge-published-${page.id}`}
                  >
                    {page.published ? "Pubblicata" : "Bozza"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    data-testid={`button-move-up-${page.id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMove(index, "down")}
                    disabled={index === sortedPages.length - 1}
                    data-testid={`button-move-down-${page.id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEditPage(page)}
                    data-testid={`button-edit-guide-${page.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeletePage(page)}
                    data-testid={`button-delete-guide-${page.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Modifica Pagina" : "Nuova Pagina"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo *</FormLabel>
                    <FormControl>
                      <MiniRichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Titolo della pagina"
                      />
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
                      <MiniRichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Descrizione della pagina"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Video</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="https://..."
                        data-testid="input-guide-video-url"
                      />
                    </FormControl>
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
                      <RichTextEditor
                        content={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-guide-published"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pubblicata</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-guide"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  data-testid="button-save-guide"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : editingPage ? (
                    "Aggiorna"
                  ) : (
                    "Crea"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
