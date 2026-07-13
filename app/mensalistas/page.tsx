"use client";

import { useState } from "react";
import { Banknote, Check, ChevronDown, Clock, Copy, Pencil, Users, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { MetricCard } from "@/components/dashboard/metric-card";
import { useEstado } from "@/lib/estado-context";
import {
  alternarPagoMensalista,
  alternarSelecaoMensalista,
  confirmarSelecaoMensalistas,
  desmarcarTodosMensalistas,
  marcarTodosMensalistas,
  salvarValorCustomMensalista,
} from "@/lib/acoes";
import { dadosCaixa, getMensalMes, gerarRelatorioMensalistas, valorMensalistaJogador } from "@/lib/calculos";
import { dinheiro } from "@/lib/utils";
import { BotaoMostrarMais, PassoNumero, Vazio } from "@/components/shared/list-ui";
import type { Jogador } from "@/lib/types";

const LIMITE = 16;
const TITULO_PADRAO = "🏆 QUADRO DE MENSALISTAS 2026 🔴🔵";

export default function MensalistasPage() {
  const { estado, carregando, atualizarEstado } = useEstado();
  const [mostrarTodaSelecao, setMostrarTodaSelecao] = useState(false);
  const [mostrarTodoPagamento, setMostrarTodoPagamento] = useState(false);
  const [editandoValorId, setEditandoValorId] = useState<string | null>(null);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [titulo, setTitulo] = useState(TITULO_PADRAO);

  if (carregando) return <EstadoLoading />;

  const { mes } = estado;
  const m = getMensalMes(estado, mes);
  const dados = dadosCaixa(estado, mes);
  const emAlteracao = JSON.stringify([...m.selecionados].sort()) !== JSON.stringify([...m.confirmados].sort());

  const jogadoresOrdenados = [...estado.jogadores].sort(
    (a, b) => (m.selecionados.includes(a.id) ? 0 : 1) - (m.selecionados.includes(b.id) ? 0 : 1),
  );
  const jogadoresVisiveis = mostrarTodaSelecao ? jogadoresOrdenados : jogadoresOrdenados.slice(0, LIMITE);

  const mensalistas = m.confirmados
    .map((id) => estado.jogadores.find((j) => j.id === id))
    .filter((j): j is Jogador => Boolean(j));
  const mensalistasOrdenados = [...mensalistas].sort(
    (a, b) => (m.pagos.includes(a.id) ? 1 : 0) - (m.pagos.includes(b.id) ? 1 : 0),
  );
  const mensalistasVisiveis = mostrarTodoPagamento ? mensalistasOrdenados : mensalistasOrdenados.slice(0, LIMITE);

  const totalPagos = m.pagos.length;
  const totalPendentes = Math.max(mensalistas.length - totalPagos, 0);

  function alternarSelecao(jogadorId: string, marcado: boolean) {
    atualizarEstado((atual) => alternarSelecaoMensalista(atual, mes, jogadorId, marcado));
  }

  function aoMarcarTodos() {
    if (!confirm("Marcar todos como mensalistas deste mês?")) return;
    atualizarEstado((atual) => marcarTodosMensalistas(atual, mes));
  }

  function aoLimparSelecao() {
    if (!confirm("Limpar seleção de mensalistas deste mês?")) return;
    atualizarEstado((atual) => desmarcarTodosMensalistas(atual, mes));
  }

  function aoConfirmarSelecao() {
    if (!confirm(`Gerar lista com ${m.selecionados.length} mensalistas? A lista de pagamentos será atualizada.`)) return;
    atualizarEstado((atual) => confirmarSelecaoMensalistas(atual, mes));
  }

  function alternarPago(jogadorId: string, pago: boolean) {
    atualizarEstado((atual) => alternarPagoMensalista(atual, mes, jogadorId, pago));
  }

  function salvarValor(jogadorId: string, valorTexto: string) {
    const valor = Number(valorTexto);
    atualizarEstado((atual) => salvarValorCustomMensalista(atual, mes, jogadorId, valor > 0 ? valor : null));
    setEditandoValorId(null);
  }

  function copiarCobranca() {
    navigator.clipboard.writeText(gerarRelatorioMensalistas(estado, mes, titulo));
    alert("Cobrança mensal copiada.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          titulo="Mensalistas confirmados"
          valor={String(mensalistas.length)}
          legenda={`${m.selecionados.length} selecionado${m.selecionados.length === 1 ? "" : "s"} no momento`}
          variante="primary"
          icone={<Users />}
        />
        <MetricCard
          titulo="Arrecadado"
          valor={dinheiro(dados.mensaisPagos)}
          legenda={`${totalPagos}/${mensalistas.length} pagaram`}
          variante="success"
          progresso={mensalistas.length ? (totalPagos / mensalistas.length) * 100 : 0}
          icone={<Banknote />}
        />
        <MetricCard
          titulo="A receber"
          valor={dinheiro(dados.mensaisAReceber)}
          legenda={`${totalPendentes} pendente${totalPendentes === 1 ? "" : "s"}`}
          variante="warning"
          icone={<Clock />}
        />
        <MetricCard
          titulo="Total esperado"
          valor={dinheiro(dados.mensaisPagos + dados.mensaisAReceber)}
          legenda="Soma de todos os mensalistas do mês"
          variante="blue"
          icone={<Wallet />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PassoNumero numero={1} />
              Seleção
            </CardTitle>
            <CardDescription>
              Selecione os mensalistas e clique em <strong>Gerar lista</strong> para atualizar os pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={aoMarcarTodos}>Marcar todos</Button>
              <Button variant="outline" onClick={aoLimparSelecao}>
                Limpar
              </Button>
              <Button variant={emAlteracao ? "warning" : "secondary"} onClick={aoConfirmarSelecao}>
                {emAlteracao ? "Gerar lista ⚠️" : "Gerar lista"}
              </Button>
            </div>

            {estado.jogadores.length === 0 ? (
              <Vazio texto="Cadastre jogadores primeiro." />
            ) : (
              <>
                <div className="mt-3 grid gap-1.5">
                  {jogadoresVisiveis.map((j) => (
                    <label
                      key={j.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border bg-surface px-3.5 py-2.5 transition-colors hover:border-[#a8b2d0] hover:bg-blue-light"
                    >
                      <span>
                        <strong className="block text-[13.5px]">{j.nome}</strong>
                        <small className="text-xs text-muted">
                          {j.apelido ? `Apelido: ${j.apelido}` : "Sem apelido"}
                        </small>
                      </span>
                      <Checkbox
                        checked={m.selecionados.includes(j.id)}
                        onChange={(e) => alternarSelecao(j.id, e.target.checked)}
                      />
                    </label>
                  ))}
                </div>
                {!mostrarTodaSelecao && jogadoresOrdenados.length > LIMITE && (
                  <BotaoMostrarMais
                    quantidade={jogadoresOrdenados.length - LIMITE}
                    onClick={() => setMostrarTodaSelecao(true)}
                  />
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
            <CardDescription>Marque ou desmarque quem já pagou.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-sm border border-[rgba(201,162,39,.28)] border-l-[3.5px] border-l-accent bg-[rgba(201,162,39,.07)] px-3.5 py-2.5 text-[13px] text-blue">
              <strong>Total:</strong> {mensalistas.length} | <strong>Pagos:</strong> {totalPagos} |{" "}
              <strong>Pendentes:</strong> {totalPendentes}
              {emAlteracao && <em className="ml-1 not-italic text-warning">(seleção alterada — gere a lista)</em>}
            </div>

            {mensalistas.length === 0 ? (
              <Vazio
                texto={
                  emAlteracao ? 'Clique em "Gerar lista" para atualizar os pagamentos.' : "Gere a lista de mensalistas."
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mensalistasVisiveis.map((j) => {
                      const pago = m.pagos.includes(j.id);
                      const valor = valorMensalistaJogador(estado, mes, j.id);
                      return (
                        <TableRow key={j.id}>
                          <TableCell>
                            <strong>{j.nome}</strong>
                          </TableCell>
                          <TableCell>
                            {editandoValorId === j.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                autoFocus
                                defaultValue={valor}
                                className="h-8 w-[100px] min-h-0 px-2 py-1"
                                onBlur={(e) => salvarValor(j.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") salvarValor(j.id, e.currentTarget.value);
                                  if (e.key === "Escape") setEditandoValorId(null);
                                }}
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <strong>{dinheiro(valor)}</strong>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Editar valor"
                                  onClick={() => setEditandoValorId(j.id)}
                                >
                                  <Pencil />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pago ? "success" : "warning"}>{pago ? "Pago" : "Pendente"}</Badge>
                          </TableCell>
                          <TableCell>
                            {pago ? (
                              <Button variant="ghost" size="sm" onClick={() => alternarPago(j.id, false)}>
                                <X /> Desmarcar
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => alternarPago(j.id, true)}>
                                <Check /> Marcar pago
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {!mostrarTodoPagamento && mensalistasOrdenados.length > LIMITE && (
                  <BotaoMostrarMais
                    quantidade={mensalistasOrdenados.length - LIMITE}
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
            <CardDescription>Texto pronto para a cobrança do mês de referência.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMostrarPrevia((v) => !v)}>
              <ChevronDown className={mostrarPrevia ? "rotate-180" : ""} />
              {mostrarPrevia ? "Ocultar prévia" : "Mostrar prévia"}
            </Button>
            <Button onClick={copiarCobranca}>
              <Copy /> Copiar cobrança
            </Button>
          </div>
        </CardHeader>
        {mostrarPrevia && (
          <CardContent>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mb-3" />
            <pre className="min-h-[250px] overflow-auto whitespace-pre-wrap rounded-md border border-white/5 bg-[#0d1117] p-4 font-mono text-[13px] leading-relaxed text-[#e2e8f0] shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              {gerarRelatorioMensalistas(estado, mes, titulo)}
            </pre>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
