import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CourseCard } from "@/components/CourseCard";
import { LevelBadge } from "@/components/LevelBadge";
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
  const initialLevel = params.get("level") || "all";

  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: pageHeader } = usePageHeader('courses');

  const filteredCourses = courses?.filter((course) => {
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    const matchesFree = !showFreeOnly || course.isFree;
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesFree && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <PageHeader 
        imageUrl={pageHeader?.imageUrl || undefined}
        title={pageHeader?.title || "Catalogo Corsi"}
        subtitle={pageHeader?.subtitle || "Scopri i nostri corsi di surf e longboard. Trova il percorso perfetto per il tuo livello."}
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

              {/* Level Filter */}
              <div className="mb-6">
                <Label className="mb-3 block">Livello</Label>
                <RadioGroup value={selectedLevel} onValueChange={setSelectedLevel}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="level-all" data-testid="radio-level-all" />
                      <Label htmlFor="level-all" className="cursor-pointer font-normal">
                        Tutti i livelli
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="beginner" id="level-beginner" data-testid="radio-level-beginner" />
                      <Label htmlFor="level-beginner" className="cursor-pointer font-normal">
                        Principiante
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="level-intermediate" data-testid="radio-level-intermediate" />
                      <Label htmlFor="level-intermediate" className="cursor-pointer font-normal">
                        Intermedio
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="level-advanced" data-testid="radio-level-advanced" />
                      <Label htmlFor="level-advanced" className="cursor-pointer font-normal">
                        Avanzato
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Free Only */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="free-only"
                  checked={showFreeOnly}
                  onChange={(e) => setShowFreeOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                  data-testid="checkbox-free-only"
                />
                <Label htmlFor="free-only" className="cursor-pointer font-normal">
                  Solo corsi gratuiti
                </Label>
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
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground" data-testid="text-courses-count">
                    {filteredCourses.length} {filteredCourses.length === 1 ? "corso" : "corsi"} trovati
                  </p>
                  {selectedLevel !== "all" && (
                    <LevelBadge level={selectedLevel} />
                  )}
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
                      setSelectedLevel("all");
                      setShowFreeOnly(false);
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
