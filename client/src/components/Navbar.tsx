import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Menu, X, User, LogOut, BookOpen, ChevronDown, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import logoUrl from "@assets/web_logo_1760523001836.webp";
import logoLightUrl from "@assets/chiaro1_1760538494784.webp";
import type { Enrollment, Course } from "@shared/schema";

type EnrollmentWithCourse = Enrollment & { course: Course };

const WORDPRESS_URL = "https://scuoladilongboard.it";

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch user's enrolled courses
  const { data: enrollments } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdminPage = location.startsWith("/admin");

  return (
    <>
      {/* WordPress-style Admin Bar */}
      {user?.isAdmin && !isAdminPage && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900 text-white flex items-center px-4 text-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(2rem + env(safe-area-inset-top, 0px))' }}>
          <a 
            href="/admin" 
            className="hover:bg-gray-800 px-3 py-1 rounded transition-colors"
            data-testid="link-admin-bar"
          >
            Dashboard Admin
          </a>
        </div>
      )}
      
      <nav className={`fixed ${user?.isAdmin && !isAdminPage ? '' : 'top-0'} z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? 'border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' 
          : 'bg-transparent border-b border-transparent'
      }`} style={{ 
        paddingTop: user?.isAdmin && !isAdminPage ? undefined : 'env(safe-area-inset-top, 0px)',
        top: user?.isAdmin && !isAdminPage ? 'calc(2rem + env(safe-area-inset-top, 0px))' : undefined,
      }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-28 items-center justify-between py-2">
          {/* Logo - links to Welcome page */}
          <a 
            href="/"
            className="flex items-center space-x-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1 -ml-2" 
            data-testid="link-home"
          >
            <img src={(!isScrolled || theme === 'dark') ? logoLightUrl : logoUrl} alt="Scuola di Longboard" className="h-24 w-auto transition-opacity duration-300" />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {/* Dashboard */}
            {isAuthenticated && (
              <Link 
                href="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover-elevate active-elevate-2 ${
                  !isScrolled ? "text-white/90 hover:text-white" : location === "/dashboard" ? "text-primary" : "text-foreground/80 hover:text-foreground"
                }`}
                data-testid="link-dashboard"
              >
                Dashboard
              </Link>
            )}

            {/* Guida App */}
            {isAuthenticated && (
              <Link 
                href="/guida-app"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover-elevate active-elevate-2 flex items-center gap-1 ${
                  !isScrolled ? "text-white/90 hover:text-white" : location === "/guida-app" ? "text-primary" : "text-foreground/80 hover:text-foreground"
                }`}
                data-testid="link-guida-app"
              >
                <HelpCircle className="h-4 w-4" />
                Guida App
              </Link>
            )}

            {/* I Miei Corsi Dropdown */}
            {isAuthenticated && enrollments && enrollments.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`px-3 py-2 text-sm font-medium ${isScrolled ? 'text-foreground/80 hover:text-foreground' : 'text-white/90 hover:text-white'}`}
                    data-testid="dropdown-my-courses"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    I Miei Corsi
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {enrollments.map((enrollment) => (
                    <DropdownMenuItem key={enrollment.id} asChild>
                      <Link 
                        href={`/corsi/${enrollment.course.id}/player`}
                        className="cursor-pointer"
                        data-testid={`link-course-${enrollment.course.id}`}
                      >
                        {enrollment.course.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Desktop Actions */}
          <div className={`hidden md:flex md:items-center md:space-x-2 ${!isScrolled ? 'text-white' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              className={!isScrolled ? 'text-white/90 hover:text-white' : ''}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" className={!isScrolled ? 'text-white/90 hover:text-white' : ''} asChild>
                  <a href={`${WORDPRESS_URL}/my-account`} target="_blank" rel="noopener noreferrer">
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
                      <span>Ciao {user?.firstName || "Utente"}</span>
                    </span>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={!isScrolled ? 'border-white/50 text-white hover:text-white' : ''}
                  asChild 
                >
                  <a href="/api/logout" data-testid="button-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    Esci
                  </a>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login" data-testid="button-login">
                  Accedi
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && user && (
              <a 
                href={`${WORDPRESS_URL}/my-account`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm font-medium truncate max-w-[140px] ${isScrolled ? 'text-foreground/80' : 'text-white/90'}`}
                data-testid="mobile-greeting"
              >
                Ciao {user.firstName || "Utente"}
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={!isScrolled ? 'text-white/90 hover:text-white' : ''}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={!isScrolled ? 'text-white/90 hover:text-white' : ''}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-testid="mobile-menu">
            <div className="flex flex-col space-y-2">
              {/* Dashboard */}
              {isAuthenticated && (
                <Link 
                  href="/dashboard"
                  className={`px-3 py-2 text-base font-medium rounded-md transition-colors hover-elevate active-elevate-2 ${
                    location === "/dashboard" ? "text-primary bg-primary/10" : "text-foreground/80"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-link-dashboard"
                >
                  Dashboard
                </Link>
              )}

              {/* Guida App - Mobile */}
              {isAuthenticated && (
                <Link 
                  href="/guida-app"
                  className={`px-3 py-2 text-base font-medium rounded-md transition-colors hover-elevate active-elevate-2 flex items-center gap-2 ${
                    location === "/guida-app" ? "text-primary bg-primary/10" : "text-foreground/80"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-link-guida-app"
                >
                  <HelpCircle className="h-4 w-4" />
                  Guida App
                </Link>
              )}

              {/* I Miei Corsi - Mobile */}
              {isAuthenticated && enrollments && enrollments.length > 0 && (
                <>
                  <div className="px-3 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    I Miei Corsi
                  </div>
                  {enrollments.map((enrollment) => (
                    <Link 
                      key={enrollment.id}
                      href={`/corsi/${enrollment.course.id}/player`}
                      className="px-6 py-2 text-base font-medium rounded-md transition-colors hover-elevate active-elevate-2 text-foreground/80"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`mobile-link-course-${enrollment.course.id}`}
                    >
                      {enrollment.course.title}
                    </Link>
                  ))}
                </>
              )}

              {isAuthenticated ? (
                <>
                  <a 
                    href={`${WORDPRESS_URL}/my-account`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-base font-medium rounded-md text-foreground/80 hover-elevate active-elevate-2 flex items-center gap-2"
                    data-testid="mobile-button-profile"
                  >
                    <User className="h-4 w-4" />
                    <span>Profilo</span>
                  </a>
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
                <Link
                  href="/login"
                  className="px-3 py-2 text-base font-medium rounded-md bg-primary text-primary-foreground hover-elevate active-elevate-2"
                  data-testid="mobile-button-login"
                >
                  Accedi
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
