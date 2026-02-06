import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import bgDesktop from "@assets/Tavola_disegno_1_1770398994590.png";
import bgMobile from "@assets/Tavola_disegno_2_1770398994590.png";
import logoWhite from "@assets/chiaro1_1760538494784.webp";
import goodVibesImg from "@assets/Tavola_disegno_3_1770398994590.png";

type AnimStep = "welcome" | "logo" | "vibes" | "button";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState<AnimStep>("welcome");
  const [fadeIn, setFadeIn] = useState(false);

  const firstName = user?.firstName || "Studente";

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setFadeIn(true), 200));

    timers.push(setTimeout(() => {
      setFadeIn(false);
    }, 2800));

    timers.push(setTimeout(() => {
      setStep("logo");
      setFadeIn(true);
    }, 3500));

    timers.push(setTimeout(() => {
      setFadeIn(false);
    }, 6000));

    timers.push(setTimeout(() => {
      setStep("vibes");
      setFadeIn(true);
    }, 6700));

    timers.push(setTimeout(() => {
      setStep("button");
    }, 8200));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" data-testid="welcome-page">
      <picture>
        <source media="(max-width: 768px)" srcSet={bgMobile} />
        <source media="(min-width: 769px)" srcSet={bgDesktop} />
        <img
          src={bgDesktop}
          alt="Sfondo"
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-welcome-bg"
        />
      </picture>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {step === "welcome" && (
          <h1
            className={`text-white text-3xl sm:text-4xl md:text-5xl font-display font-bold text-center drop-shadow-lg transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
            data-testid="text-welcome-name"
          >
            Benvenuto, {firstName}
          </h1>
        )}

        {step === "logo" && (
          <img
            src={logoWhite}
            alt="Scuola di Longboard"
            className={`h-28 sm:h-36 md:h-44 w-auto drop-shadow-2xl transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}
            data-testid="img-welcome-logo"
          />
        )}

        {step === "vibes" && (
          <div className={`flex flex-col items-center gap-10 transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
            <img
              src={goodVibesImg}
              alt="Good Vibes"
              className="h-24 sm:h-32 md:h-40 w-auto drop-shadow-2xl brightness-0 invert"
              data-testid="img-good-vibes"
            />
          </div>
        )}

        {step === "button" && (
          <div className="flex flex-col items-center gap-10 animate-fade-in">
            <img
              src={goodVibesImg}
              alt="Good Vibes"
              className="h-24 sm:h-32 md:h-40 w-auto drop-shadow-2xl brightness-0 invert"
              data-testid="img-good-vibes-final"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="bg-white/20 backdrop-blur-sm text-white border-white/40"
              data-testid="button-go-to-lessons"
            >
              Vai alle lezioni
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
