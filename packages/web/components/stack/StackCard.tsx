"use client";
import { TechStack } from "@/context/StackContext";
import { Card, CardContent } from "@/components/ui/card";

export const StackCard: React.FC<{ stack: TechStack }> = ({ stack }) => (
  <Card className="rounded-2xl hover:shadow-lg transition-shadow">
    <CardContent className="p-4 flex items-center gap-4">
      {stack.icon ?? null}
      <div>
        <p className="font-medium">{stack.name}</p>
        <p className="text-sm text-muted-foreground">{stack.type}</p>
      </div>
    </CardContent>
  </Card>
);
