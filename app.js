/* Tino — a memória que o WhatsApp não guarda.
 *
 * A ideia inteira cabe numa frase: você já digita o número em algum lugar
 * antes de mandar mensagem. Se digitar aqui, o app abre a conversa para você
 * E guarda quem é. Mesmas teclas de sempre, e no dia em que a lista do
 * trabalho reiniciar, é ele que lembra quem você já queimou.
 *
 * Tudo mora no aparelho (localStorage). Nada sobe para servidor nenhum —
 * decisão de risco, não de preguiça: assim isto é a agenda pessoal de quem
 * usa, e não a cópia da base de uma empresa.
 */

"use strict";

/* O app virou Tino, a chave não: ela é o endereço dos dados no aparelho, e
   trocá-la apagaria os contatos de quem já usa. Nome antigo, dados intactos. */
const CHAVE = "lembra.v1";

const MODELOS_PADRAO = [
  {
    id: "m1",
    titulo: "Primeiro contato",
    texto:
      "{saudacao}, {nome}. Aqui é o {eu}, da {instituicao}. Posso te mandar " +
      "uma simulação rápida, sem compromisso? Se não tiver interesse é só me " +
      "dizer que eu não incomodo mais.",
  },
  {
    id: "m2",
    titulo: "Segunda tentativa",
    texto:
      "{nome}, é o {eu} de novo. Só para não te deixar sem retorno: ainda quer " +
      "que eu veja essa simulação? Se preferir que eu pare, me avisa que eu paro.",
  },
  {
    id: "m3",
    titulo: "Retorno combinado",
    texto:
      "{saudacao}, {nome}. Aqui é o {eu}. Você pediu para eu te procurar hoje. " +
      "Posso mandar os números?",
  },
];

/* Os tipos que aparecem na lista. "Outro" fecha o conjunto sem obrigar a
 * escolher errado, e a escolha vazia continua valendo: benefício desconhecido
 * é o normal no primeiro contato. */
const TIPOS_BENEFICIO = [
  "Aposentadoria por idade",
  "Aposentadoria por tempo de contribuição",
  "Aposentadoria por invalidez",
  "Pensão por morte",
  "Auxílio-doença",
  "Auxílio-acidente",
  "Auxílio-reclusão",
  "BPC / LOAS",
  "Outro",
];

const PADRAO = {
  versao: 1,
  eu: { nome: "", instituicao: "" },
  regua: { um: 15, dois: 45, respondeu: 7 },
  modelos: MODELOS_PADRAO,
  contatos: {},
  copiaEm: null,     // quando a última cópia de segurança foi tirada
  copiaComData: false,  // nome com a data (guarda várias) ou nome fixo (substitui)
  aberturas: 0,      // quantas vezes o app abriu: mede se o navegador apaga
  desde: null,       // data da primeira abertura que sobreviveu
  ajustadoEm: null,  // última mexida nos ajustes, para a sincronia desempatar
};

// ---------------------------------------------------------------- estado

let estado = carregar();
let chaveAtual = null;    // contato em foco na tela de discar
let chaveFicha = null;    // contato aberto na ficha
let previaEditada = false;   // o texto foi ajustado à mão e não deve ser refeito
let modeloEmEdicao = null;   // id do modelo aberto no editor dos Ajustes
let filtroAtual = "TODOS";

function carregar() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return estruturar(PADRAO);
    const lido = JSON.parse(cru);
    return estruturar({ ...PADRAO, ...lido });
  } catch (e) {
    console.error("não deu para ler o que estava guardado", e);
    return estruturar(PADRAO);
  }
}

/** Garante que campos novos de versões futuras não venham faltando. */
function estruturar(d) {
  return {
    versao: 1,
    eu: { nome: "", instituicao: "", ...(d.eu || {}) },
    regua: { um: 15, dois: 45, respondeu: 7, ...(d.regua || {}) },
    modelos: Array.isArray(d.modelos) && d.modelos.length ? d.modelos : MODELOS_PADRAO,
    contatos: d.contatos || {},
    copiaEm: d.copiaEm || null,
    copiaComData: !!d.copiaComData,
    aberturas: Number(d.aberturas) || 0,
    desde: d.desde || null,
    ajustadoEm: d.ajustadoEm || null,
  };
}

/** Carimba os ajustes para a sincronização saber qual lado é o mais recente. */
function ajustesMexidos() {
  estado.ajustadoEm = new Date().toISOString();
}

/**
 * Pede ao Android que não jogue fora os dados quando o aparelho ficar
 * apertado de espaço. Sem isto, o sistema pode limpar o armazenamento de um
 * site que ele considera descartável — e aqui não é site, é a agenda de
 * trabalho de alguém. Instalar o app na tela inicial ajuda a conseguir.
 */
async function fixarArmazenamento() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch (e) {
    return null;
  }
}

function guardar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    agendarSincronia();
    return true;
  } catch (e) {
    // Cota estourada é o único erro realista aqui, e acontece com conversa
    // colada demais. Avisar é melhor que perder em silêncio.
    avisar("Não coube mais no aparelho. Exporte uma cópia e apague conversas antigas.");
    console.error(e);
    return false;
  }
}

// ------------------------------------------------------------- utilidades

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function soDigitos(s) {
  return String(s || "").replace(/\D/g, "");
}

/** Deixa o número no formato DDD + assinante, sem o 55 do país. */
function normalizar(bruto) {
  let d = soDigitos(bruto);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

/**
 * A chave de identidade. O nono dígito do celular entrou em 2016 e metade das
 * listas antigas não tem: 11 98765-4321 e 11 8765-4321 são a mesma pessoa.
 * Guardar pelos dois jeitos faria o app dizer "número novo" para quem já foi
 * chamado seis vezes — justamente o erro que ele existe para evitar.
 */
function chaveDe(bruto) {
  const d = normalizar(bruto);
  if (d.length === 11 && d[2] === "9") return d.slice(0, 2) + d.slice(3);
  return d;
}

function valido(bruto) {
  const d = normalizar(bruto);
  return d.length === 10 || d.length === 11;
}

function bonito(bruto) {
  const d = normalizar(bruto);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return bruto;
}

/**
 * O número do benefício tem dez dígitos, e o último é verificador. Aqui ele é
 * só formatado, nunca recusado: lista de trabalho vem com número truncado e
 * com número antigo, e barrar a digitação faria a pessoa desistir de anotar.
 * Número meio certo ainda acha a pessoa na busca; número nenhum não acha.
 */
function beneficioBonito(bruto) {
  const d = soDigitos(bruto);
  if (d.length === 10) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d[9];
  return String(bruto || "").trim();
}

function baixarArquivo(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Enche uma lista de tipos de benefício, com a opção de não dizer nada. */
function encherTipos(sel) {
  $(sel).innerHTML = '<option value="">Não informado</option>' +
    TIPOS_BENEFICIO.map((t) => '<option value="' + escapar(t) + '">' + escapar(t) + "</option>").join("");
}

function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * O dia, no fuso de quem usa.
 *
 * Cuidado que custou um bug: `new Date("2026-09-01")` é lido como meia-noite
 * em UTC, o que no Brasil ainda é dia 31 de agosto às 21h. O campo de data do
 * navegador devolve exatamente esse formato, então um retorno marcado para o
 * dia 1º aparecia como 31 e caía na fila um dia antes. Data sem hora tem de
 * ser montada peça por peça, no fuso local.
 */
function dia(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(valor);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasEntre(a, b) {
  return Math.round((b - a) / 86400000);
}

function dataCurta(valor) {
  return dia(valor).toLocaleDateString("pt-BR",
    { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function dataHora(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function haQuanto(iso) {
  const n = diasEntre(dia(iso), hoje());
  if (n <= 0) return "hoje";
  if (n === 1) return "ontem";
  if (n < 30) return `há ${n} dias`;
  const m = Math.floor(n / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

let relogioAviso = null;
function avisar(texto) {
  const el = $("#aviso");
  el.textContent = texto;
  el.classList.remove("oculto");
  clearTimeout(relogioAviso);
  relogioAviso = setTimeout(() => el.classList.add("oculto"), 3200);
}

// --------------------------------------------------------------- contatos

function achar(bruto) {
  return estado.contatos[chaveDe(bruto)] || null;
}

function criar(bruto, nome) {
  const k = chaveDe(bruto);
  estado.contatos[k] = {
    numero: normalizar(bruto),
    nome: (nome || "").trim(),
    criadoEm: new Date().toISOString(),
    status: "ABERTO",
    voltarEm: null,
    cpf: null,
    cpfEm: null,
    beneficio: null,
    beneficioEm: null,
    eventos: [],
  };
  return estado.contatos[k];
}

function beneficioDe(c) {
  return { numero: "", tipo: "", ...((c && c.beneficio) || {}) };
}

/** "123.456.789-0 · Aposentadoria por idade", ou vazio se não há nada. */
function resumoBeneficio(c) {
  const b = beneficioDe(c);
  return [b.numero ? beneficioBonito(b.numero) : "", b.tipo].filter(Boolean).join(" · ");
}

/**
 * Guarda o benefício no contato. Diferente da situação, que é deduzida dos
 * eventos, isto é um ajuste: quando dois aparelhos discordam vence quem mexeu
 * por último, e é para isso que serve o carimbo `beneficioEm`. O evento no
 * histórico é só memória de quando foi anotado.
 */
function anotarBeneficio(c, numeroBruto, tipo) {
  const antes = beneficioDe(c);
  const depois = { numero: soDigitos(numeroBruto), tipo: (tipo || "").trim() };
  if (antes.numero === depois.numero && antes.tipo === depois.tipo) return false;

  c.beneficio = depois.numero || depois.tipo ? depois : null;
  c.beneficioEm = new Date().toISOString();
  registrar(c, "BENEFICIO", {
    texto: resumoBeneficio(c) || "Dados do benefício apagados",
  });
  return true;
}

/**
 * O CPF é o único dado aqui que se pode conferir sozinho, e por isso ele é
 * conferido: os dois últimos dígitos são calculados a partir dos nove
 * primeiros. CPF errado é pior que CPF vazio — ele não avisa que está errado,
 * só some da busca no dia em que a pessoa for procurada.
 */
function cpfValido(bruto) {
  const d = soDigitos(bruto);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;   // 111.111.111-11 e parentes passam na conta

  for (let corte = 9; corte <= 10; corte++) {
    let soma = 0;
    for (let i = 0; i < corte; i++) soma += Number(d[i]) * (corte + 1 - i);
    let dv = (soma * 10) % 11;
    if (dv === 10) dv = 0;
    if (dv !== Number(d[corte])) return false;
  }
  return true;
}

function cpfBonito(bruto) {
  const d = soDigitos(bruto);
  if (d.length === 11) {
    return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  }
  return String(bruto || "").trim();
}

/**
 * Guarda o CPF. Como o benefício, é ajuste e não evento: entre dois aparelhos
 * vence quem mexeu por último, pelo carimbo `cpfEm`.
 *
 * Devolve o que aconteceu, porque quem chama precisa saber se avisa ou não:
 * "igual", "gravado", "apagado", "invalido" ou "incompleto".
 */
function anotarCpf(c, bruto) {
  const d = soDigitos(bruto);
  const antes = soDigitos(c.cpf);

  if (d === antes) return "igual";
  if (!d) {
    c.cpf = null;
    c.cpfEm = new Date().toISOString();
    registrar(c, "CPF", { texto: "CPF apagado" });
    return "apagado";
  }
  if (d.length < 11) return "incompleto";
  if (!cpfValido(d)) return "invalido";

  c.cpf = d;
  c.cpfEm = new Date().toISOString();
  registrar(c, "CPF", { texto: cpfBonito(d) });
  return "gravado";
}

/** O aviso certo para cada desfecho de anotarCpf(). Vazio = não precisa avisar. */
function recadoDoCpf(desfecho) {
  if (desfecho === "invalido") return "Esse CPF não confere. Não guardei — confira os dígitos.";
  if (desfecho === "incompleto") return "CPF incompleto. Não guardei.";
  return "";
}

/** CPF e benefício juntos, para a linha de identificação da ficha. */
function resumoDoCliente(c) {
  const partes = [];
  if (c && c.cpf) partes.push("CPF " + cpfBonito(c.cpf));
  const b = resumoBeneficio(c);
  if (b) partes.push(b);
  return partes.join(" · ");
}

function registrar(c, tipo, extra = {}) {
  c.eventos.push({ em: new Date().toISOString(), tipo, ...extra });
}

/** Quantas mensagens foram mandadas desde a última resposta (ou liberação). */
function semRespostaSeguidas(c) {
  let n = 0;
  for (let i = c.eventos.length - 1; i >= 0; i--) {
    const t = c.eventos[i].tipo;
    if (t === "RESPONDEU" || t === "LIBERADO") break;
    if (t === "ENVIADO") n++;
  }
  return n;
}

function jaRespondeu(c) {
  return c.eventos.some((e) => e.tipo === "RESPONDEU");
}

function totalEnviados(c) {
  return c.eventos.filter((e) => e.tipo === "ENVIADO").length;
}

function ultimoEnvio(c) {
  for (let i = c.eventos.length - 1; i >= 0; i--) {
    if (c.eventos[i].tipo === "ENVIADO") return c.eventos[i].em;
  }
  return null;
}

/** Quantos dias esperar antes de procurar de novo. null = nunca mais. */
function esperaDe(c) {
  if (c.status === "NAO_PERTURBE" || c.status === "SEM_INTERESSE") return null;
  if (jaRespondeu(c)) return estado.regua.respondeu;
  const n = semRespostaSeguidas(c);
  if (n === 0) return 0;
  if (n === 1) return estado.regua.um;
  if (n === 2) return estado.regua.dois;
  return null;   // três tentativas mudas: sai da fila de vez
}

/** Data a partir da qual pode chamar de novo. null = nunca. */
function liberadoEm(c) {
  const espera = esperaDe(c);
  if (espera === null) return null;
  const ult = ultimoEnvio(c);
  if (!ult) return hoje();
  const d = dia(ult);
  d.setDate(d.getDate() + espera);
  return d;
}

// ------------------------------------------------------------- o veredito

/**
 * O que o app tem a dizer no instante em que o número é digitado — antes de
 * mandar qualquer coisa. É a tela inteira do produto.
 */
function julgar(c) {
  if (!c) {
    return { classe: "novo", titulo: "Número novo", detalhe: "Você nunca falou com esta pessoa." };
  }

  const enviados = totalEnviados(c);
  const ult = ultimoEnvio(c);
  const desde = ult ? `Última em ${dataCurta(ult)}, ${haQuanto(ult)}.` : "";

  if (c.status === "NAO_PERTURBE") {
    return {
      classe: "pare",
      titulo: "Pediu para não receber mais",
      detalhe: "Não mande. É desse contato que sai denúncia, e denúncia é o que derruba o número.",
    };
  }
  if (c.status === "SEM_INTERESSE") {
    return { classe: "pare", titulo: "Disse que não tem interesse", detalhe: desde };
  }
  if (c.status === "CLIENTE") {
    return { classe: "ok", titulo: "Já é seu cliente", detalhe: desde };
  }

  if (c.voltarEm) {
    const faltam = diasEntre(hoje(), dia(c.voltarEm));
    if (faltam <= 0) {
      return {
        classe: "ok",
        titulo: "Retorno combinado",
        detalhe: `Você marcou para procurar em ${dataCurta(c.voltarEm)}. ${
          faltam === 0 ? "É hoje." : `Já passou ${-faltam === 1 ? "1 dia" : -faltam + " dias"}.`}`,
      };
    }
    return {
      classe: "ok",
      titulo: "Retorno marcado",
      detalhe: `Combinado para ${dataCurta(c.voltarEm)} — ${
        faltam === 1 ? "amanhã" : `faltam ${faltam} dias`}. Antes disso, deixe quieto.`,
    };
  }

  if (jaRespondeu(c)) {
    return {
      classe: "ok",
      titulo: "Já respondeu antes",
      detalhe: `${enviados} ${enviados === 1 ? "mensagem" : "mensagens"}. ${desde}`,
    };
  }

  const mudas = semRespostaSeguidas(c);
  if (mudas >= 3) {
    return {
      classe: "pare",
      titulo: `${mudas} tentativas, nenhuma resposta`,
      detalhe: "Quem não respondeu três vezes não responde na quarta. Insistir aqui é o que queima seu número.",
    };
  }
  if (mudas > 0) {
    const lib = liberadoEm(c);
    const falta = lib ? diasEntre(hoje(), lib) : 0;
    return {
      classe: "cuidado",
      titulo: `Já chamado ${mudas} ${mudas === 1 ? "vez" : "vezes"}, sem resposta`,
      detalhe: falta > 0
        ? `${desde} Melhor só voltar em ${dataCurta(lib.toISOString())} — faltam ${falta} dias.`
        : `${desde} Já pode chamar de novo.`,
    };
  }

  return { classe: "novo", titulo: "Cadastrado, ainda não chamado", detalhe: "" };
}

// ------------------------------------------------------- tela de discagem

function pintarDiscagem() {
  const bruto = $("#numero").value;
  const ok = valido(bruto);

  const mostrar = (sel, cond) => $(sel).classList.toggle("oculto", !cond);

  // No iPhone fora da Tela de Início, o aviso de instalar vem antes de tudo:
  // não adianta o app funcionar bem se o Safari vai apagar no fim do dia.
  const precisaInstalar = EH_IPHONE && !estaInstalado();
  mostrar("#instalar", precisaInstalar && !ok);

  // O aviso de "sumiu tudo" só faz sentido com a tela parada e vazia.
  const semContatos = Object.keys(estado.contatos).length === 0;
  mostrar("#sumiu", !ok && !precisaInstalar && semContatos);

  // A cobrança da cópia vem depois dos dois: quem ainda não instalou tem
  // problema maior, e quem está com a lista vazia não tem o que copiar.
  const cobrar = !ok && !precisaInstalar && !semContatos && precisaCobrarCopia();
  if (cobrar) pintarCobrancaDaCopia();
  mostrar("#copia-atrasada", cobrar);

  if (!ok) {
    chaveAtual = null;
    ["#veredito", "#campo-nome", "#campo-beneficio", "#campo-modelo", "#campo-previa",
      "#abrir", "#so-guardar", "#desfecho", "#agendar", "#ver-ficha"]
      .forEach((s) => mostrar(s, false));
    return;
  }

  const c = achar(bruto);
  const k = chaveDe(bruto);

  // Trocou de pessoa? O nome tem de trocar junto. Sem isto, digitar o número
  // da Maria logo depois do José deixava "Sr. José" no campo — e a mensagem
  // saía com o nome errado, que é pior do que sair sem nome nenhum.
  if (k !== chaveAtual) {
    // Outra pessoa, outra mensagem: o ajuste feito para a anterior não a segue.
    previaEditada = false;
    $("#nome").value = c ? c.nome || "" : "";
    const b = beneficioDe(c);
    $("#cpf").value = c && c.cpf ? cpfBonito(c.cpf) : "";
    $("#beneficio-numero").value = b.numero ? beneficioBonito(b.numero) : "";
    $("#beneficio-tipo").value = b.tipo || "";
    // Quem já tem dado anotado vê na hora; quem não tem não perde a tela
    // com campos que não vai preencher agora.
    $("#campo-beneficio").open = !!((c && c.cpf) || b.numero || b.tipo);
  }
  chaveAtual = k;

  const v = julgar(c);
  const el = $("#veredito");
  el.className = "veredito " + v.classe;
  el.innerHTML =
    `<p class="titulo">${escapar(v.titulo)}</p>` +
    (v.detalhe ? `<p class="detalhe">${escapar(v.detalhe)}</p>` : "");

  mostrar("#veredito", true);
  mostrar("#campo-nome", true);
  mostrar("#campo-beneficio", true);
  mostrar("#campo-modelo", true);
  mostrar("#campo-previa", true);
  mostrar("#abrir", true);
  mostrar("#so-guardar", true);
  mostrar("#ver-ficha", !!c);
  mostrar("#desfecho", !!c && !!ultimoEnvio(c));
  mostrar("#agendar", true);
  pintarRetorno(c, { campo: "#voltar-em", limpar: "#tirar-retorno", texto: "#agendar-atual" });

  atualizarPrevia();
}

/** Troca os marcadores pelo que eles valem na hora de mandar. */
function renderizar(texto, nome) {
  return String(texto || "")
    .replaceAll("{saudacao}", saudacao())
    .replaceAll("{nome}", (nome || "").trim() || "tudo bem")
    .replaceAll("{eu}", estado.eu.nome || "…")
    .replaceAll("{instituicao}", estado.eu.instituicao || "…")
    .replace(/\s+/g, " ")
    .trim();
}

function montarTexto() {
  const m = estado.modelos.find((x) => x.id === $("#modelo").value) || estado.modelos[0];
  if (!m) return "";
  return renderizar(m.texto, $("#nome").value);
}

/** Nome e benefício digitados na tela de discar, aplicados ao contato. */
function aplicarCamposDaDiscagem(c) {
  const nome = ($("#nome").value || "").trim();
  if (nome) c.nome = nome;

  // CPF errado não derruba o resto: nome e benefício são gravados do mesmo
  // jeito. O aviso não sai daqui — quem chama é que decide, senão o recado
  // genérico de "guardado" apagaria o do CPF meio segundo depois.
  const doCpf = anotarCpf(c, $("#cpf").value);
  const mexeuBeneficio = anotarBeneficio(c, $("#beneficio-numero").value, $("#beneficio-tipo").value);

  return {
    mexeu: mexeuBeneficio || doCpf === "gravado" || doCpf === "apagado",
    recadoCpf: recadoDoCpf(doCpf),
  };
}

/**
 * Cadastrar sem chamar. É o contrário do resto do app, e por isso existe: o
 * número às vezes chega pelo balcão ou por indicação, e mandar na hora é
 * justamente o que queima o chip. A pessoa fica guardada, o veredito passa a
 * valer para ela, e nenhuma mensagem saiu.
 */
function guardarSemMandar() {
  const bruto = $("#numero").value;
  if (!valido(bruto)) return avisar("Número incompleto.");

  let c = achar(bruto);
  const jaEra = !!c;
  if (!c) c = criar(bruto, $("#nome").value);
  const r = aplicarCamposDaDiscagem(c);
  if (!guardar()) return;

  pintarDiscagem();
  pintarFila();
  pintarContatos();

  // O problema no CPF tem prioridade: guardar é o esperado, o CPF recusado
  // é a surpresa, e é ela que precisa aparecer.
  avisar(r.recadoCpf || (!jaEra ? "Contato guardado, sem mandar nada."
    : r.mexeu ? "Contato atualizado."
    : "Este contato já estava guardado."));
}

/**
 * A mensagem que está na tela é a mensagem que vai. Ela nasce do modelo, mas
 * a partir do momento em que alguém mexe nela, é a mão de quem escreveu que
 * manda — por isso a marca. Sem ela, digitar o nome depois de ajustar o texto
 * apagaria o ajuste sem avisar.
 */
function atualizarPrevia() {
  if (!previaEditada) $("#previa").value = montarTexto();
  $("#voltar-modelo").classList.toggle("oculto", !previaEditada);
  esticarPrevia();
}

/** A caixa cresce com o texto: mensagem cortada não dá para conferir. */
function esticar(el, minimo) {
  el.style.height = "auto";
  el.style.height = Math.max(el.scrollHeight, minimo || 92) + "px";
}

function esticarPrevia() {
  esticar($("#previa"), 92);
}

/** O que vai para o WhatsApp: o que está escrito, e não o que o modelo diria. */
function textoParaEnviar() {
  return ($("#previa").value || "").trim() || montarTexto();
}

function abrirConversa() {
  const bruto = $("#numero").value;
  if (!valido(bruto)) return avisar("Número incompleto.");

  let c = achar(bruto);
  const jaEra = !!c;
  if (!c) c = criar(bruto, $("#nome").value);

  if (c.status === "NAO_PERTURBE") {
    if (!confirm("Esta pessoa pediu para não receber mais mensagens.\n\nMandar assim mesmo?")) return;
  }

  const recadoCpf = aplicarCamposDaDiscagem(c).recadoCpf;
  if (recadoCpf) avisar(recadoCpf);

  const modeloId = $("#modelo").value;
  const texto = textoParaEnviar();
  registrar(c, "ENVIADO", { modeloId, texto });
  // Chamou no dia combinado? O compromisso está cumprido. Mas um retorno
  // marcado para daqui a um mês continua de pé — mandar hoje por outro
  // motivo não desmarca o que ficou combinado para lá na frente.
  if (c.voltarEm && diasEntre(hoje(), dia(c.voltarEm)) <= 0) c.voltarEm = null;
  guardar();

  const destino = "https://wa.me/55" + c.numero + "?text=" + encodeURIComponent(texto);
  window.open(destino, "_blank", "noopener");

  pintarDiscagem();
  pintarFila();
  if (!jaEra) avisar("Contato guardado.");
}

function marcarResultado(tipo) {
  if (!chaveAtual) return;
  const c = estado.contatos[chaveAtual];
  if (!c) return;
  aplicarResultado(c, tipo);
  guardar();
  pintarDiscagem();
  pintarFila();
  avisar(recadoDe(tipo));
}

function aplicarResultado(c, tipo) {
  registrar(c, tipo);
  if (tipo === "NAO_PERTURBE") { c.status = "NAO_PERTURBE"; c.voltarEm = null; }
  else if (tipo === "SEM_INTERESSE") { c.status = "SEM_INTERESSE"; c.voltarEm = null; }
  else if (tipo === "CLIENTE") { c.status = "CLIENTE"; }
  else if (tipo === "LIBERADO") { c.status = "ABERTO"; }
}

/**
 * Marca a data de voltar a procurar. Vale na discagem e na ficha.
 *
 * O evento guarda a data em `quando`, e não só no texto: é assim que a
 * sincronização entre aparelhos consegue deduzir qual retorno vale sem ter de
 * ler frase escrita para gente.
 */
function agendarRetorno(c, quando) {
  c.voltarEm = quando;
  // quem tinha sido descartado volta a valer: marcar retorno é o contrário
  // de "não me procure mais", e sem isto ele nunca reapareceria na fila
  if (c.status === "NAO_PERTURBE" || c.status === "SEM_INTERESSE") c.status = "ABERTO";
  registrar(c, "RETORNO", { quando, texto: "Voltar em " + dataCurta(quando) });
}

function desmarcarRetorno(c) {
  if (!c.voltarEm) return;
  registrar(c, "RETORNO", {
    quando: null,
    texto: "Retorno de " + dataCurta(c.voltarEm) + " desmarcado",
  });
  c.voltarEm = null;
}

/** Desenha a área de agendar, na discagem ou na ficha. */
function pintarRetorno(c, alvos) {
  const marcado = c && c.voltarEm;
  $(alvos.campo).value = marcado || "";
  $(alvos.limpar).classList.toggle("oculto", !marcado);
  $(alvos.texto).textContent = marcado
    ? `Marcado para ${dataCurta(c.voltarEm)}. Ele aparece na aba Hoje quando chegar o dia.`
    : "Combinou de procurar depois? Marque a data e ele volta sozinho na aba Hoje.";
}

function recadoDe(tipo) {
  return {
    RESPONDEU: "Anotado: respondeu.",
    SEM_RESPOSTA: "Anotado: sem resposta.",
    SEM_INTERESSE: "Anotado. Sai da fila.",
    NAO_PERTURBE: "Anotado. Não aparece mais na fila.",
    CLIENTE: "Anotado: virou cliente.",
    LIBERADO: "Liberado para a fila de novo.",
  }[tipo] || "Anotado.";
}

// ---------------------------------------------------------- fila do dia

function montarFila() {
  const h = hoje();
  const linhas = [];

  for (const [k, c] of Object.entries(estado.contatos)) {
    if (c.status === "NAO_PERTURBE" || c.status === "SEM_INTERESSE") continue;

    if (c.voltarEm && dia(c.voltarEm) <= h) {
      linhas.push({ k, c, ordem: 0, motivo: `retorno combinado para ${dataCurta(c.voltarEm)}` });
      continue;
    }

    const lib = liberadoEm(c);
    if (!lib || lib > h) continue;

    const ult = ultimoEnvio(c);
    if (!ult) {
      linhas.push({ k, c, ordem: 2, motivo: "cadastrado e nunca chamado" });
    } else {
      const n = semRespostaSeguidas(c);
      linhas.push({
        k, c, ordem: 1,
        motivo: jaRespondeu(c)
          ? `respondeu antes · falado ${haQuanto(ult)}`
          : `${n} ${n === 1 ? "tentativa" : "tentativas"} · falado ${haQuanto(ult)}`,
        peso: dia(ult).getTime(),
      });
    }
  }

  linhas.sort((a, b) => (a.ordem - b.ordem) || ((a.peso || 0) - (b.peso || 0)));
  return linhas;
}

function pintarFila() {
  const linhas = montarFila();
  const lista = $("#fila-lista");

  $("#fila-contagem").textContent = linhas.length
    ? `${linhas.length} para falar` : "vazia";

  const badge = $("#badge-fila");
  badge.textContent = linhas.length > 99 ? "99+" : String(linhas.length);
  badge.classList.toggle("oculto", linhas.length === 0);

  const total = Object.keys(estado.contatos).length;
  $("#fila-resumo").textContent = total
    ? `De ${total} ${total === 1 ? "contato guardado" : "contatos guardados"}, ` +
      `${linhas.length} ${linhas.length === 1 ? "está" : "estão"} no prazo de hoje. ` +
      `O resto é para deixar quieto.`
    : "";

  if (!linhas.length) {
    lista.innerHTML = `<p class="vazio">Ninguém para chamar hoje.<br>
      Isso é bom: cada mensagem que você não manda é chip que dura mais.</p>`;
    return;
  }

  lista.innerHTML = linhas.map(({ k, c, ordem, motivo }) => {
    const classe = ordem === 0 ? "ok" : ordem === 2 ? "novo" : "cuidado";
    return `<button class="item ${classe}" data-fila="${escapar(k)}">
      <span class="cresce">
        <span class="nome">${escapar(c.nome || bonito(c.numero))}</span>
        <span class="sub">${escapar(motivo)}</span>
      </span>
      <span class="seta">›</span>
    </button>`;
  }).join("");
}

// ----------------------------------------------------------- contatos

function pintarContatos() {
  const busca = soDigitos($("#busca").value)
    || ($("#busca").value || "").trim().toLowerCase();
  const digitos = /^\d+$/.test(busca);

  let itens = Object.entries(estado.contatos).map(([k, c]) => ({ k, c }));

  itens = itens.filter(({ c }) => {
    if (filtroAtual === "RESPONDEU" && !jaRespondeu(c)) return false;
    if (filtroAtual === "MUDOS" && (jaRespondeu(c) || totalEnviados(c) === 0)) return false;
    if (filtroAtual === "NAO_PERTURBE" && c.status !== "NAO_PERTURBE") return false;
    if (!busca) return true;
    const b = beneficioDe(c);
    return digitos
      ? c.numero.includes(busca) || b.numero.includes(busca)
        || soDigitos(c.cpf).includes(busca)
      : (c.nome || "").toLowerCase().includes(busca)
        || b.tipo.toLowerCase().includes(busca);
  });

  itens.sort((a, b) => {
    const ua = ultimoEnvio(a.c) || a.c.criadoEm;
    const ub = ultimoEnvio(b.c) || b.c.criadoEm;
    return new Date(ub) - new Date(ua);
  });

  const total = Object.keys(estado.contatos).length;
  $("#contatos-contagem").textContent = total
    ? (itens.length === total ? `${total}` : `${itens.length} de ${total}`)
    : "nenhum";

  visiveis = itens.map(({ k }) => k);
  pintarBarraSelecao();

  const lista = $("#contatos-lista");
  if (!itens.length) {
    lista.innerHTML = `<p class="vazio">${total
      ? "Nada com esse filtro."
      : "Ainda não há ninguém aqui.<br>Digite um número na aba Discar e a memória começa."}</p>`;
    return;
  }

  lista.innerHTML = itens.map(({ k, c }) => {
    const v = julgar(c);
    const n = totalEnviados(c);
    const marcado = selecionando && selecionados.has(k);
    return `<button class="item ${v.classe}${marcado ? " marcado" : ""}" data-contato="${escapar(k)}">
      <span class="cresce">
        <span class="nome">${selecionando ? (marcado ? "☑ " : "☐ ") : ""}${escapar(c.nome || bonito(c.numero))}</span>
        <span class="sub">${escapar(bonito(c.numero))} · ${n} ${n === 1 ? "mensagem" : "mensagens"}${
          jaRespondeu(c) ? " · respondeu" : ""}</span>
      </span>
      <span class="seta">›</span>
    </button>`;
  }).join("");
}

// ------------------------------------------------- escolher e enviar contatos

/* Quem está escolhendo não está lendo ficha: enquanto a seleção está ligada, o
   toque na lista marca em vez de abrir. */
let selecionando = false;
const selecionados = new Set();
let visiveis = [];   // as chaves que o filtro deixou na tela agora

/**
 * Manda um arquivo pela folha de compartilhar, com o download como plano B.
 * Devolve true se foi mesmo embora — quem chama decide o que fazer com isso,
 * e é por isso que a cópia parcial não carimba a data da cópia.
 */
async function mandarArquivo(nome, conteudo, tipo, titulo) {
  const arquivo = new File([conteudo], nome, { type: tipo });
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: titulo });
      return true;
    } catch (e) {
      return false;   // fechou a folha; não é erro
    }
  }
  baixarArquivo(nome, conteudo, tipo);
  avisar("Este aparelho não abre a folha de compartilhar. O arquivo foi baixado.");
  return true;
}

/**
 * Uma cópia com só alguns contatos. Vai marcada como `parcial` de propósito:
 * do outro lado, o arquivo parcial só pode ser JUNTADO, nunca substituir o
 * aparelho inteiro — senão mandar cinco contatos apagaria oitocentos.
 */
function conteudoParcial(chaves) {
  const contatos = {};
  for (const k of chaves) if (estado.contatos[k]) contatos[k] = estado.contatos[k];
  return JSON.stringify({ ...estado, contatos, parcial: chaves.length }, null, 2);
}

function nomeParcial(quantos) {
  return `Tino - ${quantos} contatos ${new Date().toISOString().slice(0, 10)}.json`;
}

function entrarNaSelecao() {
  selecionando = true;
  selecionados.clear();
  pintarContatos();
}

function sairDaSelecao() {
  selecionando = false;
  selecionados.clear();
  pintarContatos();
}

function alternarSelecao(k) {
  if (selecionados.has(k)) selecionados.delete(k);
  else selecionados.add(k);
  pintarContatos();
}

/** Marca o que o filtro deixou à vista — é assim que se escolhe "todos os que responderam". */
function marcarVisiveis() {
  const faltam = visiveis.some((k) => !selecionados.has(k));
  visiveis.forEach((k) => (faltam ? selecionados.add(k) : selecionados.delete(k)));
  pintarContatos();
}

async function enviarEscolhidos() {
  const chaves = [...selecionados];
  if (!chaves.length) return avisar("Nenhum contato escolhido.");

  const conteudo = conteudoParcial(chaves);
  const foi = await mandarArquivo(nomeParcial(chaves.length), conteudo,
    "application/json", `${chaves.length} contatos do Tino`);

  // De propósito: cópia parcial NÃO conta como cópia de segurança. Carimbar a
  // data aqui faria o app parar de cobrar enquanto o resto continua sem cópia.
  if (foi) {
    avisar(`${chaves.length} ${chaves.length === 1 ? "contato enviado" : "contatos enviados"}. Isso não substitui a cópia inteira.`);
    sairDaSelecao();
  }
}

function pintarBarraSelecao() {
  $("#barra-selecao").classList.toggle("oculto", !selecionando);
  $("#escolher-contatos").classList.toggle("oculto", selecionando);
  if (!selecionando) return;

  const n = selecionados.size;
  $("#selecao-contagem").textContent = n
    ? `${n} ${n === 1 ? "escolhido" : "escolhidos"}`
    : "toque nos contatos";
  $("#marcar-visiveis").textContent =
    visiveis.some((k) => !selecionados.has(k))
      ? `Marcar os ${visiveis.length} à vista`
      : "Desmarcar os que estão à vista";
  $("#enviar-escolhidos").disabled = !n;
}

// --------------------------------------------------------------- ficha

const ROTULO_EVENTO = {
  ENVIADO: "Mensagem enviada",
  RESPONDEU: "Respondeu",
  SEM_RESPOSTA: "Sem resposta",
  SEM_INTERESSE: "Disse que não tem interesse",
  NAO_PERTURBE: "Pediu para não receber mais",
  CLIENTE: "Virou cliente",
  LIBERADO: "Liberado para a fila",
  RETORNO: "Retorno marcado",
  NOTA: "Anotação",
  CONVERSA: "Conversa guardada",
  IMPORTADO: "Histórico importado do WhatsApp",
  BENEFICIO: "Dados do benefício",
  CPF: "CPF anotado",
};

function abrirFicha(k) {
  const c = estado.contatos[k];
  if (!c) return;
  chaveFicha = k;

  $("#ficha-nome").textContent = c.nome || "Sem nome";
  $("#ficha-numero").textContent = bonito(c.numero);
  $("#ficha-editar-nome").value = c.nome || "";

  const b = beneficioDe(c);
  $("#ficha-cpf").value = c.cpf ? cpfBonito(c.cpf) : "";
  $("#ficha-beneficio-numero").value = b.numero ? beneficioBonito(b.numero) : "";
  $("#ficha-beneficio-tipo").value = b.tipo || "";
  const resumo = resumoDoCliente(c);
  $("#ficha-beneficio-resumo").textContent = resumo;
  $("#ficha-beneficio-resumo").classList.toggle("oculto", !resumo);

  $("#ficha-nota").value = "";
  $("#ficha-conversa").value = "";
  $("#ficha-voltar-em").min = new Date().toISOString().slice(0, 10);
  pintarRetorno(c, {
    campo: "#ficha-voltar-em",
    limpar: "#ficha-tirar-retorno",
    texto: "#ficha-retorno-atual",
  });

  const v = julgar(c);
  $("#ficha-situacao").className = "veredito " + v.classe;
  $("#ficha-situacao").innerHTML =
    `<p class="titulo">${escapar(v.titulo)}</p>` +
    (v.detalhe ? `<p class="detalhe">${escapar(v.detalhe)}</p>` : "");

  const eventos = [...c.eventos].reverse();
  $("#ficha-historico").innerHTML = eventos.length
    ? eventos.map((e) => {
        const cor = e.tipo === "RESPONDEU" || e.tipo === "CLIENTE" ? "bom"
          : (e.tipo === "NAO_PERTURBE" || e.tipo === "SEM_INTERESSE") ? "ruim" : "";
        return `<div class="evento ${cor}">
          <div class="quando">${escapar(dataHora(e.em))}</div>
          <div class="oque">${escapar(ROTULO_EVENTO[e.tipo] || e.tipo)}</div>
          ${e.texto ? `<div class="texto">${escapar(e.texto)}</div>` : ""}
        </div>`;
      }).join("")
    : `<p class="vazio">Sem histórico ainda.</p>`;

  $("#ficha").classList.remove("oculto");
  document.body.style.overflow = "hidden";
}

/**
 * Leva a pessoa da ficha para a tela de discagem, já preenchida. Não manda
 * nada: só põe o número no lugar onde o veredito aparece e a mensagem se
 * monta. Um toque a mais, de propósito — é o toque em que dá para desistir.
 */
function falarCom(k) {
  const c = estado.contatos[k];
  if (!c) return;
  fecharFicha();
  irPara("discar");

  const n = $("#numero");
  n.value = c.numero;
  n.dispatchEvent(new Event("input", { bubbles: true }));
  window.scrollTo(0, 0);
}

function fecharFicha() {
  $("#ficha").classList.add("oculto");
  document.body.style.overflow = "";
  chaveFicha = null;
  pintarDiscagem();
  pintarFila();
  pintarContatos();
}

/**
 * Converte a exportação do WhatsApp num texto limpo.
 * Android:  11/08/2026 14:32 - Fulano: mensagem
 * iPhone:  [11/08/2026 14:32:10] Fulano: mensagem
 * Só interessa reconhecer o começo de linha para contar mensagens e tirar o
 * lixo invisível que os dois formatos deixam.
 */
function lerExportacao(cru) {
  const limpo = cru.replace(/[\u200E\u200F\u202A-\u202E]/g, "");
  const linhas = limpo.split(/\r?\n/);
  const inicio = /^\[?\d{1,2}\/\d{1,2}\/\d{2,4}[,]?\s+\d{1,2}:\d{2}/;
  const mensagens = linhas.filter((l) => inicio.test(l)).length;
  return { texto: limpo.trim(), mensagens };
}

// ------------------------------------------------- a conversa para fora

/**
 * Dentro do app a conversa é a prova do que ficou combinado; fora dele é o que
 * sobrevive ao aparelho, ao chip e ao próprio Tino. Sai em texto puro de
 * propósito: abre em qualquer coisa, hoje e daqui a dez anos.
 */
function textoDaFicha(c) {
  const linhas = [
    "Tino — histórico de " + (c.nome || bonito(c.numero)),
    "Telefone: " + bonito(c.numero),
  ];
  if (c.cpf) linhas.push("CPF: " + cpfBonito(c.cpf));
  const b = resumoBeneficio(c);
  if (b) linhas.push("Benefício: " + b);
  linhas.push("Exportado em " + dataHora(new Date().toISOString()));
  linhas.push("", "----------------------------------------", "");

  if (!c.eventos.length) {
    linhas.push("Sem histórico guardado.");
  } else {
    for (const e of c.eventos) {
      linhas.push("[" + dataHora(e.em) + "] " + (ROTULO_EVENTO[e.tipo] || e.tipo));
      if (e.texto) linhas.push(e.texto);
      linhas.push("");
    }
  }
  return linhas.join("\n");
}

function nomeDoArquivoDaFicha(c) {
  const cru = (c.nome || c.numero).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const limpo = cru.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return "Tino - conversa " + (limpo || c.numero) + " " + new Date().toISOString().slice(0, 10) + ".txt";
}

async function exportarConversa() {
  const c = estado.contatos[chaveFicha];
  if (!c) return;

  const conteudo = textoDaFicha(c);
  const nome = nomeDoArquivoDaFicha(c);
  const arquivo = new File([conteudo], nome, { type: "text/plain" });

  // Mesma razão da cópia de segurança: no celular, baixar é esconder. A folha
  // de compartilhar leva para o WhatsApp, o e-mail ou o Drive.
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({
        files: [arquivo],
        title: "Conversa — " + (c.nome || bonito(c.numero)),
      });
      avisar("Conversa enviada.");
    } catch (e) {
      // fechou a folha de compartilhar; não é erro
    }
    return;
  }
  baixarArquivo(nome, conteudo, "text/plain");
  avisar("Arquivo de texto baixado.");
}

// -------------------------------------------------------- agenda do celular

/**
 * O Android deixa o site pedir contatos ao dono do aparelho, com uma tela do
 * próprio sistema onde ele escolhe quem entrega. Não é acesso à agenda: é o
 * usuário passando um por um. Só existe no Chrome do Android — no computador
 * e no iPhone o botão nem aparece.
 *
 * Do WhatsApp não há equivalente: nenhum site lê conversa nem contato de lá.
 * O que lê são as bibliotecas piratas, e são elas que derrubam o número.
 */
const TEM_AGENDA = "contacts" in navigator && "ContactsManager" in window;

async function pedirDaAgenda(varios) {
  try {
    return await navigator.contacts.select(["name", "tel"], { multiple: !!varios });
  } catch (e) {
    // cancelar a escolha também cai aqui; não é erro que mereça alarde
    return [];
  }
}

/** Do que o Android devolve, o que interessa: um nome e um telefone válido. */
function limparDaAgenda(bruto) {
  const nome = (bruto.name && bruto.name[0] ? String(bruto.name[0]) : "").trim();
  const tels = (bruto.tel || []).map(normalizar).filter(valido);
  return tels.length ? { nome, numero: tels[0] } : null;
}

async function escolherDaAgenda() {
  const [escolhido] = await pedirDaAgenda(false);
  if (!escolhido) return;
  const c = limparDaAgenda(escolhido);
  if (!c) return avisar("Esse contato não tem telefone que dê para usar.");

  const n = $("#numero");
  n.value = c.numero;
  n.dispatchEvent(new Event("input", { bubbles: true }));
  if (c.nome) {
    $("#nome").value = c.nome;
    atualizarPrevia();
  }
}

async function trazerVariosDaAgenda() {
  const escolhidos = await pedirDaAgenda(true);
  if (!escolhidos.length) return;

  let novos = 0, jaTinha = 0, semTelefone = 0;
  for (const bruto of escolhidos) {
    const c = limparDaAgenda(bruto);
    if (!c) { semTelefone++; continue; }
    const existente = achar(c.numero);
    if (existente) {
      if (!existente.nome && c.nome) existente.nome = c.nome;
      jaTinha++;
      continue;
    }
    criar(c.numero, c.nome);
    novos++;
  }
  guardar();
  pintarContatos();
  pintarFila();

  const partes = [];
  if (novos) partes.push(`${novos} ${novos === 1 ? "novo" : "novos"}`);
  if (jaTinha) partes.push(`${jaTinha} já ${jaTinha === 1 ? "estava" : "estavam"} aqui`);
  if (semTelefone) partes.push(`${semTelefone} sem telefone`);
  avisar(partes.join(" · ") || "Nada para trazer.");
}

// --------------------------------------------------------------- sincronia

let relogioSincronia = null;
let sincronizando = false;

/**
 * Sincroniza pouco depois de a poeira baixar.
 *
 * Marcar um desfecho dispara três gravações seguidas; subir a cada uma seria
 * conversa fiada com o servidor. O atraso junta tudo num envio só. E se não
 * houver internet, some em silêncio: o aparelho já guardou, que é o que
 * importa para quem está com o cliente na frente.
 */
function agendarSincronia() {
  if (!nuvemConectada() || sincronizando) return;
  clearTimeout(relogioSincronia);
  relogioSincronia = setTimeout(() => { sincronizar(true); }, 4000);
}

async function sincronizar(silencioso) {
  if (!nuvemConectada() || sincronizando) return;
  sincronizando = true;
  pintarConta();
  try {
    const combinado = await sincronizarNuvem(estado);
    estado = estruturar(combinado);
    localStorage.setItem(CHAVE, JSON.stringify(estado));   // sem realimentar
    pintarTudo();
    if (!silencioso) avisar("Sincronizado.");
  } catch (e) {
    if (!silencioso) avisar(e.semRede ? "Sem internet agora. Fica para depois." : e.message);
  } finally {
    sincronizando = false;
    pintarConta();
  }
}

function pintarConta() {
  const caixa = $("#estado-conta");
  const mostrar = (sel, cond) => $(sel).classList.toggle("oculto", !cond);

  mostrar("#configurar-nuvem", !nuvemConfigurada());
  mostrar("#entrar-nuvem", nuvemConfigurada() && !nuvemConectada());
  mostrar("#conta-ligada", nuvemConectada());

  if (!nuvemConfigurada()) {
    caixa.className = "veredito cuidado";
    caixa.innerHTML = `<p class="titulo">Sem servidor ainda</p>
      <p class="detalhe">Enquanto não configurar, tudo vive só neste aparelho.</p>`;
    return;
  }
  if (!nuvemConectada()) {
    caixa.className = "veredito cuidado";
    caixa.innerHTML = `<p class="titulo">Fora da conta</p>
      <p class="detalhe">Entre para os contatos sobreviverem à troca de aparelho.</p>`;
    return;
  }
  if (sincronizando) {
    caixa.className = "veredito novo";
    caixa.innerHTML = `<p class="titulo">Sincronizando…</p>`;
    return;
  }
  caixa.className = "veredito ok";
  caixa.innerHTML = `<p class="titulo">${escapar(nuvem.email || "Conectado")}</p>
    <p class="detalhe">${nuvem.sincronizadoEm
      ? `Última sincronia em ${escapar(dataCurta(nuvem.sincronizadoEm))}, ${escapar(haQuanto(nuvem.sincronizadoEm))}.`
      : "Ainda não sincronizou."}</p>`;
}

// ------------------------------------------------------- aparelho e instalação

/**
 * O iPhone é um caso à parte, e é o que quebra este app se ficar sem aviso.
 *
 * O Safari apaga o armazenamento de site que vive em aba — é a proteção
 * contra rastreamento dele, e ela não distingue rastreador de ferramenta de
 * trabalho. Quem só está de aba perde tudo. Adicionado à Tela de Início, o
 * mesmo endereço vira aplicativo e fica de fora dessa limpeza.
 *
 * E o Safari não oferece instalar sozinho, como o Chrome do Android faz: se o
 * app não explicar o caminho, ninguém encontra.
 */
const EH_IPHONE = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function estaInstalado() {
  // navigator.standalone é o jeito do iOS, e o único confiável nas versões
  // mais antigas; a media query é o padrão, que o Android usa.
  return navigator.standalone === true
    || window.matchMedia("(display-mode: standalone)").matches;
}

// ------------------------------------------------------------- diagnóstico

/**
 * Mede o que ninguém consegue ver: se o navegador está apagando os dados.
 *
 * O truque é o contador de aberturas. Se ele volta a 1 toda vez que o
 * navegador reinicia, o armazenamento está sendo limpo — e nenhum conserto no
 * app resolve isso, porque a causa é aba anônima ou a opção de limpar dados ao
 * sair. Sem essa medida a conversa vira adivinhação.
 */
async function levantarDiagnostico() {
  const dados = {
    aberturas: estado.aberturas,
    desde: estado.desde,
    contatos: Object.keys(estado.contatos).length,
    instalado: estaInstalado(),
    fixado: null,
    usado: null,
    total: null,
    escreve: false,
  };

  try {
    const teste = "lembra.teste";
    localStorage.setItem(teste, "1");
    dados.escreve = localStorage.getItem(teste) === "1";
    localStorage.removeItem(teste);
  } catch (e) {
    dados.escreve = false;
  }

  try {
    if (navigator.storage && navigator.storage.persisted) {
      dados.fixado = await navigator.storage.persisted();
    }
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      dados.usado = e.usage;
      dados.total = e.quota;
    }
  } catch (e) { /* navegador antigo; os campos ficam nulos */ }

  return dados;
}

function emMega(bytes) {
  if (!bytes && bytes !== 0) return "?";
  const mb = bytes / 1048576;
  return mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : mb.toFixed(1) + " MB";
}

async function pintarDiagnostico() {
  const d = await levantarDiagnostico();
  const topo = $("#diagnostico");

  if (!d.escreve) {
    topo.className = "veredito pare";
    topo.innerHTML = `<p class="titulo">O navegador não deixa guardar nada</p>
      <p class="detalhe">Provavelmente é aba anônima ou privada. Feche e abra
      numa aba normal.</p>`;
  } else if (EH_IPHONE && !d.instalado) {
    // No iPhone isto não é um risco entre outros: é a causa certa da perda.
    topo.className = "veredito pare";
    topo.innerHTML = `<p class="titulo">O Safari vai apagar tudo</p>
      <p class="detalhe">Você está numa aba do Safari, e ele apaga os dados de
      site que não foi adicionado à Tela de Início. Volte à aba <b>Discar</b> e
      siga os quatro passos para instalar — é a única forma de os contatos
      sobreviverem no iPhone.</p>`;
  } else if (d.aberturas <= 1 && d.contatos === 0) {
    topo.className = "veredito novo";
    topo.innerHTML = `<p class="titulo">Primeira abertura</p>
      <p class="detalhe">Feche o navegador, abra de novo e volte aqui: o contador
      abaixo tem de marcar 2.</p>`;
  } else if (d.aberturas <= 1) {
    topo.className = "veredito pare";
    topo.innerHTML = `<p class="titulo">Os dados estão sendo apagados</p>
      <p class="detalhe">Há ${d.contatos} ${d.contatos === 1 ? "contato" : "contatos"}
      aqui, mas o app conta como se fosse a primeira vez que abre. O navegador
      está limpando tudo ao fechar.</p>`;
  } else {
    topo.className = "veredito ok";
    topo.innerHTML = `<p class="titulo">Os dados estão sobrevivendo</p>
      <p class="detalhe">O app já abriu ${d.aberturas} vezes e continua lembrando.</p>`;
  }

  const linha = (nome, valor, classe = "") =>
    `<div class="item ${classe}"><span class="cresce">
       <span class="nome">${escapar(nome)}</span>
       <span class="sub">${escapar(valor)}</span>
     </span></div>`;

  $("#detalhes-diagnostico").innerHTML = [
    linha("Aberturas contadas",
      d.desde ? `${d.aberturas} desde ${dataCurta(d.desde)}` : String(d.aberturas),
      d.aberturas > 1 ? "ok" : "cuidado"),
    linha("Contatos guardados", String(d.contatos)),
    linha("Instalado na tela inicial", d.instalado ? "sim" : "não",
      d.instalado ? "ok" : "cuidado"),
    linha("O sistema promete não apagar",
      d.fixado === null ? "o navegador não informa" : d.fixado ? "sim" : "não",
      d.fixado ? "ok" : "cuidado"),
    linha("Espaço usado",
      d.total ? `${emMega(d.usado)} de ${emMega(d.total)}` : "o navegador não informa"),
    linha("Última cópia",
      estado.copiaEm ? `${dataCurta(estado.copiaEm)}, ${haQuanto(estado.copiaEm)}` : "nunca",
      estado.copiaEm ? "" : "cuidado"),
  ].join("");
}

// --------------------------------------------------------- cópia de segurança

function conteudoDaCopia() {
  return JSON.stringify(estado, null, 2);
}

/* Sete dias, e não trinta. Um mês de trabalho perdido é a diferença entre um
   susto e recomeçar do zero — e a cobrança só sai quando há o que perder,
   então encurtar o prazo não custa incômodo a mais. */
const DIAS_ATE_COBRAR_COPIA = 7;

/**
 * Nome fixo por padrão, e não é detalhe: com a data no nome, cada envio vira um
 * arquivo novo e em um mês são trinta cópias no Drive, das quais só a última
 * presta. Com nome fixo, o celular pergunta se substitui e sobra uma cópia só,
 * sempre atual. Quem quiser um histórico de versões liga a data nos Ajustes.
 *
 * O que o app NÃO controla: para onde o arquivo vai. Ele entrega à folha de
 * compartilhar e quem decide é o Drive, o Arquivos ou o e-mail.
 */
function nomeDaCopia() {
  const nome = "Tino - meus contatos";
  if (!estado.copiaComData) return nome + ".json";
  return `${nome} ${new Date().toISOString().slice(0, 10)}.json`;
}

function marcarCopiaFeita() {
  estado.copiaEm = new Date().toISOString();
  guardar();
  pintarEstadoCopia();
  pintarDiscagem();   // a cobrança na primeira tela some na hora
}

/**
 * O que se perderia se o aparelho sumisse agora: tudo que nasceu depois da
 * última cópia. Contar isso vale mais do que contar dias — dizer "12 contatos
 * novos" move o dedo, e "faz 9 dias" não move.
 */
function perdaDesdeACopia() {
  const marco = estado.copiaEm ? new Date(estado.copiaEm).getTime() : 0;
  let contatos = 0, eventos = 0;
  for (const c of Object.values(estado.contatos)) {
    if (new Date(c.criadoEm).getTime() > marco) contatos++;
    eventos += (c.eventos || []).filter((e) => new Date(e.em).getTime() > marco).length;
  }
  return { contatos, eventos };
}

/**
 * Cobrar todo dia vira paisagem, e paisagem ninguém aperta. A cobrança só
 * aparece quando há mesmo o que perder: nunca copiou e já juntou gente, ou a
 * cópia completou uma semana E aconteceu coisa nova desde então. Quem copiou e
 * passou a semana sem trabalhar não é incomodado — a cópia dele está em dia.
 */
function precisaCobrarCopia() {
  const perda = perdaDesdeACopia();
  if (!perda.contatos && !perda.eventos) return false;
  if (!estado.copiaEm) return Object.keys(estado.contatos).length >= 3;
  return diasEntre(dia(estado.copiaEm), hoje()) >= DIAS_ATE_COBRAR_COPIA;
}

/** Em quantos contatos e quantos registros a perda se traduz, por extenso. */
function perdaPorExtenso() {
  const { contatos, eventos } = perdaDesdeACopia();
  const partes = [];
  if (contatos) partes.push(contatos === 1 ? "1 contato novo" : contatos + " contatos novos");
  if (eventos) partes.push(eventos === 1 ? "1 registro" : eventos + " registros");
  return partes.join(" e ");
}

function pintarCobrancaDaCopia() {
  const quantos = Object.keys(estado.contatos).length;
  if (!estado.copiaEm) {
    $("#copia-atrasada-titulo").textContent = "Você nunca tirou uma cópia";
    $("#copia-atrasada-detalhe").textContent =
      `Seus ${quantos} ${quantos === 1 ? "contato existe" : "contatos existem"} só neste ` +
      "celular. Trocar de aparelho, ou o navegador fazer limpeza, apaga tudo.";
    return;
  }
  $("#copia-atrasada-titulo").textContent = "Sua cópia é de " + dataCurta(estado.copiaEm);
  $("#copia-atrasada-detalhe").textContent =
    `Depois dela entraram ${perdaPorExtenso()}. É isso que se perde se este ` +
    "celular sumir hoje — o resto está na cópia.";
}

/**
 * Baixar arquivo no celular esconde a cópia numa pasta que ninguém revisita.
 * Com a folha de compartilhar, ela vai direto para o Drive, o e-mail ou uma
 * conversa — que é onde a cópia realmente sobrevive à troca de aparelho.
 */
async function enviarCopia() {
  const foi = await mandarArquivo(nomeDaCopia(), conteudoDaCopia(),
    "application/json", "Cópia do Tino");
  if (!foi) return;
  marcarCopiaFeita();
  avisar("Cópia enviada.");
}

function baixarCopia() {
  baixarArquivo(nomeDaCopia(), conteudoDaCopia(), "application/json");
  marcarCopiaFeita();
}

function pintarEstadoCopia() {
  const el = $("#estado-copia");
  const quantos = Object.keys(estado.contatos).length;

  if (!quantos) {
    el.className = "veredito";
    el.innerHTML = `<p class="detalhe">Ainda não há nada para copiar.</p>`;
    return;
  }
  if (!estado.copiaEm) {
    el.className = "veredito cuidado";
    el.innerHTML = `<p class="titulo">Nunca copiado</p>
      <p class="detalhe">${quantos} ${quantos === 1 ? "contato existe" : "contatos existem"}
      só neste aparelho.</p>`;
    return;
  }
  const velha = precisaCobrarCopia();
  const perdido = perdaPorExtenso();
  el.className = "veredito " + (velha ? "cuidado" : "ok");
  el.innerHTML = `<p class="titulo">${velha ? "Cópia atrasada" : "Cópia em dia"}</p>
    <p class="detalhe">Última em ${escapar(dataCurta(estado.copiaEm))}, ${escapar(haQuanto(estado.copiaEm))}
    · ${quantos} ${quantos === 1 ? "contato" : "contatos"}.${
      perdido ? " Fora da cópia: " + escapar(perdido) + "." : " Nada mudou desde então."}</p>`;
}

// ------------------------------------------------------------- modelos

/** Taxa de resposta de um modelo: respondeu logo depois de ter sido usado. */
function desempenho(modeloId) {
  let usos = 0, respostas = 0;
  for (const c of Object.values(estado.contatos)) {
    c.eventos.forEach((e, i) => {
      if (e.tipo !== "ENVIADO" || e.modeloId !== modeloId) return;
      usos++;
      // vale como resposta se veio antes do próximo envio
      for (let j = i + 1; j < c.eventos.length; j++) {
        if (c.eventos[j].tipo === "ENVIADO") break;
        if (c.eventos[j].tipo === "RESPONDEU") { respostas++; break; }
      }
    });
  }
  return { usos, respostas, taxa: usos ? Math.round((respostas / usos) * 100) : null };
}

function pintarModelos() {
  const sel = $("#modelo");
  const escolhido = sel.value;
  sel.innerHTML = estado.modelos
    .map((m) => `<option value="${escapar(m.id)}">${escapar(m.titulo)}</option>`).join("");
  if (escolhido && estado.modelos.some((m) => m.id === escolhido)) sel.value = escolhido;

  $("#modelos-lista").innerHTML = estado.modelos.map((m) => {
    const d = desempenho(m.id);
    const marca = d.taxa === null
      ? "ainda sem uso"
      : `${d.taxa}% de resposta · ${d.usos} ${d.usos === 1 ? "envio" : "envios"}`;
    return `<button class="item" data-modelo="${escapar(m.id)}">
      <span class="cresce">
        <span class="nome">${escapar(m.titulo)}</span>
        <span class="sub">${escapar(marca)}</span>
      </span>
      <span class="seta">›</span>
    </button>`;
  }).join("");
}

/**
 * O editor de modelo. Antes eram dois prompt() do navegador, que mostram o
 * texto numa caixa de uma linha — dá para digitar, não dá para ler. Modelo que
 * não se lê inteiro não se corrige, e corrigir é o que se faz com modelo.
 */
function editarModelo(id) {
  const m = estado.modelos.find((x) => x.id === id);
  if (!m) return;

  modeloEmEdicao = id;
  $("#modelo-titulo").value = m.titulo;
  $("#modelo-texto").value = m.texto;
  $("#editor-modelo").classList.remove("oculto");
  $("#novo-modelo").classList.add("oculto");
  // Apagar só faz sentido quando sobra outro: sem modelo nenhum não há mensagem.
  $("#apagar-modelo").classList.toggle("oculto", estado.modelos.length <= 1);

  pintarExemploDoModelo();
  esticar($("#modelo-texto"), 120);
  $("#editor-modelo").scrollIntoView({ block: "center" });
}

/** Como a mensagem fica depois de trocados os marcadores. */
function pintarExemploDoModelo() {
  $("#modelo-exemplo").textContent = renderizar($("#modelo-texto").value, "Maria");
}

function fecharEditorDeModelo() {
  modeloEmEdicao = null;
  $("#editor-modelo").classList.add("oculto");
  $("#novo-modelo").classList.remove("oculto");
}

function salvarModeloEditado() {
  const m = estado.modelos.find((x) => x.id === modeloEmEdicao);
  if (!m) return fecharEditorDeModelo();

  const texto = $("#modelo-texto").value.trim();
  if (!texto) return avisar("A mensagem não pode ficar vazia.");

  m.titulo = $("#modelo-titulo").value.trim() || m.titulo;
  m.texto = texto;
  guardar();
  fecharEditorDeModelo();
  pintarModelos();
  pintarDiscagem();
  avisar("Modelo salvo.");
}

function apagarModeloEditado() {
  const m = estado.modelos.find((x) => x.id === modeloEmEdicao);
  if (!m) return;
  if (estado.modelos.length <= 1) return avisar("Precisa sobrar pelo menos um modelo.");
  if (!confirm("Apagar o modelo \"" + m.titulo + "\"?")) return;

  estado.modelos = estado.modelos.filter((x) => x.id !== modeloEmEdicao);
  guardar();
  fecharEditorDeModelo();
  pintarModelos();
  pintarDiscagem();
  avisar("Modelo apagado.");
}

// ------------------------------------------------------------- navegação

function irPara(tela) {
  $$(".tela").forEach((s) => s.classList.toggle("ativa", s.id === "tela-" + tela));
  $$(".aba").forEach((b) => b.classList.toggle("ativa", b.dataset.tela === tela));
  window.scrollTo(0, 0);
  if (tela === "fila") pintarFila();
  if (tela !== "ajustes" && modeloEmEdicao) fecharEditorDeModelo();
  if (tela !== "contatos" && selecionando) sairDaSelecao();
  if (tela === "contatos") pintarContatos();
  if (tela === "ajustes") {
    pintarModelos(); pintarEstadoCopia(); pintarConta(); pintarDiagnostico();
    if (nuvemConfigurada()) {
      $("#nuvem-url").value = nuvem.url;
      $("#nuvem-chave").value = nuvem.publica;
    }
  }
}

// --------------------------------------------------------------- ligações

function ligar() {
  // -- discagem
  $("#numero").addEventListener("input", pintarDiscagem);
  $("#nome").addEventListener("input", () => { atualizarPrevia(); });
  $("#modelo").addEventListener("change", () => {
    previaEditada = false;
    atualizarPrevia();
  });

  $("#previa").addEventListener("input", () => {
    previaEditada = true;
    $("#voltar-modelo").classList.remove("oculto");
    esticarPrevia();
  });

  $("#voltar-modelo").addEventListener("click", () => {
    previaEditada = false;
    atualizarPrevia();
    avisar("Texto do modelo de volta.");
  });
  $("#abrir").addEventListener("click", abrirConversa);
  $("#so-guardar").addEventListener("click", guardarSemMandar);
  $("#beneficio-numero").addEventListener("blur", () => {
    $("#beneficio-numero").value = beneficioBonito($("#beneficio-numero").value);
  });
  $("#cpf").addEventListener("blur", () => {
    const el = $("#cpf");
    if (soDigitos(el.value).length !== 11) return;
    if (!cpfValido(el.value)) return avisar("Esse CPF não confere. Confira os dígitos.");
    el.value = cpfBonito(el.value);
  });
  $("#ver-ficha").addEventListener("click", () => chaveAtual && abrirFicha(chaveAtual));

  $$("#desfecho .resultado").forEach((b) =>
    b.addEventListener("click", () => marcarResultado(b.dataset.r)));

  $("#marcar-retorno").addEventListener("click", () => {
    const quando = $("#voltar-em").value;
    if (!quando) return avisar("Escolha a data no calendário.");
    const bruto = $("#numero").value;
    if (!valido(bruto)) return avisar("Número incompleto.");

    // Dá para agendar alguém que ainda não foi chamado — às vezes o combinado
    // é só "me procura depois do dia 10", sem mensagem nenhuma antes.
    let c = achar(bruto);
    if (!c) c = criar(bruto, $("#nome").value);
    else if ($("#nome").value.trim()) c.nome = $("#nome").value.trim();

    agendarRetorno(c, quando);
    guardar();
    pintarDiscagem();
    pintarFila();
    avisar("Retorno marcado para " + dataCurta(quando) + ".");
  });

  $("#tirar-retorno").addEventListener("click", () => {
    const c = chaveAtual && estado.contatos[chaveAtual];
    if (!c) return;
    desmarcarRetorno(c);
    guardar();
    pintarDiscagem();
    pintarFila();
    avisar("Retorno desmarcado.");
  });

  // -- abas
  $$(".aba").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.tela)));

  // -- fila e contatos (delegação: as listas são redesenhadas o tempo todo)
  $("#fila-lista").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-fila]");
    if (b) abrirFicha(b.dataset.fila);
  });
  $("#contatos-lista").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-contato]");
    if (!b) return;
    if (selecionando) alternarSelecao(b.dataset.contato);
    else abrirFicha(b.dataset.contato);
  });

  $("#escolher-contatos").addEventListener("click", entrarNaSelecao);
  $("#cancelar-selecao").addEventListener("click", sairDaSelecao);
  $("#marcar-visiveis").addEventListener("click", marcarVisiveis);
  $("#enviar-escolhidos").addEventListener("click", enviarEscolhidos);
  $("#modelos-lista").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-modelo]");
    if (b) editarModelo(b.dataset.modelo);
  });

  $("#busca").addEventListener("input", pintarContatos);
  $("#filtros").addEventListener("click", (ev) => {
    const b = ev.target.closest(".chip");
    if (!b) return;
    filtroAtual = b.dataset.f;
    $$("#filtros .chip").forEach((x) => x.classList.toggle("ativo", x === b));
    pintarContatos();
  });

  // -- ficha
  $("#fechar-ficha").addEventListener("click", fecharFicha);
  $("#ficha-falar").addEventListener("click", () => chaveFicha && falarCom(chaveFicha));

  $$("#ficha .resultado").forEach((b) =>
    b.addEventListener("click", () => {
      const c = estado.contatos[chaveFicha];
      if (!c) return;
      aplicarResultado(c, b.dataset.fr);
      guardar();
      abrirFicha(chaveFicha);
      avisar(recadoDe(b.dataset.fr));
    }));

  $("#ficha-editar-nome").addEventListener("change", () => {
    const c = estado.contatos[chaveFicha];
    if (!c) return;
    c.nome = $("#ficha-editar-nome").value.trim();
    guardar();
    $("#ficha-nome").textContent = c.nome || "Sem nome";
  });

  $("#ficha-cpf").addEventListener("change", () => {
    const c = estado.contatos[chaveFicha];
    if (!c) return;
    const desfecho = anotarCpf(c, $("#ficha-cpf").value);
    const recado = recadoDoCpf(desfecho);
    if (recado) return avisar(recado);
    if (desfecho === "igual") return;
    guardar();
    abrirFicha(chaveFicha);
    avisar(desfecho === "apagado" ? "CPF apagado." : "CPF anotado.");
  });

  const salvarBeneficioDaFicha = () => {
    const c = estado.contatos[chaveFicha];
    if (!c) return;
    if (!anotarBeneficio(c, $("#ficha-beneficio-numero").value, $("#ficha-beneficio-tipo").value)) return;
    guardar();
    abrirFicha(chaveFicha);
    avisar("Benefício anotado.");
  };
  $("#ficha-beneficio-numero").addEventListener("change", salvarBeneficioDaFicha);
  $("#ficha-beneficio-tipo").addEventListener("change", salvarBeneficioDaFicha);

  $("#exportar-conversa").addEventListener("click", exportarConversa);

  $("#ficha-marcar-retorno").addEventListener("click", () => {
    const c = estado.contatos[chaveFicha];
    const quando = $("#ficha-voltar-em").value;
    if (!c) return;
    if (!quando) return avisar("Escolha a data no calendário.");
    agendarRetorno(c, quando);
    guardar();
    abrirFicha(chaveFicha);
    pintarFila();
    avisar("Retorno marcado para " + dataCurta(quando) + ".");
  });

  $("#ficha-tirar-retorno").addEventListener("click", () => {
    const c = estado.contatos[chaveFicha];
    if (!c) return;
    desmarcarRetorno(c);
    guardar();
    abrirFicha(chaveFicha);
    pintarFila();
    avisar("Retorno desmarcado.");
  });

  $("#salvar-nota").addEventListener("click", () => {
    const c = estado.contatos[chaveFicha];
    const t = $("#ficha-nota").value.trim();
    if (!c || !t) return avisar("Escreva alguma coisa primeiro.");
    registrar(c, "NOTA", { texto: t });
    guardar();
    abrirFicha(chaveFicha);
    avisar("Anotado.");
  });

  $("#salvar-conversa").addEventListener("click", () => {
    const c = estado.contatos[chaveFicha];
    const t = $("#ficha-conversa").value.trim();
    if (!c || !t) return avisar("Cole a conversa primeiro.");
    registrar(c, "CONVERSA", { texto: t });
    if (guardar()) { abrirFicha(chaveFicha); avisar("Conversa guardada."); }
  });

  $("#ficha-arquivo").addEventListener("change", (ev) => {
    const arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    const c = estado.contatos[chaveFicha];
    if (!c) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      const { texto, mensagens } = lerExportacao(String(leitor.result || ""));
      if (!texto) return avisar("O arquivo veio vazio.");

      const LIMITE = 200000;   // o aparelho guarda uns 5 MB no total
      const cortado = texto.length > LIMITE;
      registrar(c, "IMPORTADO", {
        texto: cortado ? texto.slice(-LIMITE) : texto,
      });
      if (guardar()) {
        abrirFicha(chaveFicha);
        avisar(cortado
          ? `Importado: ${mensagens} mensagens (guardei as mais recentes).`
          : `Importado: ${mensagens} mensagens.`);
      }
    };
    leitor.readAsText(arquivo);
    ev.target.value = "";
  });

  $("#ficha-apagar").addEventListener("click", () => {
    const c = estado.contatos[chaveFicha];
    if (!c) return;
    if (!confirm(`Apagar ${c.nome || bonito(c.numero)} e todo o histórico?\n\nNão tem como voltar atrás.`)) return;
    delete estado.contatos[chaveFicha];
    guardar();
    fecharFicha();
    avisar("Contato apagado.");
  });

  // -- ajustes
  const salvarEu = () => {
    estado.eu.nome = $("#eu-nome").value.trim();
    estado.eu.instituicao = $("#eu-instituicao").value.trim();
    ajustesMexidos();
    guardar();
    atualizarPrevia();
  };
  $("#eu-nome").addEventListener("change", salvarEu);
  $("#eu-instituicao").addEventListener("change", salvarEu);

  const salvarRegua = () => {
    estado.regua.um = Math.max(1, Number($("#regua-1").value) || 15);
    estado.regua.dois = Math.max(1, Number($("#regua-2").value) || 45);
    estado.regua.respondeu = Math.max(1, Number($("#regua-r").value) || 7);
    ajustesMexidos();
    guardar();
    pintarFila();
    avisar("Régua atualizada.");
  };
  ["#regua-1", "#regua-2", "#regua-r"].forEach((s) =>
    $(s).addEventListener("change", salvarRegua));

  $("#modelo-texto").addEventListener("input", () => {
    pintarExemploDoModelo();
    esticar($("#modelo-texto"), 120);
  });
  $("#salvar-modelo").addEventListener("click", salvarModeloEditado);
  $("#apagar-modelo").addEventListener("click", apagarModeloEditado);
  $("#fechar-editor").addEventListener("click", fecharEditorDeModelo);

  $("#novo-modelo").addEventListener("click", () => {
    const id = "m" + Date.now().toString(36);
    estado.modelos.push({ id, titulo: "Novo modelo", texto: "{saudacao}, {nome}. Aqui é o {eu}." });
    guardar();
    pintarModelos();
    editarModelo(id);
  });

  // -- conta e sincronização
  $("#salvar-nuvem").addEventListener("click", () => {
    const url = $("#nuvem-url").value.trim();
    const chave = $("#nuvem-chave").value.trim();
    // https na vida real; http só em localhost, que é onde se testa
    const bom = /^https:\/\/.+/.test(url) || /^http:\/\/localhost(:\d+)?/.test(url);
    if (!bom) return avisar("O endereço tem de começar com https://");
    if (chave.length < 20) return avisar("Essa chave parece incompleta.");
    configurarNuvem(url, chave);
    pintarConta();
    avisar("Servidor guardado. Agora crie a conta ou entre.");
  });

  $("#trocar-servidor").addEventListener("click", () => {
    configurarNuvem("", "");
    pintarConta();
  });

  const comCredenciais = async (acao, oQueFaz) => {
    const email = $("#conta-email").value.trim();
    const senha = $("#conta-senha").value;
    if (!email || !senha) return avisar("Preencha e-mail e senha.");
    avisar(oQueFaz + "…");
    try {
      await acao(email, senha);
    } catch (e) {
      return avisar(e.semRede ? "Sem internet agora." : e.message);
    }
    $("#conta-senha").value = "";
    pintarConta();
    if (nuvemConectada()) await sincronizar(false);
  };

  $("#entrar-conta").addEventListener("click", () =>
    comCredenciais(entrarNaConta, "Entrando"));

  $("#criar-conta").addEventListener("click", () =>
    comCredenciais(async (email, senha) => {
      const r = await criarConta(email, senha);
      if (!r.entrou) avisar("Conta criada. Confirme o e-mail e depois toque em Entrar.");
    }, "Criando conta"));

  $("#sincronizar-agora").addEventListener("click", () => sincronizar(false));

  $("#sair-conta").addEventListener("click", () => {
    if (!confirm("Sair da conta neste aparelho?\n\nOs contatos continuam aqui e no servidor.")) return;
    sairDaConta();
    pintarConta();
    avisar("Você saiu da conta.");
  });

  $("#copia-com-data").addEventListener("change", () => {
    estado.copiaComData = $("#copia-com-data").checked;
    ajustesMexidos();
    guardar();
    avisar(estado.copiaComData
      ? "Cada cópia vai levar a data no nome."
      : "A cópia vai substituir a anterior.");
  });

  $("#enviar-copia").addEventListener("click", enviarCopia);
  $("#copia-atrasada-botao").addEventListener("click", enviarCopia);
  $("#exportar").addEventListener("click", () => {
    baixarCopia();
    avisar("Arquivo baixado. Guarde num lugar seguro.");
  });

  // -- agenda do celular
  $("#da-agenda").classList.toggle("oculto", !TEM_AGENDA);
  $("#trazer-agenda").classList.toggle("oculto", !TEM_AGENDA);
  if (TEM_AGENDA) {
    $("#da-agenda").addEventListener("click", escolherDaAgenda);
    $("#trazer-agenda").addEventListener("click", trazerVariosDaAgenda);
  }

  $("#importar").addEventListener("change", (ev) => {
    const arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const cru = JSON.parse(String(leitor.result));
        const lido = estruturar(cru);
        const quantos = Object.keys(lido.contatos).length;
        const aqui = Object.keys(estado.contatos).length;

        if (!aqui) {
          // Aparelho vazio: não há o que perder, e juntar com nada é o mesmo
          // que restaurar. Perguntar aqui só atrapalharia quem trocou de celular.
          if (!confirm(`Trazer ${quantos} contatos desta cópia?`)) return;
          estado = lido;
        } else if (cru.parcial) {
          // Arquivo com só alguns contatos nunca substitui: se substituísse,
          // mandar cinco contatos apagaria os outros oitocentos.
          if (!confirm(`Esta cópia tem só ${quantos} ${quantos === 1 ? "contato" : "contatos"}.\n\n` +
            `Vou JUNTAR com os ${aqui} que já estão aqui. Nada se perde.`)) return;
          estado = estruturar(mesclarEstados(estado, lido));
        } else if (confirm(`Esta cópia tem ${quantos} contatos. Neste aparelho há ${aqui}.\n\n` +
          `OK para JUNTAR os dois — nada se perde.\n` +
          `Cancelar para ver a outra opção.`)) {
          estado = estruturar(mesclarEstados(estado, lido));
        } else if (confirm(`Então SUBSTITUIR tudo por esta cópia?\n\n` +
          `Os ${aqui} contatos deste aparelho serão apagados, e não voltam.`)) {
          estado = lido;
        } else {
          return;
        }
        guardar();
        iniciarCampos();
        pintarTudo();
        avisar("Pronto: " + Object.keys(estado.contatos).length + " contatos aqui.");
      } catch (e) {
        avisar("Esse arquivo não é uma cópia do Tino.");
      }
    };
    leitor.readAsText(arquivo);
    ev.target.value = "";
  });

  $("#apagar").addEventListener("click", () => {
    if (!confirm("Apagar TODOS os contatos, histórico e ajustes?\n\nNão tem como voltar atrás.")) return;
    if (!confirm("Tem certeza mesmo? Exporte uma cópia antes se tiver dúvida.")) return;
    localStorage.removeItem(CHAVE);
    estado = estruturar(PADRAO);
    iniciarCampos();
    pintarTudo();
    avisar("Tudo apagado.");
  });
}

// ----------------------------------------------------------------- início

function iniciarCampos() {
  $("#eu-nome").value = estado.eu.nome;
  $("#eu-instituicao").value = estado.eu.instituicao;
  $("#regua-1").value = estado.regua.um;
  $("#regua-2").value = estado.regua.dois;
  $("#regua-r").value = estado.regua.respondeu;
  $("#voltar-em").min = new Date().toISOString().slice(0, 10);
  $("#copia-com-data").checked = !!estado.copiaComData;
  encherTipos("#beneficio-tipo");
  encherTipos("#ficha-beneficio-tipo");
}

function pintarTudo() {
  pintarModelos();
  pintarDiscagem();
  pintarFila();
  pintarContatos();
  pintarEstadoCopia();
  pintarConta();
  if (chaveFicha && estado.contatos[chaveFicha]) abrirFicha(chaveFicha);
}

async function comecar() {
  // Contar aberturas é o que revela navegador que apaga tudo ao fechar: se
  // este número nunca passa de 1, não há conserto possível dentro do app.
  estado.aberturas = (estado.aberturas || 0) + 1;
  if (!estado.desde) estado.desde = new Date().toISOString();
  guardar();

  $("#marca-dia").textContent = new Date().toLocaleDateString("pt-BR",
    { weekday: "short", day: "2-digit", month: "short" });
  iniciarCampos();
  ligar();
  pintarTudo();

  if (!estado.eu.nome) {
    avisar("Comece pelos Ajustes: ponha seu nome na mensagem.");
  } else if (precisaCobrarCopia() && $("#copia-atrasada").classList.contains("oculto")) {
    // O cartão da primeira tela é a cobrança de verdade. Este aviso só cobre o
    // caso em que ele cedeu o lugar para algo mais urgente, como instalar.
    avisar("Sua cópia está atrasada. Ajustes → enviar cópia.");
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // Entrar já traz de volta o que o aparelho tiver perdido — é o motivo de
  // existir a conta, então acontece na abertura e não sob pedido.
  if (nuvemConectada()) sincronizar(true);

  const fixado = await fixarArmazenamento();
  $("#estado-guarda").textContent =
    fixado === true
      ? "Este aparelho promete não apagar os dados sozinho."
      : fixado === false
        ? "O aparelho pode apagar estes dados se ficar sem espaço. Instalar o app na tela inicial reduz o risco — e a cópia resolve de vez."
        : "";
}

comecar().catch((e) => console.error("não deu para começar", e));
