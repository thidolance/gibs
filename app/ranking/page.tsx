"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Goal, Star, TrendingUp, Trophy } from "lucide-react";
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

const POS_COR: Record<Posicao, string> = {
  defensor: "bg-blue-3/25 text-blue-3",
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
  const artilheiro = [...ranking].sort((a, b) => b.stats.gols - a.stats.gols)[0];
  const totalGols = ranking.reduce((s, l) => s + l.stats.gols, 0);

  async function baixarImagem() {
    if (!capturaRef.current) return;
    setBaixando(true);
    try {
      const url = await toPng(capturaRef.current, { pixelRatio: 3, backgroundColor: "#ffffff", cacheBust: true });
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
          titulo="Artilheiro"
          valor={artilheiro && artilheiro.stats.gols > 0 ? artilheiro.jogador.nome : "—"}
          legenda={artilheiro && artilheiro.stats.gols > 0 ? `${artilheiro.stats.gols} gol(s)` : "Nenhum gol registrado"}
          variante="primary"
          icone={<Goal />}
        />
        <MetricCard
          titulo="Gols no total"
          valor={String(totalGols)}
          legenda={`${ranking.length} jogador(es) no ranking`}
          variante="blue"
          icone={<TrendingUp />}
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
              Todos começam em <strong>6,0</strong>. Vitória <strong>+0,2</strong>, derrota <strong>−0,1</strong>, cada
              gol <strong>+0,1</strong> e cada título de campeão <strong>+0,5</strong> — travado entre 5 e 10. O
              movimento (▲▼) é em relação à rodada anterior.
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
              className="overflow-hidden rounded-xl bg-[linear-gradient(165deg,#0a1730_0%,#0e2258_55%,#0a1730_100%)] p-5 text-white shadow-[0_18px_40px_-12px_rgba(10,23,48,.6)] max-md:p-4"
            >
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Gibs FC</div>
                  <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight max-md:text-xl">
                    Ranking<span className="ml-2 text-gold">Jogadores</span>
                  </h2>
                </div>
                <span className="shrink-0 rounded-md bg-[#16a34a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  {ranking.length} na lista
                </span>
              </div>

              <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <span className="w-7 shrink-0 text-center">#</span>
                <span className="w-10 shrink-0 text-center">Mov</span>
                <span className="flex-1">Jogador</span>
                <span className="w-12 text-right text-gold">Nota</span>
                <span className="w-7 text-right">V</span>
                <span className="w-7 text-right">D</span>
                <span className="w-7 text-right">G</span>
              </div>

              <div className="flex flex-col gap-1">
                {ranking.map((linha, i) => {
                  const podio = [
                    "bg-[linear-gradient(135deg,#fbbf24,#d97706)] text-[#3a2500]",
                    "bg-[linear-gradient(135deg,#e2e8f0,#94a3b8)] text-[#1e293b]",
                    "bg-[linear-gradient(135deg,#e0a26a,#a15a1e)] text-white",
                  ];
                  const badge = podio[i] ?? "bg-white/10 text-white/80";
                  const acento = i === 0 ? "bg-gold" : i === 1 ? "bg-white/50" : i === 2 ? "bg-[#c07a3a]" : "bg-red";
                  return (
                    <div
                      key={linha.jogador.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md py-2 pr-2 pl-0",
                        i < 3 ? "bg-white/[0.08]" : "bg-white/[0.03]",
                      )}
                    >
                      <span className={cn("h-7 w-1 shrink-0 rounded-full", acento)} />
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-extrabold",
                          badge,
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="w-8 shrink-0 text-center text-[11px]">
                        <Movimento valor={linha.movimento} />
                      </span>
                      <span className="flex flex-1 items-center gap-2 truncate">
                        <span className="truncate text-[15px] font-bold uppercase tracking-tight max-md:text-sm">
                          {linha.jogador.nome}
                        </span>
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
                      <span className="w-12 text-right text-lg font-extrabold text-gold max-md:text-base">
                        {linha.stats.nota.toFixed(1)}
                      </span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.stats.vitorias}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.stats.derrotas}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/45">{linha.stats.gols}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                {POSICOES.map((p) => (
                  <span key={p.valor} className="flex items-center gap-1.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[9px]", POS_COR[p.valor])}>{p.abrev}</span>
                    {p.rotulo}
                  </span>
                ))}
                <span className="ml-auto normal-case tracking-normal text-white/35">Nota 5–10 · Gibs FC</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
