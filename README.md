# Lembra

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

O Lembra resolve a única parte que está na mão de quem usa: **a memória**.

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
que o Lembra importa. O que lê o WhatsApp por fora são as bibliotecas que
imitam o WhatsApp Web, e são exatamente elas que derrubam o número.

**Da agenda do celular, sim.** No Chrome do Android existe uma permissão do
próprio sistema: o app pede, aparece a tela do Android, e você escolhe quem
entregar. Não é acesso à agenda — é você passando os contatos um a um. Há dois
caminhos: um contato na aba **Discar** e vários de uma vez na aba **Contatos**.
No computador e no iPhone o botão nem aparece, porque a permissão não existe.

**Digitando**, sempre. É o caminho que funciona em qualquer aparelho, e é o
mesmo número que você digitaria no WhatsApp de qualquer jeito.

## O que tem dentro

**Discar** — digita o número, lê o veredito, escolhe o modelo, abre a conversa.
Depois marca o que aconteceu com um toque.

**Hoje** — a fila do dia pela régua de contato: só quem está no prazo. De 800
nomes costumam sobrar poucas dezenas. Mandar menos é o que faz o chip durar.

**Contatos** — busca por nome ou número, com filtros de quem respondeu, quem
nunca respondeu e quem pediu para parar.

**Ficha** — histórico completo, anotações e a conversa guardada.

**Ajustes** — seu nome, a régua, os modelos de mensagem com **taxa de resposta
de cada um**, e a cópia de segurança.

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

**O retorno marcado passa na frente de tudo.** Você escolhe a data no
calendário, na tela de Discar ou na ficha do contato, e ele some da fila até
o dia chegar — quando volta, no topo. Marcar retorno também tira alguém de
"sem interesse", porque marcar data é o contrário de descartar. Dá para
agendar quem você ainda nem chamou: às vezes o combinado é só "me procura
depois do dia 10".

## Guardar conversas

Duas formas, ambas dentro da ficha do contato:

1. **Colar.** No WhatsApp, segure uma mensagem, marque as que quiser, toque em
   copiar e cole no campo. Serve para o trecho que importa.
2. **Importar.** No WhatsApp: abra a conversa → menu → **Exportar conversa** →
   **Sem mídia**. Escolha o arquivo `.txt` na ficha. Traz o histórico inteiro.

Vale fazer isso **antes** de um número cair, com os clientes que importam.
Conversa exportada é o único jeito de o histórico sobreviver ao bloqueio.

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

`node scripts/icone.js` regenera `icone-192.png` e `icone-512.png`. O desenho é
feito por matemática, sem biblioteca nenhuma.

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
   que ninguém revisita; cópia enviada sobrevive à troca de aparelho. Os Ajustes
   mostram quando foi a última e avisam depois de 30 dias.

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
