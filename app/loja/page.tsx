"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Shirt, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vazio } from "@/components/shared/list-ui";
import { assinarLoja, gravarLoja, type Uniforme } from "@/lib/loja";
import { comprimirImagem } from "@/lib/imagem";
import { cn, dinheiro, gerarId } from "@/lib/utils";

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG"];
const FORM_VAZIO = {
  nome: "",
  tipo: "",
  preco: "",
  tamanhos: [] as string[],
  descricao: "",
  foto: "",
  disponivel: true,
};

export default function LojaAdminPage() {
  const [uniformes, setUniformes] = useState<Uniforme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cancelar = assinarLoja((lista) => {
      setUniformes(lista);
      setCarregando(false);
    });
    return () => cancelar();
  }, []);

  const total = uniformes.length;
  const disponiveis = useMemo(() => uniformes.filter((u) => u.disponivel).length, [uniformes]);

  function limparFormulario() {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setProcessandoFoto(true);
    try {
      const foto = await comprimirImagem(arquivo);
      setForm((f) => ({ ...f, foto }));
    } catch {
      alert("Não foi possível processar a imagem.");
    } finally {
      setProcessandoFoto(false);
    }
  }

  function alternarTamanho(t: string) {
    setForm((f) => ({
      ...f,
      tamanhos: f.tamanhos.includes(t) ? f.tamanhos.filter((x) => x !== t) : [...f.tamanhos, t],
    }));
  }

  function salvar() {
    if (!form.nome.trim()) {
      alert("Informe o nome/modelo do uniforme.");
      return;
    }
    if (!form.foto) {
      alert("Adicione uma foto do uniforme.");
      return;
    }
    const dados: Uniforme = {
      id: editandoId ?? gerarId(),
      nome: form.nome.trim(),
      tipo: form.tipo.trim(),
      preco: Number(form.preco) || 0,
      tamanhos: TAMANHOS.filter((t) => form.tamanhos.includes(t)), // mantém a ordem padrão
      descricao: form.descricao.trim(),
      foto: form.foto,
      disponivel: form.disponivel,
      ordem: editandoId ? (uniformes.find((u) => u.id === editandoId)?.ordem ?? uniformes.length) : uniformes.length,
    };
    const lista = editandoId ? uniformes.map((u) => (u.id === editandoId ? dados : u)) : [...uniformes, dados];
    gravarLoja(lista).catch((e) => alert("Erro ao salvar: " + e));
    limparFormulario();
  }

  function editar(u: Uniforme) {
    setEditandoId(u.id);
    setForm({
      nome: u.nome,
      tipo: u.tipo,
      preco: String(u.preco || ""),
      tamanhos: u.tamanhos,
      descricao: u.descricao,
      foto: u.foto,
      disponivel: u.disponivel,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluir(u: Uniforme) {
    if (!confirm(`Remover "${u.nome}" da vitrine?`)) return;
    gravarLoja(uniformes.filter((x) => x.id !== u.id)).catch((e) => alert("Erro ao remover: " + e));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="size-5 text-blue" />
              {editandoId ? "Editar uniforme" : "Cadastrar uniforme"}
            </CardTitle>
            <CardDescription>
              Monte a vitrine da loja do Gibs. Só exibição — sem pagamento. Aparece em{" "}
              <a href="/loja.html" target="_blank" className="font-semibold text-blue hover:underline">
                /loja.html
              </a>
              .
            </CardDescription>
          </div>
          {editandoId && (
            <Button variant="ghost" onClick={limparFormulario}>
              <X /> Cancelar edição
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            {/* Foto */}
            <div>
              <Label>Foto</Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-2 bg-surface-2 text-muted transition-colors hover:border-blue-3",
                  form.foto && "border-solid",
                )}
              >
                {processandoFoto ? (
                  <Loader2 className="size-7 animate-spin text-blue" />
                ) : form.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.foto} alt="Prévia" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-xs font-semibold">
                    <ImagePlus className="size-7" />
                    Enviar foto
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={selecionarFoto} />
              {form.foto && (
                <button
                  onClick={() => setForm((f) => ({ ...f, foto: "" }))}
                  className="mt-1.5 text-[12px] font-semibold text-danger hover:underline"
                >
                  Remover foto
                </button>
              )}
            </div>

            {/* Campos */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="uNome">Nome / modelo</Label>
                <Input
                  id="uNome"
                  placeholder="Camisa Oficial 2026"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="uTipo">Tipo</Label>
                <Input
                  id="uTipo"
                  placeholder="Camisa I, Goleiro, Regata…"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="uPreco">Preço</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] font-bold text-muted">
                    R$
                  </span>
                  <Input
                    id="uPreco"
                    type="number"
                    step="0.01"
                    className="pl-9"
                    placeholder="0,00"
                    value={form.preco}
                    onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Disponibilidade</Label>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, disponivel: !f.disponivel }))}
                  className={cn(
                    "flex min-h-10 w-full items-center justify-center rounded-sm border px-3 text-sm font-bold transition-colors",
                    form.disponivel
                      ? "border-success bg-success-bg text-success"
                      : "border-border-2 bg-surface-2 text-muted",
                  )}
                >
                  {form.disponivel ? "✓ Disponível" : "Esgotado"}
                </button>
              </div>
              <div className="sm:col-span-2">
                <Label>Tamanhos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TAMANHOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => alternarTamanho(t)}
                      className={cn(
                        "min-w-11 rounded-sm border px-3 py-1.5 text-[13px] font-bold transition-colors",
                        form.tamanhos.includes(t)
                          ? "border-blue bg-blue text-white"
                          : "border-border-2 bg-white text-text-2 hover:border-blue-3",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="uDesc">Descrição</Label>
                <Input
                  id="uDesc"
                  placeholder="Detalhes, tecido, observações…"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={salvar} disabled={processandoFoto}>
              {editandoId ? (
                <>
                  <Pencil /> Salvar alterações
                </>
              ) : (
                <>
                  <Plus /> Adicionar à vitrine
                </>
              )}
            </Button>
            {editandoId && (
              <Button variant="secondary" onClick={limparFormulario}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vitrine ({total})</CardTitle>
          <CardDescription>
            {total ? `${disponiveis} disponível(is) de ${total} uniforme(s).` : "Nenhum uniforme cadastrado ainda."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <Vazio texto="Carregando vitrine…" />
          ) : total === 0 ? (
            <Vazio texto="Cadastre o primeiro uniforme acima para montar a vitrine." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {uniformes.map((u) => (
                <div
                  key={u.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs"
                >
                  <div className="relative aspect-square overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.foto}
                      alt={u.nome}
                      className={cn("h-full w-full object-cover", !u.disponivel && "opacity-50 grayscale")}
                    />
                    {!u.disponivel && (
                      <span className="absolute left-2 top-2 rounded-sm bg-danger px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        Esgotado
                      </span>
                    )}
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="action-edit" size="icon-sm" title="Editar" onClick={() => editar(u)}>
                        <Pencil />
                      </Button>
                      <Button variant="action-delete" size="icon-sm" title="Remover" onClick={() => excluir(u)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    {u.tipo && <span className="text-[10px] font-bold uppercase tracking-wider text-blue">{u.tipo}</span>}
                    <strong className="text-[13px] leading-tight">{u.nome}</strong>
                    {u.tamanhos.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {u.tamanhos.map((t) => (
                          <Badge key={t} className="bg-surface-2 px-1.5 py-0 text-[10px] text-muted">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <strong className="mt-auto pt-1 text-[15px] text-blue">{dinheiro(u.preco)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
