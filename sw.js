/* Service worker do Tino.
 *
 * Serve do cache para abrir sem internet, mas busca a versão nova por trás e
 * guarda para a próxima abertura ("stale-while-revalidate"). É de propósito:
 * o cache puro obriga a lembrar de subir a VERSAO a cada mudança, e esquecer
 * disso já custou uma tarde noutro projeto — a tela ficava velha e imune até
 * a Ctrl+F5.
 *
 * Suba a VERSAO quando quiser forçar a limpeza imediata de todo mundo.
 */

const VERSAO = "tino-v2";

const CASCA = [
  "./",
  "./index.html",
  "./estilo.css",
  "./nuvem.js",
  "./app.js",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VERSAO)
      .then((c) => c.addAll(CASCA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const pedido = ev.request;
  if (pedido.method !== "GET") return;

  // Só cuidamos do que é nosso. wa.me e afins passam direto.
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  ev.respondWith(
    caches.open(VERSAO).then(async (cache) => {
      const guardado = await cache.match(pedido, { ignoreSearch: true });

      const rede = fetch(pedido)
        .then((resposta) => {
          if (resposta && resposta.ok) cache.put(pedido, resposta.clone());
          return resposta;
        })
        .catch(() => null);

      // Tem no cache? Entrega já e atualiza por trás.
      if (guardado) { ev.waitUntil(rede); return guardado; }

      const daRede = await rede;
      if (daRede) return daRede;

      // Sem cache e sem rede: se for navegação, devolve a página inicial.
      if (pedido.mode === "navigate") {
        const inicial = await cache.match("./index.html");
        if (inicial) return inicial;
      }
      return new Response("Sem conexão.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    })
  );
});
