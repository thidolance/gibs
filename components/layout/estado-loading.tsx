import { Loader2 } from "lucide-react";

export function EstadoLoading() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">Carregando dados do Firebase...</p>
    </div>
  );
}
