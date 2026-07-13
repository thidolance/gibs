/**
 * Paleta usada nos gráficos (recharts e VChart). Valores literais porque
 * canvas (VChart) não resolve `var(--color-*)`.
 */
export const CORES = {
  azul: "#2563eb",
  azulEscuro: "#1d4ed8",
  azulClaro: "#93c5fd",
  vermelho: "#ef4444",
  vermelhoEscuro: "#dc2626",
  dourado: "#f59e0b",
  douradoClaro: "#fcd34d",
  verde: "#22c55e",
  roxo: "#8b5cf6",
  ciano: "#06b6d4",
  rosa: "#ec4899",
  sucesso: "#16a34a",
  alerta: "#f97316",
  perigo: "#dc2626",
  neutro: "#94a3b8",
  borda: "#e2e8f0",
} as const;

/** Paleta categórica vibrante para gráficos com várias séries (ex.: despesas por categoria). */
export const PALETA_CATEGORICA = [
  CORES.azul,
  CORES.vermelho,
  CORES.dourado,
  CORES.verde,
  CORES.roxo,
  CORES.ciano,
  CORES.rosa,
  CORES.azulEscuro,
  CORES.alerta,
] as const;
