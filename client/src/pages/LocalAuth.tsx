import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import logoLightUrl from "@assets/chiaro1_1760538494784.webp";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LocalAuth() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => apiRequest("POST", "/api/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Login effettuato con successo!" });
      navigate("/");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: '#0e6e6e' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        <img 
          src={logoLightUrl} 
          alt="Scuola di Longboard" 
          className="h-40 w-auto mb-10"
          data-testid="img-login-logo"
        />

        <Form {...loginForm}>
          <form 
            onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} 
            className="w-full space-y-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className="bg-white/20 border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/40"
                      data-testid="input-login-email"
                    />
                  </FormControl>
                  <FormMessage className="text-orange-300" />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="bg-white/20 border-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/40 pr-12"
                        data-testid="input-login-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-white/60"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-orange-300" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg font-bold bg-amber-500 border-amber-600 text-white"
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "Accesso in corso..." : "Log In"}
            </Button>
          </form>
        </Form>

        <p className="mt-8 text-center text-sm text-white/70">
          Non hai un account?{" "}
          <a
            href="https://scuoladilongboard.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 underline"
            data-testid="link-register-wp"
          >
            Registrati su scuoladilongboard.it
          </a>
        </p>
      </div>
    </div>
  );
}
