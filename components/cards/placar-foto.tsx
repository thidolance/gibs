import { type CSSProperties } from "react";
import { Crown, Flame, TrendingDown } from "lucide-react";
import { POSICOES, type Posicao } from "@/lib/types";

/**
 * Placar para foto (download): réplica fiel do board do site público (gibs.css),
 * feito com estilos inline para garantir fidelidade no html-to-image.
 * Serve tanto para a Classificação quanto para o Ranking.
 */

const COR = {
  gold: "#f59e0b",
  green: "#4ade80",
  muted: "rgba(255,255,255,.58)",
  muted2: "rgba(255,255,255,.34)",
  line: "rgba(255,255,255,.10)",
  line2: "rgba(255,255,255,.16)",
};

const POS_ABREV: Record<Posicao, string> = { defensor: "DEF", meio: "MEI", atacante: "ATA" };
const POS_TAG: Record<Posicao, CSSProperties> = {
  defensor: { background: "rgba(59,130,246,.22)", color: "#93c5fd" },
  meio: { background: "rgba(34,197,94,.22)", color: "#4ade80" },
  atacante: { background: "rgba(255,46,46,.25)", color: "#ff8080" },
};

const badgePos = (i: number): CSSProperties =>
  i === 0
    ? { background: "linear-gradient(135deg,#fbbf24,#d97706)", color: "#3a2500" }
    : i === 1
      ? { background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", color: "#1e293b" }
      : i === 2
        ? { background: "linear-gradient(135deg,#e0a26a,#a15a1e)", color: "#fff" }
        : { background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)" };
const accPos = (i: number) =>
  i === 0 ? "#f59e0b" : i === 1 ? "rgba(255,255,255,.5)" : i === 2 ? "#c07a3a" : "#ef4444";
const rowBg = (i: number) =>
  i === 0
    ? "linear-gradient(90deg,rgba(245,158,11,.18),rgba(245,158,11,.02))"
    : i < 3
      ? "rgba(255,255,255,.05)"
      : "rgba(255,255,255,.025)";

export interface LinhaFoto {
  id: string;
  nome: string;
  posicao?: Posicao;
  campeao: boolean;
  destaque: string;
  mov?: number;
  seq?: number;
  seqDerrota?: number;
  /** Colunas numéricas extras, na ordem do cabeçalho (ex.: V, E, D, J). */
  valores: { valor: string | number; esmaecido?: boolean }[];
}

export interface PlacarFotoProps {
  meta: string;
  titulo: string;
  tituloSpan: string;
  destaqueLabel: string;
  /** Rótulos das colunas numéricas extras (largura fixa 30px cada). */
  colunas: string[];
  temMov?: boolean;
  temSeq?: boolean;
  linhas: LinhaFoto[];
  legendaFim: string;
}

function Coroa() {
  return (
    <Crown
      style={{ width: 15, height: 15, margin: "0 3px -3px", color: COR.gold, filter: "drop-shadow(0 0 5px rgba(245,158,11,.6))" }}
      fill={COR.gold}
    />
  );
}

function CelulaMov({ mov = 0 }: { mov?: number }) {
  const base: CSSProperties = {
    width: 46,
    textAlign: "center",
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
  };
  const pill: CSSProperties = { padding: "2px 5px", borderRadius: 6, display: "inline-block" };
  if (mov > 0) return <span style={base}><span style={{ ...pill, color: COR.green, background: "rgba(74,222,128,.14)" }}>▲ {mov}</span></span>;
  if (mov < 0) return <span style={base}><span style={{ ...pill, color: "#ff6b6b", background: "rgba(255,46,46,.16)" }}>▼ {Math.abs(mov)}</span></span>;
  return <span style={base}><span style={{ color: COR.muted2 }}>—</span></span>;
}

function CelulaSeq({ seq = 0, seqDerrota = 0 }: { seq?: number; seqDerrota?: number }) {
  const wrap: CSSProperties = { width: 48, flexShrink: 0, display: "flex", justifyContent: "flex-end" };
  const chip: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 900, fontSize: 13 };
  const ic: CSSProperties = { width: 13, height: 13 };
  if (seq > 0)
    return (
      <span style={wrap}>
        <span style={{ ...chip, color: "#fb923c" }}>
          <Flame style={ic} fill="#fb923c" /> {seq}
        </span>
      </span>
    );
  if (seqDerrota > 0)
    return (
      <span style={wrap}>
        <span style={{ ...chip, color: "#f87171" }}>
          <TrendingDown style={ic} /> {seqDerrota}
        </span>
      </span>
    );
  return (
    <span style={wrap}>
      <span style={{ color: COR.muted2 }}>—</span>
    </span>
  );
}

export function PlacarFoto({
  meta,
  titulo,
  tituloSpan,
  destaqueLabel,
  colunas,
  temMov,
  temSeq,
  linhas,
  legendaFim,
}: PlacarFotoProps) {
  const wNum: CSSProperties = { width: 30, textAlign: "right", flexShrink: 0 };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: 520,
        background: "linear-gradient(180deg,rgba(12,20,46,.72),rgba(6,12,30,.55))",
        border: `1px solid ${COR.line2}`,
        borderRadius: 18,
        padding: 22,
        color: "#fff",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg,#3b82f6 0%,#6d5bd0 50%,#ff2e2e 100%)",
        }}
      />

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", color: COR.gold, marginBottom: 3 }}>
        {meta}
      </div>
      <h2 style={{ fontSize: 23, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.01em", marginBottom: 16 }}>
        {titulo}{" "}
        <span
          style={{
            background: "linear-gradient(100deg,#ff2e2e,#9333ea 60%,#3b82f6)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {tituloSpan}
        </span>
      </h2>

      {/* Cabeçalho de colunas */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 10px 10px",
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          color: COR.muted2,
        }}
      >
        <span style={{ width: 28, textAlign: "center", flexShrink: 0 }}>#</span>
        {temMov && <span style={{ width: 46, textAlign: "center", flexShrink: 0 }}>Mov</span>}
        <span style={{ flex: 1 }}>Jogador</span>
        <span style={{ width: 54, textAlign: "right", flexShrink: 0, color: COR.gold }}>{destaqueLabel}</span>
        {colunas.map((c) => (
          <span key={c} style={wNum}>
            {c}
          </span>
        ))}
        {temSeq && <span style={{ width: 48, textAlign: "right", flexShrink: 0 }}>Seq</span>}
      </div>

      {/* Linhas */}
      <div>
        {linhas.map((l, i) => (
          <div
            key={l.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px 8px 0",
              borderRadius: 12,
              background: rowBg(i),
              boxShadow: i === 0 ? "inset 0 0 0 1px rgba(245,158,11,.32)" : "none",
              marginBottom: 5,
            }}
          >
            <span style={{ width: 4, height: 30, borderRadius: 99, flexShrink: 0, background: accPos(i) }} />
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 12,
                flexShrink: 0,
                boxShadow: "0 3px 8px -3px rgba(0,0,0,.5)",
                ...badgePos(i),
              }}
            >
              {i + 1}
            </span>
            {temMov && <CelulaMov mov={l.mov} />}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "-.01em",
                fontSize: 15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome}</span>
              {l.campeao && <Coroa />}
              {l.posicao && (
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: ".04em",
                    padding: "2px 6px",
                    borderRadius: 5,
                    ...POS_TAG[l.posicao],
                  }}
                >
                  {POS_ABREV[l.posicao]}
                </span>
              )}
            </span>
            <span
              style={{
                width: 54,
                textAlign: "right",
                flexShrink: 0,
                fontSize: 20,
                fontWeight: 900,
                color: COR.gold,
                textShadow: "0 0 16px rgba(245,158,11,.35)",
              }}
            >
              {l.destaque}
            </span>
            {l.valores.map((v, k) => (
              <span key={k} style={{ ...wNum, fontSize: 14, color: v.esmaecido ? COR.muted2 : "rgba(255,255,255,.85)" }}>
                {v.valor}
              </span>
            ))}
            {temSeq && <CelulaSeq seq={l.seq} seqDerrota={l.seqDerrota} />}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${COR.line}`,
          fontSize: 10.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          color: COR.muted2,
          alignItems: "center",
        }}
      >
        {POSICOES.map((p) => (
          <span key={p.valor} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".04em", padding: "2px 6px", borderRadius: 5, ...POS_TAG[p.valor] }}>
              {p.abrev}
            </span>
            {p.rotulo}
          </span>
        ))}
        <span style={{ marginLeft: "auto", textTransform: "none", letterSpacing: "normal" }}>{legendaFim}</span>
      </div>
    </div>
  );
}
