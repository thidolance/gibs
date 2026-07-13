import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  titulo: string;
  valor: string;
  legenda: string;
  variante?: "primary" | "success" | "warning" | "blue" | "danger";
  progresso?: number;
  icone?: ReactNode;
}

const BORDA: Record<NonNullable<MetricCardProps["variante"]>, string> = {
  primary: "border-l-accent",
  success: "border-l-success",
  warning: "border-l-warning",
  blue: "border-l-blue-3",
  danger: "border-l-danger",
};

const ICONE: Record<NonNullable<MetricCardProps["variante"]>, string> = {
  primary: "bg-gold/15 text-gold-dark",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  blue: "bg-blue-light text-blue",
  danger: "bg-red-light text-red",
};

export function MetricCard({ titulo, valor, legenda, variante = "primary", progresso, icone }: MetricCardProps) {
  return (
    <Card className={cn("flex min-h-[106px] flex-col justify-between gap-0.5 border-l-[3.5px] p-4", BORDA[variante])}>
      <div className="flex items-start justify-between gap-2">
        <span className="block text-[10.5px] font-bold uppercase tracking-wider text-muted">{titulo}</span>
        {icone && (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4", ICONE[variante])}>
            {icone}
          </span>
        )}
      </div>
      <strong className="text-[25px] font-extrabold leading-tight text-blue">{valor}</strong>
      <small className="block text-xs text-muted-2">{legenda}</small>
      {progresso !== undefined && <Progress value={progresso} />}
    </Card>
  );
}
