import { useEffect } from "react";
import { HeroSlider } from "@/components/HeroSlider";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="flex flex-col">
      {/* Dynamic Hero Slider */}
      <HeroSlider />
    </div>
  );
}
