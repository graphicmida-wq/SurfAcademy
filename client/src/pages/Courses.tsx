import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { usePageHeader } from "@/hooks/usePageHeader";
import type { Course } from "@shared/schema";

export default function Courses() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const initialCategory = params.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: pageHeader } = usePageHeader('courses');

  const filteredCourses = courses?.filter((course) => {
    const matchesCategory = selectedCategory === "all" || course.courseCategory === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Catalogo Corsi"}
        subtitle={pageHeader?.subtitle || "Scopri i nostri corsi di surf e longboard. Trova il percorso perfetto per te."}
        paddingTop={pageHeader?.paddingTop || undefined}
        paddingBottom={pageHeader?.paddingBottom || undefined}
        minHeight={pageHeader?.minHeight || undefined}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-20 h-fit" data-testid="section-filters">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="font-display font-semibold text-xl">Filtri</h2>
              </div>

              {/* Search */}
              <div className="mb-6">
                <Label htmlFor="search" className="mb-2 block">
                  Cerca
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cerca corsi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-courses"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <Label className="mb-3 block">Categoria Corso</Label>
                <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="category-all" data-testid="radio-category-all" />
                      <Label htmlFor="category-all" className="cursor-pointer font-normal">
                        Tutti i corsi
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="remata" id="category-remata" data-testid="radio-category-remata" />
                      <Label htmlFor="category-remata" className="cursor-pointer font-normal">
                        REMATA
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="takeoff" id="category-takeoff" data-testid="radio-category-takeoff" />
                      <Label htmlFor="category-takeoff" className="cursor-pointer font-normal">
                        TAKEOFF
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="noseride" id="category-noseride" data-testid="radio-category-noseride" />
                      <Label htmlFor="category-noseride" className="cursor-pointer font-normal">
                        NOSERIDE
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gratuiti" id="category-gratuiti" data-testid="radio-category-gratuiti" />
                      <Label htmlFor="category-gratuiti" className="cursor-pointer font-normal">
                        Contenuti Gratuiti
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="special" id="category-special" data-testid="radio-category-special" />
                      <Label htmlFor="category-special" className="cursor-pointer font-normal">
                        Special
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </Card>
          </aside>

          {/* Courses Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-96 animate-pulse bg-muted" />
                ))}
              </div>
            ) : filteredCourses && filteredCourses.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground" data-testid="text-courses-count">
                    {filteredCourses.length} {filteredCourses.length === 1 ? "corso" : "corsi"} {selectedCategory !== "all" ? `in ${selectedCategory.toUpperCase()}` : "disponibili"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="grid-courses">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-xl mb-2">Nessun corso trovato</h3>
                  <p className="text-muted-foreground mb-4">
                    Prova a modificare i filtri o la ricerca
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    data-testid="button-reset-filters"
                  >
                    Resetta Filtri
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
