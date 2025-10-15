import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { HeroSlide } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logoUrl from "@assets/web_logo_1760523001836.webp";
import surferImageUrl from "@assets/535999700_1280076383904390_8637028697374410736_n_1760535684158.jpg";

// Map database URLs to imported assets
const assetMap: Record<string, string> = {
  "@assets/535999700_1280076383904390_8637028697374410736_n_1760535684158.jpg": surferImageUrl,
};

export function HeroSlider() {
  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 30 },
    [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (isLoading || slides.length === 0) {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-chart-2/10 to-primary/30" data-testid="section-hero-loading">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={logoUrl} 
            alt="Scuola di Longboard" 
            className="mx-auto mb-8 h-32 sm:h-40 md:h-48 w-auto"
            data-testid="img-logo-loading"
          />
          <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Scuola di Longboard
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            La prima vera scuola di SURF in Italia dedicata al LONGBOARD
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden" data-testid="section-hero-slider">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide) => (
            <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0 relative" data-testid={`slide-${slide.id}`}>
              {/* Background Media */}
              <div className="absolute inset-0">
                {slide.type === "image" ? (
                  <img
                    src={assetMap[slide.mediaUrl] || slide.mediaUrl}
                    alt={slide.title || "Hero slide"}
                    className="w-full h-full object-cover"
                    data-testid={`slide-image-${slide.id}`}
                  />
                ) : (
                  <video
                    src={assetMap[slide.mediaUrl] || slide.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid={`slide-video-${slide.id}`}
                  />
                )}
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-black/30 to-primary/60" />

              {/* Content */}
              <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-screen flex items-center justify-center">
                <div className="text-center max-w-4xl">
                  <img 
                    src={logoUrl} 
                    alt="Scuola di Longboard" 
                    className="mx-auto mb-8 h-24 sm:h-32 md:h-40 w-auto drop-shadow-2xl"
                    data-testid={`img-logo-${slide.id}`}
                  />
                  
                  {slide.title && (
                    <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 drop-shadow-lg" data-testid={`slide-title-${slide.id}`}>
                      {slide.title}
                    </h1>
                  )}
                  
                  {slide.subtitle && (
                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md" data-testid={`slide-subtitle-${slide.id}`}>
                      {slide.subtitle}
                    </p>
                  )}
                  
                  {slide.ctaText && slide.ctaLink && (
                    <Button 
                      size="lg" 
                      variant="default" 
                      asChild 
                      className="bg-chart-3 hover:bg-chart-3/90 text-white border-0 text-lg px-8 py-6 rounded-full shadow-2xl"
                      data-testid={`slide-cta-${slide.id}`}
                    >
                      <Link href={slide.ctaLink}>
                        {slide.ctaText}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all"
            data-testid="button-prev-slide"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all"
            data-testid="button-next-slide"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2" data-testid="dots-navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === selectedIndex
                  ? "bg-white w-8"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              data-testid={`dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
        <div className="w-6 h-10 rounded-full border-2 border-white/60 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}
