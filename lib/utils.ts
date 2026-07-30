import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function mesAtualPadrao() {
  return new Date().toISOString().slice(0, 7);
}

/** Terça-feira da semana atual (dia fixo da rodada), no formato YYYY-MM-DD. */
export function tercaDaSemana(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const indiceSegunda = (d.getDay() + 6) % 7; // Segunda=0 ... Domingo=6
  d.setDate(d.getDate() + (1 - indiceSegunda)); // desloca para a terça desta semana
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dinheiro(v: number | undefined | null) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function dinheiroSimples(v: number | undefined | null) {
  return `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;
}

const NOMES_MES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

const NOMES_MES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function nomeMes(m: string) {
  const idx = Number(m.split("-")[1]) - 1;
  return NOMES_MES[idx] || m;
}

export function nomeMesCurto(m: string) {
  const idx = Number(m.split("-")[1]) - 1;
  return NOMES_MES_CURTO[idx] || m;
}

export function dataBR(d: string | undefined | null) {
  if (!d) return "";
  const [, m, di] = d.split("-");
  return `${di}/${m}`;
}

export function dataBRCompleta(d: string | undefined | null) {
  if (!d) return "";
  const [a, m, di] = d.split("-");
  return `${di}/${m}/${a}`;
}

const DIAS_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

export function calcularDiaSemana(d: string | undefined | null) {
  if (!d) return "";
  const [y, m, di] = d.split("-").map(Number);
  return DIAS_SEMANA[new Date(y, m - 1, di).getDay()];
}
