import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass: string;
}

export function StatCard({ value, label, icon, trend, colorClass }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
            {trend && (
              <p className="text-xs text-success font-medium">{trend}</p>
            )}
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", colorClass)}>
            {icon}
          </div>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300", colorClass)} />
    </Card>
  );
}
