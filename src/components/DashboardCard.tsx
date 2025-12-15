import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  description,
  icon,
  children,
  className,
}: DashboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm mt-2">{description}</p>
        )}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
