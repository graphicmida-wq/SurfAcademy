import { Link } from "wouter";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Email non valida",
        description: "Inserisci un indirizzo email valido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/newsletter/subscribe", { email });
      
      toast({
        title: "Iscrizione richiesta!",
        description: "Controlla la tua email per confermare l'iscrizione alla newsletter.",
      });
      
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Scuola di Longboard</h3>
            <p className="text-sm text-muted-foreground">
              La tua scuola di surf online. Impara il longboard con i migliori corsi, esercizi e una community appassionata.
            </p>
          </div>

          {/* Risorse */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Risorse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/corsi"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-courses"
                >
                  Tutti i Corsi
                </Link>
              </li>
              <li>
                <Link 
                  href="/community"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-community"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link 
                  href="/clinic"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-clinic"
                >
                  Clinic
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ricevi consigli sul surf, aggiornamenti sui corsi e offerte esclusive.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2" data-testid="form-newsletter-subscribe">
              <Input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="bg-background"
                data-testid="input-newsletter-email"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                size="sm"
                data-testid="button-newsletter-submit"
              >
                {isSubmitting ? "Invio..." : "Iscriviti"}
              </Button>
            </form>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Seguici</h3>
            <div className="flex space-x-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover-elevate active-elevate-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="social-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover-elevate active-elevate-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="social-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover-elevate active-elevate-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="social-youtube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Scuola di Longboard. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
