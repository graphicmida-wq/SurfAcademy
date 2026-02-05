import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LocalAuth() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiRequest("POST", "/api/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Login effettuato con successo!" });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Benvenuto</CardTitle>
          <CardDescription className="text-center">
            Accedi con le tue credenziali WordPress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="tua@email.com"
                        data-testid="input-login-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="La tua password WordPress"
                        data-testid="input-login-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Non hai un account?{" "}
            <a
              href="https://scuoladilongboard.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-register-wp"
            >
              Registrati su scuoladilongboard.it
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
