"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dinheiro } from "@/lib/utils";
import { CORES, PALETA_CATEGORICA } from "@/lib/chart-colors";
import type { CategoriaDespesa } from "@/lib/calculos";

export function DespesasCategoriaChart({ dados }: { dados: CategoriaDespesa[] }) {
  if (!dados.length) {
    return (
      <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted">
        Nenhuma despesa lançada no período
      </div>
    );
  }

  const altura = Math.max(220, dados.length * 42);

  return (
    <div style={{ height: altura }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 56, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CORES.borda} />
          <XAxis
            type="number"
            tickFormatter={(v) => dinheiro(v)}
            tick={{ fontSize: 11, fill: CORES.neutro }}
            axisLine={{ stroke: CORES.borda }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="categoria"
            width={120}
            tick={{ fontSize: 12, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => dinheiro(Number(value))}
            contentStyle={{ borderRadius: 10, border: `1px solid ${CORES.borda}`, fontSize: 13 }}
          />
          <Bar dataKey="valor" radius={[0, 8, 8, 0]} barSize={22}>
            {dados.map((entry, i) => (
              <Cell key={entry.categoria} fill={PALETA_CATEGORICA[i % PALETA_CATEGORICA.length]} />
            ))}
            <LabelList
              dataKey="valor"
              position="right"
              formatter={(value) => dinheiro(Number(value))}
              style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
