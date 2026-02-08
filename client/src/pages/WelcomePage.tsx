import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import bgDesktop from "@assets/Tavola_disegno_1_1770398994590.png";
import bgMobile from "@assets/Tavola_disegno_2_1770398994590.png";
import logoWhite from "@assets/chiaro1_1760538494784.webp";
import goodVibesImg from "@assets/Tavola_disegno_3_1770398994590.png";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [logoFadedIn, setLogoFadedIn] = useState(false);
  const [showVibes, setShowVibes] = useState(false);
  const [vibesFadedIn, setVibesFadedIn] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [hideWelcome, setHideWelcome] = useState(false);
  const [hideLogo, setHideLogo] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const bgImage = isMobile ? bgMobile : bgDesktop;

  const firstName = user?.firstName || "Studente";

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setShowWelcome(true), 400));
    timers.push(setTimeout(() => setHideWelcome(true), 3600));

    timers.push(setTimeout(() => setShowLogo(true), 5400));
    timers.push(setTimeout(() => setLogoFadedIn(true), 5500));
    timers.push(setTimeout(() => setHideLogo(true), 8400));

    timers.push(setTimeout(() => setShowVibes(true), 10200));
    timers.push(setTimeout(() => setVibesFadedIn(true), 10300));

    timers.push(setTimeout(() => setShowButton(true), 12800));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div data-testid="welcome-page">
      <div
        className="fixed left-0 right-0"
        style={{
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center px-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {!hideLogo && !showLogo && (
          <h1
            className="text-white text-xl sm:text-2xl md:text-3xl font-display font-semibold text-center drop-shadow-lg"
            style={{
              opacity: showWelcome && !hideWelcome ? 1 : 0,
              transition: "opacity 1.8s ease-in-out",
            }}
            data-testid="text-welcome-name"
          >
            Benvenuto, {firstName}
          </h1>
        )}

        {showLogo && !showVibes && (
          <img
            src={logoWhite}
            alt="Scuola di Longboard"
            className="w-auto drop-shadow-2xl"
            style={{
              height: "clamp(11rem, 24vw, 17.5rem)",
              opacity: logoFadedIn && !hideLogo ? 1 : 0,
              transition: "opacity 1.8s ease-in-out",
            }}
            data-testid="img-welcome-logo"
          />
        )}

        {showVibes && (
          <div
            className="flex flex-col items-center"
            style={{
              opacity: vibesFadedIn ? 1 : 0,
              transition: "opacity 1.8s ease-in-out",
            }}
          >
            <img
              src={goodVibesImg}
              alt="Good Vibes"
              className="w-auto drop-shadow-2xl"
              style={{
                height: showButton ? "clamp(6.5rem, 13vw, 11rem)" : "clamp(10rem, 20vw, 16rem)",
                transform: showButton ? "translateY(-2rem)" : "translateY(0)",
                transition: "height 1.4s ease-in-out, transform 1.4s ease-in-out",
              }}
              data-testid="img-good-vibes"
            />
            <div
              style={{
                opacity: showButton ? 1 : 0,
                transform: showButton ? "translateY(-1rem)" : "translateY(1rem)",
                transition: "opacity 1.4s ease-in-out 0.5s, transform 1.4s ease-in-out 0.5s",
                pointerEvents: showButton ? "auto" : "none",
              }}
            >
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
          </div>
        )}
      </div>
    </div>
  );
}
