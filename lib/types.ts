export interface Jogador {
  id: string;
  nome: string;
  apelido: string;
  telefone: string;
}

export interface MensalistaMes {
  selecionados: string[];
  confirmados: string[];
  pagos: string[];
  valoresCustom: Record<string, number>;
}

export interface JogoAvulso {
  data: string;
  jogadores: string[];
  selecionados: string[];
  pagos: string[];
  observacao: string;
}

export type ResultadoRodada = "vermelho" | "azul" | "empate";

export interface Rodada {
  id: string;
  data: string;
  timeVermelho: string[];
  timeAzul: string[];
  resultado: ResultadoRodada;
}

export interface CampeaoTrimestral {
  id: string;
  periodo: string;
  jogadorNome: string;
  pontos: number;
  data: string;
}

export type TipoLancamento = "despesa" | "entrada";

export interface Lancamento {
  id: string;
  mes: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
}

export interface Configuracoes {
  valorMensal: number;
  valorAvulso: number;
  pixMensal: string;
  pixAvulso: string;
  localPadrao: string;
  horarioPadrao: string;
}

export interface Estado {
  mes: string;
  jogadores: Jogador[];
  mensalistasPorMes: Record<string, MensalistaMes>;
  jogosAvulsos: Record<string, JogoAvulso>;
  despesas: Lancamento[];
  receitasExtras: Lancamento[];
  rodadas: Rodada[];
  campeoes: CampeaoTrimestral[];
  configuracoes: Configuracoes;
}

export const CATEGORIAS_DESPESA = [
  "Quadra",
  "Arbitragem",
  "Goleiro de aluguel",
  "Bola/equipamentos",
  "Água/bebida",
  "Churrasco",
  "Patrocinador",
  "Doação",
  "Outros",
] as const;

export const estadoInicial: Estado = {
  mes: new Date().toISOString().slice(0, 7),
  jogadores: [],
  mensalistasPorMes: {},
  jogosAvulsos: {},
  despesas: [],
  receitasExtras: [],
  rodadas: [],
  campeoes: [],
  configuracoes: {
    valorMensal: 70,
    valorAvulso: 20,
    pixMensal: "futgibs@gmail.com",
    pixAvulso: "futgibs@gmail.com",
    localPadrao: "Camisa 9",
    horarioPadrao: "21:00",
  },
};
