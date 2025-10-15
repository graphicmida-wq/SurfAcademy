import { Switch, Route } from "wouter";
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
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={Landing} />
          <Route path="/corsi" component={Courses} />
          <Route path="/corsi/:id" component={CourseDetail} />
          <Route path="/surf-camp" component={SurfCamp} />
          <Route path="/community" component={Community} />
          
          {/* Protected routes */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={Admin} />
          
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
