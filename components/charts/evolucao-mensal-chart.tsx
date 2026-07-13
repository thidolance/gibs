"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dinheiro } from "@/lib/utils";
import { CORES } from "@/lib/chart-colors";
import type { PontoEvolucaoMensal } from "@/lib/calculos";

export function EvolucaoMensalChart({ dados }: { dados: PontoEvolucaoMensal[] }) {
  if (dados.length < 2) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center text-sm text-muted">
        Lance dados em pelo menos 2 meses para visualizar a evolução
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CORES.borda} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: CORES.neutro }} axisLine={{ stroke: CORES.borda }} tickLine={false} />
          <YAxis
            tickFormatter={(v) => dinheiro(v)}
            tick={{ fontSize: 11, fill: CORES.neutro }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value) => dinheiro(Number(value))}
            contentStyle={{ borderRadius: 10, border: `1px solid ${CORES.borda}`, fontSize: 13 }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12, fontWeight: 600 }} />
          <Bar dataKey="entradas" name="Entradas" fill={CORES.verde} radius={[6, 6, 0, 0]} barSize={22} />
          <Bar dataKey="despesas" name="Despesas" fill={CORES.vermelho} radius={[6, 6, 0, 0]} barSize={22} />
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo"
            stroke={CORES.azul}
            strokeWidth={3}
            dot={{ r: 4, fill: CORES.azul, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
