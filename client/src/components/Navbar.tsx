import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import logoUrl from "@assets/web_logo_1760523001836.webp";
import logoLightUrl from "@assets/chiaro1_1760538494784.webp";

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOnHero, setIsOnHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setIsOnHero(window.scrollY < window.innerHeight - 100);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLandingPage = location === "/";

  const navLinks = [
    { href: "/corsi", label: "Corsi" },
    { href: "/surf-camp", label: "Surf Camp" },
    { href: "/community", label: "Community" },
    ...(isAuthenticated ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  const transparentNav = isLandingPage && isOnHero && !isScrolled;
  const currentLogo = transparentNav ? logoLightUrl : logoUrl;
  const textColor = transparentNav ? "text-white" : "text-foreground";
  const textColorMuted = transparentNav ? "text-white/80" : "text-foreground/80";

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      transparentNav 
        ? "border-b-0 bg-transparent" 
        : "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between py-2">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1 -ml-2" 
            data-testid="link-home"
          >
            <img src={currentLogo} alt="Scuola di Longboard" className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover-elevate active-elevate-2 ${
                  location === link.href
                    ? transparentNav ? "text-white" : "text-primary"
                    : transparentNav ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"
                }`}
                data-testid={`link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
              className={transparentNav ? "text-white hover:bg-white/10" : ""}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild className={transparentNav ? "text-white hover:bg-white/10" : ""}>
                  <Link href="/dashboard">
                    <span className="flex items-center gap-2" data-testid="button-profile">
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.firstName || "User"} 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span>{user?.firstName || "Profilo"}</span>
                    </span>
                  </Link>
                </Button>
                <Button 
                  variant={transparentNav ? "outline" : "outline"} 
                  size="sm" 
                  asChild 
                  className={transparentNav ? "text-white border-white/40 hover:bg-white/10" : ""}
                >
                  <a href="/api/logout" data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </a>
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                asChild 
                className={transparentNav ? "bg-white text-primary hover:bg-white/90" : ""}
              >
                <a href="/api/login" data-testid="button-login">
                  Accedi
                </a>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle-mobile"
              className={transparentNav ? "text-white hover:bg-white/10" : ""}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              className={transparentNav ? "text-white hover:bg-white/10" : ""}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4" data-testid="mobile-menu">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-3 py-2 text-base font-medium rounded-md transition-colors hover-elevate active-elevate-2 ${
                    location === link.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground/80"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="px-3 py-2 text-base font-medium rounded-md text-foreground/80 hover-elevate active-elevate-2 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-button-profile"
                  >
                    <User className="h-4 w-4" />
                    <span>Profilo</span>
                  </Link>
                  <a
                    href="/api/logout"
                    className="px-3 py-2 text-base font-medium rounded-md text-foreground/80 hover-elevate active-elevate-2 flex items-center gap-2"
                    data-testid="mobile-button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Esci</span>
                  </a>
                </>
              ) : (
                <a
                  href="/api/login"
                  className="px-3 py-2 text-base font-medium rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2"
                  data-testid="mobile-button-login"
                >
                  Accedi
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
