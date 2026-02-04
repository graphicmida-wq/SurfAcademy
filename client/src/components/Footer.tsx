import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Seguici */}
          <div className="text-center">
            <h3 className="font-display font-semibold text-lg mb-3">Seguici</h3>
            <a
              href="https://www.instagram.com/scuoladilongboard/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 p-3 rounded-lg hover-elevate active-elevate-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="social-instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Scuola di Longboard. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
