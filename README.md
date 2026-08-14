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

Não existe importação de lista, e isso é decisão, não limitação: a base do
trabalho não é sua, e copiá-la para um aplicativo pessoal é problema de LGPD e
de contrato. Aqui entra só o **seu registro de contato**, construído um número
por vez, conforme você trabalha. Em duas semanas de uso já são centenas.

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
| Nunca contatado | agora |
| Respondeu alguma vez | 7 dias |
| 1 tentativa sem resposta | 15 dias |
| 2 tentativas sem resposta | 45 dias |
| 3 tentativas sem resposta | **nunca mais** |
| Disse que não tem interesse | nunca mais |
| Pediu para parar | nunca mais |

Os prazos se mudam em Ajustes. O corte na terceira tentativa não: quem não
respondeu três vezes não responde na quarta — denuncia.

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

## Limites conhecidos

- O aparelho guarda cerca de 5 MB no total. Conversas importadas são cortadas
  em 200 mil caracteres cada, ficando com as mensagens mais recentes.
- **Apagar os dados do navegador apaga tudo.** Exporte cópia de vez em quando.
- A taxa de resposta por modelo só conta o que foi marcado na mão. Se você não
  marcar o desfecho, o número não significa nada.
