import { Badge } from "@/components/ui/badge";

export interface ItemPendente {
  id: string;
  titulo: string;
  subtitulo?: string;
}

export function ListaPendentes({ itens, vazio }: { itens: ItemPendente[]; vazio: string }) {
  if (!itens.length) {
    return <p className="mt-3 text-sm text-muted-2">{vazio}</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{item.titulo}</p>
            {item.subtitulo && <p className="text-xs text-muted">{item.subtitulo}</p>}
          </div>
          <Badge variant="warning">Pendente</Badge>
        </li>
      ))}
    </ul>
  );
}
