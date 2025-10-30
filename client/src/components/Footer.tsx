import { Link } from "wouter";
import { Facebook, Instagram, Youtube } from "lucide-react";

export function Footer() {
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
                  href="/surf-day"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-surf-day"
                >
                  SurfDay
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/community"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-feed"
                >
                  Feed
                </Link>
              </li>
              <li>
                <Link 
                  href="/surf-day"
                  className="text-muted-foreground hover:text-primary transition-colors" 
                  data-testid="footer-link-surfdays"
                >
                  SurfDay
                </Link>
              </li>
            </ul>
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
