import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LevelBadge } from "@/components/LevelBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { Post, Comment, User as UserType } from "@shared/schema";

export default function Community() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data: posts, isLoading } = useQuery<(Post & { user: UserType; _count: { comments: number } })[]>({
    queryKey: ["/api/posts", selectedLevel],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; level: string }) => {
      await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostTitle("");
      setNewPostContent("");
      toast({
        title: "Post pubblicato!",
        description: "Il tuo post è ora visibile alla community.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Accesso richiesto",
          description: "Effettua il login per pubblicare post.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Errore",
        description: "Impossibile pubblicare il post. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci titolo e contenuto del post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate({
      title: newPostTitle,
      content: newPostContent,
      level: user?.userLevel || "beginner",
    });
  };

  const filteredPosts = posts?.filter(
    (post) => selectedLevel === "all" || post.level === selectedLevel || post.level === "all"
  );

  return (
    <div className="min-h-screen pt-36 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4" data-testid="text-community-title">
            Community
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Condividi la tua passione per il surf, chiedi consigli e discuti con altri surfisti.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            {isAuthenticated && (
              <Card data-testid="card-create-post">
                <CardHeader>
                  <h2 className="font-display font-semibold text-xl">Crea un Post</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Titolo del post..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    data-testid="input-post-title"
                  />
                  <Textarea
                    placeholder="Cosa vuoi condividere con la community?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-32"
                    data-testid="input-post-content"
                  />
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                    className="w-full sm:w-auto"
                    data-testid="button-submit-post"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createPostMutation.isPending ? "Pubblicazione..." : "Pubblica"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded mb-3 w-3/4" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                ))}
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-4" data-testid="list-posts">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="hover-elevate active-elevate-2 transition-all" data-testid={`card-post-${post.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          {post.user.profileImageUrl ? (
                            <img
                              src={post.user.profileImageUrl}
                              alt={post.user.firstName || "User"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" data-testid={`text-post-author-${post.id}`}>
                              {post.user.firstName || "Surfista"} {post.user.lastName?.[0] || ""}.
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </p>
                          </div>
                        </div>
                        {post.level && <LevelBadge level={post.level} />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-display font-semibold text-xl mb-2" data-testid={`text-post-title-${post.id}`}>
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap mb-4" data-testid={`text-post-content-${post.id}`}>
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post._count?.comments || 0} commenti</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-xl mb-2">Nessun post</h3>
                <p className="text-muted-foreground mb-4">
                  {isAuthenticated
                    ? "Sii il primo a condividere qualcosa con la community!"
                    : "Accedi per vedere i post della community"}
                </p>
                {!isAuthenticated && (
                  <Button asChild data-testid="button-login-to-view-posts">
                    <a href="/api/login">Accedi</a>
                  </Button>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Level Filter */}
            <Card>
              <CardHeader>
                <h3 className="font-display font-semibold text-lg">Filtra per Livello</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedLevel === "all" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedLevel("all")}
                  data-testid="button-filter-all"
                >
                  Tutti i livelli
                </Button>
                <Button
                  variant={selectedLevel === "beginner" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedLevel("beginner")}
                  data-testid="button-filter-beginner"
                >
                  Principiante
                </Button>
                <Button
                  variant={selectedLevel === "intermediate" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedLevel("intermediate")}
                  data-testid="button-filter-intermediate"
                >
                  Intermedio
                </Button>
                <Button
                  variant={selectedLevel === "advanced" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedLevel("advanced")}
                  data-testid="button-filter-advanced"
                >
                  Avanzato
                </Button>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <h3 className="font-display font-semibold text-lg">Linee Guida</h3>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Sii rispettoso e cortese</p>
                <p>• Condividi esperienze costruttive</p>
                <p>• Aiuta gli altri surfisti</p>
                <p>• Evita spam e contenuti offensivi</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
