import { Instagram } from "lucide-react";
import cinghialeLogoUrl from "@assets/cinghiale-marino-logo-_1770386698975.png";
import longboardLogoUrl from "@assets/logo_longboard2_1770386728175.png";
import clinicLogoUrl from "@assets/Tavola_disegno_6_1770386741977.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <a
            href="https://www.instagram.com/scuoladilongboard/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg hover-elevate active-elevate-2 text-muted-foreground hover:text-primary transition-colors"
            data-testid="social-instagram"
          >
            <span className="font-display font-semibold text-lg">Seguici</span>
            <Instagram className="h-6 w-6" />
          </a>

          <div className="flex items-center justify-center gap-8 flex-wrap">
            <img src={longboardLogoUrl} alt="Scuola di Longboard" className="h-14 w-auto object-contain grayscale opacity-60" />
            <img src={cinghialeLogoUrl} alt="Cinghiale Marino Surf Club" className="h-14 w-auto object-contain grayscale opacity-60" />
            <img src={clinicLogoUrl} alt="Clinic" className="h-14 w-auto object-contain grayscale opacity-60" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            COPYRIGHT© 2025 – SCUOLA DI LONGBOARD – ASD CINGHIALE MARINO SURF CLUB – Via Aurelia 45 – 17051 – ANDORA (SV)
          </p>
        </div>
      </div>
    </footer>
  );
}
