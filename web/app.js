/* NEXORA Intelligence — front-end sem etapa de build.
   Fontes de dados, em ordem: Supabase (se configurado) → data/oportunidades.json → data/demo.json */
(function () {
  "use strict";

  const CFG = window.NEXORA_CONFIG || {};
  const TEM_SUPABASE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  // Os ids precisam ser os mesmos de collector/categorias.py (há um teste que confere).
  const CATEGORIAS = {
    escritorio_papelaria: "Escritório e papelaria",
    mobiliario: "Mobiliário",
    informatica_impressao: "Informática e impressão",
    tecnologia_software: "Software e serviços de TI",
    limpeza_higiene: "Limpeza e higiene",
    alimentos_bebidas: "Alimentos e bebidas",
    saude_medicamentos: "Saúde e medicamentos",
    construcao_obras: "Construção e obras",
    veiculos_combustiveis: "Veículos e combustíveis",
    uniformes_vestuario: "Uniformes e EPI",
    educacao_esporte: "Educação e esporte",
    eletrico_telecom: "Elétrica e telecomunicações",
    ferramentas_agro: "Ferramentas, máquinas e agro",
    casa_utensilios: "Casa, copa e eletrodomésticos",
    servicos_gerais: "Serviços gerais e terceirizados",
    outros: "Outros",
  };
  const TIPOS = { produtos: "Compra de produtos", servicos: "Serviços", obras: "Obras" };
  // Atalhos do perfil: o tipo de empresa marca as categorias que normalmente interessam a ela.
  const TIPOS_EMPRESA = {
    "Papelaria e material de escritório": ["escritorio_papelaria"],
    "Móveis e decoração": ["mobiliario", "casa_utensilios"],
    "Informática e tecnologia": ["informatica_impressao", "tecnologia_software", "eletrico_telecom"],
    "Limpeza e higiene": ["limpeza_higiene"],
    "Alimentos e bebidas": ["alimentos_bebidas"],
    "Saúde (farmácia, hospitalar, odontologia)": ["saude_medicamentos"],
    "Construção e engenharia": ["construcao_obras", "ferramentas_agro"],
    "Veículos, combustíveis e peças": ["veiculos_combustiveis"],
    "Uniformes e EPI": ["uniformes_vestuario"],
    "Educação e esporte": ["educacao_esporte"],
    "Elétrica e telecomunicações": ["eletrico_telecom"],
    "Serviços (vigilância, limpeza, eventos)": ["servicos_gerais"],
  };
  const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
  const SUGESTOES = ["cadeira", "papel A4", "medicamento", "uniforme", "combustível", "merenda", "software", "ar condicionado", "material de limpeza", "obra"];
  const PAGINA = 40;

  const S = {
    dados: [], demo: false, geradoEm: null, coleta: null, fonte: "",
    filtros: { q: "", uf: "", cat: "", tipo: "", vmin: "", vmax: "", prazo: "", novas: "", ordem: "prazo" },
    mostrar: PAGINA,
    perfil: lerLocal("nexora_perfil", { tipo: "visitante", razao: "", cnpj: "", ufs: [], cats: [], palavras: "", vmin: "", vmax: "" }),
    sessao: lerLocal("nexora_sessao", null),
    busca: "",
    buscaCat: "",
    ajudaQ: "",
    acompFiltro: "",
    salvos: lerLocal("nexora_salvos", {}), // { id: { status, nota, salvoEm, o: oportunidade } } — só neste navegador
  };
  const CONTEUDO = window.NEXORA_CONTEUDO || { faq: [], planos: { gratis: [], pago: [] } };
  const STATUS = {
    interesse: "Tenho interesse",
    preparando: "Preparando proposta",
    enviada: "Proposta enviada",
    ganhei: "Ganhei",
    perdi: "Não ganhei ou desisti",
  };
  const STATUS_ATIVOS = ["interesse", "preparando", "enviada"];
  const emailContato = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(CFG.CONTATO_EMAIL || "") ? CFG.CONTATO_EMAIL : "";

  /* ------------------------------------------------ utilidades */
  function lerLocal(k, padrao) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* navegador bloqueou */ } }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const brl = (n) => n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const brlCurto = (n) => { n = Number(n) || 0; return n >= 1e9 ? "R$ " + (n / 1e9).toFixed(1).replace(".", ",") + " bi" : n >= 1e6 ? "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi" : n >= 1e3 ? "R$ " + Math.round(n / 1e3) + " mil" : brl(n); };
  const dataBR = (iso) => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString("pt-BR"); };
  // Dias de CALENDÁRIO até o fim da proposta: 0 = hoje, 1 = amanhã, -1 = já encerrou (inclusive hoje, se a hora passou).
  // O PNCP informa horário de Brasília sem fuso; o navegador lê como horário local (certo para quem está no Brasil).
  const diasAte = (iso) => {
    if (!iso) return null;
    const d = new Date(iso); if (isNaN(d)) return null;
    if (d < new Date()) return -1;
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const a = new Date(d); a.setHours(0, 0, 0, 0);
    return Math.round((a - h) / 864e5);
  };
  const dataHoraBR = (iso) => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
  // "Nova" = apareceu na base nas últimas 24 horas (campo primeiro_visto, marcado pelo coletor)
  const nova = (o) => { if (!o.primeiro_visto) return false; const t = Date.parse(o.primeiro_visto); return !isNaN(t) && Date.now() - t < 864e5; };
  const horaBR = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
  const linkSeguro = (u) => (typeof u === "string" && /^https?:\/\//i.test(u)) ? u : null; // só http(s): bloqueia "javascript:"
  const soma = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
  const mediana = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const $ = (sel, el) => (el || document).querySelector(sel);

  /* ------------------------------------------------ oportunidades salvas (acompanhamento) */
  function gravarSalvos() { gravarLocal("nexora_salvos", S.salvos); }
  function estaSalvo(id) { return !!S.salvos[id]; }
  function alternarSalvo(id) {
    if (S.salvos[id]) { delete S.salvos[id]; gravarSalvos(); return; }
    const o = S.dados.find((x) => x.numero_controle_pncp === id);
    if (!o) return;
    S.salvos[id] = { status: "interesse", nota: "", salvoEm: new Date().toISOString(), o: { ...o } };
    gravarSalvos();
  }
  // dado mais novo se a oportunidade ainda está na base; senão, a cópia guardada ao salvar
  function atual(reg, id) { return S.dados.find((x) => x.numero_controle_pncp === id) || reg.o; }

  function abertas() { return S.dados.filter((o) => { const d = diasAte(o.data_encerramento_proposta); return d === null || d >= 0; }); }

  function contar(lista, chave) {
    const m = new Map();
    lista.forEach((o) => { const k = o[chave]; if (k) { const e = m.get(k) || { n: 0, v: 0 }; e.n++; e.v += Number(o.valor_estimado) || 0; m.set(k, e); } });
    return [...m.entries()].map(([k, e]) => ({ k, ...e })).sort((a, b) => b.n - a.n);
  }

  function barras(itens, rotulo) {
    if (!itens.length) return '<p class="empty">Sem dados para mostrar.</p>';
    const max = Math.max(...itens.map((i) => i.n));
    return '<div class="bars">' + itens.map((i) =>
      `<div class="bar"><span>${esc(rotulo(i.k))}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(3, Math.round(i.n / max * 100))}%"></span></span><span class="n">${i.n}</span></div>`).join("") + "</div>";
  }

  /* compatibilidade 0–100 com o perfil da empresa */
  function compat(o) {
    const p = S.perfil; if (p.tipo !== "empresa") return null;
    let pts = 0, max = 0;
    if (p.cats.length) { max += 40; if (p.cats.includes(o.categoria)) pts += 40; }
    if (p.ufs.length) { max += 25; if (p.ufs.includes(o.uf)) pts += 25; }
    const pal = norm(p.palavras).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    if (pal.length) { max += 25; const t = norm(o.objeto); if (pal.some((w) => t.includes(w))) pts += 25; }
    if (p.vmin !== "" || p.vmax !== "") {
      max += 10; const v = Number(o.valor_estimado) || 0;
      if ((p.vmin === "" || v >= Number(p.vmin)) && (p.vmax === "" || v <= Number(p.vmax))) pts += 10;
    }
    return max ? Math.round(pts / max * 100) : null;
  }

  /* ------------------------------------------------ dados */
  async function jget(url, opts) { const r = await fetch(url, opts); if (!r.ok) throw new Error(r.status); return r.json(); }

  async function carregar() {
    if (TEM_SUPABASE) {
      try {
        const q = `${CFG.SUPABASE_URL}/rest/v1/oportunidades?select=*&order=data_encerramento_proposta.asc&limit=2000`;
        S.dados = await jget(q, { headers: cabSupa() });
        S.fonte = "PNCP (via NEXORA)"; S.geradoEm = null; S.demo = false;
        return;
      } catch (e) { /* cai para arquivos */ }
    }
    for (const arq of ["data/oportunidades.json", "data/demo.json"]) {
      try {
        const j = await jget(arq);
        if (j.oportunidades && j.oportunidades.length) {
          S.dados = j.oportunidades; S.demo = !!j.demo; S.geradoEm = j.gerado_em; S.coleta = j.coleta || null; S.fonte = j.fonte || "";
          return;
        }
      } catch (e) { /* tenta o próximo */ }
    }
    S.dados = [];
  }

  /* ------------------------------------------------ Supabase (login e perfil) */
  function cabSupa() {
    const h = { apikey: CFG.SUPABASE_ANON_KEY, "Content-Type": "application/json" };
    h.Authorization = "Bearer " + (S.sessao ? S.sessao.access_token : CFG.SUPABASE_ANON_KEY);
    return h;
  }
  async function authSupa(modo, email, senha) {
    const url = modo === "criar" ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const r = await fetch(CFG.SUPABASE_URL + url, { method: "POST", headers: { apikey: CFG.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: senha }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.msg || j.error_description || j.message || "Não foi possível entrar.");
    if (!j.access_token) throw new Error("Conta criada. Confirme o e-mail que enviamos e entre em seguida.");
    S.sessao = { access_token: j.access_token, user: { id: j.user.id, email: j.user.email } };
    gravarLocal("nexora_sessao", S.sessao);
  }
  async function salvarPerfilRemoto() {
    if (!TEM_SUPABASE || !S.sessao) return;
    const p = S.perfil;
    await fetch(CFG.SUPABASE_URL + "/rest/v1/perfis?on_conflict=id", {
      method: "POST", headers: { ...cabSupa(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: S.sessao.user.id, tipo: p.tipo, razao_social: p.razao || null, cnpj: p.cnpj || null, ufs_interesse: p.ufs, categorias_interesse: p.cats, palavras_chave: norm(p.palavras).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean), valor_min: p.vmin === "" ? null : Number(p.vmin), valor_max: p.vmax === "" ? null : Number(p.vmax) }),
    });
  }
  function sair() { S.sessao = null; gravarLocal("nexora_sessao", null); render(); }

  /* ------------------------------------------------ filtros */
  function filtrar(lista, f) {
    const q = norm(f.q);
    return lista.filter((o) => {
      if (f.uf && o.uf !== f.uf) return false;
      if (f.cat && o.categoria !== f.cat) return false;
      if (f.tipo && o.tipo !== f.tipo) return false;
      if (f.novas && !nova(o)) return false;
      const v = Number(o.valor_estimado) || 0;
      if (f.vmin !== "" && v < Number(f.vmin)) return false;
      if (f.vmax !== "" && v > Number(f.vmax)) return false;
      if (f.prazo) { const d = diasAte(o.data_encerramento_proposta); if (d === null || d < 0 || d > Number(f.prazo)) return false; }
      if (q && !(norm(o.objeto).includes(q) || norm(o.orgao_nome).includes(q) || norm(o.municipio).includes(q))) return false;
      return true;
    });
  }
  function ordenar(lista, ordem) {
    const a = [...lista];
    if (ordem === "valor") a.sort((x, y) => (Number(y.valor_estimado) || 0) - (Number(x.valor_estimado) || 0));
    else if (ordem === "compat") a.sort((x, y) => (compat(y) ?? -1) - (compat(x) ?? -1));
    else if (ordem === "recentes") a.sort((x, y) => String(y.data_publicacao).localeCompare(String(x.data_publicacao)));
    else a.sort((x, y) => String(x.data_encerramento_proposta || "9").localeCompare(String(y.data_encerramento_proposta || "9")));
    return a;
  }

  /* ------------------------------------------------ componentes de tela */
  function selo(o) {
    return (nova(o) ? '<span class="tag ok">Nova</span> ' : "") + seloPrazo(o);
  }
  function seloPrazo(o) {
    const d = diasAte(o.data_encerramento_proposta);
    if (d === null) return '<span class="tag off">Prazo não informado</span>';
    if (d < 0) return '<span class="tag off">Encerrada</span>';
    if (d === 0) return `<span class="tag warn">Encerra hoje${horaBR(o.data_encerramento_proposta) ? " às " + horaBR(o.data_encerramento_proposta) : ""}</span>`;
    if (d === 1) return '<span class="tag warn">Encerra amanhã</span>';
    if (d <= 3) return `<span class="tag warn">Encerra em ${d} dias</span>`;
    return `<span class="tag">Encerra em ${d} dias</span>`;
  }

  // Guia genérico de participação. Não substitui o edital: cada órgão pode pedir mais ou menos.
  function guia(o) {
    const docs = [
      "CNPJ ativo, com atividade (CNAE) compatível com o que está sendo comprado",
      "Certidões de regularidade: federal (Receita e PGFN), FGTS e trabalhista (CNDT), além da estadual e da municipal quando o edital pedir",
      "Cadastro na plataforma onde a disputa acontece (o botão “Enviar proposta” leva até ela)",
      "Proposta com preço, marca e especificação dos itens, como pede o termo de referência",
    ];
    if (o.tipo === "obras") docs.push("Registro da empresa e do responsável técnico no CREA ou CAU, e atestados de obras parecidas já executadas");
    if (o.tipo === "servicos") docs.push("Atestados de capacidade técnica de serviços parecidos (muitos editais pedem)");
    const mod = String(o.modalidade_nome || "");
    let nota = "";
    if (/dispensa/i.test(mod)) nota = "Dispensa costuma ter prazo curto, às vezes de poucos dias: confira a data e o horário limite.";
    else if (/preg/i.test(mod)) nota = "No pregão, em regra vence o menor preço depois da fase de lances.";
    else if (/concorr/i.test(mod)) nota = "Concorrência costuma pedir mais documentos de qualificação que o pregão.";
    else if (/credenc/i.test(mod)) nota = "No credenciamento, a empresa se cadastra para ser chamada quando houver demanda. As regras estão no edital.";
    return `<details class="guia"><summary>O que você precisa para participar</summary>
      <div class="guia-corpo">
        ${o.tipo === "obras" ? '<p class="aviso-obra"><b>Obra de engenharia.</b> Em geral só participa quem tem registro técnico (CREA ou CAU) e histórico de obras. Quem vende produtos costuma procurar compras de produtos.</p>' : ""}
        <h4>Documentos mais comuns</h4>
        <ul>${docs.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
        <p class="small">MEI, ME e EPP costumam ter vantagens em licitações (como preferência no desempate). Confira no edital.</p>
        <h4>Passo a passo</h4>
        <ol>
          <li>Leia o edital e o termo de referência (botão “Ver edital”).</li>
          <li>Se tiver dúvida, peça esclarecimento por escrito no canal indicado no edital. A resposta fica pública para todos os concorrentes.</li>
          <li>Envie a proposta no sistema até o prazo.</li>
          <li>Se vencer, o órgão confere os documentos e depois assina o contrato ou emite a nota de empenho.</li>
        </ol>
        ${nota ? `<p class="small"><b>Esta modalidade:</b> ${esc(nota)}</p>` : ""}
        <p class="small muted">Lista geral. Não substitui o edital nem orientação jurídica: cada órgão define as próprias exigências.</p>
      </div></details>`;
  }

  function itemOpp(o) { return cartao(o, ""); } // não usar direto em .map(): ele passaria o índice como 2º argumento

  function cartao(o, extra) {
    const link = linkSeguro(o.link_pncp);
    const proposta = linkSeguro(o.link_origem);
    const c = compat(o);
    const id = o.numero_controle_pncp;
    const salvo = estaSalvo(id);
    return `<article class="opp">
      <div>
        <h3>${esc(o.objeto)}</h3>
        <div class="meta">
          <span>${esc(o.orgao_nome || "Órgão não informado")}</span>
          <span>${esc(o.municipio || "")}${o.uf ? " / " + esc(o.uf) : ""}</span>
          <span>${esc(o.modalidade_nome || "")}</span>
          ${o.tipo ? `<span><b>${esc(TIPOS[o.tipo] || o.tipo)}</b></span>` : ""}
          <span>${esc(CATEGORIAS[o.categoria] || "")}</span>
          <span>Proposta até ${dataBR(o.data_encerramento_proposta)}</span>
        </div>
      </div>
      <div class="side-r">
        <span class="val">${Number(o.valor_estimado) > 0 ? brl(o.valor_estimado) : '<span class="small muted" title="Valor não informado ou sigiloso no edital">Valor não informado</span>'}</span>
        ${selo(o)}
        ${c !== null ? `<span class="score">${c}% de compatibilidade</span>` : ""}
        <div class="acoes">
          ${link ? `<a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Ver edital</a>` : '<span class="small muted">Sem link (demonstração)</span>'}
          ${proposta ? `<a class="btn sm primary" href="${esc(proposta)}" target="_blank" rel="noopener noreferrer">Enviar proposta</a>` : ""}
          ${id ? `<button class="btn sm${salvo ? " ligado" : ""}" data-acao="salvar" data-id="${esc(id)}" aria-pressed="${salvo}">${salvo ? "Acompanhando ✓" : "Acompanhar"}</button>` : ""}
        </div>
      </div>
      ${extra}
      ${guia(o)}
    </article>`;
  }

  function cabecalho(titulo, sub, extra, semAviso) {
    return `<div class="topline"><div><h1>${esc(titulo)}</h1><p>${esc(sub)}</p></div><div class="no-print">${extra || ""}</div></div>
      ${S.coleta && S.coleta.parcial && !S.demo && !semAviso ? '<div class="banner"><b>Atualização incompleta.</b> Na última coleta algumas consultas ao PNCP falharam (' + esc(S.coleta.n_erros || "") + '). Parte das oportunidades pode estar faltando ou desatualizada; a próxima coleta tenta de novo.</div>' : ""}
      ${S.demo && !semAviso ? '<div class="banner"><b>Dados de demonstração.</b> As oportunidades abaixo são fictícias, só para você testar o sistema. Rode o coletor para trazer compras reais do PNCP.</div>' : ""}`;
  }

  /* ------------------------------------------------ telas */
  function vPainel() {
    const ab = abertas();
    const urgentes = ordenar(ab.filter((o) => { const d = diasAte(o.data_encerramento_proposta); return d !== null && d <= 7; }), "prazo").slice(0, 5);
    const recentes = ordenar(ab, "recentes").slice(0, 5);
    const meu = S.perfil.tipo === "empresa" ? ordenar(ab, "compat").filter((o) => (compat(o) || 0) >= 60).slice(0, 5) : [];
    const prazosSalvos = ordenar(Object.entries(S.salvos).filter(([, r]) => STATUS_ATIVOS.includes(r.status)).map(([id, r]) => atual(r, id))
      .filter((o) => { const d = diasAte(o.data_encerramento_proposta); return d !== null && d >= 0; }), "prazo").slice(0, 5);
    return cabecalho("Painel", "Visão geral das compras públicas monitoradas.", '<a class="btn primary" href="#radar">Abrir radar</a>') + `
    <section class="grid kpis" aria-label="Indicadores">
      <div class="card kpi"><div class="l">Oportunidades abertas</div><div class="v">${ab.length}</div></div>
      <div class="card kpi"><div class="l">Valor estimado total</div><div class="v">${brlCurto(soma(ab, (o) => o.valor_estimado))}</div></div>
      <div class="card kpi"><div class="l">Estados monitorados</div><div class="v">${new Set(S.dados.map((o) => o.uf).filter(Boolean)).size}</div></div>
      <div class="card kpi"><div class="l">Municípios monitorados</div><div class="v">${new Set(S.dados.map((o) => o.codigo_ibge).filter(Boolean)).size}</div></div>
    </section>
    <section class="grid two" style="margin-top:16px">
      <div class="card"><h2>Por categoria</h2>${barras(contar(ab, "categoria"), (k) => CATEGORIAS[k] || k)}</div>
      <div class="card"><h2>Estados com mais oportunidades</h2>${barras(contar(ab, "uf").slice(0, 8), (k) => k)}</div>
    </section>
    ${prazosSalvos.length ? `<section class="card" style="margin-top:16px"><h2>Seus próximos prazos</h2>${prazosSalvos.map(itemOpp).join("")}<p style="margin:12px 0 0"><a href="#acompanhar">Ver todas as oportunidades que você acompanha</a></p></section>` : ""}
    ${meu.length ? `<section class="card" style="margin-top:16px"><h2>Combinam com o perfil da sua empresa</h2>${meu.map(itemOpp).join("")}</section>` : ""}
    <section class="grid two" style="margin-top:16px">
      <div class="card"><h2>Encerram nos próximos 7 dias</h2>${urgentes.length ? urgentes.map(itemOpp).join("") : '<p class="empty">Nada encerrando nesta semana.</p>'}</div>
      <div class="card"><h2>Publicadas recentemente</h2>${recentes.length ? recentes.map(itemOpp).join("") : '<p class="empty">Sem publicações recentes.</p>'}</div>
    </section>`;
  }

  function vRadar() {
    const f = S.filtros;
    const lista = ordenar(filtrar(abertas(), f), f.ordem);
    const opt = (v, t, sel) => `<option value="${esc(v)}"${sel === v ? " selected" : ""}>${esc(t)}</option>`;
    return cabecalho("Radar de oportunidades", "Compras públicas com proposta em aberto, em um só lugar.",
      `<button class="btn" data-acao="csv" data-fonte="radar">Baixar CSV</button>`) + `
    <form class="card filters" id="filtros" aria-label="Filtros">
      <div class="field"><label for="f-q">Buscar</label><input id="f-q" name="q" value="${esc(f.q)}" placeholder="produto, órgão ou cidade"></div>
      <div class="field"><label for="f-uf">Estado</label><select id="f-uf" name="uf">${opt("", "Todos", f.uf)}${UFS.map((u) => opt(u, u, f.uf)).join("")}</select></div>
      <div class="field"><label for="f-cat">Categoria</label><select id="f-cat" name="cat">${opt("", "Todas", f.cat)}${Object.entries(CATEGORIAS).map(([k, v]) => opt(k, v, f.cat)).join("")}</select></div>
      <div class="field"><label for="f-tipo">O que o órgão quer</label><select id="f-tipo" name="tipo">${opt("", "Tudo", f.tipo)}${Object.entries(TIPOS).map(([k, v]) => opt(k, v, f.tipo)).join("")}</select></div>
      <div class="field"><label for="f-vmin">Valor mínimo (R$)</label><input id="f-vmin" name="vmin" type="number" min="0" step="1000" value="${esc(f.vmin)}"></div>
      <div class="field"><label for="f-vmax">Valor máximo (R$)</label><input id="f-vmax" name="vmax" type="number" min="0" step="1000" value="${esc(f.vmax)}"></div>
      <div class="field"><label for="f-prazo">Prazo</label><select id="f-prazo" name="prazo">${opt("", "Qualquer", f.prazo)}${opt("3", "Até 3 dias", f.prazo)}${opt("7", "Até 7 dias", f.prazo)}${opt("15", "Até 15 dias", f.prazo)}${opt("30", "Até 30 dias", f.prazo)}</select></div>
      <div class="field"><label for="f-novas">Novidades</label><select id="f-novas" name="novas">${opt("", "Todas", f.novas)}${opt("1", "Só as novas (24 h)", f.novas)}</select></div>
      <div class="field"><label for="f-ordem">Ordenar por</label><select id="f-ordem" name="ordem">${opt("prazo", "Prazo mais próximo", f.ordem)}${opt("valor", "Maior valor", f.ordem)}${opt("recentes", "Mais recentes", f.ordem)}${S.perfil.tipo === "empresa" ? opt("compat", "Compatibilidade", f.ordem) : ""}</select></div>
      <div class="field"><button type="button" class="btn" data-acao="limpar">Limpar filtros</button></div>
    </form>
    <p class="muted small" style="margin:12px 2px" role="status">${lista.length} oportunidade${lista.length === 1 ? "" : "s"} encontrada${lista.length === 1 ? "" : "s"}</p>
    <section class="card">${lista.length ? lista.slice(0, S.mostrar).map(itemOpp).join("") : '<p class="empty">Nenhuma oportunidade com esses filtros. Tente ampliar o estado, o valor ou o prazo.</p>'}
      ${lista.length > S.mostrar ? `<div style="text-align:center;padding-top:12px"><button class="btn" data-acao="mais">Mostrar mais (${lista.length - S.mostrar} restantes)</button></div>` : ""}
    </section>`;
  }

  function vPesquisa() {
    const q = S.busca.trim();
    let res = "";
    if (q) {
      const lista = filtrar(S.dados, { q, uf: "", cat: S.buscaCat, vmin: "", vmax: "", prazo: "" });
      const valores = lista.map((o) => Number(o.valor_estimado)).filter((v) => v > 0);
      res = lista.length ? `
        <section class="grid kpis" style="margin-bottom:16px">
          <div class="card kpi"><div class="l">Compras encontradas</div><div class="v">${lista.length}</div></div>
          <div class="card kpi"><div class="l">Valor típico da compra</div><div class="v">${brlCurto(mediana(valores))}</div></div>
          <div class="card kpi"><div class="l">Menor e maior valor</div><div class="v" style="font-size:19px">${valores.length ? brlCurto(Math.min(...valores)) + " a " + brlCurto(Math.max(...valores)) : "—"}</div></div>
          <div class="card kpi"><div class="l">Órgãos diferentes</div><div class="v">${new Set(lista.map((o) => o.orgao_cnpj || o.orgao_nome)).size}</div></div>
        </section>
        <div class="note" style="margin-bottom:16px">Os valores são o <b>total estimado de cada compra</b> (vários itens juntos), não o preço de uma unidade. Use como referência do tamanho do mercado; o preço por item está no edital.</div>
        <section class="grid two" style="margin-bottom:16px">
          <div class="card"><h2>Onde mais se compra</h2>${barras(contar(lista, "uf").slice(0, 8), (k) => k)}</div>
          <div class="card"><h2>Quem compra</h2>${barras(contar(lista, "esfera"), (k) => ({ M: "Municipal", E: "Estadual", F: "Federal", D: "Distrital" }[k] || k))}</div>
        </section>
        <section class="card"><h2>Compras com “${esc(q)}”</h2>${ordenar(lista, "recentes").slice(0, 30).map(itemOpp).join("")}</section>`
        : `<div class="card"><h2>Nenhuma compra encontrada para “${esc(q)}”</h2>
            <p class="muted" style="margin:8px 0 0;max-width:70ch">Isso não quer dizer que ninguém compre isso. Quer dizer que o produto não está na base que a NEXORA carregou até agora${S.buscaCat ? " (ou não está na categoria escolhida)" : ""}. Você pode:</p>
            <ul class="muted" style="margin:8px 0 0;padding-left:20px">
              <li>tentar um termo mais simples, no singular ou sem acento (“cadeira”, “papel”, “medicamento”);</li>
              ${S.buscaCat ? '<li>escolher “Todas as categorias” no filtro acima;</li>' : ""}
              <li>conferir a cobertura abaixo e coletar mais estados.</li>
            </ul></div>`;
    }
    const ufsBase = [...new Set(S.dados.map((o) => o.uf).filter(Boolean))].sort();
    const cobertura = `<p class="muted small" style="margin:0 2px 16px">Base atual: <b>${S.dados.length}</b> compras${ufsBase.length ? " de " + ufsBase.length + " estado" + (ufsBase.length === 1 ? "" : "s") + " (" + esc(ufsBase.join(", ")) + ")" : ""}${S.geradoEm ? ", atualizada em " + esc(dataHoraBR(S.geradoEm)) : ""}. A busca procura no texto do objeto, no órgão e na cidade.</p>`;
    return `
    ${S.demo ? '<div class="banner"><b>Dados de demonstração.</b> Resultados fictícios para teste.</div>' : ""}
    <section class="hero">
      <h1>Descubra quanto o governo compra de qualquer produto</h1>
      <p>Pesquise cadeiras, papel, mesas, impressoras e mais. Veja quem compra, onde e por quanto, sem precisar ter empresa nem criar conta.</p>
      <form class="searchbox" id="form-busca" role="search">
        <input id="busca" type="search" value="${esc(S.busca)}" placeholder="O que você quer pesquisar?" aria-label="Produto a pesquisar" autocomplete="off">
        <select id="busca-cat" class="hero-select" aria-label="Categoria">
          <option value="">Todas as categorias</option>
          ${Object.entries(CATEGORIAS).filter(([k]) => k !== "outros").map(([k, v]) => `<option value="${k}"${S.buscaCat === k ? " selected" : ""}>${esc(v)}</option>`).join("")}
        </select>
        <button class="btn primary">Pesquisar</button>
      </form>
      <div class="chips" style="margin-top:14px">${SUGESTOES.map((s) => `<button class="chip" data-busca="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    </section>
    ${cobertura}
    ${res}
    <section class="card" style="margin-top:16px">
      <h2>Ainda não tem empresa?</h2>
      <p class="muted" style="margin:6px 0 0;max-width:70ch">Para fornecer ao governo é preciso ter CNPJ, e o MEI também pode participar de compras públicas. Use esta pesquisa para medir a demanda antes de abrir a empresa. As regras mudam de edital para edital, então confira sempre as exigências no documento original.</p>
    </section>`;
  }

  function vRelatorios() {
    const dias = Number(S.relDias || 30);
    const ab = abertas().filter((o) => { const d = diasAte(o.data_encerramento_proposta); return d !== null && d <= dias; });
    const topValor = ordenar(ab, "valor").slice(0, 8);
    const ehEmpresa = S.perfil.tipo === "empresa";
    return cabecalho("Relatórios", `Resumo das oportunidades que encerram nos próximos ${dias} dias.`,
      `<button class="btn" data-acao="csv" data-fonte="relatorio">Baixar CSV</button> <button class="btn primary" data-acao="imprimir">Imprimir ou salvar em PDF</button>`) + `
    <div class="card no-print" style="margin-bottom:16px;display:flex;gap:12px;align-items:end;flex-wrap:wrap">
      <div class="field"><label for="r-dias">Período</label><select id="r-dias">${[7, 15, 30, 60].map((d) => `<option value="${d}"${d === dias ? " selected" : ""}>Próximos ${d} dias</option>`).join("")}</select></div>
      ${ehEmpresa ? `<p class="muted small" style="margin:0">Relatório de <b>${esc(S.perfil.razao || "sua empresa")}</b></p>` : '<p class="muted small" style="margin:0">Dica: cadastre o perfil da sua empresa em Minha conta para destacar o que combina com você.</p>'}
    </div>
    <section class="grid kpis">
      <div class="card kpi"><div class="l">Oportunidades no período</div><div class="v">${ab.length}</div></div>
      <div class="card kpi"><div class="l">Valor estimado</div><div class="v">${brlCurto(soma(ab, (o) => o.valor_estimado))}</div></div>
      <div class="card kpi"><div class="l">Valor mediano</div><div class="v">${brlCurto(mediana(ab.map((o) => Number(o.valor_estimado)).filter((v) => v > 0)))}</div></div>
      <div class="card kpi"><div class="l">Pregões eletrônicos</div><div class="v">${ab.filter((o) => o.modalidade_id === 6).length}</div></div>
    </section>
    <section class="grid two" style="margin-top:16px">
      <div class="card"><h2>Por categoria</h2>${barras(contar(ab, "categoria"), (k) => CATEGORIAS[k] || k)}</div>
      <div class="card"><h2>Por estado</h2>${barras(contar(ab, "uf").slice(0, 8), (k) => k)}</div>
    </section>
    <section class="card" style="margin-top:16px"><h2>Maiores oportunidades do período</h2>${topValor.length ? topValor.map(itemOpp).join("") : '<p class="empty">Sem oportunidades neste período.</p>'}</section>
    <p class="muted small" style="margin-top:14px">Fonte: ${esc(S.fonte || "PNCP")}${S.geradoEm ? " · atualizado em " + esc(dataHoraBR(S.geradoEm)) : ""}. Confirme sempre as informações no edital original.</p>`;
  }

  function vConta() {
    const p = S.perfil;
    const logado = !!S.sessao;
    return cabecalho("Minha conta", "Perfil da empresa e preferências de monitoramento.", "") + `
    <section class="card" style="margin-bottom:16px">
      <h2>Acesso</h2>
      ${TEM_SUPABASE
        ? (logado ? `<p style="margin:8px 0">Conectado como <b>${esc(S.sessao.user.email)}</b>. <button class="btn sm" data-acao="sair">Sair</button></p>`
          : `<p class="muted" style="margin:8px 0">Entre para salvar o perfil na nuvem e usar em qualquer aparelho. <button class="btn primary sm" data-acao="login">Entrar ou criar conta</button></p>`)
        : '<p class="muted" style="margin:8px 0">O login será ativado quando o Supabase for configurado (veja o README). Por enquanto, o perfil fica salvo só neste navegador.</p>'}
    </section>
    <form class="card" id="form-perfil">
      <h2>Perfil</h2>
      <div class="chips" style="margin:12px 0" role="radiogroup" aria-label="Tipo de uso">
        <label class="chip"><input type="radio" name="tipo" value="empresa"${p.tipo === "empresa" ? " checked" : ""}>Tenho empresa</label>
        <label class="chip"><input type="radio" name="tipo" value="visitante"${p.tipo !== "empresa" ? " checked" : ""}>Só quero pesquisar produtos</label>
      </div>
      <div id="bloco-empresa" ${p.tipo === "empresa" ? "" : "hidden"}>
        <div class="grid two" style="margin-bottom:14px">
          <div class="field"><label for="p-razao">Razão social</label><input id="p-razao" name="razao" value="${esc(p.razao)}" autocomplete="organization"></div>
          <div class="field"><label for="p-cnpj">CNPJ</label><input id="p-cnpj" name="cnpj" value="${esc(p.cnpj)}" inputmode="numeric" placeholder="00.000.000/0000-00"></div>
        </div>
        <div class="lbl">Qual é o tipo da sua empresa? <span class="muted small">(marca as categorias abaixo para você)</span></div>
        <div class="chips" style="margin:6px 0 14px">${Object.keys(TIPOS_EMPRESA).map((t) => `<label class="chip"><input type="checkbox" data-tipo="${esc(t)}">${esc(t)}</label>`).join("")}</div>
        <div class="lbl">Categorias que a empresa vende</div>
        <div class="chips" style="margin:6px 0 14px">${Object.entries(CATEGORIAS).filter(([k]) => k !== "outros").map(([k, v]) => `<label class="chip"><input type="checkbox" name="cats" value="${k}"${p.cats.includes(k) ? " checked" : ""}>${esc(v)}</label>`).join("")}</div>
        <div class="lbl">Estados atendidos</div>
        <div class="chips" style="margin:6px 0 14px">${UFS.map((u) => `<label class="chip"><input type="checkbox" name="ufs" value="${u}"${p.ufs.includes(u) ? " checked" : ""}>${u}</label>`).join("")}</div>
        <div class="grid two">
          <div class="field"><label for="p-pal">Palavras-chave (separe por vírgula)</label><input id="p-pal" name="palavras" value="${esc(p.palavras)}" placeholder="cadeira giratória, toner, armário de aço"></div>
          <div class="grid two"><div class="field"><label for="p-vmin">Valor mínimo (R$)</label><input id="p-vmin" name="vmin" type="number" min="0" value="${esc(p.vmin)}"></div>
          <div class="field"><label for="p-vmax">Valor máximo (R$)</label><input id="p-vmax" name="vmax" type="number" min="0" value="${esc(p.vmax)}"></div></div>
        </div>
      </div>
      <p style="margin:18px 0 0"><button class="btn primary">Salvar perfil</button> <span id="p-ok" class="small muted" role="status"></span></p>
    </form>`;
  }

  /* ------------------------------------------------ CSV */
  function celula(v) {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita injeção de fórmula ao abrir no Excel
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function baixarCSV(lista, nome) {
    const cols = [["Objeto", "objeto"], ["Órgão", "orgao_nome"], ["Município", "municipio"], ["UF", "uf"], ["Modalidade", "modalidade_nome"], ["Tipo", "tipo"], ["Categoria", "categoria"], ["Valor estimado", "valor_estimado"], ["Proposta até", "data_encerramento_proposta"], ["Link do edital", "link_pncp"], ["Link para enviar proposta", "link_origem"]];
    const linhas = [cols.map((c) => celula(c[0])).join(";")].concat(lista.map((o) => cols.map((c) => celula(o[c[1]])).join(";")));
    const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ------------------------------------------------ roteamento e eventos */
  /* ------------------------------------------------ telas: acompanhar, ajuda, planos */
  function vAcompanhar() {
    const regs = Object.keys(S.salvos).map((id) => ({ id, reg: S.salvos[id], o: atual(S.salvos[id], id), naBase: S.dados.some((x) => x.numero_controle_pncp === id) }));
    const cont = {}; Object.keys(STATUS).forEach((k) => { cont[k] = regs.filter((r) => r.reg.status === k).length; });
    const f = S.acompFiltro;
    const prazo = (r) => String(r.o.data_encerramento_proposta || "9");
    const lista = regs.filter((r) => !f || r.reg.status === f).sort((a, b) => {
      const ka = STATUS_ATIVOS.includes(a.reg.status) ? 0 : 1, kb = STATUS_ATIVOS.includes(b.reg.status) ? 0 : 1;
      return ka !== kb ? ka - kb : prazo(a).localeCompare(prazo(b));
    });
    const chips = [["", "Todas", regs.length]].concat(Object.entries(STATUS).map(([k, v]) => [k, v, cont[k]]))
      .map(([k, v, n]) => `<button class="chip${f === k ? " ativo" : ""}" data-acao="acfiltro" data-v="${k}" aria-pressed="${f === k}">${esc(v)} (${n})</button>`).join("");
    const controles = (r) => `<div class="acomp">
      <div class="field"><label for="st-${esc(r.id)}">Situação</label>
        <select id="st-${esc(r.id)}" class="status-sel" data-id="${esc(r.id)}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${r.reg.status === k ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
      <div class="field" style="flex:1;min-width:220px"><label for="nt-${esc(r.id)}">Anotações</label>
        <textarea id="nt-${esc(r.id)}" class="nota" data-id="${esc(r.id)}" rows="2" maxlength="500" placeholder="Ex.: falta a certidão estadual; pedir preço ao fornecedor">${esc(r.reg.nota)}</textarea></div>
      <button class="btn sm" data-acao="remover" data-id="${esc(r.id)}">Remover da lista</button>
      ${r.naBase ? "" : '<p class="small muted" style="flex-basis:100%;margin:0">Esta oportunidade saiu da base atual. Mostrando os dados de quando você a salvou.</p>'}
    </div>`;
    return cabecalho("Minhas oportunidades", "Acompanhe cada licitação, do interesse até o resultado.", '<a class="btn primary" href="#radar">Encontrar oportunidades</a>') + `
      <p class="muted small" style="margin:0 2px 14px">Salvo neste navegador. Com o login (plano pago), o acompanhamento ficará guardado na nuvem e disponível em qualquer aparelho.</p>
      ${regs.length ? `<div class="chips no-print" style="margin-bottom:14px">${chips}</div>` : ""}
      <section class="card">${lista.length ? lista.map((r) => cartao(r.o, controles(r))).join("")
        : regs.length ? '<p class="empty">Nenhuma oportunidade nessa situação.</p>'
        : '<p class="empty">Você ainda não acompanha nenhuma oportunidade.<br>No <a href="#radar">Radar</a>, clique em “Acompanhar” nas que interessam. Elas aparecem aqui, com a situação e suas anotações.</p>'}</section>`;
  }

  function vAjuda() {
    if (!CONTEUDO.faq.length) {
      return cabecalho("Central de ajuda", "Respostas para as dúvidas mais comuns.", "", true) + `<div class="card"><h2>Não foi possível carregar as respostas</h2>
        <p class="muted" style="margin:8px 0 0;max-width:70ch">O arquivo <b>conteudo.js</b> não foi encontrado. Confira se ele está dentro da pasta <b>web</b>, ao lado do <b>app.js</b> e do <b>index.html</b>, e aperte Ctrl + F5.</p></div>`;
    }
    const q = norm(S.ajudaQ.trim());
    const grupos = CONTEUDO.faq.map((g) => ({ grupo: g.grupo, itens: g.itens.filter((i) => !q || norm(i.p + " " + i.r).includes(q)) })).filter((g) => g.itens.length);
    const total = grupos.reduce((n, g) => n + g.itens.length, 0);
    const paragrafos = (t) => String(t).split(/\n\n/).map((p) => `<p>${esc(p)}</p>`).join("");
    return cabecalho("Central de ajuda", "Respostas para as dúvidas mais comuns sobre a NEXORA e sobre compras públicas.", "", true) + `
      <div class="field" style="max-width:520px;margin-bottom:6px"><label for="ajuda-q">Buscar nas respostas</label>
        <input id="ajuda-q" type="search" value="${esc(S.ajudaQ)}" placeholder="Ex.: MEI, pregão, documentos" autocomplete="off"></div>
      <p class="muted small" style="margin:0 2px 14px" role="status">${q ? total + " resposta" + (total === 1 ? "" : "s") + " encontrada" + (total === 1 ? "" : "s") : "Escolha uma pergunta ou use a busca."}</p>
      ${grupos.length ? grupos.map((g) => `<section class="card faq" style="margin-bottom:16px"><h2>${esc(g.grupo)}</h2>
        ${g.itens.map((i) => `<details${q ? " open" : ""}><summary>${esc(i.p)}</summary><div class="faq-r">${paragrafos(i.r)}</div></details>`).join("")}</section>`).join("")
        : `<div class="card"><h2>Nenhuma resposta para “${esc(S.ajudaQ)}”</h2><p class="muted" style="margin:8px 0 0">Tente uma palavra mais simples (“documentos”, “MEI”, “prazo”) ou veja as perguntas por assunto, limpando a busca.</p></div>`}
      <section class="card"><h2>Não encontrou sua dúvida?</h2>
        ${emailContato
          ? `<p class="muted" style="margin:8px 0 12px">Escreva para a gente. Quando a pergunta for comum, ela entra aqui na Central de ajuda.</p><a class="btn primary" href="mailto:${esc(emailContato)}?subject=${encodeURIComponent("Dúvida sobre a NEXORA")}">Enviar uma dúvida</a>`
          : '<p class="muted" style="margin:8px 0 0">O canal para enviar dúvidas será ativado em breve.</p>'}
      </section>
      <p class="muted small" style="margin-top:14px">As respostas são orientações gerais e não substituem o edital nem aconselhamento jurídico ou contábil.</p>`;
  }

  function vPlanos() {
    if (!CONTEUDO.planos.pago.length && !CONTEUDO.planos.gratis.length) {
      return cabecalho("Planos", "O que já funciona hoje e o que está sendo construído.", "", true) + `<div class="card"><h2>Não foi possível carregar os planos</h2>
        <p class="muted" style="margin:8px 0 0;max-width:70ch">O arquivo <b>conteudo.js</b> não foi encontrado na pasta <b>web</b>. Coloque-o ao lado do <b>app.js</b> e aperte Ctrl + F5.</p></div>`;
    }
    const ROT = { agora: ["Disponível agora", "ok"], parcial: ["Parcial", "warn"], andamento: ["Em desenvolvimento", "warn"], planejado: ["Planejado", "off"] };
    const li = (i) => { const [txt, cls] = ROT[i.s] || ["", "off"]; return `<li><div><b>${esc(i.t)}</b> <span class="tag ${cls}">${esc(txt)}</span></div>${i.d ? `<p class="small muted" style="margin:2px 0 0">${esc(i.d)}</p>` : ""}</li>`; };
    const corpo = encodeURIComponent("Olá! Quero ser avisado quando os planos da NEXORA estiverem disponíveis.\n\nMinha empresa vende: ");
    return cabecalho("Planos", "O que já funciona hoje e o que está sendo construído para o plano pago.", "", true) + `
      <div class="note" style="margin-bottom:16px"><b>Nada é cobrado hoje.</b> Os planos e preços ainda estão sendo definidos e validados com empresas. Os itens abaixo mostram, com honestidade, o que já existe e o que ainda não.</div>
      <section class="grid two">
        <div class="card plano"><h2>Gratuito</h2><p class="muted small" style="margin:4px 0 8px">Para pesquisar e conhecer a plataforma.</p><ul>${CONTEUDO.planos.gratis.map(li).join("")}</ul></div>
        <div class="card plano destaque"><h2>Plano pago</h2><p class="muted small" style="margin:4px 0 8px">Para empresas que querem ganhar tempo e vender mais. Preço em definição.</p><ul>${CONTEUDO.planos.pago.map(li).join("")}</ul>
          ${emailContato ? `<p style="margin:14px 0 0"><a class="btn primary" href="mailto:${esc(emailContato)}?subject=${encodeURIComponent("Quero ser avisado sobre os planos")}&body=${corpo}">Quero ser avisado</a></p>` : ""}</div>
      </section>`;
  }

  const VIEWS = { painel: vPainel, radar: vRadar, pesquisa: vPesquisa, acompanhar: vAcompanhar, relatorios: vRelatorios, planos: vPlanos, ajuda: vAjuda, conta: vConta };
  function viewAtual() { const h = location.hash.replace("#", ""); return VIEWS[h] ? h : "pesquisa"; }

  function render(manterFoco) {
    const v = viewAtual();
    const el = $("#conteudo");
    const ativo = manterFoco && document.activeElement && document.activeElement.id;
    const pos = ativo && document.activeElement.selectionStart;
    el.innerHTML = VIEWS[v]();
    document.querySelectorAll("#nav a").forEach((a) => {
      if (a.dataset.v === v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $("#rodape").textContent = S.demo ? "Modo demonstração" : ("Fonte: " + (S.fonte || "PNCP"));
    if (ativo) { const n = document.getElementById(ativo); if (n) { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos); } catch (e) { /* tipo sem seleção */ } } }
  }

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.closest("#filtros")) { S.filtros[t.name] = t.value; S.mostrar = PAGINA; render(true); }
    if (t.id === "ajuda-q") { S.ajudaQ = t.value; render(true); }
    if (t.classList && t.classList.contains("nota") && S.salvos[t.dataset.id]) { S.salvos[t.dataset.id].nota = t.value; gravarSalvos(); } // sem redesenhar, para não perder o cursor
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "r-dias") { S.relDias = t.value; render(); }
    if (t.classList && t.classList.contains("status-sel") && S.salvos[t.dataset.id] && STATUS[t.value]) {
      S.salvos[t.dataset.id].status = t.value; gravarSalvos(); render();
    }
    if (t.id === "busca-cat") {
      // trocar a categoria vale para o que já está digitado no campo (e não apaga o texto)
      S.buscaCat = t.value; S.busca = $("#busca").value;
      if (S.busca.trim()) render(true);
    }
    if (t.dataset && t.dataset.tipo) {
      // marcar um tipo de empresa liga as categorias sugeridas (desmarcar não apaga as que você escolheu à mão)
      const cats = TIPOS_EMPRESA[t.dataset.tipo] || [];
      if (t.checked) cats.forEach((c) => { const box = document.querySelector(`input[name=cats][value="${c}"]`); if (box) box.checked = true; });
    }
    if (t.name === "tipo" && t.closest("#form-perfil")) { $("#bloco-empresa").hidden = t.value !== "empresa"; }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (f.id === "form-busca") { e.preventDefault(); S.busca = $("#busca").value; S.buscaCat = $("#busca-cat").value; render(); }
    if (f.id === "form-perfil") {
      e.preventDefault();
      const d = new FormData(f);
      S.perfil = { tipo: d.get("tipo") || "visitante", razao: d.get("razao") || "", cnpj: d.get("cnpj") || "", ufs: d.getAll("ufs"), cats: d.getAll("cats"), palavras: d.get("palavras") || "", vmin: d.get("vmin") || "", vmax: d.get("vmax") || "" };
      gravarLocal("nexora_perfil", S.perfil);
      $("#p-ok").textContent = "Salvando…";
      salvarPerfilRemoto().then(() => { $("#p-ok").textContent = "Perfil salvo."; }).catch(() => { $("#p-ok").textContent = "Salvo neste navegador. Não foi possível salvar na nuvem agora."; });
    }
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-acao],[data-busca]"); if (!b) return;
    if (b.dataset.busca) { S.busca = b.dataset.busca; render(); return; }
    const a = b.dataset.acao;
    if (a === "limpar") { S.filtros = { q: "", uf: "", cat: "", tipo: "", vmin: "", vmax: "", prazo: "", novas: "", ordem: "prazo" }; S.mostrar = PAGINA; render(); }
    if (a === "mais") { S.mostrar += PAGINA; render(); }
    if (a === "salvar") { alternarSalvo(b.dataset.id); render(); }
    if (a === "remover") { delete S.salvos[b.dataset.id]; gravarSalvos(); render(); }
    if (a === "acfiltro") { S.acompFiltro = b.dataset.v || ""; render(); }
    if (a === "imprimir") window.print();
    if (a === "csv") {
      const lista = b.dataset.fonte === "radar" ? ordenar(filtrar(abertas(), S.filtros), S.filtros.ordem)
        : abertas().filter((o) => { const d = diasAte(o.data_encerramento_proposta); return d !== null && d <= Number(S.relDias || 30); });
      baixarCSV(lista, "nexora-oportunidades.csv");
    }
    if (a === "login") { $("#lg-erro").textContent = ""; $("#dlg-login").showModal(); }
    if (a === "sair") sair();
  });

  async function enviarLogin(modo) {
    const email = $("#lg-email").value.trim(), senha = $("#lg-senha").value;
    $("#lg-erro").textContent = "";
    if (!email || senha.length < 8) { $("#lg-erro").textContent = "Informe o e-mail e uma senha com pelo menos 8 caracteres."; return; }
    try { await authSupa(modo, email, senha); $("#dlg-login").close(); render(); }
    catch (err) { $("#lg-erro").textContent = err.message; }
  }
  $("#form-login").addEventListener("submit", (e) => { e.preventDefault(); if (e.submitter && e.submitter.value === "cancel") { $("#dlg-login").close(); return; } enviarLogin("entrar"); });
  $("#lg-criar").addEventListener("click", () => enviarLogin("criar"));
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

  carregar().then(() => render());
})();
