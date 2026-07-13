import { dinheiro } from "@/lib/utils";

export interface ItemLegenda {
  nome: string;
  valor: number;
  cor: string;
}

/** Legenda em HTML (cor + nome + valor + percentual) usada ao lado de gráficos de pizza/donut. */
export function LegendaGrafico({ itens }: { itens: ItemLegenda[] }) {
  const total = itens.reduce((s, item) => s + item.valor, 0);

  return (
    <div className="flex w-full flex-col gap-2">
      {itens.map((item) => (
        <div
          key={item.nome}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-3 shrink-0 rounded-full shadow-sm" style={{ background: item.cor }} />
            <span className="truncate text-[13px] font-semibold text-text">{item.nome}</span>
          </div>
          <div className="shrink-0 text-right">
            <strong className="block text-sm text-blue">{dinheiro(item.valor)}</strong>
            <small className="text-xs font-medium text-muted">{total ? Math.round((item.valor / total) * 100) : 0}%</small>
          </div>
        </div>
      ))}
    </div>
  );
}
