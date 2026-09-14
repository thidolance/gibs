"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PontoEvolucao } from "@/lib/calculos";
import { dataBR } from "@/lib/utils";

// Cor do ponto conforme o que aconteceu na rodada.
const COR_RESULTADO: Record<PontoEvolucao["resultado"], string> = {
  vitoria: "#4ade80",
  derrota: "#f87171",
  empate: "#e2e8f0",
  ausencia: "#fb923c",
};

const ROTULO_RESULTADO: Record<PontoEvolucao["resultado"], string> = {
  vitoria: "Vitória",
  derrota: "Derrota",
  empate: "Empate",
  ausencia: "Faltou",
};

interface TooltipPayload {
  payload: PontoEvolucao;
}

function TooltipNota({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/15 bg-[#0b1430] px-3 py-2 text-xs shadow-lg">
      <div className="font-bold text-gold">Nota {p.nota.toFixed(1)}</div>
      <div className="text-white/60">
        {dataBR(p.data)} · <span style={{ color: COR_RESULTADO[p.resultado] }}>{ROTULO_RESULTADO[p.resultado]}</span>
      </div>
    </div>
  );
}

// Ponto colorido de acordo com o resultado da rodada.
function PontoColorido(props: { cx?: number; cy?: number; payload?: PontoEvolucao }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return <g />;
  return <circle cx={cx} cy={cy} r={3.5} fill={COR_RESULTADO[payload.resultado]} stroke="#0b1430" strokeWidth={1.5} />;
}

/** Gráfico de área com a evolução da nota do jogador ao longo das rodadas (tema escuro). */
export function NotaEvolucaoChart({ dados }: { dados: PontoEvolucao[] }) {
  if (dados.length < 2) {
    return (
      <div className="rounded-lg bg-white/[0.04] px-4 py-6 text-center text-sm text-white/40">
        Precisa de pelo menos 2 rodadas para desenhar a evolução da nota.
      </div>
    );
  }

  const notas = dados.map((d) => d.nota);
  const min = Math.min(...notas);
  const max = Math.max(...notas);
  const pad = Math.max(0.2, (max - min) * 0.25);
  let domMin = Math.max(6, Math.floor((min - pad) * 10) / 10);
  let domMax = Math.min(10, Math.ceil((max + pad) * 10) / 10);
  if (domMin === domMax) {
    domMin = Math.max(6, domMin - 0.3);
    domMax = Math.min(10, domMax + 0.3);
  }

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-nota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" vertical={false} />
          <ReferenceLine y={6} stroke="rgba(255,255,255,.18)" strokeDasharray="2 2" />
          <XAxis
            dataKey="rodada"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,.45)" }}
            axisLine={{ stroke: "rgba(255,255,255,.12)" }}
            tickLine={false}
          />
          <YAxis
            domain={[domMin, domMax]}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,.45)" }}
            tickFormatter={(v) => Number(v).toFixed(1)}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip content={<TooltipNota />} cursor={{ stroke: "rgba(255,255,255,.2)" }} />
          <Area
            type="monotone"
            dataKey="nota"
            stroke="#fbbf24"
            strokeWidth={2.5}
            fill="url(#grad-nota)"
            dot={<PontoColorido />}
            activeDot={{ r: 5, fill: "#fbbf24", stroke: "#0b1430", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
