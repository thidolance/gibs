import { ChevronDown } from "lucide-react";

export function PassoNumero({ numero }: { numero: number }) {
  return (
    <span className="inline-flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-blue text-[11px] font-extrabold text-white">
      {numero}
    </span>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-border-2 bg-surface-2 p-5 text-center text-sm text-muted">
      {texto}
    </div>
  );
}

export function BotaoMostrarMais({ quantidade, onClick }: { quantidade: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-surface-2 px-3.5 py-2.5 text-xs font-bold tracking-wide text-muted transition-colors hover:border-blue-3 hover:bg-blue-light hover:text-blue"
    >
      <ChevronDown className="size-3.5" />
      Mostrar mais ({quantidade})
    </button>
  );
}
