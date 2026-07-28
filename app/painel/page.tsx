"use client";

import { Clock, PiggyBank, UserCheck, UserPlus, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ListaPendentes, type ItemPendente } from "@/components/dashboard/lista-pendentes";
import { ComposicaoEntradasChart } from "@/components/charts/composicao-entradas-chart";
import { RecebidoReceberChart } from "@/components/charts/recebido-receber-chart";
import { DespesasCategoriaChart } from "@/components/charts/despesas-categoria-chart";
import { EvolucaoMensalChart } from "@/components/charts/evolucao-mensal-chart";
import { EstadoLoading } from "@/components/layout/estado-loading";
import { useEstado } from "@/lib/estado-context";
import {
  avulsosDoMes,
  dadosCaixa,
  despesasPorCategoria,
  evolucaoMensal,
  getMensalMes,
  valorAvulsoFixo,
  valorMensalistaJogador,
} from "@/lib/calculos";
import { dataBR, dinheiro } from "@/lib/utils";
import type { Jogador } from "@/lib/types";

export default function DashboardPage() {
  const { estado, carregando } = useEstado();

  if (carregando) return <EstadoLoading />;

  const { mes } = estado;
  const dados = dadosCaixa(estado, mes);
  const evolucao = evolucaoMensal(estado, 6);
  const categorias = despesasPorCategoria(estado, mes);
  const mensal = getMensalMes(estado, mes);

  const composicaoEntradas = [
    { nome: "Mensalistas", valor: dados.mensaisPagos },
    { nome: "Avulsos", valor: dados.avulsos },
    { nome: "Receitas extras", valor: dados.receitasExtras },
  ];

  const buscarJogador = (id: string) => estado.jogadores.find((j) => j.id === id);

  const mensalistasPendentes: ItemPendente[] = mensal.confirmados
    .filter((id) => !mensal.pagos.includes(id))
    .map((id) => buscarJogador(id))
    .filter((j): j is Jogador => Boolean(j))
    .map((j) => ({
      id: j.id,
      titulo: j.nome,
      subtitulo: dinheiro(valorMensalistaJogador(estado, mes, j.id)),
    }));

  const avulsosPendentes: ItemPendente[] = avulsosDoMes(estado, mes).flatMap((g) =>
    g.jogadores
      .filter((id) => !g.pagos.includes(id))
      .map((id) => buscarJogador(id))
      .filter((j): j is Jogador => Boolean(j))
      .map((j) => ({
        id: `${g.data}-${j.id}`,
        titulo: j.nome,
        subtitulo: `${dataBR(g.data)} · ${dinheiro(valorAvulsoFixo(estado))}`,
      })),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          titulo="Mensais recebidos"
          valor={dinheiro(dados.mensaisPagos)}
          legenda={`${dados.qtdMensaisPagos}/${dados.qtdMensais} pagos`}
          variante="success"
          progresso={dados.qtdMensais ? (dados.qtdMensaisPagos / dados.qtdMensais) * 100 : 0}
          icone={<UserCheck />}
        />
        <MetricCard
          titulo="Avulsos recebidos"
          valor={dinheiro(dados.avulsos)}
          legenda={`${dados.qtdAvulsosPagos}/${dados.qtdAvulsos} pagos`}
          variante="success"
          progresso={dados.qtdAvulsos ? (dados.qtdAvulsosPagos / dados.qtdAvulsos) * 100 : 0}
          icone={<UserPlus />}
        />
        <MetricCard
          titulo="Total recebido"
          valor={dinheiro(dados.entradas)}
          legenda="Mensais + avulsos + verbas"
          variante="primary"
          icone={<Wallet />}
        />
        <MetricCard
          titulo="Total a receber"
          valor={dinheiro(dados.valoresAReceber)}
          legenda="Mensais + avulsos pendentes"
          variante="warning"
          icone={<Clock />}
        />
        <MetricCard
          titulo="Saldo atual"
          valor={dinheiro(dados.saldo)}
          legenda="Recebido − despesas"
          variante="blue"
          icone={<PiggyBank />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composição das entradas</CardTitle>
            <CardDescription>Mensalistas, avulsos e receitas extras recebidas no mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <ComposicaoEntradasChart dados={composicaoEntradas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recebido vs a receber</CardTitle>
            <CardDescription>Quanto já entrou no caixa e quanto ainda falta confirmar.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecebidoReceberChart recebido={dados.entradas} aReceber={dados.valoresAReceber} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal</CardTitle>
          <CardDescription>Entradas, despesas e saldo nos últimos meses com lançamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          <EvolucaoMensalChart dados={evolucao} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
            <CardDescription>Para onde foi o dinheiro do grupo neste mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <DespesasCategoriaChart dados={categorias} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensalistas pendentes</CardTitle>
              <CardDescription>Confirmados que ainda não foram marcados como pagos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ListaPendentes itens={mensalistasPendentes} vazio="Todos os mensalistas estão em dia." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avulsos pendentes</CardTitle>
              <CardDescription>Avulsos do mês que ainda não foram marcados como pagos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ListaPendentes itens={avulsosPendentes} vazio="Todos os avulsos do mês estão em dia." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
