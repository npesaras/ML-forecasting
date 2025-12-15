import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  className?: string;
}

export function StatsCard({ label, value, icon, className }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="text-3xl text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
