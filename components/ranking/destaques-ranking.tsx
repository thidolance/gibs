"use client";

import type { ReactNode } from "react";
import {
  CalendarCheck,
  Crown,
  Flame,
  Percent,
  Star,
  Swords,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LinhaRanking } from "@/lib/calculos";
import { cn } from "@/lib/utils";

interface Destaque {
  chave: string;
  icone: ReactNode;
  rotulo: string;
  jogador: string;
  valor: string;
  legenda: string;
  /** Classe do chip do ícone e da cor do valor. */
  cor: string;
  fundo: string;
}

/** Aproveitamento em % (vitória vale 3, empate 1, sobre o total possível). */
function aproveitamento(l: LinhaRanking): number {
  const { vitorias, empates, jogos } = l.stats;
  return jogos ? Math.round(((vitorias * 3 + empates) / (jogos * 3)) * 100) : 0;
}

/** Escolhe o líder por um critério; retorna null se ninguém pontua no critério. */
function topPor(
  ranking: LinhaRanking[],
  valor: (l: LinhaRanking) => number,
  minimo = 1,
): LinhaRanking | null {
  const melhor = [...ranking].sort((a, b) => valor(b) - valor(a))[0];
  return melhor && valor(melhor) >= minimo ? melhor : null;
}

/**
 * Resumo dinâmico do ranking: cartões de destaque que só aparecem quando há dado
 * relevante (melhor nota, sequências, quem subiu, aproveitamento, títulos etc.).
 */
export function DestaquesRanking({ ranking }: { ranking: LinhaRanking[] }) {
  const comJogos = ranking.filter((l) => l.stats.jogos > 0);
  if (comJogos.length === 0) return null;

  const destaques: Destaque[] = [];

  const melhorNota = ranking[0];
  if (melhorNota) {
    destaques.push({
      chave: "nota",
      icone: <Star className="size-4" />,
      rotulo: "Melhor nota",
      jogador: melhorNota.jogador.nome,
      valor: melhorNota.stats.nota.toFixed(1),
      legenda: "líder do ranking",
      cor: "text-gold",
      fundo: "from-gold/15 to-transparent",
    });
  }

  const emChamas = topPor(ranking, (l) => l.stats.sequencia, 2);
  if (emChamas) {
    destaques.push({
      chave: "chamas",
      icone: <Flame className="size-4" />,
      rotulo: "Pegando fogo",
      jogador: emChamas.jogador.nome,
      valor: `${emChamas.stats.sequencia}`,
      legenda: "vitórias seguidas",
      cor: "text-warning",
      fundo: "from-warning/15 to-transparent",
    });
  }

  const subiu = topPor(ranking, (l) => l.movimento, 1);
  if (subiu) {
    destaques.push({
      chave: "subiu",
      icone: <TrendingUp className="size-4" />,
      rotulo: "Em ascensão",
      jogador: subiu.jogador.nome,
      valor: `+${subiu.movimento}`,
      legenda: "posições na última rodada",
      cor: "text-success",
      fundo: "from-success/15 to-transparent",
    });
  }

  const aprov = topPor(comJogos, aproveitamento, 1);
  if (aprov) {
    destaques.push({
      chave: "aprov",
      icone: <Percent className="size-4" />,
      rotulo: "Aproveitamento",
      jogador: aprov.jogador.nome,
      valor: `${aproveitamento(aprov)}%`,
      legenda: `${aprov.stats.jogos} jogo${aprov.stats.jogos > 1 ? "s" : ""}`,
      cor: "text-blue",
      fundo: "from-blue/15 to-transparent",
    });
  }

  const maisVitorias = topPor(ranking, (l) => l.stats.vitorias, 1);
  if (maisVitorias) {
    destaques.push({
      chave: "vitorias",
      icone: <Swords className="size-4" />,
      rotulo: "Mais vitórias",
      jogador: maisVitorias.jogador.nome,
      valor: `${maisVitorias.stats.vitorias}`,
      legenda: "no total",
      cor: "text-success",
      fundo: "from-success/15 to-transparent",
    });
  }

  const titulos = topPor(ranking, (l) => l.titulos, 1);
  if (titulos) {
    destaques.push({
      chave: "titulos",
      icone: <Crown className="size-4" />,
      rotulo: "Mais títulos",
      jogador: titulos.jogador.nome,
      valor: `${titulos.titulos}x`,
      legenda: "campeão trimestral",
      cor: "text-gold",
      fundo: "from-gold/15 to-transparent",
    });
  }

  const assiduo = topPor(ranking, (l) => l.stats.jogos, 1);
  if (assiduo) {
    destaques.push({
      chave: "assiduo",
      icone: <CalendarCheck className="size-4" />,
      rotulo: "Mais assíduo",
      jogador: assiduo.jogador.nome,
      valor: `${assiduo.stats.jogos}`,
      legenda: "rodadas disputadas",
      cor: "text-text",
      fundo: "from-muted/15 to-transparent",
    });
  }

  const emQueda = topPor(ranking, (l) => l.stats.sequenciaDerrota, 2);
  if (emQueda) {
    destaques.push({
      chave: "queda",
      icone: <TrendingDown className="size-4" />,
      rotulo: "Precisa reagir",
      jogador: emQueda.jogador.nome,
      valor: `${emQueda.stats.sequenciaDerrota}`,
      legenda: "derrotas seguidas",
      cor: "text-danger",
      fundo: "from-danger/15 to-transparent",
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {destaques.map((d) => (
        <div
          key={d.chave}
          className={cn(
            "relative overflow-hidden rounded-xl border border-border bg-gradient-to-br p-3.5 shadow-xs",
            d.fundo,
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className={cn("flex size-7 items-center justify-center rounded-lg bg-surface-2", d.cor)}>
              {d.icone}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{d.rotulo}</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[15px] font-extrabold leading-tight text-text">{d.jogador}</div>
              <div className="text-[10.5px] font-medium text-muted">{d.legenda}</div>
            </div>
            <span className={cn("shrink-0 text-2xl font-extrabold leading-none", d.cor)}>{d.valor}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
