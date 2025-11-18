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
import CourseInfo from "@/pages/CourseInfo";
import CoursePlayer from "@/pages/CoursePlayer";
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import Clinic from "@/pages/Clinic";
import ClinicDetail from "@/pages/ClinicDetail";
import DynamicPage from "@/pages/DynamicPage";
import LocalAuth from "@/pages/LocalAuth";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminHeroSlider from "@/pages/admin/HeroSlider";
import AdminPageHeaders from "@/pages/admin/PageHeaders";
import AdminCustomPages from "@/pages/admin/CustomPages";
import CustomPageEditor from "@/pages/admin/CustomPageEditor";
import AdminCourses from "@/pages/admin/Courses";
import AdminCourseContent from "@/pages/admin/CourseContent";
import AdminClinics from "@/pages/admin/Clinics";
import AdminIscrizioni from "@/pages/admin/Iscrizioni";
import AdminNewsletter from "@/pages/admin/Newsletter";
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
          <Route path="/admin/page-headers">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminPageHeaders />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/pages">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminCustomPages />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/pages/new">
            {user?.isAdmin ? (
              <AdminLayout>
                <CustomPageEditor />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/pages/:id/edit">
            {user?.isAdmin ? (
              <AdminLayout>
                <CustomPageEditor />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/clinic">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminClinics />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/corsi">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminCourses />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/corsi/contenuti">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminCourseContent />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/iscrizioni">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminIscrizioni />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/newsletter">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminNewsletter />
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
          <Route path="/corsi/:id/player" component={CoursePlayer} />
          <Route path="/corsi/:id" component={CourseInfo} />
          <Route path="/clinic" component={Clinic} />
          <Route path="/clinic/:id" component={ClinicDetail} />
          <Route path="/community" component={Community} />
          
          {/* Auth routes */}
          <Route path="/login" component={LocalAuth} />
          <Route path="/register" component={LocalAuth} />
          
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
