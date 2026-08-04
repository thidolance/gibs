import { Crown, Flame, TrendingDown } from "lucide-react";
import { POSICOES, type Posicao } from "@/lib/types";
import { cn, dataBRCompleta } from "@/lib/utils";

const POS_ABREV: Record<Posicao, string> = { defensor: "DEF", meio: "MEI", atacante: "ATA" };
const POS_COR: Record<Posicao, string> = {
  defensor: "bg-blue-3/25 text-blue-3",
  meio: "bg-[#22c55e]/25 text-[#4ade80]",
  atacante: "bg-red/30 text-red-light",
};

export interface JogadorEscalado {
  id: string;
  nome: string;
  numero?: string;
  posicao?: Posicao;
  nota: number;
  sequencia: number;
  sequenciaDerrota: number;
  campeao: boolean;
}

export interface ElencoCardProps {
  cor: "vermelho" | "azul";
  jogadores: JogadorEscalado[];
  data: string;
  numeroRodada: number;
}

const TEMAS = {
  vermelho: {
    label: "Vermelho",
    emoji: "🔴",
    badgeBg: "bg-red",
    gradienteTexto: "linear-gradient(100deg, #ff2e2e, #9333ea 60%, #3b82f6)",
    acentoLinha: "bg-red",
  },
  azul: {
    label: "Azul",
    emoji: "🔵",
    badgeBg: "bg-blue",
    gradienteTexto: "linear-gradient(100deg, #3b82f6, #9333ea 60%, #ff2e2e)",
    acentoLinha: "bg-blue-3",
  },
} as const;

/** Selo de sequência: chama para combo de vitórias, seta pra baixo para combo de derrotas. */
function Sequencia({ seq, seqD }: { seq: number; seqD: number }) {
  if (seq > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[#fb923c]">
        <Flame className="size-3.5" />
        {seq}
      </span>
    );
  if (seqD > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[#f87171]">
        <TrendingDown className="size-3.5" />
        {seqD}
      </span>
    );
  return <span className="text-white/30">—</span>;
}

/**
 * Card de escalação no mesmo estilo "scoreboard" da Classificação/Ranking —
 * pronto para baixar como imagem (via html-to-image) e divulgar no WhatsApp.
 */
export function ElencoCard({ cor, jogadores, data, numeroRodada }: ElencoCardProps) {
  const tema = TEMAS[cor];

  return (
    <div className="w-full overflow-hidden rounded-xl bg-[linear-gradient(165deg,#0a1730_0%,#0e2258_55%,#0a1730_100%)] p-5 text-white shadow-[0_18px_40px_-12px_rgba(10,23,48,.6)]">
      {/* Cabeçalho estilo scoreboard */}
      <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
            Gibs FC · {numeroRodada}ª Rodada
          </div>
          <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight">
            {tema.emoji} Time
            <span
              className="ml-2"
              style={{
                background: tema.gradienteTexto,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {tema.label}
            </span>
          </h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm",
            tema.badgeBg,
          )}
        >
          {jogadores.length} escalados
        </span>
      </div>

      {/* Cabeçalho das colunas */}
      <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
        <span className="w-7 shrink-0 text-center">#</span>
        <span className="flex-1">Jogador</span>
        <span className="w-12 text-right text-gold">Nota</span>
        <span className="w-12 text-right">Seq</span>
      </div>

      {/* Linhas */}
      <div className="flex flex-col gap-1">
        {jogadores.map((j, i) => (
          <div key={j.id} className={cn("flex items-center gap-3 rounded-md py-2 pr-2 pl-0", "bg-white/[0.05]")}>
            <span className={cn("h-7 w-1 shrink-0 rounded-full", tema.acentoLinha)} />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-extrabold text-white/80">
              {j.numero || i + 1}
            </span>
            <span className="flex flex-1 items-center gap-1.5 truncate">
              <span className="truncate text-[15px] font-bold uppercase tracking-tight">{j.nome}</span>
              {j.campeao && (
                <Crown className="size-3.5 shrink-0 fill-gold text-gold drop-shadow-[0_0_6px_rgba(245,158,11,.6)]" />
              )}
              {j.posicao && (
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider", POS_COR[j.posicao])}>
                  {POS_ABREV[j.posicao]}
                </span>
              )}
            </span>
            <span className="w-12 text-right text-lg font-extrabold text-gold">{j.nota.toFixed(1)}</span>
            <span className="flex w-12 justify-end text-sm font-semibold">
              <Sequencia seq={j.sequencia} seqD={j.sequenciaDerrota} />
            </span>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
        {POSICOES.map((p) => (
          <span key={p.valor} className="flex items-center gap-1.5">
            <span className={cn("rounded px-1.5 py-0.5 text-[9px]", POS_COR[p.valor])}>{p.abrev}</span>
            {p.rotulo}
          </span>
        ))}
        <span className="ml-auto normal-case tracking-normal text-white/35">{dataBRCompleta(data)} · Gibs FC</span>
      </div>
    </div>
  );
}
