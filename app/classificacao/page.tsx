"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Flag,
  Medal,
  Pencil,
  Plus,
  Swords,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PassoNumero, Vazio } from "@/components/shared/list-ui";
import { useEstado } from "@/lib/estado-context";
import {
  adicionarCampeao,
  adicionarRodada,
  atualizarCampeao,
  atualizarRodada,
  encerrarTrimestral,
  removerCampeao,
  removerRodada,
} from "@/lib/acoes";
import { classificacaoMensal, getMensalMes, rodadasOrdenadas } from "@/lib/calculos";
import { calcularDiaSemana, cn, dataBR, hoje, nomeMes, tercaDaSemana } from "@/lib/utils";
import type { CampeaoTrimestral, Jogador, ResultadoRodada } from "@/lib/types";

type Time = "vermelho" | "azul";

/** Sugere um rótulo de trimestre a partir do mês de referência (ex.: "3º Trimestre 2026"). */
function sugestaoTrimestre(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const trimestre = Math.ceil(m / 3);
  return `${trimestre}º Trimestre ${ano}`;
}

export default function ClassificacaoPage() {
  const { estado, carregando, atualizarEstado } = useEstado();
  const [data, setData] = useState(tercaDaSemana());
  const [times, setTimes] = useState<Record<string, Time>>({});
  const [resultado, setResultado] = useState<ResultadoRodada>("empate");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [baixando, setBaixando] = useState(false);
  const carrosselRef = useRef<HTMLDivElement>(null);
  const capturaRef = useRef<HTMLDivElement>(null);
  const formularioRef = useRef<HTMLDivElement>(null);

  if (carregando) return <EstadoLoading />;

  const { mes } = estado;
  const confirmados = getMensalMes(estado, mes).confirmados
    .map((id) => estado.jogadores.find((j) => j.id === id))
    .filter((j): j is Jogador => Boolean(j));

  const classificacao = classificacaoMensal(estado);
  const historico = rodadasOrdenadas(estado);
  const lider = classificacao[0];

  // Elenco do formulário: confirmados do mês + quem já estava escalado na rodada em edição.
  const elenco = [...confirmados];
  for (const id of Object.keys(times)) {
    if (!elenco.some((j) => j.id === id)) {
      const j = estado.jogadores.find((x) => x.id === id);
      if (j) elenco.push(j);
    }
  }

  const timeVermelho = elenco.filter((j) => times[j.id] === "vermelho");
  const timeAzul = elenco.filter((j) => times[j.id] === "azul");

  function definirTime(jogadorId: string, time: Time) {
    setTimes((atual) => {
      const proximo = { ...atual };
      if (proximo[jogadorId] === time) delete proximo[jogadorId];
      else proximo[jogadorId] = time;
      return proximo;
    });
  }

  function resetarFormulario() {
    setEditandoId(null);
    setTimes({});
    setResultado("empate");
    setData(tercaDaSemana());
  }

  function editarRodada(r: (typeof historico)[number]) {
    const mapa: Record<string, Time> = {};
    (r.timeVermelho ?? []).forEach((id) => (mapa[id] = "vermelho"));
    (r.timeAzul ?? []).forEach((id) => (mapa[id] = "azul"));
    setEditandoId(r.id);
    setTimes(mapa);
    setResultado(r.resultado);
    setData(r.data);
    formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function salvarRodada() {
    if (!timeVermelho.length || !timeAzul.length) {
      alert("Escale pelo menos um jogador em cada time.");
      return;
    }
    const dados = {
      data,
      timeVermelho: timeVermelho.map((j) => j.id),
      timeAzul: timeAzul.map((j) => j.id),
      resultado,
    };
    if (editandoId) {
      const id = editandoId;
      atualizarEstado((atual) => atualizarRodada(atual, id, dados));
      resetarFormulario();
      alert("Rodada atualizada e classificação recalculada.");
    } else {
      atualizarEstado((atual) => adicionarRodada(atual, dados));
      setTimes({});
      setResultado("empate");
      alert("Rodada registrada e classificação atualizada.");
    }
  }

  function excluirRodada(id: string) {
    if (!confirm("Excluir esta rodada? A classificação será recalculada.")) return;
    atualizarEstado((atual) => removerRodada(atual, id));
  }

  function encerrar() {
    if (!lider) {
      alert("Registre pelo menos uma rodada antes de encerrar o trimestral.");
      return;
    }
    const periodo = prompt("Nome do trimestral encerrado:", sugestaoTrimestre(mes));
    if (periodo === null) return;
    if (
      !confirm(
        `Campeão: ${lider.jogador.nome} (${lider.pontos} pts).\n\nEncerrar o trimestral e zerar a classificação para começar um novo?`,
      )
    )
      return;
    atualizarEstado((atual) => encerrarTrimestral(atual, periodo.trim() || sugestaoTrimestre(mes), hoje()));
    alert(`🏆 ${lider.jogador.nome} é o campeão! Classificação zerada.`);
  }

  function novoCampeaoManual() {
    atualizarEstado((atual) =>
      adicionarCampeao(atual, { periodo: sugestaoTrimestre(mes), jogadorNome: "", pontos: 0, data: hoje() }),
    );
  }

  function editarCampeao(campeao: CampeaoTrimestral, campo: keyof Omit<CampeaoTrimestral, "id">, valor: string) {
    atualizarEstado((atual) =>
      atualizarCampeao(atual, campeao.id, {
        ...campeao,
        [campo]: campo === "pontos" ? Number(valor) || 0 : valor,
      }),
    );
  }

  function excluirCampeao(id: string) {
    if (!confirm("Remover este campeão do quadro?")) return;
    atualizarEstado((atual) => removerCampeao(atual, id));
  }

  function rolarCarrossel(direcao: number) {
    carrosselRef.current?.scrollBy({ left: direcao * 320, behavior: "smooth" });
  }

  async function baixarImagem() {
    if (!capturaRef.current) return;
    setBaixando(true);
    try {
      const url = await toPng(capturaRef.current, {
        pixelRatio: 3, // alta resolução para print nítido
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `classificacao-${nomeMes(mes).toLowerCase()}.png`;
      link.href = url;
      link.click();
    } catch {
      alert("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  const nomeJogador = (id: string) => estado.jogadores.find((j) => j.id === id)?.nome ?? "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          titulo="Rodadas disputadas"
          valor={String(historico.length)}
          legenda="Total de partidas registradas"
          variante="blue"
          icone={<Swords />}
        />
        <MetricCard
          titulo="Líder"
          valor={lider ? lider.jogador.nome : "—"}
          legenda={lider ? `${lider.pontos} ponto${lider.pontos === 1 ? "" : "s"}` : "Sem rodadas ainda"}
          variante="success"
          icone={<Crown />}
        />
        <MetricCard
          titulo="Mensalistas na disputa"
          valor={String(classificacao.length)}
          legenda={`${confirmados.length} confirmado${confirmados.length === 1 ? "" : "s"} em ${nomeMes(mes)}`}
          variante="primary"
          icone={<Users />}
        />
      </div>

      {/* ── Classificação ── */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-gold" />
              Classificação do mensal
            </CardTitle>
            <CardDescription>
              Vitória vale <strong>3 pontos</strong> e empate vale <strong>1 ponto</strong> para todos os escalados.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={baixarImagem} disabled={baixando || classificacao.length === 0}>
              <Download /> {baixando ? "Gerando..." : "Baixar imagem"}
            </Button>
            <Button variant="warning" onClick={encerrar} disabled={!lider}>
              <Flag /> Encerrar trimestral
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {classificacao.length === 0 ? (
            <Vazio texto="Nenhuma rodada registrada ainda. Escale os times abaixo para começar." />
          ) : (
            <div
              ref={capturaRef}
              className="overflow-hidden rounded-xl bg-[linear-gradient(165deg,#0a1730_0%,#0e2258_55%,#0a1730_100%)] p-5 text-white shadow-[0_18px_40px_-12px_rgba(10,23,48,.6)] max-md:p-4"
            >
              {/* Cabeçalho estilo scoreboard */}
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">Gibs FC</div>
                  <h2 className="text-2xl font-extrabold uppercase leading-none tracking-tight max-md:text-xl">
                    Classificação
                    <span className="ml-2 text-gold">Mensal</span>
                  </h2>
                </div>
                <span className="shrink-0 rounded-md bg-[#16a34a] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  {historico.length} Rodada{historico.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Cabeçalho das colunas */}
              <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <span className="w-7 shrink-0 text-center">#</span>
                <span className="flex-1">Jogador</span>
                <span className="w-9 text-right text-gold">Pts</span>
                <span className="w-7 text-right">V</span>
                <span className="w-7 text-right">E</span>
                <span className="w-7 text-right">D</span>
                <span className="w-7 text-right">J</span>
              </div>

              {/* Linhas */}
              <div className="flex flex-col gap-1">
                {classificacao.map((linha, i) => {
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
                        "flex items-center gap-3 rounded-md py-2 pr-2 pl-0 transition-colors",
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
                      <span className="flex-1 truncate text-[15px] font-bold uppercase tracking-tight max-md:text-sm">
                        {linha.jogador.nome}
                      </span>
                      <span className="w-9 text-right text-lg font-extrabold text-gold max-md:text-base">
                        {linha.pontos}
                      </span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.vitorias}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.empates}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/80">{linha.derrotas}</span>
                      <span className="w-7 text-right text-sm font-semibold text-white/45">{linha.jogos}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-full bg-gold" /> Pódio
                </span>
                <span>Vitória = 3 pts</span>
                <span>Empate = 1 pt</span>
                <span className="ml-auto normal-case tracking-normal text-white/35">
                  {nomeMes(mes).charAt(0) + nomeMes(mes).slice(1).toLowerCase()} · Gibs FC
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Nova rodada / edição ── */}
      <Card ref={formularioRef} className={cn(editandoId && "border-warning ring-1 ring-warning/40")}>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {editandoId ? <Pencil className="size-4 text-warning" /> : <PassoNumero numero={1} />}
              {editandoId ? "Editar rodada" : "Nova rodada"}
            </CardTitle>
            <CardDescription>
              Escale cada mensalista no time <span className="font-bold text-red">Vermelho</span> ou{" "}
              <span className="font-bold text-blue">Azul</span>, informe o resultado e{" "}
              {editandoId ? "salve as alterações." : "registre."}
            </CardDescription>
          </div>
          {editandoId && (
            <Button variant="ghost" onClick={resetarFormulario}>
              <X /> Cancelar edição
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {elenco.length === 0 ? (
            <Vazio texto="Nenhum mensalista confirmado neste mês. Gere a lista na aba Mensalistas primeiro." />
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Data da rodada · {calcularDiaSemana(data)}
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="min-h-10 rounded-sm border border-border-2 bg-white px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-blue-3 focus:shadow-[0_0_0_3px_rgba(59,130,246,.18)]"
                  />
                </label>
                <div className="flex items-center gap-2 text-[13px]">
                  <Badge className="bg-red-light text-red">🔴 Vermelho: {timeVermelho.length}</Badge>
                  <Badge className="bg-blue-light text-blue">🔵 Azul: {timeAzul.length}</Badge>
                </div>
              </div>

              <div className="grid gap-1.5">
                {elenco.map((j) => {
                  const time = times[j.id];
                  return (
                    <div
                      key={j.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-sm border px-3.5 py-2 transition-colors",
                        time === "vermelho" && "border-red bg-red-light/50",
                        time === "azul" && "border-blue-3 bg-blue-light/50",
                        !time && "border-border bg-surface",
                      )}
                    >
                      <strong className="text-[13.5px]">{j.nome}</strong>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => definirTime(j.id, "vermelho")}
                          className={cn(
                            "rounded-sm px-3 py-1.5 text-xs font-bold transition-colors",
                            time === "vermelho"
                              ? "bg-red text-white"
                              : "bg-red-light text-red hover:bg-red hover:text-white",
                          )}
                        >
                          Vermelho
                        </button>
                        <button
                          onClick={() => definirTime(j.id, "azul")}
                          className={cn(
                            "rounded-sm px-3 py-1.5 text-xs font-bold transition-colors",
                            time === "azul"
                              ? "bg-blue text-white"
                              : "bg-blue-light text-blue hover:bg-blue hover:text-white",
                          )}
                        >
                          Azul
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-2 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Resultado</span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["vermelho", "🔴 Vermelho venceu", "bg-red text-white"],
                      ["empate", "🤝 Empate", "bg-warning text-white"],
                      ["azul", "🔵 Azul venceu", "bg-blue text-white"],
                    ] as const
                  ).map(([valor, rotulo, ativo]) => (
                    <button
                      key={valor}
                      onClick={() => setResultado(valor)}
                      className={cn(
                        "rounded-sm border px-4 py-2 text-[13px] font-bold transition-colors",
                        resultado === valor ? ativo : "border-border-2 bg-white text-text-2 hover:border-blue-3",
                      )}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant={editandoId ? "warning" : "primary"} onClick={salvarRodada}>
                  {editandoId ? (
                    <>
                      <Pencil /> Salvar alterações
                    </>
                  ) : (
                    <>
                      <Trophy /> Registrar rodada
                    </>
                  )}
                </Button>
                {editandoId && (
                  <Button variant="outline" onClick={resetarFormulario}>
                    Cancelar
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Histórico / carrossel ── */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Swords className="size-5 text-blue" />
              Histórico de rodadas
            </CardTitle>
            <CardDescription>Todas as partidas registradas, da mais recente para a mais antiga.</CardDescription>
          </div>
          {historico.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => rolarCarrossel(-1)} aria-label="Anterior">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" onClick={() => rolarCarrossel(1)} aria-label="Próximo">
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <Vazio texto="Nenhuma rodada no histórico ainda." />
          ) : (
            <div
              ref={carrosselRef}
              className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5"
            >
              {historico.map((r) => {
                const cor =
                  r.resultado === "vermelho"
                    ? { rotulo: "Vermelho venceu", classe: "bg-red-light text-red", emoji: "🔴" }
                    : r.resultado === "azul"
                      ? { rotulo: "Azul venceu", classe: "bg-blue-light text-blue", emoji: "🔵" }
                      : { rotulo: "Empate", classe: "bg-warning-bg text-warning", emoji: "🤝" };
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex w-[280px] shrink-0 flex-col gap-2.5 rounded-md border bg-surface p-3.5 shadow-xs",
                      editandoId === r.id ? "border-warning ring-1 ring-warning/40" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-text-2">
                        {dataBR(r.data)} · {calcularDiaSemana(r.data)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="action-edit"
                          size="icon-sm"
                          title="Editar rodada"
                          onClick={() => editarRodada(r)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="action-delete"
                          size="icon-sm"
                          title="Excluir rodada"
                          onClick={() => excluirRodada(r.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <Badge className={cn("w-fit", cor.classe)}>
                      {cor.emoji} {cor.rotulo}
                    </Badge>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-sm border border-red/25 bg-red-light/40 p-2">
                        <strong className="mb-1 block text-red">🔴 Vermelho</strong>
                        <ul className="flex flex-col gap-0.5 text-text-2">
                          {(r.timeVermelho ?? []).map((id) => (
                            <li key={id}>{nomeJogador(id)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-sm border border-blue-3/25 bg-blue-light/40 p-2">
                        <strong className="mb-1 block text-blue">🔵 Azul</strong>
                        <ul className="flex flex-col gap-0.5 text-text-2">
                          {(r.timeAzul ?? []).map((id) => (
                            <li key={id}>{nomeJogador(id)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quadro de campeões ── */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Medal className="size-5 text-gold" />
              Quadro de campeões
            </CardTitle>
            <CardDescription>
              Campeões de cada trimestral. Registrados ao encerrar ou cadastrados manualmente. Edite os campos direto na
              tabela.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={novoCampeaoManual}>
            <Plus /> Adicionar campeão
          </Button>
        </CardHeader>
        <CardContent>
          {estado.campeoes.length === 0 ? (
            <Vazio texto="Nenhum campeão registrado ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestral</TableHead>
                  <TableHead>Campeão</TableHead>
                  <TableHead className="w-28 text-center">Pontos</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...estado.campeoes]
                  .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
                  .map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Input
                          defaultValue={c.periodo}
                          onBlur={(e) => e.target.value !== c.periodo && editarCampeao(c, "periodo", e.target.value)}
                          className="h-9 min-h-0"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Crown className="size-4 shrink-0 text-gold" />
                          <Input
                            defaultValue={c.jogadorNome}
                            placeholder="Nome do campeão"
                            onBlur={(e) =>
                              e.target.value !== c.jogadorNome && editarCampeao(c, "jogadorNome", e.target.value)
                            }
                            className="h-9 min-h-0 font-semibold"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={c.pontos}
                          onBlur={(e) =>
                            Number(e.target.value) !== c.pontos && editarCampeao(c, "pontos", e.target.value)
                          }
                          className="h-9 min-h-0 text-center"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="action-delete"
                          size="icon-sm"
                          title="Remover campeão"
                          onClick={() => excluirCampeao(c.id)}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
