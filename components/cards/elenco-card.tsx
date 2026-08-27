import { type CSSProperties, type ReactNode } from "react";
import { Flame, TrendingDown } from "lucide-react";
import { type Posicao } from "@/lib/types";
import { dataBRCompleta } from "@/lib/utils";

export interface JogadorEscalado {
  id: string;
  nome: string;
  numero?: string;
  posicao?: Posicao;
  nota: number;
  sequencia: number;
  sequenciaDerrota: number;
  campeao: boolean;
}

export interface ElencoCardProps {
  cor: "vermelho" | "azul";
  jogadores: JogadorEscalado[];
  data: string;
  numeroRodada: number;
}

const TEMAS = {
  vermelho: { label: "Vermelho", cor: "#ef4444", cor2: "#991b1b", soft: "rgba(239,68,68,.22)" },
  azul: { label: "Azul", cor: "#3b82f6", cor2: "#1e3a8a", soft: "rgba(59,130,246,.22)" },
} as const;

/** Camisa (shirt) em SVG, preenchida com a cor do time e o número no centro. */
function Camisa({ id, cor, cor2, numero, seq, seqDerrota }: {
  id: string;
  cor: string;
  cor2: string;
  numero: string;
  seq: number;
  seqDerrota: number;
}) {
  return (
    <div style={{ position: "relative", width: 58, height: 52, filter: "drop-shadow(0 6px 8px rgba(0,0,0,.35))" }}>
      <svg viewBox="0 0 100 90" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <linearGradient id={`camisa-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={cor} />
            <stop offset="1" stopColor={cor2} />
          </linearGradient>
        </defs>
        <path
          d="M35 5 L27 9 L5 22 L14 41 L26 35 L26 86 L74 86 L74 35 L86 41 L95 22 L73 9 L65 5 C60 12 40 12 35 5 Z"
          fill={`url(#camisa-${id})`}
          stroke="rgba(0,0,0,.18)"
          strokeWidth="1.5"
        />
        <path d="M35 5 C40 12 60 12 65 5 L61 8 C56 13 44 13 39 8 Z" fill="rgba(255,255,255,.35)" />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 6,
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,.35)",
        }}
      >
        {numero}
      </span>
      {seq > 0 ? (
        <Selo tipo="v">
          <Flame style={{ width: 11, height: 11 }} fill="#fff" /> {seq}
        </Selo>
      ) : seqDerrota > 0 ? (
        <Selo tipo="d">
          <TrendingDown style={{ width: 11, height: 11 }} /> {seqDerrota}
        </Selo>
      ) : null}
    </div>
  );
}

/** Badge de sequência sobre a camisa: chama (vitórias) ou seta (derrotas). */
function Selo({ tipo, children }: { tipo: "v" | "d"; children: ReactNode }) {
  const base: CSSProperties = {
    position: "absolute",
    top: -8,
    right: -11,
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    fontSize: 10.5,
    fontWeight: 900,
    padding: "2px 6px 2px 5px",
    borderRadius: 999,
    color: "#fff",
    border: "1.5px solid rgba(255,255,255,.6)",
    lineHeight: 1,
  };
  const cor: CSSProperties =
    tipo === "v"
      ? { background: "linear-gradient(135deg,#fdba74,#f97316)", boxShadow: "0 3px 11px rgba(249,115,22,.6), inset 0 1px 0 rgba(255,255,255,.45)" }
      : { background: "linear-gradient(135deg,#94a3b8,#475569)", boxShadow: "0 3px 9px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.4)" };
  return <span style={{ ...base, ...cor }}>{children}</span>;
}

/** Jogador na escalação: camisa + nome + nota. */
function JogadorNoCampo({ j, id, cor, cor2, numero }: {
  j: JogadorEscalado;
  id: string;
  cor: string;
  cor2: string;
  numero: string;
}) {
  return (
    <div style={{ width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <Camisa id={id} cor={cor} cor2={cor2} numero={numero} seq={j.sequencia} seqDerrota={j.sequenciaDerrota} />
      <div style={{ textAlign: "center", maxWidth: 90 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "-.01em",
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 1px 3px rgba(0,0,0,.6)",
          }}
        >
          {j.nome}
        </div>
        <span style={{ display: "inline-block", marginTop: 2, fontSize: 10.5, fontWeight: 900, color: "#052e16", background: "#fde047", padding: "0 6px", borderRadius: 999 }}>
          {j.nota.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

const linhaFila: CSSProperties = { display: "flex", justifyContent: "space-evenly", alignItems: "flex-start" };
const linhaCampo: CSSProperties = { position: "absolute", left: "50%", transform: "translateX(-50%)", borderColor: "rgba(255,255,255,.24)", borderStyle: "solid" };

/**
 * Card de escalação estilo lineup de futebol: campo verde em retrato com os
 * jogadores dispostos por linha (ataque → meio → defesa), camisas na cor do
 * time, nota média no cabeçalho e sequência por jogador. Baixável via html-to-image.
 */
export function ElencoCard({ cor, jogadores, data, numeroRodada }: ElencoCardProps) {
  const tema = TEMAS[cor];
  const media = jogadores.length ? jogadores.reduce((s, j) => s + j.nota, 0) / jogadores.length : 0;

  const porPos = (p: Posicao) => jogadores.filter((j) => j.posicao === p);
  const ata = porPos("atacante");
  const mei = porPos("meio");
  const def = porPos("defensor");
  const banco = jogadores.filter((j) => !j.posicao);

  // Número exibido na camisa: usa o do jogador ou uma sequência de reserva.
  const ordem = [...ata, ...mei, ...def, ...banco];
  const numeroDe = new Map(ordem.map((j, i) => [j.id, j.numero || String(i + 1)]));

  const filas = [ata, mei, def];

  return (
    <div style={{ width: "100%", borderRadius: 22, overflow: "hidden", background: "#0a1526", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Cabeçalho colorido do time */}
      <div
        style={{
          position: "relative",
          padding: "18px 20px",
          background: `linear-gradient(120deg, ${tema.cor} 0%, ${tema.cor2} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 140% at 100% 0%, rgba(255,255,255,.22), transparent 55%)" }} />
        <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
            Gibs FC · {numeroRodada}ª Rodada
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em", color: "#fff", lineHeight: 1.05, marginTop: 2 }}>
            Time {tema.label}
          </h2>
        </div>
        <div style={{ position: "relative", zIndex: 1, textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 0.9, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,.3)" }}>
            {media.toFixed(1)}
            <span style={{ display: "block", fontSize: 9.5, fontWeight: 800, letterSpacing: ".18em", color: "rgba(255,255,255,.8)", marginTop: 2 }}>NOTA</span>
          </div>
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", color: tema.cor2, background: "#fff", padding: "4px 10px", borderRadius: 999 }}>
            {jogadores.length} escalados
          </span>
        </div>
      </div>

      {/* Campo */}
      <div
        style={{
          position: "relative",
          padding: "26px 14px 18px",
          background: `radial-gradient(120% 60% at 50% 0%, ${tema.soft}, transparent 60%), repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 46px, transparent 46px 92px), linear-gradient(180deg, #178a49 0%, #0c5c30 100%)`,
        }}
      >
        {/* Linhas do campo */}
        <span style={{ ...linhaCampo, top: 0, width: 150, height: 46, borderWidth: 2, borderTop: 0 }} />
        <span style={{ ...linhaCampo, top: 0, width: 66, height: 14, borderWidth: 2, borderTop: 0 }} />
        <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "rgba(255,255,255,.28)" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 108, height: 108, transform: "translate(-50%,-50%)", border: "2px solid rgba(255,255,255,.28)", borderRadius: "50%" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, transform: "translate(-50%,-50%)", background: "rgba(255,255,255,.4)", borderRadius: "50%" }} />
        <span style={{ ...linhaCampo, bottom: 0, width: 150, height: 46, borderWidth: 2, borderBottom: 0 }} />
        <span style={{ ...linhaCampo, bottom: 0, width: 66, height: 14, borderWidth: 2, borderBottom: 0 }} />

        {/* Linhas de jogadores: ataque → meio → defesa */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          {filas.map((fila, fi) =>
            fila.length ? (
              <div key={fi} style={linhaFila}>
                {fila.map((j) => (
                  <JogadorNoCampo key={j.id} j={j} id={j.id} cor={tema.cor} cor2={tema.cor2} numero={numeroDe.get(j.id)!} />
                ))}
              </div>
            ) : null,
          )}
        </div>

        {/* Banco / sem posição */}
        {banco.length > 0 && (
          <div style={{ position: "relative", zIndex: 1, marginTop: 18, paddingTop: 14, borderTop: "1px dashed rgba(255,255,255,.2)" }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginBottom: 8, textAlign: "center" }}>
              Sem posição definida
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {banco.map((j) => (
                <span key={j.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,.12)", padding: "4px 9px", borderRadius: 999 }}>
                  {j.nome} <b style={{ color: "#fde047" }}>{j.nota.toFixed(1)}</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#0a1526", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
        <span style={{ color: tema.cor, fontWeight: 900, letterSpacing: ".14em" }}>Gibs FC</span>
        <span>{dataBRCompleta(data)}</span>
      </div>
    </div>
  );
}
