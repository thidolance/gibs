"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { useEstado } from "@/lib/estado-context";
import { adicionarJogador, atualizarJogador, removerJogador, limparTudo } from "@/lib/acoes";
import { POSICOES, type Jogador, type Posicao } from "@/lib/types";

const FORM_VAZIO = { nome: "", apelido: "", telefone: "", posicao: "" as Posicao | "" };

const CORES_POSICAO: Record<Posicao, string> = {
  defensor: "bg-blue-light text-blue",
  meio: "bg-success-bg text-success",
  atacante: "bg-red-light text-red",
};

function rotuloPosicao(posicao?: Posicao) {
  return POSICOES.find((p) => p.valor === posicao)?.rotulo;
}

export default function JogadoresPage() {
  const { estado, carregando, atualizarEstado } = useEstado();
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (carregando) return <EstadoLoading />;

  function limparFormulario() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
  }

  function salvar() {
    const nome = form.nome.trim();
    if (!nome) {
      alert("Informe o nome do jogador.");
      return;
    }
    const dados = {
      nome,
      apelido: form.apelido.trim(),
      telefone: form.telefone.trim(),
      ...(form.posicao ? { posicao: form.posicao } : {}),
    };
    if (editandoId) {
      if (!confirm("Confirmar alterações neste jogador?")) return;
      atualizarEstado((atual) => atualizarJogador(atual, editandoId, dados));
    } else {
      atualizarEstado((atual) => adicionarJogador(atual, dados));
    }
    limparFormulario();
  }

  function editar(jogador: Jogador) {
    if (!confirm(`Editar o perfil de ${jogador.nome}?`)) return;
    setForm({
      nome: jogador.nome,
      apelido: jogador.apelido,
      telefone: jogador.telefone,
      posicao: jogador.posicao ?? "",
    });
    setEditandoId(jogador.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluir(jogador: Jogador) {
    if (!confirm(`Excluir ${jogador.nome}? Essa ação remove o jogador das listas.`)) return;
    atualizarEstado((atual) => removerJogador(atual, jogador.id));
  }

  function aoLimparTudo() {
    if (!confirm("Apagar todos os dados?")) return;
    atualizarEstado(() => limparTudo());
    limparFormulario();
  }

  const total = estado.jogadores.length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de jogadores</CardTitle>
          <CardDescription>Cadastre os jogadores do grupo para usá-los em mensalistas e avulsos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="jNome">Nome</Label>
              <Input
                id="jNome"
                placeholder="Nome nos relatórios"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="jApelido">Apelido</Label>
              <Input
                id="jApelido"
                placeholder="Apelido interno"
                value={form.apelido}
                onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="jPosicao">Posição</Label>
              <Select
                id="jPosicao"
                value={form.posicao}
                onChange={(e) => setForm((f) => ({ ...f, posicao: e.target.value as Posicao | "" }))}
              >
                <option value="">Sem posição</option>
                {POSICOES.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="jTelefone">Telefone</Label>
              <Input
                id="jTelefone"
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button onClick={salvar}>{editandoId ? "Salvar alterações" : "Adicionar jogador"}</Button>
            {editandoId && (
              <Button variant="secondary" onClick={limparFormulario}>
                Cancelar edição
              </Button>
            )}
            <Button variant="destructive" onClick={aoLimparTudo}>
              Limpar tudo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogadores cadastrados</CardTitle>
          <CardDescription>
            {total
              ? `${total} jogador${total === 1 ? "" : "es"} cadastrado${total === 1 ? "" : "s"}.`
              : "Nenhum jogador cadastrado."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="mt-3.5 rounded-md border border-dashed border-border-2 bg-surface-2 p-5.5 text-center text-sm text-muted">
              Nenhum jogador cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estado.jogadores.map((jogador) => (
                  <TableRow key={jogador.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-blue-light text-[13px] font-extrabold text-blue">
                          {(jogador.nome || "?").trim().charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong className="block text-[13.5px]">{jogador.nome}</strong>
                          <small className="block text-xs text-muted">
                            {jogador.apelido ? `Apelido: ${jogador.apelido}` : "Sem apelido"}
                          </small>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {jogador.posicao ? (
                        <Badge className={CORES_POSICAO[jogador.posicao]}>{rotuloPosicao(jogador.posicao)}</Badge>
                      ) : (
                        <span className="text-muted-2">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {jogador.telefone ? (
                        <a className="font-semibold text-blue hover:underline" href={`tel:${jogador.telefone}`}>
                          {jogador.telefone}
                        </a>
                      ) : (
                        <span className="text-muted-2">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="action-edit"
                          size="icon-circle"
                          title={`Editar ${jogador.nome}`}
                          onClick={() => editar(jogador)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="action-delete"
                          size="icon-circle"
                          title={`Excluir ${jogador.nome}`}
                          onClick={() => excluir(jogador)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
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
