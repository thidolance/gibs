import type { CampeaoTrimestral, Estado, Jogador, JogoAvulso, Lancamento, MensalistaMes, Rodada } from "./types";
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

  const rodadas = normalizarArr<Partial<Rodada> & Record<string, unknown>>(v.rodadas).map((r) => ({
    id: (r.id as string) ?? gerarId(),
    data: (r.data as string) ?? "",
    timeVermelho: normalizarArr<string>(r.timeVermelho),
    timeAzul: normalizarArr<string>(r.timeAzul),
    resultado: (r.resultado as Rodada["resultado"]) ?? "empate",
  }));

  const campeoes = normalizarArr<Partial<CampeaoTrimestral> & Record<string, unknown>>(v.campeoes).map((c) => ({
    id: (c.id as string) ?? gerarId(),
    periodo: (c.periodo as string) ?? "",
    jogadorNome: (c.jogadorNome as string) ?? "",
    pontos: Number(c.pontos ?? 0),
    data: (c.data as string) ?? "",
  }));

  return {
    mes: v.mes ?? estadoInicial.mes,
    jogadores: normalizarArr<Jogador>(v.jogadores),
    mensalistasPorMes,
    jogosAvulsos,
    despesas: normalizarArr<Lancamento>(v.despesas),
    receitasExtras: normalizarArr<Lancamento>(v.receitasExtras),
    rodadas,
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
