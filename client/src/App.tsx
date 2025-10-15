import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Pages
import Landing from "@/pages/Landing";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import SurfCamp from "@/pages/SurfCamp";
import DynamicPage from "@/pages/DynamicPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminHeroSlider from "@/pages/admin/HeroSlider";
import NotFound from "@/pages/not-found";
import { AdminLayout } from "@/components/AdminLayout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const hasAdminBar = user?.isAdmin && !isAdminPage;

  // Admin pages have their own layout, don't render navbar/footer
  if (isAdminPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Switch>
          <Route path="/admin">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/slider">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminHeroSlider />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/surf-camp">
            {user?.isAdmin ? (
              <AdminLayout>
                <div className="py-20 text-center text-muted-foreground">
                  Gestione Surf Camp - In sviluppo
                </div>
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/corsi">
            {user?.isAdmin ? (
              <AdminLayout>
                <div className="py-20 text-center text-muted-foreground">
                  Gestione Corsi - In sviluppo
                </div>
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/newsletter">
            {user?.isAdmin ? (
              <AdminLayout>
                <div className="py-20 text-center text-muted-foreground">
                  Newsletter - In sviluppo
                </div>
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/eventi">
            {user?.isAdmin ? (
              <AdminLayout>
                <div className="py-20 text-center text-muted-foreground">
                  Gestione Eventi - In sviluppo
                </div>
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${hasAdminBar ? 'pt-8' : ''}`}>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Landing} />
          <Route path="/corsi" component={Courses} />
          <Route path="/corsi/:id" component={CourseDetail} />
          <Route path="/surf-camp" component={SurfCamp} />
          <Route path="/community" component={Community} />
          
          {/* Protected routes */}
          <Route path="/dashboard" component={Dashboard} />
          
          {/* Dynamic custom pages */}
          <Route path="/p/:slug" component={DynamicPage} />
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
