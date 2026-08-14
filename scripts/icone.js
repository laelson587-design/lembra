/* Gera icone-192.png e icone-512.png sem depender de nada de fora.
 *
 * O desenho é um balão de conversa branco sobre azul, com três pontinhos
 * dentro — a conversa que ficou guardada. Tudo por matemática, porque
 * desenhar letra exigiria uma fonte, e uma fonte exigiria uma biblioteca.
 *
 * Rodar:  node scripts/icone.js
 */

const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");

const AZUL = [29, 78, 216];      // #1d4ed8, a mesma cor da marca no CSS
const BRANCO = [255, 255, 255];

// ---------------------------------------------------------------- desenho

/** Distância até um retângulo de cantos arredondados, em coordenadas 0..1. */
function dentroDoArredondado(x, y, x0, y0, x1, y1, r) {
  const cx = Math.max(x0 + r, Math.min(x, x1 - r));
  const cy = Math.max(y0 + r, Math.min(y, y1 - r));
  const dx = x - cx, dy = y - cy;
  if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
    if (dx * dx + dy * dy <= r * r) return true;
    // dentro do retângulo mas fora do canto? só nos quatro cantos é que falha
    const noCantoX = x < x0 + r || x > x1 - r;
    const noCantoY = y < y0 + r || y > y1 - r;
    return !(noCantoX && noCantoY);
  }
  return false;
}

function dentroDoCirculo(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** O rabinho do balão: um triângulo apontando para baixo e para a esquerda. */
function dentroDoRabo(x, y) {
  if (y < 0.62 || y > 0.80) return false;
  const t = (y - 0.62) / 0.18;              // 0 no topo do rabo, 1 na ponta
  const esq = 0.30;
  const dir = 0.44 - 0.14 * t;
  return x >= esq + 0.02 * t && x <= dir;
}

function corDoPonto(x, y) {
  // fundo: quadrado arredondado azul ocupando a arte toda
  const fundo = dentroDoArredondado(x, y, 0.0, 0.0, 1.0, 1.0, 0.22);
  if (!fundo) return null;                  // transparente fora do quadrado

  const balao = dentroDoArredondado(x, y, 0.20, 0.22, 0.80, 0.66, 0.13);
  const rabo = dentroDoRabo(x, y);

  if (balao || rabo) {
    // três pontinhos azuis dentro do balão
    const r = 0.045;
    if (dentroDoCirculo(x, y, 0.35, 0.44, r)) return AZUL;
    if (dentroDoCirculo(x, y, 0.50, 0.44, r)) return AZUL;
    if (dentroDoCirculo(x, y, 0.65, 0.44, r)) return AZUL;
    return BRANCO;
  }
  return AZUL;
}

// ------------------------------------------------------------------ PNG

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const nome = Buffer.from(tipo, "ascii");
  const corpo = Buffer.concat([nome, dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const verificacao = Buffer.alloc(4);
  verificacao.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, verificacao]);
}

function gerar(lado) {
  // 4 amostras por pixel em cada eixo, para a borda não sair serrilhada
  const AMOSTRAS = 4;
  const linhas = [];

  for (let py = 0; py < lado; py++) {
    const linha = Buffer.alloc(1 + lado * 4);   // 1 byte de filtro + RGBA
    for (let px = 0; px < lado; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < AMOSTRAS; sy++) {
        for (let sx = 0; sx < AMOSTRAS; sx++) {
          const x = (px + (sx + 0.5) / AMOSTRAS) / lado;
          const y = (py + (sy + 0.5) / AMOSTRAS) / lado;
          const cor = corDoPonto(x, y);
          if (cor) { r += cor[0]; g += cor[1]; b += cor[2]; a += 255; }
        }
      }
      const n = AMOSTRAS * AMOSTRAS;
      const o = 1 + px * 4;
      // cor média já ponderada pela cobertura, para não escurecer a borda
      const cobertos = a / 255;
      linha[o + 0] = cobertos ? Math.round(r / cobertos) : 0;
      linha[o + 1] = cobertos ? Math.round(g / cobertos) : 0;
      linha[o + 2] = cobertos ? Math.round(b / cobertos) : 0;
      linha[o + 3] = Math.round(a / n);
    }
    linhas.push(linha);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;      // bits por canal
  ihdr[9] = 6;      // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", zlib.deflateSync(Buffer.concat(linhas), { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- escrita

const raiz = path.join(__dirname, "..");
for (const lado of [192, 512]) {
  const destino = path.join(raiz, `icone-${lado}.png`);
  fs.writeFileSync(destino, gerar(lado));
  console.log("escrito", destino);
}
