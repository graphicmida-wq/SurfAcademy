import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: string;
  className?: string;
}

const levelConfig = {
  beginner: {
    label: "Principiante",
    color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  intermediate: {
    label: "Intermedio",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  advanced: {
    label: "Avanzato",
    color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.beginner;

  return (
    <Badge 
      variant="outline" 
      className={cn("border-2", config.color, className)}
      data-testid={`badge-level-${level}`}
    >
      {config.label}
    </Badge>
  );
}
