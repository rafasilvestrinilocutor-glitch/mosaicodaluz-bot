// Gera as imagens do carrossel do dia (capa + 1 slide por tradição + chamada final)
// e a legenda. Sem nenhuma dependência npm: usa só Node + Google Chrome (headless).
//
//   node scripts/gerar.mjs manha|meiodia|noite [--offset -1]
//
// Saída: out/<AAAA-MM-DD>/<grupo>/01.jpg ... NN.jpg + legenda.txt + meta.json

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ALTURA, DATA_BASE, GRUPOS, HASHTAGS, LARGURA, SITE_LABEL, SITE_URL, TZ,
} from "./config.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const TEMPLATE = join(RAIZ, "template");

/* ---------------------------------------------------------------- dia / dados */

// Mesma conta do site (js/app.js): dias desde 1970-01-01, usando a data CIVIL
// do Brasil — assim o slide mostra exatamente a frase que o site mostra hoje.
export function dayNumber(quando = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const [y, m, d] = f.format(quando).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function indiceDoDia(total, offset = 0) {
  if (total <= 0) return 0;
  return (((dayNumber() + offset) % total) + total) % total;
}

function dataISO(offset = 0) {
  return new Date((dayNumber() + offset) * 86400000).toISOString().slice(0, 10);
}

function dataPorExtenso(offset = 0) {
  const d = new Date((dayNumber() + offset) * 86400000);
  const txt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", day: "numeric", month: "long", year: "numeric",
  }).format(d);
  return txt;
}

async function baixarJSON(arquivo) {
  // Permite rodar offline apontando DATA_LOCAL para a pasta data/ do site.
  const local = process.env.DATA_LOCAL && join(process.env.DATA_LOCAL, arquivo);
  if (local && existsSync(local)) return JSON.parse(readFileSync(local, "utf8"));

  const url = `${DATA_BASE}/${arquivo}`;
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "mosaicodaluz-bot" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 4) throw new Error(`Falhou ao baixar ${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 1500 * tentativa));
    }
  }
}

/* ------------------------------------------------------------------- desenho */

const SIMBOLOS = (() => {
  const svg = readFileSync(join(TEMPLATE, "symbols.svg"), "utf8");
  const mapa = {};
  for (const m of svg.matchAll(/<symbol id="sym-([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)) {
    mapa[m[1]] = { viewBox: m[2], corpo: m[3] };
  }
  return mapa;
})();

function simbolo(nome, classe = "") {
  const s = SIMBOLOS[nome] || SIMBOLOS.mosaic;
  return `<svg class="${classe}" viewBox="${s.viewBox}" xmlns="http://www.w3.org/2000/svg">${s.corpo}</svg>`;
}

const fonte = (arq) => pathToFileURL(join(TEMPLATE, "fonts", arq)).href;

function escapar(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function baseCSS(cor) {
  return `
@font-face{font-family:"Cormorant";src:url("${fonte("Cormorant-normal.woff2")}") format("woff2");font-style:normal;font-weight:300 700;font-display:block}
@font-face{font-family:"Cormorant";src:url("${fonte("Cormorant-italic.woff2")}") format("woff2");font-style:italic;font-weight:300 700;font-display:block}
@font-face{font-family:"Outfit";src:url("${fonte("Outfit.woff2")}") format("woff2");font-style:normal;font-weight:100 900;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${LARGURA}px;height:${ALTURA}px;overflow:hidden}
body{
  --bg:#0b0c11; --bg2:#060709; --text:#f0eadd; --muted:#9d978a;
  --gold:#c9a24a; --gold-soft:#e6cd8e; --primary:${cor};
  background:var(--bg); color:var(--text); font-family:"Outfit",sans-serif;
  position:relative;
}
.fundo{position:absolute;inset:0;
  background:
    radial-gradient(58% 40% at 50% 14%, color-mix(in srgb, var(--primary) 38%, transparent), transparent 68%),
    radial-gradient(48% 36% at 88% 98%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 72%),
    radial-gradient(54% 42% at 6% 90%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 74%),
    radial-gradient(120% 104% at 50% 26%, transparent 42%, rgba(0,0,0,.62) 100%),
    linear-gradient(180deg, var(--bg), var(--bg2));}
.marca-dagua{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);
  width:820px;height:820px;color:var(--primary);fill:var(--primary);opacity:.10;
  filter:drop-shadow(0 0 70px color-mix(in srgb, var(--primary) 55%, transparent))}
.grao{position:absolute;inset:0;opacity:.5;mix-blend-mode:soft-light;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")}
.quadro{position:absolute;inset:0;padding:92px 86px;display:flex;flex-direction:column;z-index:2}
.topo{display:flex;align-items:center;gap:18px}
.topo svg{width:44px;height:44px;color:var(--gold-soft);fill:none;stroke:var(--gold-soft);stroke-width:1.2}
.topo span{font-size:22px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold-soft);font-weight:400}
.rodape{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;font-size:24px;color:var(--muted)}
.rodape b{display:block;color:var(--gold-soft);font-weight:500;letter-spacing:.06em;font-size:30px}
.pag{font-size:22px;letter-spacing:.22em;color:var(--muted)}
`;
}

function paginaHTML({ cor, simboloFundo, conteudo, css = "", script = "" }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${baseCSS(cor)}${css}</style></head>
<body><div class="fundo"></div>${simboloFundo ? simbolo(simboloFundo, "marca-dagua") : ""}
<div class="quadro">${conteudo}</div><div class="grao"></div>
<script>${script}<\/script></body></html>`;
}

function slideCapa({ grupo, dataTexto, quantas }) {
  const conteudo = `
  <div class="topo">${simbolo("mosaic")}<span>Mosaico da Luz</span></div>
  <div class="centro">
    <div class="data">${escapar(dataTexto)}</div>
    <h1>A palavra<br>de hoje</h1>
    <div class="linha"></div>
    <div class="grupo">${escapar(grupo.titulo)}</div>
    <div class="quantas">${quantas} tradições · uma frase para cada dia</div>
  </div>
  <div class="rodape"><span>${SITE_LABEL}</span><span class="arraste">arraste &rsaquo;&rsaquo;</span></div>`;
  const css = `
  .centro{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:26px}
  .data{font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
  h1{font-family:"Cormorant",serif;font-weight:600;font-size:148px;line-height:1.02;
     background:linear-gradient(180deg,#fbf3df 0%,var(--gold-soft) 55%,var(--gold) 100%);
     -webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.08em}
  .linha{width:200px;height:1px;background:linear-gradient(90deg,var(--gold),transparent)}
  .grupo{font-family:"Cormorant",serif;font-style:italic;font-size:54px;color:var(--text)}
  .quantas{font-size:28px;color:var(--muted);letter-spacing:.02em}
  .arraste{color:var(--gold-soft);letter-spacing:.2em;text-transform:uppercase;font-size:22px}
  .marca-dagua{opacity:.055;top:62%;left:60%;width:760px;height:760px}`;
  return paginaHTML({ cor: "#c9a24a", simboloFundo: "mosaic", conteudo, css });
}

function slideFrase({ rel, frase, pagina, total }) {
  const conteudo = `
  <div class="topo">${simbolo("mosaic")}<span>Mosaico da Luz</span></div>
  <div class="centro">
    <div class="rotulo">${escapar(rel.phraseLabel)}</div>
    <div class="caixa"><p class="frase" id="frase">${escapar(frase.text)}</p></div>
    ${frase.reference ? `<div class="ref">${escapar(frase.reference)}</div>` : ""}
  </div>
  <div class="rodape">
    <span><b>${escapar(rel.name)}</b>${escapar(rel.source || "")}</span>
    <span class="pag">${pagina}/${total}</span>
  </div>`;
  const css = `
  .centro{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:42px;padding:20px 0}
  .rotulo{font-size:22px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold-soft);
          display:flex;align-items:center;gap:22px}
  .rotulo::before,.rotulo::after{content:"";width:64px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
  .caixa{width:100%;height:660px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .frase{font-family:"Cormorant",serif;font-style:italic;font-weight:500;line-height:1.36;
         font-size:76px;color:var(--text);text-shadow:0 1px 34px color-mix(in srgb, var(--primary) 30%, transparent)}
  .ref{font-size:24px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-soft)}`;
  // encolhe o texto até caber na caixa (frases variam muito de tamanho)
  const script = `
  (function(){
    function ajustar(){
      var p=document.getElementById('frase'), caixa=p.parentElement, tam=78;
      var limite=caixa.clientHeight;
      p.style.fontSize=tam+'px';
      while(p.scrollHeight>limite&&tam>26){ tam-=2; p.style.fontSize=tam+'px'; }
    }
    ajustar();
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(ajustar);}
  })();`;
  return paginaHTML({ cor: rel.theme.primary, simboloFundo: rel.symbol, conteudo, css, script });
}

function slideFinal({ pagina, total }) {
  const conteudo = `
  <div class="topo">${simbolo("mosaic")}<span>Mosaico da Luz</span></div>
  <div class="centro">
    <h2>A sua tradição<br>também está lá.</h2>
    <div class="linha"></div>
    <p class="txt">20 tradições espirituais.<br>Uma frase nova a cada dia, de graça, sem cadastro.</p>
    <div class="link">${SITE_LABEL}</div>
    <p class="txt peq">Link na bio &rsaquo;</p>
  </div>
  <div class="rodape"><span>salve &amp; compartilhe</span><span class="pag">${pagina}/${total}</span></div>`;
  const css = `
  .centro{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:30px}
  h2{font-family:"Cormorant",serif;font-weight:600;font-size:104px;line-height:1.08;
     background:linear-gradient(180deg,#fbf3df 0%,var(--gold-soft) 55%,var(--gold) 100%);
     -webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.08em}
  .linha{width:200px;height:1px;background:linear-gradient(90deg,var(--gold),transparent)}
  .txt{font-size:34px;line-height:1.5;color:var(--text);font-weight:300}
  .txt.peq{font-size:26px;color:var(--muted)}
  .link{font-family:"Cormorant",serif;font-style:italic;font-size:52px;color:var(--gold-soft)}
  .marca-dagua{opacity:.055;top:62%;left:60%;width:760px;height:760px}`;
  return paginaHTML({ cor: "#c9a24a", simboloFundo: "mosaic", conteudo, css });
}

/* ------------------------------------------------------------------ renderer */

function acharChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidatos = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ];
  for (const c of candidatos) if (existsSync(c)) return c;
  throw new Error("Google Chrome não encontrado (defina CHROME_BIN).");
}

const CHROME = acharChrome();

function renderizar(html, destinoPNG, tmpHTML) {
  writeFileSync(tmpHTML, html);
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--force-device-scale-factor=1",
    `--window-size=${LARGURA},${ALTURA}`,
    "--virtual-time-budget=5000",
    `--screenshot=${destinoPNG}`,
    pathToFileURL(tmpHTML).href,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  if (!existsSync(destinoPNG)) throw new Error(`Chrome não gerou ${destinoPNG}`);
}

// A API do Instagram só aceita JPEG — converte com o que existir na máquina.
function paraJPEG(png, jpg) {
  const tentativas = [
    ["magick", [png, "-quality", "92", "-strip", jpg]],
    ["convert", [png, "-quality", "92", "-strip", jpg]],
    ["sips", ["-s", "format", "jpeg", "-s", "formatOptions", "92", png, "--out", jpg]],
    ["ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-q:v", "3", jpg]],
  ];
  for (const [cmd, args] of tentativas) {
    try {
      execFileSync(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
      if (existsSync(jpg)) { rmSync(png, { force: true }); return; }
    } catch { /* tenta o próximo */ }
  }
  throw new Error("Nenhum conversor de imagem disponível (instale o ImageMagick).");
}

/* ------------------------------------------------------------------- legenda */

function montarLegenda({ grupo, dataTexto, itens }) {
  const linhas = itens.map((i) => `${i.rel.name} — ${i.frase.reference || i.rel.source}`);
  return [
    `${grupo.emoji} A palavra de hoje — ${dataTexto}`,
    "",
    `${grupo.titulo}. Arraste para ler a frase de cada tradição. 🕯️`,
    "",
    ...linhas,
    "",
    "Uma frase nova por dia, em 20 tradições espirituais — de graça, sem cadastro.",
    `👉 ${SITE_URL}`,
    "",
    "Respeito por todos os caminhos. Salve para reler e marque alguém que precisa ler isso hoje.",
    "",
    HASHTAGS.join(" "),
  ].join("\n");
}

/* --------------------------------------------------------------------- main */

async function main() {
  const nomeGrupo = process.argv[2];
  const grupo = GRUPOS[nomeGrupo];
  if (!grupo) {
    console.error(`Uso: node scripts/gerar.mjs ${Object.keys(GRUPOS).join("|")} [--offset -1]`);
    process.exit(1);
  }
  const i = process.argv.indexOf("--offset");
  const offset = i > -1 ? Number(process.argv[i + 1]) : 0;

  const dia = dataISO(offset);
  const dataTexto = dataPorExtenso(offset);
  const pasta = join(RAIZ, "out", dia, nomeGrupo);
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });

  const { religions } = await baixarJSON("religions.json");
  const porId = Object.fromEntries(religions.map((r) => [r.id, r]));

  const itens = [];
  for (const id of grupo.tradicoes) {
    const rel = porId[id];
    if (!rel) throw new Error(`Tradição "${id}" não existe em religions.json`);
    const dados = await baixarJSON(`${id}.json`);
    const frases = Array.isArray(dados) ? dados : dados.phrases || [];
    const frase = frases[indiceDoDia(frases.length, offset)];
    if (!frase || !frase.text) throw new Error(`Sem frase para ${id}`);
    itens.push({ rel, frase });
  }

  const total = itens.length + 2; // capa + frases + chamada final
  const paginas = [
    slideCapa({ grupo, dataTexto, quantas: itens.length }),
    ...itens.map((it, n) => slideFrase({ ...it, pagina: n + 2, total })),
    slideFinal({ pagina: total, total }),
  ];

  const arquivos = [];
  paginas.forEach((html, n) => {
    const nome = String(n + 1).padStart(2, "0");
    const png = join(pasta, `${nome}.png`);
    const jpg = join(pasta, `${nome}.jpg`);
    renderizar(html, png, join(pasta, `_${nome}.html`));
    paraJPEG(png, jpg);
    rmSync(join(pasta, `_${nome}.html`), { force: true });
    arquivos.push(`${nome}.jpg`);
    console.log(`  ✓ ${nome}.jpg`);
  });

  const legenda = montarLegenda({ grupo, dataTexto, itens });
  writeFileSync(join(pasta, "legenda.txt"), legenda);
  writeFileSync(join(pasta, "meta.json"), JSON.stringify({
    dia, grupo: nomeGrupo, titulo: grupo.titulo, arquivos, legenda,
    tradicoes: itens.map((i) => i.rel.id),
  }, null, 2));

  console.log(`\n${arquivos.length} imagens em out/${dia}/${nomeGrupo}`);
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
