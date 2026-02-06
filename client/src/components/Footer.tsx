import { Instagram } from "lucide-react";
import scuolaLogoUrl from "@assets/scuola-monocol_1770391680234.png";
import cinghialeLogoUrl from "@assets/cinghiale-monocol_1770391680234.png";
import clinicLogoUrl from "@assets/clinic-monocol_1770391680234.png";

const FOOTER_COLOR = '#3d636d';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center gap-6">
          <a
            href="https://www.instagram.com/scuoladilongboard/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg hover-elevate active-elevate-2 transition-opacity"
            style={{ color: FOOTER_COLOR }}
            data-testid="social-instagram"
          >
            <span className="font-display font-semibold text-lg">Seguici</span>
            <Instagram className="h-6 w-6" />
          </a>

          <div className="flex items-center justify-center gap-8 flex-wrap">
            <img src={scuolaLogoUrl} alt="Scuola di Longboard" className="h-16 w-auto object-contain" />
            <img src={cinghialeLogoUrl} alt="Cinghiale Marino Surf Club" className="h-16 w-auto object-contain" />
            <img src={clinicLogoUrl} alt="Nose Riding Clinic" className="h-16 w-auto object-contain" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm" style={{ color: FOOTER_COLOR }}>
            COPYRIGHT© 2025 – SCUOLA DI LONGBOARD – ASD CINGHIALE MARINO SURF CLUB – Via Aurelia 45 – 17051 – ANDORA (SV)
          </p>
        </div>
      </div>
    </footer>
  );
}
