/* Conta e sincronização.
 *
 * O aparelho continua sendo o lugar onde o app lê e escreve: nada aqui pode
 * fazer o balcão esperar rede. A nuvem é uma segunda cópia que se acerta
 * quando dá — e é ela que devolve tudo quando o Safari apaga, quando o celular
 * quebra ou quando o chip cai.
 *
 * Falamos com o Supabase por HTTP puro, sem biblioteca. São três endereços
 * (entrar, renovar, ler/gravar) e vale mais tê-los à vista do que carregar um
 * pacote inteiro num app que precisa abrir offline.
 *
 * A chave pública ("anon") pode ficar no código: ela sozinha não abre nada. É
 * a regra de linha do banco que garante que cada conta só enxerga o que é
 * dela. Quem não faz a regra é que se dá mal, não quem publica a chave.
 */

"use strict";

const NUVEM_CHAVE = "lembra.nuvem";

/* Preenchidos depois que a conta do Supabase existir. Enquanto estiverem
   vazios, o app pergunta em Ajustes e guarda no aparelho. */
const NUVEM_PADRAO = {
  url: "",
  publica: "",
};

let nuvem = carregarNuvem();

function carregarNuvem() {
  try {
    const lido = JSON.parse(localStorage.getItem(NUVEM_CHAVE) || "{}");
    return {
      url: lido.url || NUVEM_PADRAO.url,
      publica: lido.publica || NUVEM_PADRAO.publica,
      email: lido.email || null,
      token: lido.token || null,
      renovacao: lido.renovacao || null,
      expiraEm: lido.expiraEm || 0,
      usuario: lido.usuario || null,
      sincronizadoEm: lido.sincronizadoEm || null,
    };
  } catch (e) {
    return { ...NUVEM_PADRAO, email: null, token: null, renovacao: null,
      expiraEm: 0, usuario: null, sincronizadoEm: null };
  }
}

function guardarNuvem() {
  try {
    localStorage.setItem(NUVEM_CHAVE, JSON.stringify(nuvem));
  } catch (e) { /* sem espaço; o aviso já sai por outro caminho */ }
}

function nuvemConfigurada() {
  return !!(nuvem.url && nuvem.publica);
}

function nuvemConectada() {
  return nuvemConfigurada() && !!nuvem.token;
}

// ------------------------------------------------------------------ HTTP

async function chamar(caminho, opcoes = {}, comToken = false) {
  if (!nuvemConfigurada()) throw new Error("A conta ainda não foi configurada.");

  const cabecalho = {
    "apikey": nuvem.publica,
    "Content-Type": "application/json",
    ...(opcoes.headers || {}),
  };
  if (comToken) {
    await garantirToken();
    cabecalho.Authorization = "Bearer " + nuvem.token;
  }

  let resposta;
  try {
    resposta = await fetch(nuvem.url.replace(/\/+$/, "") + caminho,
      { ...opcoes, headers: cabecalho });
  } catch (e) {
    // sem internet não é erro de programa: é o estado normal de quem anda
    const falha = new Error("sem conexão");
    falha.semRede = true;
    throw falha;
  }

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;
  if (!resposta.ok) {
    throw new Error(traduzir(corpo, resposta.status));
  }
  return corpo;
}

/** As mensagens do Supabase vêm em inglês e assustam. */
function traduzir(corpo, status) {
  const cru = (corpo && (corpo.error_description || corpo.msg || corpo.message
    || corpo.error || corpo.hint)) || "";
  const m = String(cru).toLowerCase();

  if (m.includes("invalid login")) return "E-mail ou senha errados.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Já existe conta com esse e-mail. Use Entrar.";
  if (m.includes("password should be") || m.includes("at least 6"))
    return "A senha precisa de pelo menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Esse e-mail não parece válido.";
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail que a Supabase enviou e tente de novo.";
  if (status === 401 || status === 403) return "A conta perdeu o acesso. Entre de novo.";
  if (status === 404) return "O endereço do servidor está errado. Confira em Ajustes.";
  return cru || `Deu erro no servidor (${status}).`;
}

async function garantirToken() {
  if (!nuvem.token) throw new Error("Entre na sua conta primeiro.");
  // renova um minuto antes de vencer, para não estourar no meio de um envio
  if (Date.now() < nuvem.expiraEm - 60000) return;
  if (!nuvem.renovacao) return;

  const r = await chamar("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: nuvem.renovacao }),
  });
  aplicarSessao(r);
}

function aplicarSessao(r) {
  nuvem.token = r.access_token;
  nuvem.renovacao = r.refresh_token;
  nuvem.expiraEm = Date.now() + (Number(r.expires_in) || 3600) * 1000;
  nuvem.usuario = r.user ? r.user.id : nuvem.usuario;
  nuvem.email = r.user ? r.user.email : nuvem.email;
  guardarNuvem();
}

// ---------------------------------------------------------------- conta

async function criarConta(email, senha) {
  const r = await chamar("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({ email, password: senha }),
  });
  // Com confirmação de e-mail ligada, não vem sessão: só o cadastro.
  if (r && r.access_token) { aplicarSessao(r); return { entrou: true }; }
  return { entrou: false };
}

async function entrarNaConta(email, senha) {
  const r = await chamar("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password: senha }),
  });
  aplicarSessao(r);
  return true;
}

function sairDaConta() {
  nuvem.token = null;
  nuvem.renovacao = null;
  nuvem.expiraEm = 0;
  nuvem.usuario = null;
  nuvem.sincronizadoEm = null;
  guardarNuvem();
}

function configurarNuvem(url, publica) {
  nuvem.url = String(url || "").trim().replace(/\/+$/, "");
  nuvem.publica = String(publica || "").trim();
  guardarNuvem();
}

// -------------------------------------------------------------- mesclagem

/**
 * O que torna a mesclagem possível: eventos são só acrescentados, nunca
 * alterados. Então juntar dois aparelhos é juntar duas listas e tirar as
 * repetições — sem decidir quem "ganha", que é onde esse tipo de código
 * costuma perder dado.
 *
 * O resto (situação, data de retorno) deixa de ser guardado como verdade
 * própria e passa a ser deduzido dos eventos. Assim não existe campo que
 * possa discordar do histórico.
 */
function assinaturaDoEvento(e) {
  return [e.em, e.tipo, e.modeloId || "", (e.texto || "").slice(0, 120)].join("|");
}

function juntarEventos(a = [], b = []) {
  const vistos = new Set();
  const todos = [];
  for (const e of [...a, ...b]) {
    const chave = assinaturaDoEvento(e);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    todos.push(e);
  }
  todos.sort((x, y) => new Date(x.em) - new Date(y.em));
  return todos;
}

function situacaoPorEventos(eventos) {
  let status = "ABERTO";
  for (const e of eventos) {
    if (e.tipo === "NAO_PERTURBE") status = "NAO_PERTURBE";
    else if (e.tipo === "SEM_INTERESSE") status = "SEM_INTERESSE";
    else if (e.tipo === "CLIENTE") status = "CLIENTE";
    else if (e.tipo === "LIBERADO") status = "ABERTO";
    // marcar retorno é o contrário de descartar, mas não rebaixa um cliente
    else if (e.tipo === "RETORNO" && e.quando
      && (status === "NAO_PERTURBE" || status === "SEM_INTERESSE")) status = "ABERTO";
  }
  return status;
}

function retornoPorEventos(eventos, reserva) {
  for (let i = eventos.length - 1; i >= 0; i--) {
    const e = eventos[i];
    if (e.tipo !== "RETORNO") continue;
    if ("quando" in e) return e.quando || null;   // desmarcar grava quando: null
    return reserva || null;                       // evento antigo, sem o campo
  }
  return reserva || null;
}

function mesclarContato(a, b) {
  if (!a) return b;
  if (!b) return a;
  const eventos = juntarEventos(a.eventos, b.eventos);
  const maisNovo = new Date(a.criadoEm) <= new Date(b.criadoEm) ? a : b;

  // O benefício não é dedução de evento nenhum: é ajuste, e ajuste resolve por
  // quem mexeu por último. Só que "por último" precisa de carimbo — sem ele o
  // lado que nunca ouviu falar em benefício apagaria o do outro.
  const donoBen = new Date(a.beneficioEm || 0) >= new Date(b.beneficioEm || 0) ? a : b;
  const outroBen = donoBen === a ? b : a;

  // O CPF segue a mesma regra do benefício, com carimbo próprio.
  const donoCpf = new Date(a.cpfEm || 0) >= new Date(b.cpfEm || 0) ? a : b;
  const outroCpf = donoCpf === a ? b : a;

  return {
    numero: (a.numero || "").length >= (b.numero || "").length ? a.numero : b.numero,
    nome: a.nome || b.nome || "",
    criadoEm: new Date(a.criadoEm) <= new Date(b.criadoEm) ? a.criadoEm : b.criadoEm,
    status: situacaoPorEventos(eventos),
    voltarEm: retornoPorEventos(eventos, maisNovo.voltarEm),
    cpf: (donoCpf.cpfEm ? donoCpf.cpf : null) || outroCpf.cpf || null,
    cpfEm: donoCpf.cpfEm || outroCpf.cpfEm || null,
    beneficio: (donoBen.beneficioEm ? donoBen.beneficio : null) || outroBen.beneficio || null,
    beneficioEm: donoBen.beneficioEm || outroBen.beneficioEm || null,
    eventos,
  };
}

/** `local` e `remoto` no formato do estado inteiro. Devolve o combinado. */
function mesclarEstados(local, remoto) {
  if (!remoto) return local;
  if (!local) return remoto;

  const contatos = {};
  for (const k of new Set([...Object.keys(local.contatos || {}),
                           ...Object.keys(remoto.contatos || {})])) {
    contatos[k] = mesclarContato((local.contatos || {})[k], (remoto.contatos || {})[k]);
  }

  // Ajustes não têm histórico, então vale o que foi mexido por último. Na
  // dúvida fica o do aparelho: é onde a pessoa acabou de digitar.
  const localMaisNovo = !remoto.ajustadoEm
    || new Date(local.ajustadoEm || 0) >= new Date(remoto.ajustadoEm);
  const dono = localMaisNovo ? local : remoto;

  return {
    versao: 1,
    eu: dono.eu,
    regua: dono.regua,
    modelos: dono.modelos,
    ajustadoEm: dono.ajustadoEm || null,
    contatos,
    copiaComData: !!dono.copiaComData,
    tema: dono.tema || "escuro",
    copiaEm: [local.copiaEm, remoto.copiaEm].filter(Boolean).sort().pop() || null,
    aberturas: Math.max(Number(local.aberturas) || 0, Number(remoto.aberturas) || 0),
    desde: [local.desde, remoto.desde].filter(Boolean).sort()[0] || null,
  };
}

// ------------------------------------------------------------ sincronizar

const TABELA = "/rest/v1/caderno";

async function baixarDaNuvem() {
  const linhas = await chamar(
    `${TABELA}?select=dados,atualizado_em&dono=eq.${nuvem.usuario}&limit=1`,
    { method: "GET" }, true);
  return linhas && linhas[0] ? linhas[0] : null;
}

async function subirParaNuvem(dados) {
  await chamar(TABELA, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      dono: nuvem.usuario,
      dados,
      atualizado_em: new Date().toISOString(),
    }),
  }, true);
}

/**
 * Baixa, junta com o que está no aparelho, grava dos dois lados.
 * Devolve o estado combinado para quem chamou aplicar na tela.
 */
async function sincronizarNuvem(estadoLocal) {
  if (!nuvemConectada()) throw new Error("Entre na sua conta primeiro.");

  const linha = await baixarDaNuvem();
  const combinado = mesclarEstados(estadoLocal, linha ? linha.dados : null);
  await subirParaNuvem(combinado);

  nuvem.sincronizadoEm = new Date().toISOString();
  guardarNuvem();
  return combinado;
}
