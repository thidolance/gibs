import { onValue, ref, set } from "firebase/database";
import { db } from "./firebase";
import { gerarId } from "./utils";

// A loja fica num nó separado do Firebase (`/loja`) para não pesar o `estado`
// principal — as fotos (base64) podem ser grandes e só a vitrine precisa delas.

const CAMINHO_LOJA = "loja";

export interface Uniforme {
  id: string;
  nome: string;
  tipo: string; // ex.: "Camisa I", "Goleiro", "Regata"
  preco: number;
  tamanhos: string[]; // ex.: ["P", "M", "G", "GG"]
  descricao: string;
  foto: string; // data URL (imagem comprimida) ou URL externa
  disponivel: boolean;
  ordem: number;
}

function normalizarUniforme(u: Partial<Uniforme> & Record<string, unknown>, i: number): Uniforme {
  return {
    id: (u.id as string) ?? gerarId(),
    nome: (u.nome as string) ?? "",
    tipo: (u.tipo as string) ?? "",
    preco: Number(u.preco ?? 0),
    tamanhos: Array.isArray(u.tamanhos) ? (u.tamanhos as string[]) : [],
    descricao: (u.descricao as string) ?? "",
    foto: (u.foto as string) ?? "",
    disponivel: u.disponivel !== false,
    ordem: Number(u.ordem ?? i),
  };
}

export function normalizarLoja(valor: unknown): Uniforme[] {
  const lista = Array.isArray(valor)
    ? valor
    : valor && typeof valor === "object"
      ? Object.values(valor as Record<string, unknown>)
      : [];
  return lista
    .map((u, i) => normalizarUniforme(u as Partial<Uniforme> & Record<string, unknown>, i))
    .sort((a, b) => a.ordem - b.ordem);
}

/** Observa a lista de uniformes em tempo real. Retorna a função de cancelamento. */
export function assinarLoja(callback: (uniformes: Uniforme[]) => void): () => void {
  return onValue(ref(db, CAMINHO_LOJA), (snap) => callback(normalizarLoja(snap.val())));
}

export function gravarLoja(uniformes: Uniforme[]): Promise<void> {
  return set(ref(db, CAMINHO_LOJA), uniformes);
}
