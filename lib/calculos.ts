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
  if (!g) return { data, jogadores: [], selecionados: [], pagos: [], observacao: "", valoresCustom: {} };
  return {
    data: g.data,
    jogadores: g.jogadores ?? [],
    selecionados: g.selecionados ?? g.jogadores ?? [],
    pagos: g.pagos ?? [],
    observacao: g.observacao ?? "",
    valoresCustom: g.valoresCustom ?? {},
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

export function valorAvulsoJogador(estado: Estado, data: string, jogadorId: string) {
  const custom = getJogoAvulso(estado, data).valoresCustom?.[jogadorId];
  return custom ? Number(custom) : valorAvulsoFixo(estado);
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

  const valorMensal = valorMensalFixo(estado);
  const valorAvulso = valorAvulsoFixo(estado);

  const valorDe = (jogadorId: string) =>
    m.valoresCustom?.[jogadorId] ? Number(m.valoresCustom[jogadorId]) : valorMensal;

  const mensRec = m.pagos.reduce((s, id) => s + valorDe(id), 0);
  const mensAR = m.confirmados.filter((id) => !m.pagos.includes(id)).reduce((s, id) => s + valorDe(id), 0);

  // Avulsos usam valor individual quando definido; senão o valor de avulso padrão.
  const valorAvulsoDe = (g: JogoAvulso, id: string) =>
    g.valoresCustom?.[id] ? Number(g.valoresCustom[id]) : valorAvulso;
  let avRec = 0;
  let avAR = 0;
  for (const g of jogos) {
    for (const id of g.jogadores) {
      if (g.pagos.includes(id)) avRec += valorAvulsoDe(g, id);
      else avAR += valorAvulsoDe(g, id);
    }
  }

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
      valoresCustom: (gg.valoresCustom as Record<string, number>) ?? {},
    };
  }

  const normalizarPlacar = (valor: unknown): number | undefined => {
    if (valor === undefined || valor === null || valor === "") return undefined;
    const n = Number(valor);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const normalizarRodada = (r: Partial<Rodada> & Record<string, unknown>): Rodada => ({
    id: (r.id as string) ?? gerarId(),
    data: (r.data as string) ?? "",
    timeVermelho: normalizarArr<string>(r.timeVermelho),
    timeAzul: normalizarArr<string>(r.timeAzul),
    resultado: (r.resultado as Rodada["resultado"]) ?? "empate",
    ...(normalizarPlacar(r.placarVermelho) !== undefined ? { placarVermelho: normalizarPlacar(r.placarVermelho) } : {}),
    ...(normalizarPlacar(r.placarAzul) !== undefined ? { placarAzul: normalizarPlacar(r.placarAzul) } : {}),
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
    const ausentes = new Set(r.ausentes ?? []);
    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
        if (!mensalistas.has(id)) continue; // avulso não pontua no mensal
        if (ausentes.has(id)) continue; // escalado que faltou não joga nem pontua
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
// Todos começam em NOTA_BASE (6). A nota é um saldo CORRENTE travado em [6, 10] e
// atualizado a cada rodada: vitória sobe, derrota e ausência descem (empate é neutro)
// e cada título soma um bônus. Como a trava age rodada a rodada, derrota não acumula
// dívida abaixo do piso — ao voltar a vencer a nota sobe na hora. Usa TODAS as rodadas
// já jogadas (atuais + arquivadas), então sobrevive ao encerramento de um trimestral.

export const NOTA_BASE = 6;
export const NOTA_MIN = 6; // piso: a nota nunca baixa de 6
export const NOTA_MAX = 10;
export const PASSO_CAMPEAO = 0.5;
export const PASSO_AUSENCIA = 0.1; // perde por rodada em que foi escalado e faltou

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

/**
 * A nota é um saldo CORRENTE em [6, 10], atualizado rodada a rodada e travado a cada
 * passo. Como a trava age em cada rodada, uma derrota nunca afunda a nota abaixo de 6
 * nem acumula dívida escondida: ao voltar a vencer, o jogador sobe na hora a partir do
 * piso. O bônus de título entra por cima do saldo já travado.
 */
function comTitulos(nota: number, campeonatos: number) {
  return limitar(nota + campeonatos * PASSO_CAMPEAO, NOTA_MIN, NOTA_MAX);
}

/** Quantas vezes cada jogador foi campeão. O quadro guarda por nome; casamos com o id
 *  por nome EXATO (ignorando espaços/maiúsculas), só creditando quando há um único
 *  jogador com aquele nome — evita creditar título ao jogador errado. */
function campeonatosPorJogador(estado: Estado): Map<string, number> {
  const porId = new Map<string, number>();
  const normalizar = (s: string) => s.trim().toLowerCase();
  for (const c of estado.campeoes) {
    const nome = normalizar(c.jogadorNome ?? "");
    if (!nome) continue;
    const candidatos = estado.jogadores.filter((j) => normalizar(j.nome) === nome);
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
  /** Rodadas em que o jogador foi escalado e faltou. */
  ausencias: number;
  /** Combo atual de vitórias seguidas (zera ao perder ou faltar). */
  sequencia: number;
  /** Combo atual de derrotas seguidas (zera ao vencer; falta NÃO zera). */
  sequenciaDerrota: number;
  /** Saldo corrente da nota, travado em [6, 10] a cada rodada. */
  nota: number;
}

function novoStat(): EstatisticaJogador {
  return {
    vitorias: 0,
    derrotas: 0,
    empates: 0,
    jogos: 0,
    ausencias: 0,
    sequencia: 0,
    sequenciaDerrota: 0,
    nota: NOTA_BASE,
  };
}

/**
 * Percorre as rodadas em ordem e apura, para cada jogador: vitórias/derrotas/empates,
 * o combo de vitórias seguidas (empate mantém, derrota e falta zeram)
 * e as ausências (rodadas em que foi escalado e faltou).
 */
export function estatisticasPorRodadas(rodadas: Rodada[]): Map<string, EstatisticaJogador> {
  const stats = new Map<string, EstatisticaJogador>();

  const decididas = rodadas
    .filter((r) => r.resultado !== "andamento")
    .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));

  for (const r of decididas) {
    const ausentes = new Set(r.ausentes ?? []);

    // Ausência só pune quem foi escalado para a rodada e não compareceu (r.ausentes).
    // Tira 0,1 e zera o combo de VITÓRIA; o combo de DERROTA continua (não zera).
    for (const id of ausentes) {
      if (!stats.has(id)) stats.set(id, novoStat());
      const s = stats.get(id)!;
      s.ausencias++;
      s.sequencia = 0;
      s.nota = limitar(s.nota - PASSO_AUSENCIA, NOTA_MIN, NOTA_MAX);
    }

    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
        if (ausentes.has(id)) continue; // escalado que faltou não joga nem pontua
        if (!stats.has(id)) stats.set(id, novoStat());
        const s = stats.get(id)!;
        s.jogos++;
        if (r.resultado === "empate") {
          s.empates++; // empate é neutro: não zera nem soma nenhum combo
        } else if (venceu) {
          s.vitorias++;
          s.sequencia++;
          s.nota = limitar(s.nota + pontosVitoriaSeguida(s.sequencia), NOTA_MIN, NOTA_MAX); // +0,2 · 0,3 · 0,4 ...
          s.sequenciaDerrota = 0; // vencer quebra a sequência de derrotas
        } else {
          s.derrotas++;
          s.sequenciaDerrota++;
          s.nota = limitar(s.nota - pontosDerrotaSeguida(s.sequenciaDerrota), NOTA_MIN, NOTA_MAX); // −0,1 · 0,2 · 0,3 ...
          s.sequencia = 0; // perder quebra o combo de vitórias
        }
      }
    }
  }

  // nota já vem travada rodada a rodada; o bônus de título entra em notasComCampeoes.
  return stats;
}

/** Aplica o bônus de campeão sobre as estatísticas de uma lista de rodadas. */
function notasComCampeoes(estado: Estado, rodadas: Rodada[]): Map<string, EstatisticaJogador> {
  const stats = estatisticasPorRodadas(rodadas);
  const campeoes = campeonatosPorJogador(estado);
  const totalDecididas = rodadas.filter((r) => r.resultado !== "andamento").length;
  // Campeão que nunca jogou conta como ausente em todas — a nota só cai até o piso (6).
  for (const id of campeoes.keys()) {
    if (!stats.has(id)) {
      const s = { ...novoStat(), ausencias: totalDecididas };
      s.nota = limitar(NOTA_BASE - totalDecididas * PASSO_AUSENCIA, NOTA_MIN, NOTA_MAX);
      stats.set(id, s);
    }
  }
  for (const [id, s] of stats) {
    s.nota = comTitulos(s.nota, campeoes.get(id) ?? 0);
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

/** Ordena TODOS os jogadores cadastrados por nota (desempate: vitórias, sequência, nome). */
function ordenarPorNota(estado: Estado, stats: Map<string, EstatisticaJogador>): Jogador[] {
  return [...estado.jogadores].sort((a, b) => {
    const sa = statOuPadrao(stats, a.id);
    const sb = statOuPadrao(stats, b.id);
    return (
      sb.nota - sa.nota ||
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

export interface PartidaJogador {
  data: string;
  resultado: "vitoria" | "derrota" | "empate";
  time: "vermelho" | "azul";
  /** Placar do time do jogador × adversário (null quando a rodada não teve placar lançado). */
  golsPro: number | null;
  golsContra: number | null;
}

/** Histórico de partidas de um jogador (só rodadas decididas em que ele entrou), da mais recente para a mais antiga. */
export function partidasDoJogador(estado: Estado, jogadorId: string): PartidaJogador[] {
  const todas = [...estado.rodadas, ...(estado.rodadasArquivadas ?? [])];
  const partidas: PartidaJogador[] = [];
  for (const r of todas) {
    if (r.resultado === "andamento") continue;
    if ((r.ausentes ?? []).includes(jogadorId)) continue; // escalado que faltou não jogou
    const noVermelho = (r.timeVermelho ?? []).includes(jogadorId);
    const noAzul = (r.timeAzul ?? []).includes(jogadorId);
    if (!noVermelho && !noAzul) continue;
    const time = noVermelho ? "vermelho" : "azul";
    const resultado = r.resultado === "empate" ? "empate" : r.resultado === time ? "vitoria" : "derrota";
    let golsPro = (time === "vermelho" ? r.placarVermelho : r.placarAzul) ?? null;
    let golsContra = (time === "vermelho" ? r.placarAzul : r.placarVermelho) ?? null;
    // Jogo com vencedor mas sem placar lançado: assume 3×0 a favor de quem venceu.
    if (golsPro === null && golsContra === null && resultado !== "empate") {
      golsPro = resultado === "vitoria" ? 3 : 0;
      golsContra = resultado === "vitoria" ? 0 : 3;
    }
    partidas.push({ data: r.data, resultado, time, golsPro, golsContra });
  }
  return partidas.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
}

export interface PontoEvolucao {
  data: string;
  /** Nº da rodada na trajetória do jogador (1..N, só rodadas que o afetaram). */
  rodada: number;
  nota: number;
  resultado: "vitoria" | "derrota" | "empate" | "ausencia";
}

/**
 * Evolução da nota do jogador rodada a rodada — só rodadas decididas que o afetaram
 * (jogou ou foi escalado e faltou), da mais antiga para a mais recente. Usa exatamente
 * a mesma fórmula da nota do ranking, então o último ponto bate com a nota atual.
 * O bônus de título entra como constante (não há rodada associada ao título).
 */
export function evolucaoNotaJogador(estado: Estado, jogadorId: string): PontoEvolucao[] {
  const todas = [...estado.rodadas, ...(estado.rodadasArquivadas ?? [])]
    .filter((r) => r.resultado !== "andamento")
    .sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
  const campeonatos = campeonatosPorJogador(estado).get(jogadorId) ?? 0;

  const s = novoStat();
  const pontos: PontoEvolucao[] = [];
  for (const r of todas) {
    const ausente = (r.ausentes ?? []).includes(jogadorId);
    const noVermelho = (r.timeVermelho ?? []).includes(jogadorId);
    const noAzul = (r.timeAzul ?? []).includes(jogadorId);

    let resultado: PontoEvolucao["resultado"];
    if (ausente) {
      s.ausencias++;
      s.sequencia = 0; // faltar zera o combo de vitória
      s.nota = limitar(s.nota - PASSO_AUSENCIA, NOTA_MIN, NOTA_MAX);
      resultado = "ausencia";
    } else if (noVermelho || noAzul) {
      const time = noVermelho ? "vermelho" : "azul";
      if (r.resultado === "empate") {
        resultado = "empate"; // neutro
      } else if (r.resultado === time) {
        s.sequencia++;
        s.nota = limitar(s.nota + pontosVitoriaSeguida(s.sequencia), NOTA_MIN, NOTA_MAX);
        s.sequenciaDerrota = 0;
        resultado = "vitoria";
      } else {
        s.sequenciaDerrota++;
        s.nota = limitar(s.nota - pontosDerrotaSeguida(s.sequenciaDerrota), NOTA_MIN, NOTA_MAX);
        s.sequencia = 0;
        resultado = "derrota";
      }
    } else {
      continue; // rodada não envolveu o jogador
    }
    pontos.push({ data: r.data, rodada: pontos.length + 1, nota: comTitulos(s.nota, campeonatos), resultado });
  }
  return pontos;
}

/** Conjunto de jogadores que entraram em campo nas últimas `n` rodadas decididas. */
export function jogadoresUltimasRodadas(rodadas: Rodada[], n = 5): Set<string> {
  const recentes = [...rodadas]
    .filter((r) => r.resultado !== "andamento")
    .sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))
    .slice(0, n);
  const ids = new Set<string>();
  for (const r of recentes) {
    const ausentes = new Set(r.ausentes ?? []);
    for (const id of [...(r.timeVermelho ?? []), ...(r.timeAzul ?? [])]) {
      if (!ausentes.has(id)) ids.add(id); // quem faltou não entra na foto
    }
  }
  return ids;
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
