"use client";

import { useEffect } from "react";
import { Crown, Flame, TrendingDown, Trophy, X } from "lucide-react";
import type { LinhaRanking, PartidaJogador } from "@/lib/calculos";
import { type Posicao } from "@/lib/types";
import { cn, dataBR } from "@/lib/utils";

const POS_ABREV: Record<Posicao, string> = { defensor: "DEF", meio: "MEI", atacante: "ATA" };
const POS_COR: Record<Posicao, string> = {
  defensor: "bg-blue-3/25 text-blue-light",
  meio: "bg-[#22c55e]/25 text-[#4ade80]",
  atacante: "bg-red/30 text-red-light",
};

const RESULTADO = {
  vitoria: { letra: "V", rotulo: "Vitória", classe: "bg-[#16a34a] text-white", suave: "bg-[#16a34a]/20 text-[#4ade80]" },
  derrota: { letra: "D", rotulo: "Derrota", classe: "bg-red text-white", suave: "bg-red/20 text-red-light" },
  empate: { letra: "E", rotulo: "Empate", classe: "bg-white/25 text-white", suave: "bg-white/10 text-white/70" },
} as const;

interface JogadorModalProps {
  linha: LinhaRanking;
  partidas: PartidaJogador[];
  onClose: () => void;
}

/** Tile compacto de estatística (número em destaque + rótulo). */
function Stat({ valor, rotulo, cor }: { valor: number | string; rotulo: string; cor?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.06] px-2 py-2.5">
      <span className={cn("text-xl font-extrabold leading-none", cor ?? "text-white")}>{valor}</span>
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/45">{rotulo}</span>
    </div>
  );
}

/**
 * Modal com o cartão do jogador: nota, resumo (J/V/D/E), sequência atual,
 * forma recente e a lista das últimas partidas. Mesmo tema escuro do placar.
 */
export function JogadorModal({ linha, partidas, onClose }: JogadorModalProps) {
  const { jogador, stats } = linha;

  // Fecha no Esc e trava o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  const aproveitamento = stats.jogos
    ? Math.round(((stats.vitorias * 3 + stats.empates) / (stats.jogos * 3)) * 100)
    : 0;
  const formaRecente = partidas.slice(0, 10);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-200 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Ficha de ${jogador.nome}`}
    >
      <div
        className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(12,20,46,.98),rgba(6,12,30,.98))] text-white shadow-[0_30px_70px_-20px_rgba(0,0,0,.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de topo em gradiente, igual ao placar */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#3b82f6,#9333ea_50%,#ff2e2e)]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>

        {/* Cabeçalho: posição no ranking, nome e nota */}
        <div className="flex items-start gap-3 border-b border-white/10 p-5 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#fbbf24,#d97706)] text-lg font-extrabold text-[#3a2500] shadow-[0_4px_12px_-3px_rgba(245,158,11,.6)]">
            {linha.posicaoAtual}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold">Gibs FC · Ficha</div>
            <h2 className="flex items-center gap-1.5 text-xl font-extrabold uppercase leading-tight tracking-tight">
              <span className="truncate">{jogador.nome}</span>
              {linha.titulos > 0 && (
                <Crown className="size-4 shrink-0 fill-gold text-gold drop-shadow-[0_0_6px_rgba(245,158,11,.6)]" />
              )}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {jogador.posicao && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider",
                    POS_COR[jogador.posicao],
                  )}
                >
                  {POS_ABREV[jogador.posicao]}
                </span>
              )}
              {linha.titulos > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold">
                  <Trophy className="size-3" /> {linha.titulos}x campeão
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 pr-8 text-right">
            <div className="text-3xl font-extrabold leading-none text-gold drop-shadow-[0_0_12px_rgba(245,158,11,.45)]">
              {stats.nota.toFixed(1)}
            </div>
            <div className="text-[9.5px] font-bold uppercase tracking-wider text-white/45">Nota</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Resumo */}
          <div className="grid grid-cols-4 gap-2">
            <Stat valor={stats.jogos} rotulo="Jogos" />
            <Stat valor={stats.vitorias} rotulo="Vitórias" cor="text-[#4ade80]" />
            <Stat valor={stats.derrotas} rotulo="Derrotas" cor="text-red-light" />
            <Stat valor={stats.empates} rotulo="Empates" />
          </div>

          {/* Sequência atual + aproveitamento */}
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              {stats.sequencia > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#fb923c]">
                  <Flame className="size-4" /> {stats.sequencia} vitória{stats.sequencia > 1 ? "s" : ""} seguida
                  {stats.sequencia > 1 ? "s" : ""}
                </span>
              ) : stats.sequenciaDerrota > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#f87171]">
                  <TrendingDown className="size-4" /> {stats.sequenciaDerrota} derrota
                  {stats.sequenciaDerrota > 1 ? "s" : ""} seguida{stats.sequenciaDerrota > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-sm font-semibold text-white/50">Sem sequência ativa</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-white">{aproveitamento}%</span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-white/45">aprov.</span>
            </div>
          </div>

          {/* Forma recente */}
          {formaRecente.length > 0 && (
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Forma recente (mais recente primeiro)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formaRecente.map((p, i) => (
                  <span
                    key={i}
                    title={`${dataBR(p.data)} · ${RESULTADO[p.resultado].rotulo}`}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-xs font-extrabold",
                      RESULTADO[p.resultado].classe,
                    )}
                  >
                    {RESULTADO[p.resultado].letra}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Últimas partidas */}
          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">Últimas partidas</div>
            {partidas.length === 0 ? (
              <div className="rounded-lg bg-white/[0.04] px-4 py-6 text-center text-sm text-white/40">
                Nenhuma partida registrada ainda.
              </div>
            ) : (
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {partidas.map((p, i) => {
                  const r = RESULTADO[p.resultado];
                  const temPlacar = p.golsPro !== null && p.golsContra !== null;
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-2">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-extrabold",
                          r.suave,
                        )}
                      >
                        {r.letra}
                      </span>
                      <span className="flex flex-1 items-center gap-2">
                        <span
                          className={cn("size-2 shrink-0 rounded-full", p.time === "vermelho" ? "bg-red" : "bg-blue-3")}
                        />
                        <span className="text-[13px] font-semibold text-white/80">
                          Time {p.time === "vermelho" ? "Vermelho" : "Azul"}
                        </span>
                      </span>
                      {temPlacar && (
                        <span className="shrink-0 text-sm font-extrabold tabular-nums text-white">
                          {p.golsPro} <span className="text-white/40">×</span> {p.golsContra}
                        </span>
                      )}
                      <span className="w-12 shrink-0 text-right text-xs font-semibold text-white/45">
                        {dataBR(p.data)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
