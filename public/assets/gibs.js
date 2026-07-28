/* ===== Gibs FC — dados, cálculos e header do site público =====
   As fórmulas são espelho de lib/calculos.ts — manter idênticas. */
(function () {
  const DB_URL = "https://gibs-51f02-default-rtdb.firebaseio.com/estado.json";
  const LOJA_URL = "https://gibs-51f02-default-rtdb.firebaseio.com/loja.json";

  const NOTA_BASE = 6, NOTA_MIN = 5, NOTA_MAX = 10, PV = 0.2, PD = 0.1, PG = 0.1, PCAMP = 0.5;
  const limitar = (x, a, b) => Math.min(b, Math.max(a, x));
  const arr = (v) => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const nomeMes = (m) => MESES[Number((m || "").split("-")[1]) - 1] || m;
  const dataBR = (d) => { if (!d) return ""; const p = d.split("-"); return p[2] + "/" + p[1]; };
  const dataExt = (d) => { if (!d) return ""; const p = d.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; };
  const dinheiro = (v) => "R$ " + Number(v || 0).toFixed(2).replace(".", ",");
  const POS = { defensor: { abrev: "DEF", cls: "pos-def", rotulo: "Defensor" }, meio: { abrev: "MEI", cls: "pos-mei", rotulo: "Meio-campo" }, atacante: { abrev: "ATA", cls: "pos-ata", rotulo: "Atacante" } };

  function normalizar(v) {
    v = v || {};
    const jogadores = arr(v.jogadores).map((j) => ({ id: j.id, nome: j.nome || "", posicao: j.posicao }));
    const rod = (r) => ({ id: r.id, data: r.data || "", resultado: r.resultado || "empate", timeVermelho: arr(r.timeVermelho), timeAzul: arr(r.timeAzul), gols: r.gols || {} });
    return {
      mes: v.mes, jogadores,
      rodadas: arr(v.rodadas).map(rod),
      rodadasArquivadas: arr(v.rodadasArquivadas).map(rod),
      mensalistasPorMes: v.mensalistasPorMes || {},
      configuracoes: v.configuracoes || {},
      campeoes: arr(v.campeoes),
    };
  }

  // Nomes combinam se iguais ou um é prefixo (por palavra) do outro — ex.: "Henrique" ~ "Henrique Muller".
  function nomesCombinam(a, b) {
    a = (a || "").trim().toLowerCase(); b = (b || "").trim().toLowerCase();
    return !!a && !!b && (a === b || a.startsWith(b + " ") || b.startsWith(a + " "));
  }
  // Quantas vezes cada jogador foi campeão, casando por nome de forma tolerante (correspondência única).
  function campeoesPorId(e) {
    const porId = {};
    (e.campeoes || []).forEach((c) => {
      const nome = (c.jogadorNome || "").trim();
      if (!nome) return;
      const cand = e.jogadores.filter((j) => nomesCombinam(j.nome, nome));
      if (cand.length === 1) porId[cand[0].id] = (porId[cand[0].id] || 0) + 1;
    });
    return porId;
  }

  function confirmadosDoMes(e) {
    const m = e.mensalistasPorMes[e.mes] || {};
    return arr(m.confirmados).length ? arr(m.confirmados) : arr(m.selecionados);
  }

  function classificacao(e) {
    const st = {}; const gar = (id) => st[id] = st[id] || { pontos: 0, v: 0, em: 0, d: 0, j: 0 };
    confirmadosDoMes(e).forEach(gar);
    for (const r of e.rodadas) {
      if (r.resultado === "andamento") continue;
      [[r.timeVermelho, r.resultado === "vermelho"], [r.timeAzul, r.resultado === "azul"]].forEach(([t, w]) => {
        for (const id of t) { const s = gar(id); s.j++; if (r.resultado === "empate") { s.em++; s.pontos += 1; } else if (w) { s.v++; s.pontos += 3; } else s.d++; }
      });
    }
    return Object.entries(st).map(([id, s]) => ({ jogador: e.jogadores.find((j) => j.id === id), ...s }))
      .filter((x) => x.jogador).sort((a, b) => b.pontos - a.pontos || b.v - a.v || b.j - a.j || a.jogador.nome.localeCompare(b.jogador.nome));
  }

  function estatisticas(rodadas) {
    const t = {}; const g = (id) => t[id] = t[id] || { v: 0, d: 0, em: 0, gols: 0, j: 0, nota: NOTA_BASE };
    for (const r of rodadas) {
      if (r.resultado === "andamento") continue;
      [[r.timeVermelho, r.resultado === "vermelho"], [r.timeAzul, r.resultado === "azul"]].forEach(([tm, w]) => {
        for (const id of tm) { const x = g(id); x.j++; if (r.resultado === "empate") x.em++; else if (w) x.v++; else x.d++; x.gols += Number((r.gols || {})[id] || 0); }
      });
    }
    for (const id in t) t[id].nota = limitar(NOTA_BASE + t[id].v * PV - t[id].d * PD + t[id].gols * PG, NOTA_MIN, NOTA_MAX);
    return t;
  }
  // Estatísticas + bônus de campeão (+0,5 por título), recalculando a nota.
  function estatComCampeoes(e, rodadas) {
    const t = estatisticas(rodadas);
    const camp = campeoesPorId(e);
    Object.keys(camp).forEach((id) => { if (!t[id]) t[id] = { v: 0, d: 0, em: 0, gols: 0, j: 0, nota: NOTA_BASE }; });
    for (const id in t) t[id].nota = limitar(NOTA_BASE + t[id].v * PV - t[id].d * PD + t[id].gols * PG + (camp[id] || 0) * PCAMP, NOTA_MIN, NOTA_MAX);
    return t;
  }
  const statPad = (st, id) => st[id] || { v: 0, d: 0, em: 0, gols: 0, j: 0, nota: NOTA_BASE };
  // Todos os jogadores cadastrados entram no ranking (quem não jogou fica com a nota base).
  const ordenar = (e, st) => e.jogadores.slice().sort((a, b) => { const A = statPad(st, a.id), B = statPad(st, b.id); return B.nota - A.nota || B.gols - A.gols || B.v - A.v || a.nome.localeCompare(b.nome); });

  function ranking(e) {
    const todas = e.rodadas.concat(e.rodadasArquivadas);
    const stA = estatComCampeoes(e, todas); const ordem = ordenar(e, stA);
    const ant = todas.slice().sort((a, b) => (a.data || "").localeCompare(b.data || "")); ant.pop();
    const pAnt = {}; ordenar(e, estatComCampeoes(e, ant)).forEach((j, i) => pAnt[j.id] = i);
    return ordem.map((j, i) => ({ jogador: j, stats: statPad(stA, j.id), pos: i + 1, mov: pAnt[j.id] === undefined ? 0 : pAnt[j.id] - i }));
  }

  // ── Header (escudo central + menu simétrico + próxima rodada) ──
  function iconInsta() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>';
  }

  const NAV_ESQ = [["inicio", "Início", "inicio.html"], ["classificacao", "Classificação", "publico.html#classificacao"], ["ranking", "Ranking", "publico.html#ranking"]];
  const NAV_DIR = [["rodadas", "Rodadas", "publico.html#rodadas"], ["loja", "Loja", "loja.html"]];

  function chaveAtiva() {
    const page = document.body.dataset.page;
    if (page === "loja") return "loja";
    if (page === "publico") { const h = (location.hash || "#classificacao").slice(1); return ["classificacao", "ranking", "rodadas"].includes(h) ? h : "classificacao"; }
    return "inicio";
  }

  function linkHTML(item, ativa) {
    return '<a class="link' + (item[0] === ativa ? " ativo" : "") + '" href="' + item[2] + '">' + item[1] + "</a>";
  }

  function renderHeader(estado) {
    const el = document.querySelector("[data-gibs-masthead]");
    if (!el) return;
    // A home é limpa: sem barra e sem menu (o hero e os cards já dão a navegação).
    if (document.body.dataset.page === "inicio") {
      el.innerHTML = "";
      return;
    }
    const insta = (estado.configuracoes.instagram || "").replace(/^@/, "");
    const ativa = chaveAtiva();
    const socialInsta = insta ? '<a href="https://instagram.com/' + esc(insta) + '" target="_blank" rel="noopener">' + iconInsta() + "@" + esc(insta) + "</a>" : "";
    const todos = NAV_ESQ.concat(NAV_DIR);
    const topbar = '<div class="topbar"><div class="wrap"><span class="marca">Gibs FC</span><div class="socials">' + socialInsta + '<a href="/painel">Área do time</a></div></div></div>';
    el.innerHTML =
      topbar +
      '<div class="masthead"><div class="glow"></div><div class="wrap"><nav class="nav">' +
      '<div class="side esq">' + NAV_ESQ.map((i) => linkHTML(i, ativa)).join("") + "</div>" +
      '<a href="inicio.html"><img class="crest" src="/gibs-logo.avif" alt="Gibs FC" /></a>' +
      '<div class="side dir">' + NAV_DIR.map((i) => linkHTML(i, ativa)).join("") + "</div>" +
      '<div class="menu-mobile">' + todos.map((i) => linkHTML(i, ativa)).join("") + "</div>" +
      "</nav></div></div>" +
      renderProxbar(estado);
    ligarReveal();
  }

  function renderProxbar(e) {
    // A próxima rodada é a rodada mais recente que ainda está "em andamento" (sorteada, sem resultado).
    const emAndamento = e.rodadas.filter((r) => r.resultado === "andamento").sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const p = emAndamento[0];
    if (!p || (!p.timeVermelho.length && !p.timeAzul.length)) return "";
    const cfg = e.configuracoes || {};
    const nome = (id) => { const j = e.jogadores.find((x) => x.id === id); return j ? j.nome : "—"; };
    const posTag = (id) => { const j = e.jogadores.find((x) => x.id === id); return j && POS[j.posicao] ? '<span class="tag">' + POS[j.posicao].abrev + "</span>" : ""; };
    const lista = (ids) => ids.map((id) => "<li>" + posTag(id) + "<span>" + esc(nome(id)) + "</span></li>").join("");
    const quando = (p.data ? "<b>" + esc(dataBR(p.data)) + "</b>" : "") + (cfg.horarioPadrao ? " às <b>" + esc(cfg.horarioPadrao) + "</b>" : "") + (cfg.localPadrao ? " · " + esc(cfg.localPadrao) : "");
    return '<div class="proxbar"><div class="wrap">' +
      '<span class="rot">Próxima rodada</span>' +
      '<div class="vs"><span class="team"><span class="dot v"></span>Vermelho</span><span style="color:var(--muted-2)">×</span><span class="team">Azul<span class="dot a"></span></span></div>' +
      '<span class="quando">' + quando + "</span>" +
      '<button class="btn ghost btn-times" data-reveal>Ver times ▾</button>' +
      '</div><div class="wrap"><div class="times-reveal" data-reveal-panel><div class="times-grid">' +
      '<div class="time-col v"><h4 style="color:var(--red-l)">🔴 Time Vermelho</h4><ul>' + lista(p.timeVermelho) + "</ul></div>" +
      '<div class="time-col a"><h4 style="color:var(--blue-l)">🔵 Time Azul</h4><ul>' + lista(p.timeAzul) + "</ul></div>" +
      "</div></div></div></div>";
  }

  // Glow que segue o mouse na borda dos cards (delegação — pega até cards criados depois).
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".acesso, .produto, .rodada");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });

  function ligarReveal() {
    const btn = document.querySelector("[data-reveal]");
    const panel = document.querySelector("[data-reveal-panel]");
    if (!btn || !panel) return;
    btn.addEventListener("click", () => {
      const aberto = panel.classList.toggle("aberto");
      btn.textContent = aberto ? "Ocultar times ▴" : "Ver times ▾";
    });
  }

  // ── API pública ──
  window.GIBS = {
    DB_URL, LOJA_URL, esc, nomeMes, dataBR, dataExt, dinheiro, POS,
    classificacao, ranking,
    carregar() {
      return fetch(DB_URL).then((r) => r.json()).then((d) => {
        const estado = normalizar(d);
        renderHeader(estado);
        return estado;
      });
    },
    carregarLoja() {
      return fetch(LOJA_URL).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : d && typeof d === "object" ? Object.values(d) : []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    },
  };
})();
