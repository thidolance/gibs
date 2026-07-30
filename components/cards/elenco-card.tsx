import { Anton, Playfair_Display } from "next/font/google";
import { Hand } from "lucide-react";
import { dataBRCompleta } from "@/lib/utils";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  style: ["italic"],
  variable: "--font-playfair",
});

export interface JogadorCard {
  id: string;
  nome: string;
  numero?: string;
}

export interface ElencoCardProps {
  cor: "vermelho" | "azul";
  jogadores: JogadorCard[];
  data: string;
  numeroRodada: number;
}

const TEMAS = {
  vermelho: {
    nome: "RED",
    acento: "#dc2626",
    acentoEscuro: "#7f1d1d",
    acentoClaro: "#f87171",
    gradienteTexto: "linear-gradient(135deg, #f87171 0%, #dc2626 45%, #7f1d1d 100%)",
    numeroMuted: "#9ca3af",
  },
  azul: {
    nome: "BLUE",
    acento: "#2563eb",
    acentoEscuro: "#1e3a8a",
    acentoClaro: "#60a5fa",
    gradienteTexto: "linear-gradient(135deg, #60a5fa 0%, #2563eb 45%, #1e3a8a 100%)",
    numeroMuted: "#eab308",
  },
} as const;

/** Textura leve de ruído (papel), gerada via SVG — mantém o card com um acabamento "fosco". */
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const GRAIN_URL = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

/** Coluna de setas/chevrons decorativa nas laterais do card, apontando para a borda. */
function ColunaChevron({ lado, cor }: { lado: "esquerda" | "direita"; cor: string }) {
  const qtd = 10;
  const apontaEsquerda = lado === "esquerda";
  return (
    <div
      className="pointer-events-none absolute inset-y-0 flex flex-col justify-between py-3"
      style={{
        [lado === "esquerda" ? "left" : "right"]: 0,
        width: 128,
        [lado === "esquerda" ? "paddingLeft" : "paddingRight"]: 18,
      }}
    >
      {/* Barra sólida na borda extrema */}
      <div
        className="absolute inset-y-0"
        style={{ [lado === "esquerda" ? "left" : "right"]: 0, width: 26, background: cor }}
      />
      {Array.from({ length: qtd }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 92,
            width: 100,
            clipPath: apontaEsquerda ? "polygon(100% 0%, 0% 50%, 100% 100%)" : "polygon(0% 0%, 100% 50%, 0% 100%)",
            background: `linear-gradient(${apontaEsquerda ? "110deg" : "250deg"}, ${cor} 0%, ${cor}cc 55%, ${cor}88 100%)`,
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,.18))",
          }}
        />
      ))}
    </div>
  );
}

/** Card no estilo "poster" (Elenco Red/Blue) para divulgar a escalação da rodada — pronto para baixar como imagem. */
export function ElencoCard({ cor, jogadores, data, numeroRodada }: ElencoCardProps) {
  const tema = TEMAS[cor];

  return (
    <div
      className={`${anton.variable} ${playfair.variable} relative overflow-hidden`}
      style={{
        width: 1080,
        height: 1350,
        background: "#efe9de",
        fontFamily: "var(--font-anton)",
      }}
    >
      {/* Textura de papel */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply" style={{ backgroundImage: GRAIN_URL }} />

      <ColunaChevron lado="esquerda" cor={tema.acento} />
      <ColunaChevron lado="direita" cor={tema.acento} />

      {/* Conteúdo central */}
      <div className="absolute inset-0 flex flex-col items-center px-[140px] pt-[64px] text-center">
        {/* Escudo + Mensal */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gibs-logo.avif" alt="Gibs FC" width={118} height={118} style={{ objectFit: "contain" }} />
        <div
          className="mt-2 text-[34px] tracking-[0.05em]"
          style={{
            fontFamily: "var(--font-anton)",
            background: "linear-gradient(135deg, #fde68a 0%, #d97706 55%, #92400e 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          MENSAL
        </div>

        {/* Título */}
        <div
          className="mt-8 text-[64px] leading-[0.95] tracking-[0.02em]"
          style={{
            fontFamily: "var(--font-anton)",
            background: tema.gradienteTexto,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: `4px 6px 0px ${tema.acentoEscuro}33`,
          }}
        >
          ELENCO
        </div>
        <div
          className="text-[128px] leading-[0.9] tracking-[0.01em]"
          style={{
            fontFamily: "var(--font-anton)",
            transform: "skewX(-6deg)",
            background: tema.gradienteTexto,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: `6px 8px 0px ${tema.acentoEscuro}40`,
          }}
        >
          {tema.nome}
        </div>

        {/* Elenco */}
        <div className="mt-10 flex w-full flex-col items-center gap-[18px]">
          {/* Goleiro (slot fixo, sem jogador vinculado) */}
          <div className="flex items-center gap-4">
            <Hand className="size-9" style={{ color: tema.numeroMuted, opacity: 0.75 }} />
            <span className="text-[34px] font-bold" style={{ fontFamily: "var(--font-anton)", color: tema.acento }}>
              GDA
            </span>
          </div>

          {jogadores.map((j, i) => (
            <div key={j.id} className="flex items-baseline gap-4">
              <span
                className="w-[60px] text-right text-[32px]"
                style={{
                  fontFamily: "var(--font-anton)",
                  fontStyle: "italic",
                  color: i % 2 === 0 ? tema.numeroMuted : tema.acento,
                }}
              >
                {j.numero || "—"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-anton)",
                  color: tema.acento,
                  whiteSpace: "nowrap",
                  fontSize: j.nome.length > 13 ? 26 : 34,
                }}
              >
                {j.nome.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Rodapé: data + rodada */}
        <div className="mt-auto mb-[54px] flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-2 text-[42px]" style={{ fontFamily: "var(--font-playfair)" }}>
            <span className="italic font-bold" style={{ color: "#1e3a8a" }}>
              {dataBRCompleta(data)}
            </span>
          </div>
          <div className="text-[22px] tracking-[0.08em]" style={{ fontFamily: "var(--font-playfair)", color: tema.acentoEscuro }}>
            {numeroRodada}ª RODADA
          </div>
        </div>
      </div>
    </div>
  );
}
