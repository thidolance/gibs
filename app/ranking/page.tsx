"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Crown, Download, Flame, Star, TrendingDown, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Vazio } from "@/components/shared/list-ui";
import { useEstado } from "@/lib/estado-context";
import { rankingJogadores } from "@/lib/calculos";
import { POSICOES, type Posicao } from "@/lib/types";
import { cn } from "@/lib/utils";

const POS_ABREV: Record<Posicao, string> = {
  defensor: "DEF",
  meio: "MEI",
  atacante: "ATA",
};

// Mesmas cores das tags de posição usadas no scoreboard da Classificação.
const POS_COR: Record<Posicao, string> = {
  defensor: "bg-blue-3/25 text-blue-light",
  meio: "bg-[#22c55e]/25 text-[#4ade80]",
  atacante: "bg-red/30 text-red-light",
};

/** Selo de movimento: subiu (verde), caiu (vermelho) ou estável. */
function Movimento({ valor }: { valor: number }) {
  if (valor > 0) return <span className="font-extrabold text-[#4ade80]">▲ {valor}</span>;
  if (valor < 0) return <span className="font-extrabold text-red-light">▼ {Math.abs(valor)}</span>;
  return <span className="font-semibold text-white/30">—</span>;
}

export default function RankingPage() {
  const { estado, carregando } = useEstado();
  const [baixando, setBaixando] = useState(false);
  const capturaRef = useRef<HTMLDivElement>(null);

  if (carregando) return <EstadoLoading />;

  const ranking = rankingJogadores(estado);
  const lider = ranking[0];
  const emSequencia = [...ranking].sort((a, b) => b.stats.sequencia - a.stats.sequencia)[0];

  async function baixarImagem() {
    if (!capturaRef.current) return;
    setBaixando(true);
    try {
      const url = await toPng(capturaRef.current, { pixelRatio: 3, backgroundColor: "#0a1226", cacheBust: true });
      const link = document.createElement("a");
      link.download = "ranking-gibs.png";
      link.href = url;
      link.click();
    } catch {
      alert("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          titulo="Melhor nota"
          valor={lider ? lider.stats.nota.toFixed(1) : "—"}
          legenda={lider ? lider.jogador.nome : "Sem partidas ainda"}
          variante="success"
          icone={<Star />}
        />
        <MetricCard
          titulo="Maior sequência"
          valor={emSequencia && emSequencia.stats.sequencia > 0 ? emSequencia.jogador.nome : "—"}
          legenda={
            emSequencia && emSequencia.stats.sequencia > 0
              ? `${emSequencia.stats.sequencia} vitória(s) seguida(s)`
              : "Ninguém em sequência"
          }
          variante="primary"
          icone={<Flame />}
        />
        <MetricCard
          titulo="No ranking"
          valor={String(ranking.length)}
          legenda={`${ranking.filter((l) => l.titulos > 0).length} campeão(ões)`}
          variante="blue"
          icone={<Users />}
        />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-gold" />
              Ranking de jogadores
            </CardTitle>
            <CardDescription>
              Todos começam em <strong>6,0</strong>. Vitórias <strong>seguidas</strong> somam cada vez mais (
              <strong>+0,2</strong>, +0,3, +0,4…) e derrotas <strong>seguidas</strong> tiram cada vez mais (
              <strong>−0,1</strong>, −0,2, −0,3…). Título de campeão <strong>+0,5</strong>; faltar tira{" "}
              <strong>−0,1</strong> (e zera o combo de vitória). Travado entre <strong>6 e 10</strong>. O movimento (▲▼)
              é em relação à rodada anterior.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={baixarImagem} disabled={baixando || ranking.length === 0}>
            <Download /> {baixando ? "Gerando..." : "Baixar imagem"}
          </Button>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <Vazio texto="Nenhuma partida registrada ainda. Registre rodadas na aba Classificação para gerar as notas." />
          ) : (
            <div
              ref={capturaRef}
              className="relative overflow-hidden rounded-xl bg-[linear-gradient(180deg,rgba(12,20,46,.96),rgba(6,12,30,.96))] p-5 text-white shadow-[0_18px_40px_-12px_rgba(10,23,48,.6)] max-md:p-4"
            >
              {/* Barra de topo em gradiente (azul → roxo → vermelho), igual à Classificação */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#3b82f6,#9333ea_50%,#ff2e2e)]" />

              {/* Cabeçalho estilo scoreboard */}
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Gibs FC</div>
                  <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight max-md:text-xl">
                    Ranking
                    <span className="ml-2 bg-[linear-gradient(100deg,#ff2e2e,#9333ea_60%,#3b82f6)] bg-clip-text text-transparent">
                      Jogadores
                    </span>
                  </h2>
                </div>
                <span className="shrink-0 rounded-md bg-[#16a34a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  {ranking.length} na lista
                </span>
              </div>

              {/* Cabeçalho das colunas */}
              <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <span className="w-7 shrink-0 text-center">#</span>
                <span className="w-9 shrink-0 text-center">Mov</span>
                <span className="flex-1">Jogador</span>
                <span className="w-12 text-right text-gold">Nota</span>
                <span className="w-7 text-right">V</span>
                <span className="w-7 text-right">D</span>
                <span className="w-7 text-right">J</span>
                <span className="w-12 text-right">Seq</span>
              </div>

              {/* Linhas */}
              <div className="flex flex-col gap-1">
                {ranking.map((linha, i) => {
                  const podio = [
                    "bg-[linear-gradient(135deg,#fbbf24,#d97706)] text-[#3a2500]", // 1º ouro
                    "bg-[linear-gradient(135deg,#e2e8f0,#94a3b8)] text-[#1e293b]", // 2º prata
                    "bg-[linear-gradient(135deg,#e0a26a,#a15a1e)] text-white", // 3º bronze
                  ];
                  const badge = podio[i] ?? "bg-white/10 text-white/80";
                  const acento = i === 0 ? "bg-gold" : i === 1 ? "bg-white/50" : i === 2 ? "bg-[#c07a3a]" : "bg-red";
                  return (
                    <div
                      key={linha.jogador.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md py-2 pr-2 pl-0",
                        i === 0
                          ? "bg-[linear-gradient(90deg,rgba(245,158,11,.18),rgba(245,158,11,.02))] shadow-[inset_0_0_0_1px_rgba(245,158,11,.32)]"
                          : i < 3
                            ? "bg-white/[0.08]"
                            : "bg-white/[0.03]",
                      )}
                    >
                      <span className={cn("h-7 w-1 shrink-0 rounded-full", acento)} />
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-extrabold shadow-[0_3px_8px_-3px_rgba(0,0,0,.5)]",
                          badge,
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="w-9 shrink-0 text-center text-[11px]">
                        <Movimento valor={linha.movimento} />
                      </span>
                      <span className="flex flex-1 items-center gap-2 truncate">
                        <span className="truncate text-[15px] font-bold uppercase tracking-tight max-md:text-sm">
                          {linha.jogador.nome}
                        </span>
                        {linha.titulos > 0 && (
                          <Crown
                            className="size-4 shrink-0 fill-gold text-gold drop-shadow-[0_0_6px_rgba(245,158,11,.6)]"
                            aria-label={`${linha.titulos}x campeão`}
                          />
                        )}
                        {linha.jogador.posicao && (
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider",
                              POS_COR[linha.jogador.posicao],
                            )}
                          >
                            {POS_ABREV[linha.jogador.posicao]}
                          </span>
                        )}
                      </span>
                      <span className="w-12 text-right text-lg font-extrabold text-gold drop-shadow-[0_0_10px_rgba(245,158,11,.4)] max-md:text-base">
                        {linha.stats.nota.toFixed(1)}
                      </span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.stats.vitorias}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.stats.derrotas}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/45">{linha.stats.jogos}</span>
                      <span className="flex w-12 justify-end text-sm font-semibold">
                        {linha.stats.sequencia > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[#fb923c]">
                            <Flame className="size-3.5" />
                            {linha.stats.sequencia}
                          </span>
                        ) : linha.stats.sequenciaDerrota > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[#f87171]">
                            <TrendingDown className="size-3.5" />
                            {linha.stats.sequenciaDerrota}
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                {POSICOES.map((p) => (
                  <span key={p.valor} className="flex items-center gap-1.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px]", POS_COR[p.valor])}>{p.abrev}</span>
                    {p.rotulo}
                  </span>
                ))}
                <span className="ml-auto normal-case tracking-normal text-white/35">Nota 6–10 · Gibs FC</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
