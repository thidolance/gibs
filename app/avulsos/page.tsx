"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { BotaoMostrarMais, PassoNumero, Vazio } from "@/components/shared/list-ui";
import { useEstado } from "@/lib/estado-context";
import {
  alternarPagoAvulso,
  alternarSelecaoAvulso,
  desmarcarTodosAvulsos,
  gerarListaAvulsos,
  salvarObservacaoJogo,
} from "@/lib/acoes";
import {
  avulsosDoMes,
  getJogoAvulso,
  gerarRelatorioAvulsos,
  jogadoresDisponiveisAvulso,
  valorAvulsoFixo,
} from "@/lib/calculos";
import { dataBR, dinheiro, hoje } from "@/lib/utils";
import type { Jogador } from "@/lib/types";

const LIMITE = 16;

export default function AvulsosPage() {
  const { estado, carregando, atualizarEstado } = useEstado();
  const [dataJogo, setDataJogo] = useState(() => hoje());
  const [mostrarTodaSelecao, setMostrarTodaSelecao] = useState(false);
  const [mostrarTodoPagamento, setMostrarTodoPagamento] = useState(false);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);

  if (carregando) return <EstadoLoading />;

  const { mes } = estado;
  const g = getJogoAvulso(estado, dataJogo);
  const emAlteracao = JSON.stringify([...g.selecionados].sort()) !== JSON.stringify([...g.jogadores].sort());

  const opcoes = jogadoresDisponiveisAvulso(estado, mes).sort(
    (a, b) => (g.selecionados.includes(a.id) ? 0 : 1) - (g.selecionados.includes(b.id) ? 0 : 1),
  );
  const opcoesVisiveis = mostrarTodaSelecao ? opcoes : opcoes.slice(0, LIMITE);

  const todosMes = avulsosDoMes(estado, mes).sort((a, b) => a.data.localeCompare(b.data));
  const totalAvulsos = todosMes.reduce((s, jogo) => s + jogo.jogadores.length, 0);
  const totalPagos = todosMes.reduce(
    (s, jogo) => s + jogo.pagos.filter((id) => jogo.jogadores.includes(id)).length,
    0,
  );

  const pendentes: { jogador: Jogador; data: string }[] = [];
  todosMes.forEach((jogo) => {
    jogo.jogadores
      .filter((id) => !jogo.pagos.includes(id))
      .forEach((id) => {
        const jogador = estado.jogadores.find((j) => j.id === id);
        if (jogador) pendentes.push({ jogador, data: jogo.data });
      });
  });
  const pendentesVisiveis = mostrarTodoPagamento ? pendentes : pendentes.slice(0, LIMITE);

  function alternarSelecao(jogadorId: string, marcado: boolean) {
    atualizarEstado((atual) => alternarSelecaoAvulso(atual, dataJogo, jogadorId, marcado));
  }

  function aoGerarLista() {
    if (!g.selecionados.length && !g.jogadores.length) {
      alert("Selecione ao menos um avulso antes de gerar a lista.");
      return;
    }
    const acao = g.selecionados.length
      ? `Confirmar ${g.selecionados.length} avulso(s) para este jogo? A lista de pagamentos será atualizada.`
      : "Confirmar lista vazia para este jogo? Os avulsos e pagamentos desta data serão removidos.";
    if (!confirm(acao)) return;
    atualizarEstado((atual) => gerarListaAvulsos(atual, dataJogo));
  }

  function aoLimparSelecao() {
    if (!confirm("Limpar seleção de avulsos deste jogo? A lista de pagamentos só muda ao gerar.")) return;
    atualizarEstado((atual) => desmarcarTodosAvulsos(atual, dataJogo));
  }

  function alternarPago(jogadorId: string, data: string, pago: boolean) {
    atualizarEstado((atual) => alternarPagoAvulso(atual, data, jogadorId, pago));
  }

  function copiarLista() {
    navigator.clipboard.writeText(gerarRelatorioAvulsos(estado, mes));
    alert("Lista de avulsos copiada.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PassoNumero numero={1} />
              Seleção
            </CardTitle>
            <CardDescription>Aparecem aqui os jogadores que não são mensalistas neste mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Input type="date" value={dataJogo} onChange={(e) => setDataJogo(e.target.value)} />
              <Input
                placeholder="Observação interna"
                value={g.observacao}
                onChange={(e) => atualizarEstado((atual) => salvarObservacaoJogo(atual, dataJogo, e.target.value))}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Button onClick={aoGerarLista}>Gerar lista</Button>
              <Button variant="outline" onClick={aoLimparSelecao}>
                Limpar
              </Button>
            </div>

            {opcoes.length === 0 ? (
              <Vazio texto="Todos os jogadores estão como mensalistas neste mês." />
            ) : (
              <>
                <div className="mt-3 grid gap-1.5">
                  {opcoesVisiveis.map((j) => (
                    <label
                      key={j.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border bg-surface px-3.5 py-2.5 transition-colors hover:border-[#a8b2d0] hover:bg-blue-light"
                    >
                      <span>
                        <strong className="block text-[13.5px]">{j.nome}</strong>
                        <small className="text-xs text-muted">
                          {j.apelido ? `Apelido: ${j.apelido}` : dinheiro(valorAvulsoFixo(estado))}
                        </small>
                      </span>
                      <Checkbox
                        checked={g.selecionados.includes(j.id)}
                        onChange={(e) => alternarSelecao(j.id, e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
                {!mostrarTodaSelecao && opcoes.length > LIMITE && (
                  <BotaoMostrarMais quantidade={opcoes.length - LIMITE} onClick={() => setMostrarTodaSelecao(true)} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PassoNumero numero={2} />
              Pagamentos
            </CardTitle>
            <CardDescription>Controle quem dos avulsos já pagou.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border border-[rgba(201,162,39,.28)] border-l-[3.5px] border-l-accent bg-[rgba(201,162,39,.07)] px-3.5 py-2.5 text-[13px] text-blue">
              <strong>Mês:</strong> {totalAvulsos} | <strong>Pagos:</strong> {totalPagos} |{" "}
              <strong>Pendentes:</strong> {Math.max(totalAvulsos - totalPagos, 0)}
              {emAlteracao && <em className="ml-1 not-italic text-warning">(seleção alterada — gere a lista)</em>}
            </div>

            {pendentes.length === 0 ? (
              <Vazio texto="Todos os avulsos do mês estão em dia." />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendentesVisiveis.map(({ jogador, data }) => (
                      <TableRow key={`${data}-${jogador.id}`}>
                        <TableCell>
                          <strong>{jogador.nome}</strong>
                        </TableCell>
                        <TableCell>{dataBR(data)}</TableCell>
                        <TableCell>{dinheiro(valorAvulsoFixo(estado))}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => alternarPago(jogador.id, data, true)}>
                            <Check /> Marcar pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!mostrarTodoPagamento && pendentes.length > LIMITE && (
                  <BotaoMostrarMais
                    quantidade={pendentes.length - LIMITE}
                    onClick={() => setMostrarTodoPagamento(true)}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PassoNumero numero={3} />
              Prévia da cobrança
            </CardTitle>
            <CardDescription>Lista completa do mês — todas as semanas em sequência.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMostrarPrevia((v) => !v)}>
              <ChevronDown className={mostrarPrevia ? "rotate-180" : ""} />
              {mostrarPrevia ? "Ocultar prévia" : "Mostrar prévia"}
            </Button>
            <Button onClick={copiarLista}>
              <Copy /> Copiar avulsos
            </Button>
          </div>
        </CardHeader>
        {mostrarPrevia && (
          <CardContent>
            <pre className="min-h-[250px] overflow-auto whitespace-pre-wrap rounded-md border border-white/5 bg-[#0d1117] p-4 font-mono text-[13px] leading-relaxed text-[#e2e8f0] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              {gerarRelatorioAvulsos(estado, mes)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
