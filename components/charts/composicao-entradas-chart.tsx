"use client";

import dynamic from "next/dynamic";
import type { IPieChartSpec } from "@visactor/react-vchart";
import { CORES } from "@/lib/chart-colors";
import { LegendaGrafico } from "./chart-legend";

const VChart = dynamic(() => import("@visactor/react-vchart").then((m) => m.VChart), { ssr: false });

export interface FatiaComposicao {
  nome: string;
  valor: number;
}

const PALETA = [CORES.azul, CORES.vermelho, CORES.dourado];

export function ComposicaoEntradasChart({ dados }: { dados: FatiaComposicao[] }) {
  const fatias = dados.filter((d) => d.valor > 0);

  if (!fatias.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-center text-sm text-muted">
        Nenhuma entrada registrada no período
      </div>
    );
  }

  const total = fatias.reduce((s, f) => s + f.valor, 0);

  const spec: IPieChartSpec = {
    type: "pie",
    data: { values: fatias },
    categoryField: "nome",
    valueField: "valor",
    outerRadius: 0.88,
    innerRadius: 0.62,
    padAngle: 1.2,
    cornerRadius: 8,
    color: PALETA,
    pie: {
      style: { stroke: "#fff", lineWidth: 3 },
      state: { hover: { outerRadius: 0.95 } },
    },
    label: {
      visible: true,
      position: "outside",
      formatMethod: (_text, datum) => `${Math.round(((datum?.valor ?? 0) / total) * 100)}%`,
      style: { fontSize: 12, fontWeight: 700, fill: "#374151" },
    },
    legends: { visible: false },
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[230px] w-full sm:w-[55%]">
        <VChart spec={spec} />
      </div>
      <LegendaGrafico
        itens={fatias.map((f, i) => ({ nome: f.nome, valor: f.valor, cor: PALETA[i % PALETA.length] }))}
      />
    </div>
  );
}
