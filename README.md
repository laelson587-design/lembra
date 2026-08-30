# Tino

A memória que o WhatsApp não guarda: quem você já chamou, quantas vezes, quem
nunca respondeu e quem pediu para parar.

Página única, sem servidor, sem cadastro, sem custo. Instala no celular e abre
sem internet. **Os dados ficam no aparelho e não saem dele.**

## Por que existe

Quem trabalha com lista de clientes perde o número de WhatsApp por excesso de
mensagem fria. A causa não é o volume total — é mandar para a mesma pessoa
repetidamente. Ela ignora, bloqueia ou denuncia, e bastam poucas denúncias em
pouco tempo para o número cair.

Piora quando a lista é compartilhada e **reinicia toda semana**: o histórico de
contatos some, todo mundo trabalha os mesmos nomes de novo, e não há como saber
quem já foi abordado. É desenhado para queimar número.

O Tino resolve a única parte que está na mão de quem usa: **a memória**.

## Como funciona

Você já digita o número em algum lugar antes de mandar mensagem. Passe a
digitar aqui: o app abre a conversa no WhatsApp com o texto pronto **e** guarda
com quem você falou.

Mesmas teclas de sempre. A diferença aparece na segunda vez:

> ⚠️ **Sr. José** — já chamado 2 vezes, sem resposta.
> Última em 28/07. Melhor só voltar em 11/09.

Ou, quando é o caso:

> 🚫 **Pediu para não receber mais.** Não mande.

Não existe importação da lista do trabalho, e isso é decisão, não limitação: a
base não é sua, e copiá-la para um aplicativo pessoal é problema de LGPD e de
contrato. Aqui entra só o **seu registro de contato**, construído um número por
vez, conforme você trabalha. Em duas semanas de uso já são centenas.

## De onde os dados podem vir

**Do WhatsApp, não.** Nenhuma página consegue ler as conversas nem os contatos
do aplicativo — ele é fechado, e a única saída oficial é o "Exportar conversa",
que o Tino importa. O que lê o WhatsApp por fora são as bibliotecas que
imitam o WhatsApp Web, e são exatamente elas que derrubam o número.

**Da agenda do celular, sim.** No Chrome do Android existe uma permissão do
próprio sistema: o app pede, aparece a tela do Android, e você escolhe quem
entregar. Não é acesso à agenda — é você passando os contatos um a um. De cada
um vêm **todos os telefones**, e não só o primeiro. Há dois caminhos: um contato
na aba **Discar** e vários de uma vez na aba **Contatos**.
No computador e no iPhone o botão nem aparece, porque a permissão não existe.

**Digitando**, sempre. É o caminho que funciona em qualquer aparelho, e é o
mesmo número que você digitaria no WhatsApp de qualquer jeito.

## O que tem dentro

**Discar** — digita o número e a pessoa se identifica ali mesmo: nome grande,
telefone pequeno embaixo, do mesmo jeito que na ficha e na lista. Abaixo dela o
veredito, o modelo e a conversa.
Depois marca o que aconteceu com um toque. Dá também para **só guardar, sem
mandar mensagem**: o número entra na memória e a régua começa no dia em que
você decidir chamar.

**Hoje** — a fila do dia pela régua de contato: só quem está no prazo. De 800
nomes costumam sobrar poucas dezenas. Mandar menos é o que faz o chip durar.

**Contatos** — busca por nome, qualquer um dos telefones, CPF, número do
benefício ou tipo, com filtros de quem respondeu, quem nunca respondeu e quem
pediu para parar.

**Ficha** — histórico completo, os telefones da pessoa, anotações, a conversa
guardada e os dados do benefício. No alto dela, **Falar com esta pessoa** leva para a discagem já
preenchida: é o caminho de volta da aba Hoje, que sem ele apontava para uma
pessoa sem deixar você falar com ela.

**Ajustes** — seu nome, a régua, os modelos de mensagem com **taxa de resposta
de cada um**, e a cópia de segurança.

## Mais de um número por pessoa

Ter dois telefones é o normal, não a exceção: o de casa e o do trabalho, o do
filho, o que a pessoa passa a usar quando o chip cai. Todos ficam na mesma
ficha, e qualquer um deles abre a mesma memória — digitar o fixo do Sr. José
mostra as duas mensagens que já foram para o celular dele.

Na ficha, em **Números**, dá para acrescentar, escolher qual é o **principal**
e tirar os que não servem mais. O principal é o que aparece na lista e o que
recebe a mensagem quando você não digitou outro; se digitou, a conversa abre
no que está na tela.

**Se o número já for de outra ficha**, o app não guarda em dobro: ele diz de
quem é e oferece **juntar as duas numa só**. O histórico dos dois lados fica
junto e a duplicata some — é a saída para o estrago que já existia antes de o
recurso existir.

## Dados do cliente

Além do nome, cada contato guarda **CPF**, **número do benefício** e **tipo**
(aposentadoria por idade, pensão por morte, BPC/LOAS e o resto da lista). Os
três são opcionais, ficam num bloco dobrado na tela de Discar e podem ser
preenchidos na hora de cadastrar ou depois, na ficha. Todos entram na busca.

### Um é conferido, o outro não — e é de propósito

**O CPF é conferido.** Os dois últimos dígitos são calculados a partir dos nove
primeiros, então dá para saber se está errado sem perguntar a ninguém. CPF
errado é pior que CPF vazio: ele não avisa que está errado, só some da busca no
dia em que a pessoa for procurada. Então o app confere, avisa e **não guarda** —
o resto do cadastro é gravado do mesmo jeito, só o CPF fica de fora.

**O número do benefício é formatado, nunca recusado.** Ele não tem como ser
conferido sozinho, e lista de trabalho vem com número truncado e com número
antigo. Barrar a digitação faria a pessoa desistir de anotar, e número meio
certo ainda acha alguém na busca — número nenhum não acha.

### O que isso muda na cópia

Com CPF e benefício, o arquivo que você manda para o Drive ou para o e-mail
passa a **identificar a pessoa por inteiro**. O mesmo vale para a conversa
exportada, que leva o CPF no cabeçalho. Guarde esses arquivos como você
guardaria a lista impressa.

## A tela antes de digitar

Abrir o app e ver um campo vazio não diz nada. Então, enquanto não há número
digitado, a tela responde a pergunta que o Tino existe para responder:

> **3** pessoas para chamar hoje · 214 contatos ›

A linha é tocável e leva direto para a aba Hoje — é o único atalho da tela, e
ele **economiza** um toque em vez de custar um. Sem contato nenhum guardado ela
não aparece: não há fila para mostrar.

Abaixo dela, o anel da marca bem apagado. É assinatura, não ilustração — no
tema escuro ele ganha um pouco mais de opacidade para não sumir de vez.

O cartão de instalação, que só existe na aba do Safari, encolheu para três
linhas com os passos atrás de um **ver os passos**. Ele é lido uma vez na vida;
ocupar meia tela para sempre por causa de uma leitura única era mau negócio.

## A mensagem antes de sair

O modelo escreve a mensagem, mas quem manda é você — então ela aparece numa
caixa de leitura, com tamanho de texto de verdade, **e pode ser editada**. Uma
frase a mais para aquela pessoa, um "o senhor comentou que...", e é esse texto
que vai para o WhatsApp e é esse que fica guardado no histórico.

A caixa cresce com o texto: mensagem cortada não dá para conferir, e conferir
antes de mandar é o ponto do app inteiro.

Depois de mexer aparece um **voltar ao modelo**, que devolve o texto original.
E o ajuste é daquela mensagem, não do modelo: trocar de modelo ou de pessoa
desfaz sozinho. Digitar o nome depois de ajustar, porém, **não** apaga o que
você escreveu — a partir do momento em que alguém mexe no texto, é a mão de
quem escreveu que manda.

### Editar um modelo

Tocar num modelo nos Ajustes abre o editor ali mesmo: nome, texto inteiro numa
caixa que cresce com o conteúdo, e um **"assim vai ficar"** logo abaixo,
mostrando a mensagem com os marcadores já trocados. Salvar, cancelar e apagar
são botões — e apagar só aparece quando sobra outro modelo.

Antes eram dois `prompt()` do navegador. Dá para digitar num prompt; não dá
para ler. E modelo que não se lê inteiro não se corrige, que é justamente o que
se faz com modelo depois de ver a taxa de resposta dele.

## A régua

| Situação | Quando procurar de novo |
| --- | --- |
| **Retorno marcado** | **na data combinada, e não antes** |
| Nunca contatado | agora |
| Respondeu alguma vez | 7 dias |
| 1 tentativa sem resposta | 15 dias |
| 2 tentativas sem resposta | 45 dias |
| 3 tentativas sem resposta | **nunca mais** |
| Disse que não tem interesse | nunca mais |
| Pediu para parar | nunca mais |

Os prazos se mudam em Ajustes. O corte na terceira tentativa não: quem não
respondeu três vezes não responde na quarta — denuncia.

**O retorno marcado passa na frente de tudo** — e também segura tudo. Você
escolhe a data no calendário, na tela de Discar ou na ficha do contato, e a
pessoa sai da fila até o dia chegar. Nem a régua a traz de volta antes: se ela
pediu para ser procurada no dia 25, chamar no dia 12 é quebrar o combinado, e o
app não manda fazer isso.

**Dois dias antes ela aparece como aviso**, num grupo separado no fim da lista,
apagado e com o título *"chegando — ainda não é para chamar"*. Ele não entra na
contagem do dia nem no número da aba: número na aba é chamado, e chamado é só
para hoje. Quando a data chega, ela sobe para o topo. Marcar retorno também tira alguém de
"sem interesse", porque marcar data é o contrário de descartar. Dá para
agendar quem você ainda nem chamou: às vezes o combinado é só "me procura
depois do dia 10".

## Guardar conversas

Duas formas, ambas dentro da ficha do contato:

1. **Colar.** No WhatsApp, segure uma mensagem, marque as que quiser, toque em
   copiar e cole no campo. Serve para o trecho que importa.
2. **Importar.** No WhatsApp: abra a conversa → toque no nome lá em cima →
   **Exportar conversa** → **Sem mídia** → **Salvar em Arquivos**. Na ficha,
   toque em importar e escolha **Escolher arquivo**. Traz o histórico inteiro.

   Serve tanto o `.txt` solto quanto o `.zip` que sai quando a exportação vai
   com mídia — o Tino abre o zip sozinho, pega só o texto e ignora as fotos.
   O aviso de criptografia que o WhatsApp põe na frente de toda exportação não
   entra: é recado do aplicativo, não fala de gente.

   **Importar de novo meses depois não duplica nada.** A exportação vem sempre
   desde o começo da conversa, então o Tino procura o que já está guardado
   dentro do arquivo e acrescenta só o que veio depois — um registro de
   continuação. Se não houver nada novo, ele diz isso e não guarda. Nada é
   substituído nem apagado: evento aqui só se acrescenta, que é o que permite
   juntar dois aparelhos sem perder histórico.
   O seletor não filtra por extensão de propósito: filtrando, o arquivo que o
   WhatsApp acabou de salvar aparecia cinza, dava para ver e não dava para
   escolher.

Vale fazer isso **antes** de um número cair, com os clientes que importam.
Conversa exportada é o único jeito de o histórico sobreviver ao bloqueio.

E o caminho de volta: **Exportar a conversa deste contato**, no fim da ficha,
sai com um arquivo de texto contendo tudo que está guardado ali — mensagens
enviadas, anotações, retornos marcados, conversa colada e importada. Vai pela
folha de compartilhar (WhatsApp, e-mail, Drive) ou, onde ela não existir, como
download. Texto puro de propósito: abre em qualquer coisa, hoje e daqui a dez
anos.

## Decisões

**Sem envio automático.** O app abre a conversa; quem manda é você. Disparador
não-oficial derruba o número mais rápido do que o envio manual — o robô é
regular demais e isso é o primeiro filtro do outro lado, antes de qualquer
denúncia.

**Sem servidor.** Nada sobe para lugar nenhum. Além de não custar nada, é o
desenho mais defensável: isto é a sua agenda pessoal, não a cópia da base de
uma empresa.

**O nono dígito não separa contato.** `11 98765-4321` e `11 8765-4321` são
guardados como a mesma pessoa. Sem isso, listas antigas fariam o app dizer
"número novo" para quem já foi chamado seis vezes — justo o erro que ele existe
para evitar.

**Um número só nunca foi suficiente.** A pessoa é uma; os telefones dela são
vários, e todos apontam para a mesma ficha. Guardar um por contato criava duas
memórias da mesma pessoa — e a segunda começava do zero, dizendo "pode chamar"
para quem já tinha pedido para parar.

**A mensagem padrão termina oferecendo saída** ("se não tiver interesse é só me
dizer"). Parece perder venda e faz o contrário: quem tem saída responde "não,
obrigado" em vez de denunciar. E denúncia é o que mata o número.

## Rodando

Não tem build nem dependência. Abra o `index.html` num navegador.

Para testar no celular pela rede local, sirva a pasta:

```
npx serve .
```

O service worker e a instalação só funcionam em `https` ou `localhost`.

### Publicar

Repositório no GitHub com **Pages** ligado na branch principal. `git push` e
sai no ar em cerca de um minuto.

O código é público; **os dados não** — eles ficam no `localStorage` do
aparelho de quem usa e nunca chegam ao repositório.

### Ícone

O desenho é o **anel do veredito**: três arcos na mesma ordem em que o app
decide — verde para pode ir, âmbar para cuidado, vermelho para pare — e o ponto
no miolo, que é a pausa antes de mandar.

A fonte da verdade é `icone.svg`, que é texto e versiona como qualquer outro
arquivo. `node scripts/icone.js` rasteriza dali os PNGs de 192 e 512, usando o
Chrome que já está na máquina — continua sem instalar nada.

O anel cabe dentro de 73% do quadrado, que é o que sobra depois do corte
redondo que o Android faz em ícone *maskable*.

## Conta e sincronização

O aparelho continua sendo onde o app lê e escreve — velocidade no balcão não
pode depender de sinal. A conta é uma **segunda cópia**, que se acerta quando
há internet e devolve tudo quando o aparelho perde: Safari apagou, celular
quebrou, chip caiu.

### Ligar

1. Crie conta em **supabase.com** (gratuito, sem cartão) e um projeto novo.
2. No **SQL Editor**, cole o conteúdo de [`banco.sql`](banco.sql) e execute.
3. Em **Project Settings → API**, copie o **Project URL** e a chave
   **anon public**.
4. No app: **Ajustes → Sua conta**, cole os dois e toque em *Guardar servidor*.
5. Ainda em Ajustes, **Criar conta** com e-mail e senha.

A chave `anon` pode ficar guardada no aparelho e aparecer no código: sozinha
ela não abre nada. Quem protege é a regra de linha do banco, que garante que
cada conta só enxerga a própria. Chave publicada sem essa regra é que vaza —
não a chave em si.

### Como dois aparelhos se acertam

Sem escolher um vencedor, que é onde esse tipo de código costuma perder dado.

O histórico é **só acrescentado, nunca alterado** — então juntar dois aparelhos
é juntar duas listas de eventos e tirar as repetições. A partir da lista
combinada, situação e data de retorno são **deduzidas**, em vez de guardadas
como verdade própria. Assim não existe campo que possa discordar do histórico.

Só os ajustes (seu nome, a régua, os modelos) não têm histórico; nesses vale o
lado mexido por último.

## Onde os dados ficam

No `localStorage` do navegador, naquele aparelho. Sobrevive a fechar o app,
reiniciar o celular e **perder o chip** — o número do WhatsApp e os dados do
navegador não têm relação nenhuma.

Não sobrevive a: limpar os dados do navegador, trocar de celular, ou usar outro
navegador (o Chrome e o Samsung Internet guardam separado).

Duas defesas, e as duas estão no app:

1. Na abertura ele pede ao sistema para **não descartar** o armazenamento.
   Instalar na tela inicial aumenta a chance de o Android conceder.
2. **Enviar cópia** abre a folha de compartilhar do celular, então o arquivo vai
   direto para o Drive, o e-mail ou uma conversa. Cópia baixada some numa pasta
   que ninguém revisita; cópia enviada sobrevive à troca de aparelho.

### A cobrança da cópia

Ficar só nos Ajustes não adianta: ninguém abre Ajustes. Então, quando a cópia
atrasa, a **tela de Discar** cobra, com o botão de enviar ali mesmo — e o cartão
some no instante em que a cópia sai.

Ela aparece quando **há o que perder**, e não por calendário:

- nunca houve cópia e já existem 3 contatos ou mais; ou
- a última cópia completou **7 dias** *e* aconteceu coisa nova desde então.

Quem copiou e passou a semana sem trabalhar não é incomodado — a cópia dele
continua valendo. E o texto conta o prejuízo em vez de contar dias: *"depois
dela entraram 12 contatos novos e 30 registros"* move o dedo; *"faz 9 dias"*
não move. O cartão nunca aparece com um número digitado, para não atrapalhar
quem está trabalhando.

### Levar para outro aparelho

O arquivo é texto comum, então Android e iPhone se entendem sem intermediário.

**Tudo** — Ajustes → **Enviar cópia**. No aparelho novo, **Restaurar cópia**.

**Só alguns** — Contatos → **Escolher contatos para enviar**. O toque na lista
passa a marcar em vez de abrir a ficha, e os filtros de cima fazem metade do
trabalho: filtre *Responderam* e toque em **Marcar os N à vista**.

Cópia parcial é marcada como parcial no arquivo, e isso muda o que ela pode
fazer do outro lado: **arquivo parcial sempre junta, nunca substitui** — senão
mandar cinco contatos apagaria oitocentos. E enviar alguns **não conta como
cópia de segurança**: a cobrança continua de pé, porque o resto continua sem
cópia.

### Juntar em vez de substituir

Restaurar num aparelho que já tem contatos pergunta antes:

- **Juntar** — nada se perde dos dois lados. É o caminho de quem usa dois
  aparelhos.
- **Substituir** — apaga o que está aqui e fica só a cópia. Pede confirmação
  duas vezes, e a segunda diz quantos contatos vão embora.

Aparelho vazio não pergunta: juntar com nada é restaurar.

Juntar reaproveita a mesclagem escrita para a conta que ficou dormindo, e
funciona sem servidor nenhum pelo mesmo motivo: **o histórico é só
acrescentado**, então unir dois lados é unir listas e tirar repetições, sem
escolher vencedor. Situação e retorno saem dos eventos; nome, benefício, régua
e modelos resolvem por quem mexeu por último.

## Diagnóstico

Se os dados sumirem, **Ajustes → Diagnóstico** mede o que ninguém consegue ver.

A medida que importa é o **contador de aberturas**. Se ele não sobe quando você
fecha e abre o navegador, o armazenamento está sendo limpo, e não há conserto
possível dentro do app — a causa é externa:

- **iPhone em aba do Safari** — a causa mais comum, e a mais silenciosa. Ver
  abaixo;
- **aba anônima** (o navegador apaga tudo ao fechar, por definição);
- a opção **"limpar dados/cookies ao sair"**, ligada nas configurações;
- aplicativo de limpeza ou "otimizador", que varre dados de navegador junto;
- o sistema recuperando espaço num aparelho cheio — o caso mais raro.

O painel também mostra se o app está instalado, se o sistema prometeu não
apagar, quanto espaço há e quando foi a última cópia.

### No iPhone, instalar não é opcional

O Safari apaga o armazenamento de site que vive em aba. É a proteção contra
rastreamento dele, e ela não distingue rastreador de ferramenta de trabalho:
quem só abre pelo link perde os contatos.

Adicionado à Tela de Início, o mesmo endereço passa a ser tratado como
aplicativo e fica de fora dessa limpeza. E como o Safari **não oferece**
instalar sozinho — diferente do Chrome no Android —, o app mostra o passo a
passo na tela de Discar enquanto detectar iPhone fora da Tela de Início.

Uma armadilha nessa migração: **o app instalado começa vazio.** O iOS guarda o
armazenamento do ícone separado do armazenamento do Safari, então o que estava
na aba não vai junto. Exporte a cópia pela aba antes, e restaure dentro do
ícone.

## Limites conhecidos

- O aparelho guarda cerca de 5 MB no total. Conversas importadas são cortadas
  em 200 mil caracteres cada, ficando com as mensagens mais recentes.
- A taxa de resposta por modelo só conta o que foi marcado na mão. Se você não
  marcar o desfecho, o número não significa nada.
- A escolha pela agenda depende do Chrome no Android. Nos outros, digitando.
