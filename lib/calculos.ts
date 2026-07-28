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

  const normalizarGols = (valor: unknown): Record<string, number> => {
    if (!valor || typeof valor !== "object") return {};
    const gols: Record<string, number> = {};
    for (const [id, n] of Object.entries(valor as Record<string, unknown>)) {
      const qtd = Number(n);
      if (qtd > 0) gols[id] = qtd;
    }
    return gols;
  };

  const normalizarRodada = (r: Partial<Rodada> & Record<string, unknown>): Rodada => ({
    id: (r.id as string) ?? gerarId(),
    data: (r.data as string) ?? "",
    timeVermelho: normalizarArr<string>(r.timeVermelho),
    timeAzul: normalizarArr<string>(r.timeAzul),
    resultado: (r.resultado as Rodada["resultado"]) ?? "empate",
    gols: normalizarGols(r.gols),
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
    return {
      id: (j.id as string) ?? gerarId(),
      nome: (j.nome as string) ?? "",
      apelido: (j.apelido as string) ?? "",
      telefone: (j.telefone as string) ?? "",
      ...(posicao ? { posicao } : {}),
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

  // Todos os mensalistas confirmados entram na disputa, mesmo zerados.
  getMensalMes(estado, estado.mes).confirmados.forEach(garantir);

  for (const r of estado.rodadas) {
    if (r.resultado === "andamento") continue; // ainda sem resultado: não pontua
    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
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
// Todos começam em NOTA_BASE (8). Cada vitória sobe, cada derrota desce e cada
// gol soma um pouco — sempre travado no intervalo [NOTA_MIN, NOTA_MAX]. Empate é
// neutro. A nota usa TODAS as rodadas já jogadas (atuais + arquivadas), então ela
// sobrevive ao encerramento de um trimestral.

export const NOTA_BASE = 6;
export const NOTA_MIN = 5;
export const NOTA_MAX = 10;
export const PASSO_VITORIA = 0.1;
export const PASSO_DERROTA = 0.2;
export const PASSO_GOL = 0.1;

function limitar(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

export interface EstatisticaJogador {
  vitorias: number;
  derrotas: number;
  empates: number;
  gols: number;
  jogos: number;
  nota: number;
}

/** Agrega vitórias/derrotas/empates/gols de uma lista de rodadas e calcula a nota. */
export function estatisticasPorRodadas(rodadas: Rodada[]): Map<string, EstatisticaJogador> {
  const stats = new Map<string, EstatisticaJogador>();
  const garantir = (id: string) => {
    if (!stats.has(id)) stats.set(id, { vitorias: 0, derrotas: 0, empates: 0, gols: 0, jogos: 0, nota: NOTA_BASE });
    return stats.get(id)!;
  };

  for (const r of rodadas) {
    if (r.resultado === "andamento") continue; // rodada sorteada ainda sem resultado
    const times: [string[], boolean][] = [
      [r.timeVermelho ?? [], r.resultado === "vermelho"],
      [r.timeAzul ?? [], r.resultado === "azul"],
    ];
    for (const [jogadores, venceu] of times) {
      for (const id of jogadores) {
        const s = garantir(id);
        s.jogos++;
        if (r.resultado === "empate") s.empates++;
        else if (venceu) s.vitorias++;
        else s.derrotas++;
        s.gols += Number(r.gols?.[id] ?? 0);
      }
    }
  }

  for (const s of stats.values()) {
    s.nota = limitar(
      NOTA_BASE + s.vitorias * PASSO_VITORIA - s.derrotas * PASSO_DERROTA + s.gols * PASSO_GOL,
      NOTA_MIN,
      NOTA_MAX,
    );
  }
  return stats;
}

/** Estatística/nota de cada jogador considerando rodadas atuais + arquivadas. */
export function notasJogadores(estado: Estado): Map<string, EstatisticaJogador> {
  return estatisticasPorRodadas([...estado.rodadas, ...(estado.rodadasArquivadas ?? [])]);
}

export interface LinhaRanking {
  jogador: Jogador;
  stats: EstatisticaJogador;
  posicaoAtual: number;
  /** + subiu, − caiu, 0 estável/novo desde a rodada anterior. */
  movimento: number;
}

/** Estatística do jogador ou o padrão (nota base, tudo zerado) para quem ainda não jogou. */
function statOuPadrao(stats: Map<string, EstatisticaJogador>, id: string): EstatisticaJogador {
  return stats.get(id) ?? { vitorias: 0, derrotas: 0, empates: 0, gols: 0, jogos: 0, nota: NOTA_BASE };
}

/** Ordena TODOS os jogadores cadastrados por nota (desempate: gols, vitórias, nome). */
function ordenarPorNota(estado: Estado, stats: Map<string, EstatisticaJogador>): Jogador[] {
  return [...estado.jogadores].sort((a, b) => {
    const sa = statOuPadrao(stats, a.id);
    const sb = statOuPadrao(stats, b.id);
    return sb.nota - sa.nota || sb.gols - sa.gols || sb.vitorias - sa.vitorias || a.nome.localeCompare(b.nome);
  });
}

/**
 * Ranking por nota com o movimento de posição em relação à rodada anterior:
 * compara o ranking atual com o ranking calculado sem a última rodada registrada.
 */
export function rankingJogadores(estado: Estado): LinhaRanking[] {
  const todas = [...estado.rodadas, ...(estado.rodadasArquivadas ?? [])];
  const statsAtual = estatisticasPorRodadas(todas);
  const ordemAtual = ordenarPorNota(estado, statsAtual);

  // Ranking anterior = sem a rodada mais recente (por data), para medir o movimento.
  const anterior = [...todas].sort((a, b) => (a.data ?? "").localeCompare(b.data ?? ""));
  anterior.pop();
  const posicaoAnterior = new Map<string, number>();
  ordenarPorNota(estado, estatisticasPorRodadas(anterior)).forEach((j, i) => posicaoAnterior.set(j.id, i));

  return ordemAtual.map((jogador, i) => {
    const antes = posicaoAnterior.get(jogador.id);
    const movimento = antes === undefined ? 0 : antes - i; // subiu = posição menor agora
    return { jogador, stats: statOuPadrao(statsAtual, jogador.id), posicaoAtual: i + 1, movimento };
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
