import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play } from "lucide-react";
import type { Course } from "@shared/schema";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300" data-testid={`card-course-${course.id}`}>
      <Link href={`/corsi/${course.id}`} className="block">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center">
              <Play className="h-16 w-16 text-primary/40" />
            </div>
          )}
          {course.isFree && (
            <Badge className="absolute top-3 left-3 bg-chart-4 text-white border-0">
              Gratis
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-display font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2" data-testid={`text-course-title-${course.id}`}>
            {course.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-course-description-${course.id}`}>
            {course.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration} min</span>
              </div>
            )}
            {course.instructorName && (
              <div className="flex items-center gap-2">
                {course.instructorAvatar && (
                  <img
                    src={course.instructorAvatar}
                    alt={course.instructorName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm">{course.instructorName}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="text-lg font-display font-semibold" data-testid={`text-course-price-${course.id}`}>
            {course.isFree ? "Gratis" : `€${(course.price! / 100).toFixed(2)}`}
          </div>
          <Button size="sm" className="group-hover:scale-105 transition-transform" data-testid={`button-view-course-${course.id}`}>
            Scopri
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
