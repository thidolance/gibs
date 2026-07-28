import type {
  CampeaoTrimestral,
  Estado,
  Jogador,
  JogoAvulso,
  Lancamento,
  MensalistaMes,
  Rodada,
  TipoLancamento,
} from "./types";
import { estadoInicial } from "./types";
import { classificacaoMensal, getJogoAvulso, getMensalMes } from "./calculos";
import { gerarId } from "./utils";

/** Funções puras de transição de estado: recebem o estado atual e devolvem um novo estado imutável. */

function comMensalMes(estado: Estado, mes: string, atualizar: (m: MensalistaMes) => MensalistaMes): Estado {
  const atual = getMensalMes(estado, mes);
  return {
    ...estado,
    mensalistasPorMes: { ...estado.mensalistasPorMes, [mes]: atualizar(atual) },
  };
}

function comJogoAvulso(estado: Estado, data: string, atualizar: (g: JogoAvulso) => JogoAvulso): Estado {
  const atual = getJogoAvulso(estado, data);
  return {
    ...estado,
    jogosAvulsos: { ...estado.jogosAvulsos, [data]: atualizar(atual) },
  };
}

function alternarItem(lista: string[], id: string, marcado: boolean): string[] {
  if (marcado) return lista.includes(id) ? lista : [...lista, id];
  return lista.filter((x) => x !== id);
}

// ── Mês de referência ──────────────────────────────────────────────────────

export function setMesReferencia(estado: Estado, mes: string): Estado {
  return { ...estado, mes };
}

// ── Jogadores ───────────────────────────────────────────────────────────────

export function adicionarJogador(estado: Estado, dados: Omit<Jogador, "id">): Estado {
  const jogador: Jogador = { id: gerarId(), ...dados };
  return { ...estado, jogadores: [...estado.jogadores, jogador] };
}

export function atualizarJogador(estado: Estado, id: string, dados: Omit<Jogador, "id">): Estado {
  return {
    ...estado,
    jogadores: estado.jogadores.map((j) => (j.id === id ? { id, ...dados } : j)),
  };
}

export function removerJogador(estado: Estado, id: string): Estado {
  const mensalistasPorMes: Estado["mensalistasPorMes"] = {};
  for (const [mes, m] of Object.entries(estado.mensalistasPorMes)) {
    const { [id]: _omitido, ...valoresCustom } = m.valoresCustom ?? {};
    mensalistasPorMes[mes] = {
      selecionados: (m.selecionados ?? []).filter((x) => x !== id),
      confirmados: (m.confirmados ?? []).filter((x) => x !== id),
      pagos: (m.pagos ?? []).filter((x) => x !== id),
      valoresCustom,
    };
  }

  const jogosAvulsos: Estado["jogosAvulsos"] = {};
  for (const [data, g] of Object.entries(estado.jogosAvulsos)) {
    jogosAvulsos[data] = {
      ...g,
      jogadores: (g.jogadores ?? []).filter((x) => x !== id),
      selecionados: (g.selecionados ?? []).filter((x) => x !== id),
      pagos: (g.pagos ?? []).filter((x) => x !== id),
    };
  }

  const semJogadorNaRodada = (r: Rodada): Rodada => {
    const { [id]: _omitido, ...gols } = r.gols ?? {};
    return {
      ...r,
      timeVermelho: (r.timeVermelho ?? []).filter((x) => x !== id),
      timeAzul: (r.timeAzul ?? []).filter((x) => x !== id),
      gols,
    };
  };

  return {
    ...estado,
    jogadores: estado.jogadores.filter((j) => j.id !== id),
    mensalistasPorMes,
    jogosAvulsos,
    rodadas: estado.rodadas.map(semJogadorNaRodada),
    rodadasArquivadas: (estado.rodadasArquivadas ?? []).map(semJogadorNaRodada),
  };
}

// ── Mensalistas ─────────────────────────────────────────────────────────────

export function alternarSelecaoMensalista(estado: Estado, mes: string, jogadorId: string, marcado: boolean): Estado {
  return comMensalMes(estado, mes, (m) => ({ ...m, selecionados: alternarItem(m.selecionados, jogadorId, marcado) }));
}

export function marcarTodosMensalistas(estado: Estado, mes: string): Estado {
  const todos = estado.jogadores.map((j) => j.id);
  return comMensalMes(estado, mes, (m) => ({ ...m, selecionados: todos }));
}

export function desmarcarTodosMensalistas(estado: Estado, mes: string): Estado {
  return comMensalMes(estado, mes, (m) => ({ ...m, selecionados: [] }));
}

export function confirmarSelecaoMensalistas(estado: Estado, mes: string): Estado {
  return comMensalMes(estado, mes, (m) => ({
    ...m,
    confirmados: m.selecionados,
    pagos: m.pagos.filter((id) => m.selecionados.includes(id)),
  }));
}

export function alternarPagoMensalista(estado: Estado, mes: string, jogadorId: string, pago: boolean): Estado {
  return comMensalMes(estado, mes, (m) => ({ ...m, pagos: alternarItem(m.pagos, jogadorId, pago) }));
}

export function salvarValorCustomMensalista(estado: Estado, mes: string, jogadorId: string, valor: number | null): Estado {
  return comMensalMes(estado, mes, (m) => {
    const valoresCustom = { ...m.valoresCustom };
    if (valor === null || Number.isNaN(valor)) {
      delete valoresCustom[jogadorId];
    } else {
      valoresCustom[jogadorId] = valor;
    }
    return { ...m, valoresCustom };
  });
}

// ── Jogos avulsos ───────────────────────────────────────────────────────────

export function alternarSelecaoAvulso(estado: Estado, data: string, jogadorId: string, marcado: boolean): Estado {
  return comJogoAvulso(estado, data, (g) => ({ ...g, selecionados: alternarItem(g.selecionados, jogadorId, marcado) }));
}

export function gerarListaAvulsos(estado: Estado, data: string): Estado {
  return comJogoAvulso(estado, data, (g) => ({
    ...g,
    jogadores: g.selecionados,
    pagos: g.pagos.filter((id) => g.selecionados.includes(id)),
  }));
}

export function desmarcarTodosAvulsos(estado: Estado, data: string): Estado {
  return comJogoAvulso(estado, data, (g) => ({ ...g, selecionados: [] }));
}

export function alternarPagoAvulso(estado: Estado, data: string, jogadorId: string, pago: boolean): Estado {
  return comJogoAvulso(estado, data, (g) => ({ ...g, pagos: alternarItem(g.pagos, jogadorId, pago) }));
}

export function salvarObservacaoJogo(estado: Estado, data: string, observacao: string): Estado {
  return comJogoAvulso(estado, data, (g) => ({ ...g, observacao }));
}

// ── Lançamentos (despesas / receitas extras) ─────────────────────────────────

export function adicionarLancamento(estado: Estado, tipo: TipoLancamento, dados: Omit<Lancamento, "id">): Estado {
  const lancamento: Lancamento = { id: gerarId(), ...dados };
  if (tipo === "despesa") return { ...estado, despesas: [...estado.despesas, lancamento] };
  return { ...estado, receitasExtras: [...estado.receitasExtras, lancamento] };
}

export function removerLancamento(estado: Estado, tipo: TipoLancamento, id: string): Estado {
  if (tipo === "despesa") return { ...estado, despesas: estado.despesas.filter((d) => d.id !== id) };
  return { ...estado, receitasExtras: estado.receitasExtras.filter((d) => d.id !== id) };
}

// ── Rodadas (classificação do mensal) ─────────────────────────────────────────

export function adicionarRodada(estado: Estado, dados: Omit<Rodada, "id">): Estado {
  const rodada: Rodada = { id: gerarId(), ...dados };
  return { ...estado, rodadas: [...estado.rodadas, rodada] };
}

export function atualizarRodada(estado: Estado, id: string, dados: Omit<Rodada, "id">): Estado {
  return {
    ...estado,
    rodadas: estado.rodadas.map((r) => (r.id === id ? { id, ...dados } : r)),
  };
}

export function removerRodada(estado: Estado, id: string): Estado {
  return { ...estado, rodadas: estado.rodadas.filter((r) => r.id !== id) };
}

/**
 * Encerra o trimestral: registra o 1º colocado como campeão e zera as rodadas
 * para começar uma nova disputa. Retorna o estado inalterado se não houver líder.
 */
export function encerrarTrimestral(estado: Estado, periodo: string, data: string): Estado {
  const [lider] = classificacaoMensal(estado);
  if (!lider) return estado;
  const campeao: CampeaoTrimestral = {
    id: gerarId(),
    periodo,
    jogadorNome: lider.jogador.nome,
    pontos: lider.pontos,
    data,
  };
  // Arquiva as rodadas do trimestral encerrado para manter a nota dos jogadores viva.
  return {
    ...estado,
    campeoes: [...estado.campeoes, campeao],
    rodadas: [],
    rodadasArquivadas: [...(estado.rodadasArquivadas ?? []), ...estado.rodadas],
  };
}

export function adicionarCampeao(estado: Estado, dados: Omit<CampeaoTrimestral, "id">): Estado {
  const campeao: CampeaoTrimestral = { id: gerarId(), ...dados };
  return { ...estado, campeoes: [...estado.campeoes, campeao] };
}

export function atualizarCampeao(estado: Estado, id: string, dados: Omit<CampeaoTrimestral, "id">): Estado {
  return {
    ...estado,
    campeoes: estado.campeoes.map((c) => (c.id === id ? { id, ...dados } : c)),
  };
}

export function removerCampeao(estado: Estado, id: string): Estado {
  return { ...estado, campeoes: estado.campeoes.filter((c) => c.id !== id) };
}

// ── Configurações ────────────────────────────────────────────────────────────

export function salvarConfiguracoes(estado: Estado, configuracoes: Estado["configuracoes"]): Estado {
  return { ...estado, configuracoes };
}

// ── Reset total ───────────────────────────────────────────────────────────────

export function limparTudo(): Estado {
  return { ...estadoInicial, mes: new Date().toISOString().slice(0, 7) };
}
