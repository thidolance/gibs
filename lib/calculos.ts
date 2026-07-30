import type { CampeaoTrimestral, Estado, Jogador, JogoAvulso, Lancamento, MensalistaMes, Posicao, Rodada } from "./types";
import { estadoInicial } from "./types";
import { calcularDiaSemana, dataBR, dinheiroSimples, gerarId, nomeMes, nomeMesCurto } from "./utils";

export interface DadosCaixa {
  mensaisPagos: number;
  mensaisAReceber: number;
  qtdMensaisPagos: number;
  qtdMensais: number;
  avulsos: number;
  avulsosAReceber: number;
  receitasExtras: number;
  qtdReceitasExtras: number;
  qtdAvulsosPagos: number;
  qtdAvulsos: number;
  entradas: number;
  valoresAReceber: number;
  despesas: number;
  saldo: number;
  saldoProjetado: number;
}

export function valorMensalFixo(estado: Estado) {
  return Number(estado.configuracoes?.valorMensal ?? 70);
}

export function valorAvulsoFixo(estado: Estado) {
  return Number(estado.configuracoes?.valorAvulso ?? 20);
}

export function getMensalMes(estado: Estado, mes: string): MensalistaMes {
  const m = estado.mensalistasPorMes[mes];
  if (!m) return { selecionados: [], confirmados: [], pagos: [], valoresCustom: {} };
  return {
    selecionados: m.selecionados ?? [],
    confirmados: m.confirmados ?? m.selecionados ?? [],
    pagos: m.pagos ?? [],
    valoresCustom: m.valoresCustom ?? {},
  };
}

export function getJogoAvulso(estado: Estado, data: string): JogoAvulso {
  const g = estado.jogosAvulsos[data];
  if (!g) return { data, jogadores: [], selecionados: [], pagos: [], observacao: "" };
  return {
    data: g.data,
    jogadores: g.jogadores ?? [],
    selecionados: g.selecionados ?? g.jogadores ?? [],
    pagos: g.pagos ?? [],
    observacao: g.observacao ?? "",
  };
}

export function avulsosDoMes(estado: Estado, mes: string): JogoAvulso[] {
  return Object.values(estado.jogosAvulsos)
    .filter((g) => g.data?.startsWith(mes))
    .map((g) => getJogoAvulso(estado, g.data));
}

export function despesasDoMes(estado: Estado, mes: string) {
  return estado.despesas.filter((d) => d.mes === mes);
}

export function receitasExtrasDoMes(estado: Estado, mes: string) {
  return estado.receitasExtras.filter((d) => d.mes === mes);
}

export function valorMensalistaJogador(estado: Estado, mes: string, jogadorId: string) {
  const m = getMensalMes(estado, mes);
  const custom = m.valoresCustom?.[jogadorId];
  return custom ? Number(custom) : valorMensalFixo(estado);
}

export function jogadoresDisponiveisAvulso(estado: Estado, mes: string) {
  const confirmados = getMensalMes(estado, mes).confirmados;
  return estado.jogadores.filter((j) => !confirmados.includes(j.id));
}

export function dadosCaixa(estado: Estado, mes: string): DadosCaixa {
  const m = getMensalMes(estado, mes);
  const qtdMens = m.confirmados.length;
  const qtdMensPagos = m.pagos.length;

  const jogos = avulsosDoMes(estado, mes);
  const qtdAv = jogos.reduce((s, g) => s + g.jogadores.length, 0);
  const qtdAvPagos = jogos.reduce(
    (s, g) => s + g.pagos.filter((id) => g.jogadores.includes(id)).length,
    0,
  );
  const qtdAvPend = Math.max(qtdAv - qtdAvPagos, 0);

  const valorMensal = valorMensalFixo(estado);
  const valorAvulso = valorAvulsoFixo(estado);

  const valorDe = (jogadorId: string) =>
    m.valoresCustom?.[jogadorId] ? Number(m.valoresCustom[jogadorId]) : valorMensal;

  const mensRec = m.pagos.reduce((s, id) => s + valorDe(id), 0);
  const mensAR = m.confirmados.filter((id) => !m.pagos.includes(id)).reduce((s, id) => s + valorDe(id), 0);
  const avRec = qtdAvPagos * valorAvulso;
  const avAR = qtdAvPend * valorAvulso;

  const extras = receitasExtrasDoMes(estado, mes).reduce((s, d) => s + Number(d.valor || 0), 0);
  const desp = despesasDoMes(estado, mes).reduce((s, d) => s + Number(d.valor || 0), 0);
  const entradas = mensRec + avRec + extras;

  return {
    mensaisPagos: mensRec,
    mensaisAReceber: mensAR,
    qtdMensaisPagos: qtdMensPagos,
    qtdMensais: qtdMens,
    avulsos: avRec,
    avulsosAReceber: avAR,
    receitasExtras: extras,
    qtdReceitasExtras: receitasExtrasDoMes(estado, mes).length,
    qtdAvulsosPagos: qtdAvPagos,
    qtdAvulsos: qtdAv,
    entradas,
    valoresAReceber: mensAR + avAR,
    despesas: desp,
    saldo: entradas - desp,
    saldoProjetado: entradas + mensAR + avAR - desp,
  };
}

/** Lista os meses (YYYY-MM) que possuem algum dado lançado, em ordem cronológica. */
export function mesesComDados(estado: Estado): string[] {
  const meses = new Set<string>();
  Object.keys(estado.mensalistasPorMes).forEach((m) => meses.add(m));
  Object.values(estado.jogosAvulsos).forEach((g) => g.data && meses.add(g.data.slice(0, 7)));
  estado.despesas.forEach((d) => meses.add(d.mes));
  estado.receitasExtras.forEach((d) => meses.add(d.mes));
  meses.add(estado.mes);
  return [...meses].sort();
}

export interface PontoEvolucaoMensal {
  mes: string;
  label: string;
  entradas: number;
  despesas: number;
  saldo: number;
}

/** Série temporal de entradas/despesas/saldo para os últimos N meses com dados. */
export function evolucaoMensal(estado: Estado, limite = 6): PontoEvolucaoMensal[] {
  const meses = mesesComDados(estado).slice(-limite);
  return meses.map((mes) => {
    const d = dadosCaixa(estado, mes);
    return { mes, label: nomeMesCurto(mes), entradas: d.entradas, despesas: d.despesas, saldo: d.saldo };
  });
}

export interface CategoriaDespesa {
  categoria: string;
  valor: number;
}

/** Soma das despesas do mês agrupadas por categoria, ordenadas da maior para a menor. */
export function despesasPorCategoria(estado: Estado, mes: string): CategoriaDespesa[] {
  const porCategoria = new Map<string, number>();
  despesasDoMes(estado, mes).forEach((d) => {
    porCategoria.set(d.categoria, (porCategoria.get(d.categoria) || 0) + Number(d.valor || 0));
  });
  return [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}

// ── Normalização de dados vindos do Firebase ────────────────────────────────
// O Realtime Database serializa arrays vazios/esparsos como objetos ou os omite,
// então toda leitura precisa ser normalizada de volta para o shape de `Estado`.

function normalizarArr<T>(valor: unknown): T[] {
  if (Array.isArray(valor)) return valor as T[];
  if (valor && typeof valor === "object") return Object.values(valor) as T[];
  return [];
}

export function normalizarEstado(valor: unknown): Estado {
  const v = (valor ?? {}) as Partial<Estado> & Record<string, unknown>;

  const mensalistasPorMes: Estado["mensalistasPorMes"] = {};
  for (const [mes, m] of Object.entries(v.mensalistasPorMes ?? {})) {
    const mm = m as Partial<MensalistaMes> & Record<string, unknown>;
    mensalistasPorMes[mes] = {
      selecionados: normalizarArr<string>(mm.selecionados),
      confirmados: normalizarArr<string>(mm.confirmados ?? mm.selecionados),
      pagos: normalizarArr<string>(mm.pagos),
      valoresCustom: (mm.valoresCustom as Record<string, number>) ?? {},
    };
  }

  const jogosAvulsos: Estado["jogosAvulsos"] = {};
  for (const [data, g] of Object.entries(v.jogosAvulsos ?? {})) {
    const gg = g as Partial<JogoAvulso> & Record<string, unknown>;
    jogosAvulsos[data] = {
      data: gg.data ?? data,
      jogadores: normalizarArr<string>(gg.jogadores),
      selecionados: normalizarArr<string>(gg.selecionados ?? gg.jogadores),
      pagos: normalizarArr<string>(gg.pagos),
      observacao: (gg.observacao as string) ?? "",
    };
  }

  const normalizarPlacar = (valor: unknown): number | undefined => {
    if (valor === undefined || valor === null || valor === "") return undefined;
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const normalizarContagem = (valor: unknown): Record<string, number> => {
    if (!valor || typeof valor !== "object") return {};
    const contagem: Record<string, number> = {};
    for (const [id, n] of Object.entries(valor as Record<string, unknown>)) {
      const qtd = Number(n);
      if (qtd > 0) contagem[id] = qtd;
    }
    return contagem;
  };

  const normalizarRodada = (r: Partial<Rodada> & Record<string, unknown>): Rodada => ({
    id: (r.id as string) ?? gerarId(),
    data: (r.data as string) ?? "",
    timeVermelho: normalizarArr<string>(r.timeVermelho),
    timeAzul: normalizarArr<string>(r.timeAzul),
    resultado: (r.resultado as Rodada["resultado"]) ?? "empate",
    ...(normalizarPlacar(r.placarVermelho) !== undefined ? { placarVermelho: normalizarPlacar(r.placarVermelho) } : {}),
    ...(normalizarPlacar(r.placarAzul) !== undefined ? { placarAzul: normalizarPlacar(r.placarAzul) } : {}),
    gols: normalizarContagem(r.gols),
    assistencias: normalizarContagem(r.assistencias),
  });

  const rodadas = normalizarArr<Partial<Rodada> & Record<string, unknown>>(v.rodadas).map(normalizarRodada);
  const rodadasArquivadas = normalizarArr<Partial<Rodada> & Record<string, unknown>>(v.rodadasArquivadas).map(
    normalizarRodada,
  );

  const campeoes = normalizarArr<Partial<CampeaoTrimestral> & Record<string, unknown>>(v.campeoes).map((c) => ({
    id: (c.id as string) ?? gerarId(),
    periodo: (c.periodo as string) ?? "",
    jogadorNome: (c.jogadorNome as string) ?? "",
    pontos: Number(c.pontos ?? 0),
    data: (c.data as string) ?? "",
  }));

  const POSICOES_VALIDAS: Posicao[] = ["defensor", "meio", "atacante"];
  const jogadores = normalizarArr<Partial<Jogador> & Record<string, unknown>>(v.jogadores).map((j) => {
    const posicao = POSICOES_VALIDAS.includes(j.posicao as Posicao) ? (j.posicao as Posicao) : undefined;
    const numero = j.numero !== undefined && j.numero !== null && String(j.numero) !== "" ? String(j.numero) : undefined;
    return {
      id: (j.id as string) ?? gerarId(),
      nome: (j.nome as string) ?? "",
      apelido: (j.apelido as string) ?? "",
      telefone: (j.telefone as string) ?? "",
      ...(posicao ? { posicao } : {}),
      ...(numero ? { numero } : {}),
    };
  });

  return {
    mes: v.mes ?? estadoInicial.mes,
    jogadores,
    mensalistasPorMes,
    jogosAvulsos,
    despesas: normalizarArr<Lancamento>(v.despesas),
    receitasExtras: normalizarArr<Lancamento>(v.receitasExtras),
    rodadas,
    rodadasArquivadas,
    campeoes,
    configuracoes: { ...estadoInicial.configuracoes, ...(v.configuracoes ?? {}) },
  };
}

// ── Classificação do mensal ──────────────────────────────────────────────────

export interface LinhaClassificacao {
  jogador: Jogador;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  jogos: number;
}

/** Rodadas ordenadas da mais recente para a mais antiga. */
export function rodadasOrdenadas(estado: Estado): Rodada[] {
  return [...estado.rodadas].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
}

/**
 * Agrega os pontos de todas as rodadas: vitória = 3 pontos, empate = 1 ponto.
 * Inclui todos os mensalistas confirmados do mês de referência — mesmo quem não
 * pontuou ou não jogou nenhuma rodada aparece na tabela (zerado).
 */
export function classificacaoMensal(estado: Estado): LinhaClassificacao[] {
  const stats = new Map<string, Omit<LinhaClassificacao, "jogador">>();
  const garantir = (id: string) => {
    if (!stats.has(id)) stats.set(id, { pontos: 0, vitorias: 0, empates: 0, derrotas: 0, jogos: 0 });
    return stats.get(id)!;
  };

  // Só os mensalistas (confirmados do mês) disputam a classificação — avulsos ficam de fora.
  const mensalistas = new Set(getMensalMes(estado, estado.mes).confirmados);
  mensalistas.forEach(garantir);

  for (const r of estado.rodadas) {
    if (r.resultado === "andamento") continue; // ainda sem resultado: não pontua
    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
        if (!mensalistas.has(id)) continue; // avulso não pontua no mensal
        const s = garantir(id);
        s.jogos++;
        if (r.resultado === "empate") {
          s.empates++;
          s.pontos += 1;
        } else if (venceu) {
          s.vitorias++;
          s.pontos += 3;
        } else {
          s.derrotas++;
        }
      }
    }
  }

  return [...stats.entries()]
    .map(([id, s]) => {
      const jogador = estado.jogadores.find((j) => j.id === id);
      return jogador ? { jogador, ...s } : null;
    })
    .filter((x): x is LinhaClassificacao => Boolean(x))
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.vitorias - a.vitorias ||
        b.jogos - a.jogos ||
        a.jogador.nome.localeCompare(b.jogador.nome),
    );
}

// ── Nota e ranking de jogadores ──────────────────────────────────────────────
// Todos começam em NOTA_BASE (6). Vitória e gols sobem, derrota desce e cada
// título de campeão soma um bônus — sempre travado no intervalo [NOTA_MIN, NOTA_MAX].
// Empate é neutro. A nota usa TODAS as rodadas já jogadas (atuais + arquivadas),
// então ela sobrevive ao encerramento de um trimestral.

export const NOTA_BASE = 6;
export const NOTA_MIN = 6; // piso: a nota nunca baixa de 6
export const NOTA_MAX = 10;
export const PASSO_CAMPEAO = 0.5;
export const PASSO_AUSENCIA = 0.1; // perde por rodada que rolou desde a estreia e não jogou
export const PASSO_GOL = 0.05;
export const PASSO_ASSISTENCIA = 0.05;

function limitar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

/** Combo de vitória: a N-ésima seguida vale 0,2 / 0,3 / 0,4 ... (+0,1 a cada seguida, sem teto). */
function pontosVitoriaSeguida(sequencia: number) {
  return 0.1 * (sequencia + 1);
}

/** Combo de derrota: a N-ésima seguida tira 0,1 / 0,2 / 0,3 ... (+0,1 a cada seguida, sem teto). */
function pontosDerrotaSeguida(sequencia: number) {
  return 0.1 * sequencia;
}

/** Nota = base + combo de vitórias + gols/assistências + títulos − combo de derrotas − ausências, travada em [6, 10]. */
function calcularNota(
  s: { pontosVitoria: number; pontosDerrota: number; ausencias: number; gols: number; assistencias: number },
  campeonatos: number,
) {
  return limitar(
    NOTA_BASE +
      s.pontosVitoria +
      s.gols * PASSO_GOL +
      s.assistencias * PASSO_ASSISTENCIA +
      campeonatos * PASSO_CAMPEAO -
      s.pontosDerrota -
      s.ausencias * PASSO_AUSENCIA,
    NOTA_MIN,
    NOTA_MAX,
  );
}

/** Nomes combinam se são iguais ou um é prefixo (por palavra) do outro — ex.: "Henrique" ~ "Henrique Muller". */
function nomesCombinam(a: string, b: string): boolean {
  a = a.trim().toLowerCase();
  b = b.trim().toLowerCase();
  return !!a && !!b && (a === b || a.startsWith(b + " ") || b.startsWith(a + " "));
}

/** Quantas vezes cada jogador foi campeão. O quadro guarda por nome; casamos com o id
 *  de forma tolerante, só creditando quando há um único jogador correspondente. */
function campeonatosPorJogador(estado: Estado): Map<string, number> {
  const porId = new Map<string, number>();
  for (const c of estado.campeoes) {
    const nome = (c.jogadorNome ?? "").trim();
    if (!nome) continue;
    const candidatos = estado.jogadores.filter((j) => nomesCombinam(j.nome, nome));
    if (candidatos.length === 1) {
      const id = candidatos[0].id;
      porId.set(id, (porId.get(id) ?? 0) + 1);
    }
  }
  return porId;
}

export interface EstatisticaJogador {
  vitorias: number;
  derrotas: number;
  empates: number;
  jogos: number;
  /** Gols e assistências somados em todas as rodadas (cada um vale +0,05 na nota). */
  gols: number;
  assistencias: number;
  /** Rodadas que rolaram desde a estreia e o jogador não jogou. */
  ausencias: number;
  /** Combo atual de vitórias seguidas (zera ao perder ou faltar). */
  sequencia: number;
  /** Combo atual de derrotas seguidas (zera ao vencer; falta NÃO zera). */
  sequenciaDerrota: number;
  /** Soma do combo de vitórias acumulado. */
  pontosVitoria: number;
  /** Soma do combo de derrotas acumulado (valor positivo, subtraído da nota). */
  pontosDerrota: number;
  nota: number;
}

function novoStat(): EstatisticaJogador {
  return {
    vitorias: 0,
    derrotas: 0,
    empates: 0,
    jogos: 0,
    gols: 0,
    assistencias: 0,
    ausencias: 0,
    sequencia: 0,
    sequenciaDerrota: 0,
    pontosVitoria: 0,
    pontosDerrota: 0,
    nota: NOTA_BASE,
  };
}

/**
 * Percorre as rodadas em ordem e apura, para cada jogador: vitórias/derrotas/empates,
 * gols/assistências, o combo de vitórias seguidas (empate mantém, derrota e falta zeram)
 * e as ausências desde a estreia.
 */
export function estatisticasPorRodadas(rodadas: Rodada[]): Map<string, EstatisticaJogador> {
  const stats = new Map<string, EstatisticaJogador>();
  const jaEstreou = new Set<string>();

  const decididas = rodadas
    .filter((r) => r.resultado !== "andamento")
    .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));

  for (const r of decididas) {
    const presentes = new Set<string>([...(r.timeVermelho ?? []), ...(r.timeAzul ?? [])]);

    // Quem já estreou e não veio: falta. Tira 0,1 (ausência) e zera o combo de VITÓRIA,
    // mas o combo de DERROTA continua (não zera).
    for (const id of jaEstreou) {
      if (!presentes.has(id)) {
        const s = stats.get(id)!;
        s.ausencias++;
        s.sequencia = 0;
      }
    }

    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
        if (!stats.has(id)) stats.set(id, novoStat());
        jaEstreou.add(id);
        const s = stats.get(id)!;
        s.jogos++;
        s.gols += Number(r.gols?.[id] ?? 0);
        s.assistencias += Number(r.assistencias?.[id] ?? 0);
        if (r.resultado === "empate") {
          s.empates++; // empate é neutro: não zera nem soma nenhum combo
        } else if (venceu) {
          s.vitorias++;
          s.sequencia++;
          s.pontosVitoria += pontosVitoriaSeguida(s.sequencia); // 0,2 · 0,3 · 0,4 ...
          s.sequenciaDerrota = 0; // vencer quebra a sequência de derrotas
        } else {
          s.derrotas++;
          s.sequenciaDerrota++;
          s.pontosDerrota += pontosDerrotaSeguida(s.sequenciaDerrota); // 0,1 · 0,2 · 0,3 ...
          s.sequencia = 0; // perder quebra o combo de vitórias
        }
      }
    }
  }

  for (const s of stats.values()) {
    s.nota = calcularNota(s, 0); // nota provisória (sem campeão); o bônus entra em notasComCampeoes
  }
  return stats;
}

/** Aplica o bônus de campeão sobre as estatísticas de uma lista de rodadas. */
function notasComCampeoes(estado: Estado, rodadas: Rodada[]): Map<string, EstatisticaJogador> {
  const stats = estatisticasPorRodadas(rodadas);
  const campeoes = campeonatosPorJogador(estado);
  const totalDecididas = rodadas.filter((r) => r.resultado !== "andamento").length;
  // Campeão que nunca jogou nenhuma rodada conta como tendo faltado a todas (a nota cai da base + título).
  for (const id of campeoes.keys()) {
    if (!stats.has(id)) stats.set(id, { ...novoStat(), ausencias: totalDecididas });
  }
  for (const [id, s] of stats) {
    s.nota = calcularNota(s, campeoes.get(id) ?? 0);
  }
  return stats;
}

/** Estatística/nota de cada jogador considerando rodadas atuais + arquivadas + títulos. */
export function notasJogadores(estado: Estado): Map<string, EstatisticaJogador> {
  return notasComCampeoes(estado, [...estado.rodadas, ...(estado.rodadasArquivadas ?? [])]);
}

export interface LinhaRanking {
  jogador: Jogador;
  stats: EstatisticaJogador;
  posicaoAtual: number;
  /** + subiu, − caiu, 0 estável/novo desde a rodada anterior. */
  movimento: number;
  /** Quantas vezes o jogador já foi campeão (mostra a coroa quando > 0). */
  titulos: number;
}

/** Mapa público (id → nº de títulos) para exibir a coroa dos campeões em qualquer tela. */
export function titulosPorJogador(estado: Estado): Map<string, number> {
  return campeonatosPorJogador(estado);
}

/** Estatística do jogador ou o padrão (nota base, tudo zerado) para quem ainda não jogou. */
function statOuPadrao(stats: Map<string, EstatisticaJogador>, id: string): EstatisticaJogador {
  return stats.get(id) ?? novoStat();
}

/** Ordena TODOS os jogadores cadastrados por nota (desempate: gols, vitórias, sequência, nome). */
function ordenarPorNota(estado: Estado, stats: Map<string, EstatisticaJogador>): Jogador[] {
  return [...estado.jogadores].sort((a, b) => {
    const sa = statOuPadrao(stats, a.id);
    const sb = statOuPadrao(stats, b.id);
    return (
      sb.nota - sa.nota ||
      sb.gols - sa.gols ||
      sb.vitorias - sa.vitorias ||
      sb.sequencia - sa.sequencia ||
      a.nome.localeCompare(b.nome)
    );
  });
}

/**
 * Ranking por nota com o movimento de posição em relação à rodada anterior:
 * compara o ranking atual com o ranking calculado sem a última rodada registrada.
 */
export function rankingJogadores(estado: Estado): LinhaRanking[] {
  const todas = [...estado.rodadas, ...(estado.rodadasArquivadas ?? [])];
  const statsAtual = notasComCampeoes(estado, todas);
  const ordemAtual = ordenarPorNota(estado, statsAtual);

  // Ranking anterior = sem a rodada mais recente (por data), para medir o movimento.
  const anterior = [...todas].sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
  anterior.pop();
  const posicaoAnterior = new Map<string, number>();
  ordenarPorNota(estado, notasComCampeoes(estado, anterior)).forEach((j, i) => posicaoAnterior.set(j.id, i));

  const titulos = campeonatosPorJogador(estado);

  return ordemAtual.map((jogador, i) => {
    const antes = posicaoAnterior.get(jogador.id);
    const movimento = antes === undefined ? 0 : antes - i; // subiu = posição menor agora
    return {
      jogador,
      stats: statOuPadrao(statsAtual, jogador.id),
      posicaoAtual: i + 1,
      movimento,
      titulos: titulos.get(jogador.id) ?? 0,
    };
  });
}

// ── Sorteio equilibrado de times ─────────────────────────────────────────────
// Distribui os jogadores em dois times por posição (defensor/meio/atacante/sem)
// e, dentro de cada grupo, joga cada jogador no time de menor soma de nota — o que
// equilibra tanto a nota quanto a distribuição de posições. Ideal: 16 (8 + 8).

export interface JogadorSorteio {
  id: string;
  nome: string;
  posicao?: Posicao;
  nota: number;
}

export interface ResultadoSorteio {
  vermelho: JogadorSorteio[];
  azul: JogadorSorteio[];
  somaVermelho: number;
  somaAzul: number;
  mediaVermelho: number;
  mediaAzul: number;
}

function somaNotas(time: JogadorSorteio[]) {
  return time.reduce((s, j) => s + j.nota, 0);
}

export function sortearTimes(jogadores: JogadorSorteio[], limitePorTime = 8): ResultadoSorteio {
  const grupos: (Posicao | undefined)[] = ["defensor", "meio", "atacante", undefined];
  const vermelho: JogadorSorteio[] = [];
  const azul: JogadorSorteio[] = [];
  // Contagem de jogadores por posição em cada time, para distribuir DEF/MEI/ATA parelho.
  const contagem: Record<"vermelho" | "azul", Record<string, number>> = { vermelho: {}, azul: {} };

  for (const pos of grupos) {
    const chave = pos ?? "_";
    const grupo = jogadores.filter((j) => j.posicao === pos).sort((a, b) => b.nota - a.nota);
    for (const j of grupo) {
      const vCheio = vermelho.length >= limitePorTime;
      const aCheio = azul.length >= limitePorTime;
      const cv = contagem.vermelho[chave] ?? 0;
      const ca = contagem.azul[chave] ?? 0;
      let paraVermelho: boolean;
      if (aCheio) paraVermelho = true;
      else if (vCheio) paraVermelho = false;
      else if (cv !== ca) paraVermelho = cv < ca; // primeiro equilibra a posição
      else paraVermelho = somaNotas(vermelho) <= somaNotas(azul); // depois equilibra a nota
      if (paraVermelho) {
        vermelho.push(j);
        contagem.vermelho[chave] = cv + 1;
      } else {
        azul.push(j);
        contagem.azul[chave] = ca + 1;
      }
    }
  }

  const somaVermelho = somaNotas(vermelho);
  const somaAzul = somaNotas(azul);
  return {
    vermelho,
    azul,
    somaVermelho,
    somaAzul,
    mediaVermelho: vermelho.length ? somaVermelho / vermelho.length : 0,
    mediaAzul: azul.length ? somaAzul / azul.length : 0,
  };
}

export function gerarRelatorioMensalistas(estado: Estado, mes: string, titulo: string) {
  const m = getMensalMes(estado, mes);
  const mensalistas = m.confirmados
    .map((id) => estado.jogadores.find((j) => j.id === id))
    .filter((j): j is Jogador => Boolean(j));
  const linhas = mensalistas.map((j, i) => `${i + 1} - ${j.nome}${m.pagos.includes(j.id) ? " ✅" : ""}`);
  while (linhas.length < 18) linhas.push(`${linhas.length + 1} - `);
  return `${titulo || "🏆 QUADRO DE MENSALISTAS 2026 🔴🔵"}\n📆 Mês: ${nomeMes(mes)}\n🔒 Time fechado, compromisso firmado, diversão garantida!\n\nObrigado a todos que fazem parte desse projeto com presença, apoio e espírito de grupo. Vocês são o coração do nosso futebol de quarta!\n\nConfirmação de pagamento:\n${linhas.join("\n")}\n\nPix: ${estado.configuracoes.pixMensal}\n${dinheiroSimples(valorMensalFixo(estado))}\n\n🚨Pagamento até ${dataBR(`${mes}-10`)}🚨`;
}

export function gerarRelatorioAvulsos(estado: Estado, mes: string) {
  const jogosDoMes = Object.values(estado.jogosAvulsos)
    .filter((g) => g.data?.startsWith(mes) && (g.jogadores?.length ?? 0) > 0)
    .sort((a, b) => a.data.localeCompare(b.data));
  const cabecalho = `Lista de Avulsos 🔵🔴\n🏟️ Local - ${estado.configuracoes.localPadrao}`;
  const valorAvulso = valorAvulsoFixo(estado);

  if (!jogosDoMes.length) {
    return `${cabecalho}\n\nNenhum avulso registrado.\n\nPix: ${estado.configuracoes.pixAvulso}\nValor: ${dinheiroSimples(valorAvulso)}`;
  }

  const secoes = jogosDoMes
    .map((g) => {
      const jogadores = (g.jogadores ?? [])
        .map((id) => estado.jogadores.find((j) => j.id === id))
        .filter((j): j is Jogador => Boolean(j));
      const pagos = g.pagos ?? [];
      const pendentes = jogadores.filter((j) => !pagos.includes(j.id));
      if (!pendentes.length) return null;
      const linhas = pendentes.map((j, i) => `${i + 1} - ${j.nome}`).join("\n");
      return `📅 Data - ${dataBR(g.data)} ${calcularDiaSemana(g.data)} - ${estado.configuracoes.horarioPadrao}\n⚽ AVULSOS:\n${linhas}`;
    })
    .filter((s): s is string => Boolean(s))
    .join("\n\n");

  if (!secoes) {
    return `${cabecalho}\n\nTodos os avulsos do mês estão em dia! ✅\n\nPix: ${estado.configuracoes.pixAvulso}\nValor: ${dinheiroSimples(valorAvulso)}`;
  }
  return `${cabecalho}\n\n${secoes}\n\nPix: ${estado.configuracoes.pixAvulso}\nValor: ${dinheiroSimples(valorAvulso)}`;
}
