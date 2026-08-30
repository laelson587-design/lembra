/* Testa o modelo de dados do Tino: quem é quem depois de mexer nos números.
 *
 * Não testa tela. Testa a parte onde o defeito é silencioso — se o app
 * confunde duas pessoas, a mensagem sai para quem pediu para parar e ninguém
 * vê nada errado acontecendo. Dois defeitos assim já saíram daqui.
 *
 * Roda com 
1. dois números na mesma ficha
  ok   nasce com um número
  ok   guardou o fixo
  ok   agora são dois
  ok   acha pelo principal
  ok   acha pelo fixo
  ok   acha pelo celular sem o nono
  ok   não acha um estranho
  ok   a chave do fixo aponta para a ficha
  ok   repetido não entra duas vezes
  ok   número quebrado é recusado

2. para qual número a conversa abre
  ok   digitou o fixo, fala no fixo
  ok   digitou o celular, fala no celular
  ok   digitou sem o nono, fala na forma guardada

3. trocar o principal sem mudar a chave
  ok   trocou
  ok   o principal é o fixo
  ok   o celular continua na ficha
  ok   a chave NÃO mudou
  ok   continua achando pelos dois
  ok   o principal não pode ser removido
  ok   o outro pode
  ok   sobrou um
  ok   quem saiu não acha mais

4. número que já é de outra pessoa
  ok   recusa e diz de quem é
  ok   aponta a ficha certa
  ok   não guardou em dobro

5. juntar as duas fichas
  ok   sobrou uma ficha só
  ok   ficou na chave de quem estava aberto
  ok   os dois números estão nela
  ok   o principal é o de quem juntou
  ok   nenhum evento se perdeu
  ok   a situação foi refeita pelos eventos
  ok   acha pelos dois números depois de juntar

6. sincronia entre dois aparelhos
  ok   junta os três números
  ok   nenhum número se perdeu
  ok   dá no mesmo na ordem trocada
  ok   o principal é o de quem mexeu por último

7. contato guardado antes desta versão
  ok   lê sem quebrar
  ok   continua sendo achado
  ok   aceita um segundo número
  ok   agora tem dois
  ok   mescla com um lado sem o campo

8. a agenda do celular não perde telefone
  ok   pegou o nome
  ok   o primeiro é o principal
  ok   o segundo veio junto
  ok   o lixo não entrou
  ok   cadastrou com os dois
  ok   acha pelo fixo dela

9. o número com que a ficha nasceu, depois de removido
  ok   o removido não acha mais
  ok   o que ficou continua achando
  ok   a chave velha continua sendo a casa dele
  ok   Pedro não foi escrito por cima
  ok   os dois existem
  ok   cada número acha o seu dono
  ok   Pedro manteve o nome

10. não oferecer juntar com quem não tem o número
  ok   aceita, porque o número não é de ninguém
  ok   não juntou Clara com o Zé
  ok   o número é da Clara agora
  ok   esse sim é de outra pessoa
  ok   aponta a Clara

tudo passou, sem instalar nada: carrega o nuvem.js e o
 * app.js num contexto de mentira, com um localStorage de brinquedo no lugar do
 * navegador, e chama as funções direto.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path").join(__dirname, "..") + "/";

const guardado = {};
const ctx = {
  console,
  localStorage: {
    getItem: (k) => (k in guardado ? guardado[k] : null),
    setItem: (k, v) => { guardado[k] = String(v); },
    removeItem: (k) => { delete guardado[k]; },
  },
  navigator: { userAgent: "node", contacts: undefined },
  window: {},
  document: { querySelector: () => null, addEventListener: () => {} },
  setTimeout: () => 0,
  clearTimeout: () => {},
  fetch: () => Promise.reject(new Error("sem rede")),
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);

const nuvem = fs.readFileSync(path + "nuvem.js", "utf8");
let app = fs.readFileSync(path + "app.js", "utf8");
// A última linha liga o app na tela; aqui só interessa o miolo.
app = app.replace(/comecar\(\)\.catch\([\s\S]*$/, "");
app += "\nglobalThis.__est = () => estado; globalThis.__por = (e) => { estado = e; };\n";

vm.runInContext(nuvem, ctx);
vm.runInContext(app, ctx);

const {
  chaveDe, achar, criar, adicionarNumero, removerNumero, tornarPrincipal,
  numerosDe, numeroParaFalar, chaveDoNumero, juntarContatos, mesclarContato,
  mesclarNumeros, bonito, limparDaAgenda, __est, __por,
} = ctx;

let falhas = 0;
function ok(nome, cond, extra) {
  if (cond) { console.log("  ok   " + nome); return; }
  falhas++;
  console.log("  FALHA " + nome + (extra ? "  → " + JSON.stringify(extra) : ""));
}
function limpar() {
  __est().contatos = {};
}

// ------------------------------------------------------------------ 1
console.log("\n1. dois números na mesma ficha");
limpar();
const jose = criar("11987654321", "Sr. José");
ok("nasce com um número", numerosDe(jose).length === 1);

let r = adicionarNumero(jose, "1133334444");
ok("guardou o fixo", r.desfecho === "guardado", r);
ok("agora são dois", numerosDe(jose).length === 2, numerosDe(jose));

ok("acha pelo principal", achar("11987654321") === jose);
ok("acha pelo fixo", achar("11 3333-4444") === jose);
ok("acha pelo celular sem o nono", achar("1187654321") === jose);
ok("não acha um estranho", achar("21999998888") === null);

const k = Object.keys(__est().contatos)[0];
ok("a chave do fixo aponta para a ficha", chaveDoNumero("1133334444") === k,
  { achou: chaveDoNumero("1133334444"), esperado: k });

ok("repetido não entra duas vezes",
  adicionarNumero(jose, "11 3333-4444").desfecho === "repetido");
ok("número quebrado é recusado",
  adicionarNumero(jose, "119").desfecho === "invalido");

// ------------------------------------------------------------------ 2
console.log("\n2. para qual número a conversa abre");
ok("digitou o fixo, fala no fixo",
  numeroParaFalar(jose, "11 3333-4444") === "1133334444");
ok("digitou o celular, fala no celular",
  numeroParaFalar(jose, "11987654321") === "11987654321");
ok("digitou sem o nono, fala na forma guardada",
  numeroParaFalar(jose, "1187654321") === "11987654321");

// ------------------------------------------------------------------ 3
console.log("\n3. trocar o principal sem mudar a chave");
const antes = Object.keys(__est().contatos)[0];
ok("trocou", tornarPrincipal(jose, "1133334444") === true);
ok("o principal é o fixo", jose.numero === "1133334444");
ok("o celular continua na ficha", numerosDe(jose).includes("11987654321"));
ok("a chave NÃO mudou", Object.keys(__est().contatos)[0] === antes);
ok("continua achando pelos dois",
  achar("11987654321") === jose && achar("1133334444") === jose);

ok("o principal não pode ser removido", removerNumero(jose, "1133334444") === false);
ok("o outro pode", removerNumero(jose, "11987654321") === true);
ok("sobrou um", numerosDe(jose).length === 1, numerosDe(jose));
ok("quem saiu não acha mais", achar("11987654321") === null);

// ------------------------------------------------------------------ 4
console.log("\n4. número que já é de outra pessoa");
limpar();
const a = criar("11911112222", "Maria");
const b = criar("11933334444", "Maria (fixo?)");
r = adicionarNumero(a, "11933334444");
ok("recusa e diz de quem é", r.desfecho === "de-outro", r);
ok("aponta a ficha certa", __est().contatos[r.chave] === b);
ok("não guardou em dobro", numerosDe(a).length === 1);

// ------------------------------------------------------------------ 5
console.log("\n5. juntar as duas fichas");
a.eventos.push({ em: "2026-01-01T10:00:00.000Z", tipo: "ENVIADO", texto: "oi" });
b.eventos.push({ em: "2026-02-01T10:00:00.000Z", tipo: "RESPONDEU" });
const kA = chaveDe("11911112222"), kB = chaveDe("11933334444");
const juntos = juntarContatos(kA, kB);
ok("sobrou uma ficha só", Object.keys(__est().contatos).length === 1);
ok("ficou na chave de quem estava aberto", !!__est().contatos[kA]);
ok("os dois números estão nela", numerosDe(juntos).length === 2, numerosDe(juntos));
ok("o principal é o de quem juntou", juntos.numero === "11911112222");
ok("nenhum evento se perdeu",
  juntos.eventos.filter((e) => e.tipo === "ENVIADO").length === 1 &&
  juntos.eventos.filter((e) => e.tipo === "RESPONDEU").length === 1);
ok("a situação foi refeita pelos eventos", juntos.status === "ABERTO");
ok("acha pelos dois números depois de juntar",
  achar("11911112222") === juntos && achar("11933334444") === juntos);

// ------------------------------------------------------------------ 6
console.log("\n6. sincronia entre dois aparelhos");
const celular = {
  numero: "11911112222", outros: ["1133334444"],
  numerosEm: "2026-03-01T10:00:00.000Z",
  nome: "Maria", criadoEm: "2026-01-01T00:00:00.000Z",
  status: "ABERTO", voltarEm: null, cpf: null, cpfEm: null,
  beneficio: null, beneficioEm: null, eventos: [],
};
const tablet = {
  numero: "11911112222", outros: ["11955556666"],
  numerosEm: "2026-02-01T10:00:00.000Z",
  nome: "Maria", criadoEm: "2026-01-01T00:00:00.000Z",
  status: "ABERTO", voltarEm: null, cpf: null, cpfEm: null,
  beneficio: null, beneficioEm: null, eventos: [],
};
let m = mesclarContato(celular, tablet);
ok("junta os três números", numerosDe(m).length === 3, numerosDe(m));
ok("nenhum número se perdeu",
  ["11911112222", "1133334444", "11955556666"].every(
    (n) => numerosDe(m).some((x) => chaveDe(x) === chaveDe(n))), numerosDe(m));

m = mesclarContato(tablet, celular);
ok("dá no mesmo na ordem trocada", numerosDe(m).length === 3, numerosDe(m));

// quem trocou o principal por último ganha
const trocou = { ...celular, numero: "1133334444", outros: ["11911112222"],
  numerosEm: "2026-05-01T10:00:00.000Z" };
m = mesclarContato(tablet, trocou);
ok("o principal é o de quem mexeu por último", m.numero === "1133334444", m.numero);

// ------------------------------------------------------------------ 7
console.log("\n7. contato guardado antes desta versão");
const velho = {
  numero: "21988887777", nome: "Antigo",
  criadoEm: "2025-01-01T00:00:00.000Z", status: "ABERTO",
  voltarEm: null, cpf: null, cpfEm: null,
  beneficio: null, beneficioEm: null, eventos: [],
};   // sem `outros`, sem `numerosEm`
limpar();
__est().contatos[chaveDe(velho.numero)] = velho;
ok("lê sem quebrar", numerosDe(velho).length === 1);
ok("continua sendo achado", achar("21988887777") === velho);
ok("aceita um segundo número", adicionarNumero(velho, "2133332222").desfecho === "guardado");
ok("agora tem dois", numerosDe(velho).length === 2);
const mVelho = mesclarContato(velho, { ...velho, outros: undefined, numerosEm: undefined });
ok("mescla com um lado sem o campo", numerosDe(mVelho).length === 2, numerosDe(mVelho));

// ------------------------------------------------------------------ 8
console.log("\n8. a agenda do celular não perde telefone");
const daAgenda = limparDaAgenda({
  name: ["Dona Ana"],
  tel: ["+55 11 98888-7777", "(11) 3333-2222", "abc"],
});
ok("pegou o nome", daAgenda.nome === "Dona Ana");
ok("o primeiro é o principal", daAgenda.numero === "11988887777", daAgenda.numero);
ok("o segundo veio junto", daAgenda.outros.length === 1, daAgenda.outros);
ok("o lixo não entrou", daAgenda.outros[0] === "1133332222");

limpar();
const ana = criar(daAgenda.numero, daAgenda.nome, daAgenda.outros);
ok("cadastrou com os dois", numerosDe(ana).length === 2, numerosDe(ana));
ok("acha pelo fixo dela", achar("1133332222") === ana);

// ------------------------------------------------------------------ 9
console.log("\n9. o número com que a ficha nasceu, depois de removido");
limpar();
const pedro = criar("11955551111", "Pedro");
adicionarNumero(pedro, "11966662222");
tornarPrincipal(pedro, "11966662222");
removerNumero(pedro, "11955551111");
ok("o removido não acha mais", achar("11955551111") === null);
ok("o que ficou continua achando", achar("11966662222") === pedro);
ok("a chave velha continua sendo a casa dele",
  __est().contatos[chaveDe("11955551111")] === pedro);

// e agora alguém cadastra aquele número, que é de outra pessoa
const novo = criar("11955551111", "Outra pessoa");
ok("Pedro não foi escrito por cima", __est().contatos[chaveDe("11955551111")] === pedro);
ok("os dois existem", Object.keys(__est().contatos).length === 2);
ok("cada número acha o seu dono",
  achar("11955551111") === novo && achar("11966662222") === pedro);
ok("Pedro manteve o nome", pedro.nome === "Pedro");

// ------------------------------------------------------------------ 10
console.log("\n10. não oferecer juntar com quem não tem o número");
limpar();
const ze = criar("11955551111", "Zé");
adicionarNumero(ze, "11966662222");
tornarPrincipal(ze, "11966662222");
removerNumero(ze, "11955551111");   // a chave dele continua sendo a do removido
const clara = criar("11977773333", "Clara");
r = adicionarNumero(clara, "11955551111");
ok("aceita, porque o número não é de ninguém", r.desfecho === "guardado", r);
ok("não juntou Clara com o Zé", ze.nome === "Zé" && numerosDe(ze).length === 1);
ok("o número é da Clara agora", achar("11955551111") === clara);

// e o caso legítimo continua funcionando
r = adicionarNumero(ze, "11977773333");
ok("esse sim é de outra pessoa", r.desfecho === "de-outro", r);
ok("aponta a Clara", __est().contatos[r.chave] === clara);

console.log(falhas ? `\n${falhas} FALHA(S)\n` : "\ntudo passou\n");
process.exit(falhas ? 1 : 0);
