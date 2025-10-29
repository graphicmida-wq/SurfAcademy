import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Sliders, Waves, BookOpen, Mail, Calendar, LayoutDashboard, FileText, FilePlus2, User, Users } from "lucide-react";
import logoUrl from "@assets/web_logo_1760523001836.webp";
import logoLightUrl from "@assets/chiaro1_1760538494784.webp";

const adminMenuItems = [
  {
    title: "Dashboard Admin",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Dashboard Utente",
    url: "/dashboard",
    icon: User,
  },
  {
    title: "Iscrizioni",
    url: "/admin/iscrizioni",
    icon: Users,
  },
  {
    title: "Hero Slider",
    url: "/admin/slider",
    icon: Sliders,
  },
  {
    title: "Intestazioni Pagine",
    url: "/admin/page-headers",
    icon: FileText,
  },
  {
    title: "Pagine Custom",
    url: "/admin/pages",
    icon: FilePlus2,
  },
  {
    title: "Gestione Surf Camp",
    url: "/admin/surf-camp",
    icon: Waves,
  },
  {
    title: "Gestione Corsi",
    url: "/admin/corsi",
    icon: BookOpen,
  },
  {
    title: "Newsletter",
    url: "/admin/newsletter",
    icon: Mail,
  },
  {
    title: "Gestione Eventi",
    url: "/admin/eventi",
    icon: Calendar,
  },
];

export function AppAdminSidebar() {
  const [location] = useLocation();
  const { theme } = useTheme();
  const currentLogo = theme === "light" ? logoUrl : logoLightUrl;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="p-4 border-b">
          <Link href="/" className="flex items-center justify-center" data-testid="link-admin-logo">
            <img src={currentLogo} alt="Scuola di Longboard" className="h-28 w-auto" />
          </Link>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Gestione Portale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`admin-menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppAdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-40 h-14">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
              <h2 className="text-sm font-semibold">Admin Dashboard</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Link href="/">
                <span className="text-sm text-primary hover:underline cursor-pointer ml-4">
                  Torna al sito
                </span>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
