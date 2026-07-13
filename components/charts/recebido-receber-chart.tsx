"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { dinheiro } from "@/lib/utils";
import { CORES } from "@/lib/chart-colors";
import { LegendaGrafico } from "./chart-legend";

export function RecebidoReceberChart({ recebido, aReceber }: { recebido: number; aReceber: number }) {
  const dados = [
    { nome: "Recebido", valor: recebido, cor: CORES.verde },
    { nome: "A receber", valor: aReceber, cor: CORES.dourado },
  ].filter((d) => d.valor > 0);

  if (!dados.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-center text-sm text-muted">
        Nenhum valor lançado no período
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[230px] w-full sm:w-[55%]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={4}
              cornerRadius={8}
              strokeWidth={3}
              stroke="#fff"
            >
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => dinheiro(Number(value))}
              contentStyle={{ borderRadius: 10, border: `1px solid ${CORES.borda}`, fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <LegendaGrafico itens={dados.map((d) => ({ nome: d.nome, valor: d.valor, cor: d.cor }))} />
    </div>
  );
}
