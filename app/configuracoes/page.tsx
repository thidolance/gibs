"use client";

import type { ReactNode } from "react";
import { DollarSign, MapPin, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { useEstado } from "@/lib/estado-context";
import { salvarConfiguracoes } from "@/lib/acoes";
import type { Configuracoes } from "@/lib/types";

export default function ConfiguracoesPage() {
  const { estado, carregando, atualizarEstado } = useEstado();

  if (carregando) return <EstadoLoading />;

  const { configuracoes: cfg } = estado;

  function salvarCampo<K extends keyof Configuracoes>(campo: K, valor: Configuracoes[K]) {
    atualizarEstado((atual) => salvarConfiguracoes(atual, { ...atual.configuracoes, [campo]: valor }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>
          Esses valores são usados como padrão nas cobranças, relatórios e mensagens. As alterações são salvas
          automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SecaoConfig icone={<DollarSign className="size-[15px]" />} titulo="Valores de cobrança">
            <div>
              <Label htmlFor="cfgValorMensal">Mensalidade</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] font-bold text-muted">
                  R$
                </span>
                <Input
                  id="cfgValorMensal"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  value={cfg.valorMensal}
                  onChange={(e) => salvarCampo("valorMensal", Number(e.target.value || 0))}
                />
              </div>
              <small className="mt-1 block text-[11.5px] text-muted-2">Cobrado de cada mensalista por mês</small>
            </div>
            <div>
              <Label htmlFor="cfgValorAvulso">Avulso</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[13px] font-bold text-muted">
                  R$
                </span>
                <Input
                  id="cfgValorAvulso"
                  type="number"
                  step="0.01"
                  className="pl-9"
                  value={cfg.valorAvulso}
                  onChange={(e) => salvarCampo("valorAvulso", Number(e.target.value || 0))}
                />
              </div>
              <small className="mt-1 block text-[11.5px] text-muted-2">Cobrado por jogo de quem não é mensalista</small>
            </div>
          </SecaoConfig>

          <SecaoConfig icone={<Smartphone className="size-[15px]" />} titulo="Chaves PIX">
            <div>
              <Label htmlFor="cfgPixMensal">PIX mensal</Label>
              <Input
                id="cfgPixMensal"
                value={cfg.pixMensal}
                onChange={(e) => salvarCampo("pixMensal", e.target.value)}
              />
              <small className="mt-1 block text-[11.5px] text-muted-2">Usada nas cobranças de mensalistas</small>
            </div>
            <div>
              <Label htmlFor="cfgPixAvulso">PIX avulso</Label>
              <Input
                id="cfgPixAvulso"
                value={cfg.pixAvulso}
                onChange={(e) => salvarCampo("pixAvulso", e.target.value)}
              />
              <small className="mt-1 block text-[11.5px] text-muted-2">Usada nas cobranças de avulsos</small>
            </div>
          </SecaoConfig>

          <SecaoConfig icone={<MapPin className="size-[15px]" />} titulo="Padrão dos jogos">
            <div>
              <Label htmlFor="cfgLocalPadrao">Local</Label>
              <Input
                id="cfgLocalPadrao"
                value={cfg.localPadrao}
                onChange={(e) => salvarCampo("localPadrao", e.target.value)}
              />
              <small className="mt-1 block text-[11.5px] text-muted-2">Sugerido ao criar um novo jogo avulso</small>
            </div>
            <div>
              <Label htmlFor="cfgHorarioPadrao">Horário</Label>
              <Input
                id="cfgHorarioPadrao"
                type="time"
                value={cfg.horarioPadrao}
                onChange={(e) => salvarCampo("horarioPadrao", e.target.value)}
              />
              <small className="mt-1 block text-[11.5px] text-muted-2">Sugerido ao criar um novo jogo avulso</small>
            </div>
          </SecaoConfig>
        </div>
      </CardContent>
    </Card>
  );
}

function SecaoConfig({ icone, titulo, children }: { icone: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <h4 className="mb-3.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
        <span className="text-accent">{icone}</span>
        {titulo}
      </h4>
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  );
}
