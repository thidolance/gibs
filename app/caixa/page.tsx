"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { Vazio } from "@/components/shared/list-ui";
import { useEstado } from "@/lib/estado-context";
import { adicionarLancamento, removerLancamento } from "@/lib/acoes";
import { dadosCaixa, despesasDoMes, receitasExtrasDoMes } from "@/lib/calculos";
import { dinheiro, hoje } from "@/lib/utils";
import { CATEGORIAS_DESPESA, type TipoLancamento } from "@/lib/types";

function criarFormVazio() {
  return {
    data: hoje(),
    tipo: "despesa" as TipoLancamento,
    categoria: CATEGORIAS_DESPESA[0] as string,
    descricao: "",
    valor: "",
  };
}

export default function CaixaPage() {
  const { estado, carregando, atualizarEstado } = useEstado();
  const [form, setForm] = useState(criarFormVazio);

  if (carregando) return <EstadoLoading />;

  const { mes } = estado;
  const dados = dadosCaixa(estado, mes);

  function salvar() {
    const valor = Number(form.valor || 0);
    if (!valor) {
      alert("Informe o valor do lançamento.");
      return;
    }
    atualizarEstado((atual) =>
      adicionarLancamento(atual, form.tipo, {
        mes,
        data: form.data || hoje(),
        categoria: form.categoria,
        descricao: form.descricao.trim(),
        valor,
      }),
    );
    setForm((f) => ({ ...criarFormVazio(), tipo: f.tipo, categoria: f.categoria }));
  }

  function excluir(id: string, tipo: TipoLancamento) {
    if (!confirm("Excluir este lançamento?")) return;
    atualizarEstado((atual) => removerLancamento(atual, tipo, id));
  }

  const lancamentos = [
    ...receitasExtrasDoMes(estado, mes).map((x) => ({ ...x, tipo: "entrada" as TipoLancamento })),
    ...despesasDoMes(estado, mes).map((x) => ({ ...x, tipo: "despesa" as TipoLancamento })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lançar despesa / verba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="dData">Data</Label>
                <Input
                  id="dData"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dTipo">Tipo</Label>
                <Select
                  id="dTipo"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoLancamento }))}
                >
                  <option value="despesa">Despesa</option>
                  <option value="entrada">Verba / entrada</option>
                </Select>
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="dCategoria">Categoria</Label>
                <Select
                  id="dCategoria"
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                >
                  {CATEGORIAS_DESPESA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="dDescricao">Descrição</Label>
                <Input
                  id="dDescricao"
                  placeholder="Descrição"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="dValor">Valor (R$)</Label>
                <Input
                  id="dValor"
                  type="number"
                  step="0.01"
                  placeholder="Valor (R$)"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={salvar}>
                  Adicionar lançamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balanço de caixa</CardTitle>
            <CardDescription>Valores consolidados do mês de referência.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <LinhaBalanco label="Mensais recebidos" valor={dados.mensaisPagos} />
                <LinhaBalanco label="Mensais a receber" valor={dados.mensaisAReceber} />
                <LinhaBalanco label="Avulsos recebidos" valor={dados.avulsos} />
                <LinhaBalanco label="Avulsos a receber" valor={dados.avulsosAReceber} />
                <LinhaBalanco label="Verbas/entradas extras" valor={dados.receitasExtras} />
                <LinhaBalanco label="Total recebido" valor={dados.entradas} destaque />
                <LinhaBalanco label="Total a receber" valor={dados.valoresAReceber} destaque />
                <LinhaBalanco label="Despesas" valor={dados.despesas} />
                <LinhaBalanco label="Saldo atual" valor={dados.saldo} destaque />
                <LinhaBalanco label="Saldo projetado" valor={dados.saldoProjetado} destaque />
              </TableBody>
            </Table>
            <p className="mt-2.5 text-[13px] text-muted">
              Saldo atual considera pagamentos marcados como pagos e verbas lançadas. Saldo projetado inclui valores
              a receber.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <Vazio texto="Nenhum lançamento no mês." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Badge variant={l.tipo === "entrada" ? "success" : "warning"}>
                        {l.tipo === "entrada" ? "Entrada" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.data}</TableCell>
                    <TableCell>{l.categoria}</TableCell>
                    <TableCell>
                      <strong>{l.descricao || "-"}</strong>
                    </TableCell>
                    <TableCell>
                      {l.tipo === "entrada" ? "+ " : "- "}
                      {dinheiro(l.valor)}
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => excluir(l.id, l.tipo)}>
                        <Trash2 /> Excluir
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

function LinhaBalanco({ label, valor, destaque = false }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <TableRow>
      <TableCell className={destaque ? "font-bold" : ""}>{label}</TableCell>
      <TableCell className={destaque ? "text-right font-bold" : "text-right"}>{dinheiro(valor)}</TableCell>
    </TableRow>
  );
}
