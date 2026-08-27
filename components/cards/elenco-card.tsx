"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
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

/**
 * Nome do jogador com largura fixa: mede se o nome inteiro cabe e, quando não
 * couber, mostra só o primeiro nome (reticências como salvaguarda final).
 */
function NomeJogador({ nome }: { nome: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(nome);

  // Sempre parte do nome completo quando o nome muda.
  useEffect(() => setTexto(nome), [nome]);

  // Se transbordar, cai para o primeiro nome (converge em no máximo 2 renders).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const primeiro = nome.trim().split(/\s+/)[0];
    if (el.scrollWidth > el.clientWidth && texto !== primeiro) setTexto(primeiro);
  });

  return (
    <div
      ref={ref}
      style={{
        maxWidth: 88,
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
      {texto}
    </div>
  );
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
    <div style={{ width: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <Camisa id={id} cor={cor} cor2={cor2} numero={numero} seq={j.sequencia} seqDerrota={j.sequenciaDerrota} />
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <NomeJogador nome={j.nome} />
        <span style={{ display: "inline-block", marginTop: 2, fontSize: 10.5, fontWeight: 900, color: "#052e16", background: "#fde047", padding: "0 6px", borderRadius: 999 }}>
          {j.nota.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

const linhaFila: CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "space-evenly", alignItems: "flex-start", gap: "12px 2px" };
const linhaCampo: CSSProperties = { position: "absolute", left: "50%", transform: "translateX(-50%)", borderColor: "rgba(255,255,255,.24)", borderStyle: "solid" };

/**
 * Card de escalação estilo lineup de futebol: campo verde em retrato com os
 * jogadores dispostos por linha (ataque → meio → defesa), camisas na cor do
 * time, nota média no cabeçalho e sequência por jogador. Baixável via html-to-image.
 */
export function ElencoCard({ cor, jogadores, data, numeroRodada }: ElencoCardProps) {
  const tema = TEMAS[cor];
  const media = jogadores.length ? jogadores.reduce((s, j) => s + j.nota, 0) / jogadores.length : 0;

  // Distribui em três linhas equilibradas (ex.: 9 → 3-3-3, 8 → 3-3-2), mantendo cada
  // um na sua posição natural e só movendo o necessário para bater as metas. Quando
  // precisa mover: a MAIOR nota sobe para o ataque e a MENOR desce para a defesa.
  const n = jogadores.length;
  const base = Math.floor(n / 3);
  const resto = n % 3;
  const meta = { defesa: base + (resto > 0 ? 1 : 0), meio: base + (resto > 1 ? 1 : 0), ataque: base };

  const linhas: Record<"ataque" | "meio" | "defesa", JogadorEscalado[]> = {
    ataque: jogadores.filter((j) => j.posicao === "atacante"),
    meio: jogadores.filter((j) => j.posicao === "meio" || !j.posicao),
    defesa: jogadores.filter((j) => j.posicao === "defensor"),
  };
  const chaves = ["ataque", "meio", "defesa"] as const;

  // Só mexe enquanto alguma linha estiver abaixo da meta (nada a fazer se já equilibrado).
  for (let guarda = 0; guarda < 60; guarda++) {
    const faltando = chaves.find((k) => linhas[k].length < meta[k]);
    if (!faltando) break;
    const sobrando = chaves.filter((k) => linhas[k].length > meta[k]);
    if (!sobrando.length) break;
    const candidatos = sobrando.flatMap((k) => linhas[k].map((j) => ({ j, k })));

    let escolha: { j: JogadorEscalado; k: (typeof chaves)[number] };
    if (faltando === "ataque") {
      escolha = candidatos.reduce((m, c) => (c.j.nota > m.j.nota ? c : m)); // maior nota sobe
    } else if (faltando === "defesa") {
      escolha = candidatos.reduce((m, c) => (c.j.nota < m.j.nota ? c : m)); // menor nota desce
    } else if (linhas.ataque.length > meta.ataque) {
      const menor = linhas.ataque.reduce((m, j) => (j.nota < m.nota ? j : m)); // desce o pior do ataque
      escolha = { j: menor, k: "ataque" };
    } else {
      const maior = linhas.defesa.reduce((m, j) => (j.nota > m.nota ? j : m)); // sobe o melhor da defesa
      escolha = { j: maior, k: "defesa" };
    }
    linhas[escolha.k].splice(linhas[escolha.k].indexOf(escolha.j), 1);
    linhas[faltando].push(escolha.j);
  }

  const porNota = (a: JogadorEscalado, b: JogadorEscalado) => b.nota - a.nota || a.nome.localeCompare(b.nome);
  const ataque = [...linhas.ataque].sort(porNota);
  const meio = [...linhas.meio].sort(porNota);
  const defesa = [...linhas.defesa].sort(porNota);

  // Número exibido na camisa: usa o do jogador ou uma sequência de reserva.
  const numeroDe = new Map(jogadores.map((j, i) => [j.id, j.numero || String(i + 1)]));

  const filas = [ataque, meio, defesa];

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
      </div>

      {/* Rodapé */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#0a1526", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#64748b" }}>
        <span style={{ color: tema.cor, fontWeight: 900, letterSpacing: ".14em" }}>Gibs FC</span>
        <span>{dataBRCompleta(data)}</span>
      </div>
    </div>
  );
}
