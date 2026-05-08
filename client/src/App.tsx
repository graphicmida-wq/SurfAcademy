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
import CoursePlayer from "@/pages/CoursePlayer";
import Dashboard from "@/pages/Dashboard";
import DynamicPage from "@/pages/DynamicPage";
import LocalAuth from "@/pages/LocalAuth";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminPageHeaders from "@/pages/admin/PageHeaders";
import AdminCustomPages from "@/pages/admin/CustomPages";
import CustomPageEditor from "@/pages/admin/CustomPageEditor";
import AdminCourses from "@/pages/admin/Courses";
import AdminCourseContent from "@/pages/admin/CourseContent";
import AdminIscrizioni from "@/pages/admin/Iscrizioni";
import AdminWebhookManager from "@/pages/admin/WebhookManager";
import AdminGuideApp from "@/pages/admin/GuideApp";
import AdminMasterclass from "@/pages/admin/Masterclass";
import GuidaApp from "@/pages/GuidaApp";
import MasterclassPage from "@/pages/Masterclass";
import NotFound from "@/pages/not-found";
import WelcomePage from "@/pages/WelcomePage";
import { AdminLayout } from "@/components/AdminLayout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const hasAdminBar = user?.isAdmin && !isAdminPage;

  // Loading state - show spinner first (must be before admin/auth checks)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Non-authenticated users go always to login (even for /admin)
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Switch>
            <Route path="/login" component={LocalAuth} />
            <Route path="/sso" component={LocalAuth} />
            <Route>
              <LocalAuth />
            </Route>
          </Switch>
        </main>
      </div>
    );
  }

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
          <Route path="/admin/corsi">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminCourses />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/masterclass">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminMasterclass />
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
          <Route path="/admin/webhook">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminWebhookManager />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route path="/admin/guida-app">
            {user?.isAdmin ? (
              <AdminLayout>
                <AdminGuideApp />
              </AdminLayout>
            ) : <NotFound />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }


  // Welcome page - full screen, no navbar/footer
  if (location === "/") {
    return <WelcomePage />;
  }

  // Authenticated users
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${hasAdminBar ? 'pt-8' : ''}`}>
        <Switch>
          {/* Protected routes - more specific first */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/masterclass" component={MasterclassPage} />
          <Route path="/corsi/:id/player" component={CoursePlayer} />
          <Route path="/guida-app" component={GuidaApp} />
          
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
