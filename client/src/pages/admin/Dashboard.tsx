import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sliders, Waves, BookOpen, Mail, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const quickLinks = [
    { title: "Hero Slider", icon: Sliders, href: "/admin/slider", description: "Gestisci le slide della homepage" },
    { title: "Surf Camp", icon: Waves, href: "/admin/surf-camp", description: "Gestione surf camp" },
    { title: "Corsi", icon: BookOpen, href: "/admin/corsi", description: "Gestione corsi" },
    { title: "Newsletter", icon: Mail, href: "/admin/newsletter", description: "Gestione newsletter" },
    { title: "Eventi", icon: Calendar, href: "/admin/eventi", description: "Gestione eventi" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-muted-foreground">Benvenuto nel pannello di amministrazione</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover-elevate active-elevate-2 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <link.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
