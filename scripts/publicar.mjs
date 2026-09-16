// Publica um carrossel já gerado no Instagram (Instagram API with Instagram Login).
//
//   node scripts/publicar.mjs out/2026-09-15/manha
//
// Variáveis de ambiente:
//   IG_TOKEN     token de acesso do Instagram (segredo do GitHub)
//   IG_USER_ID   id da conta profissional (segredo do GitHub)
//   BASE_URL     endereço público onde as imagens estão (ex.: raw.githubusercontent...)
//   DRY_RUN=1    só simula: confere as imagens e mostra a legenda, sem postar

import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const API = process.env.IG_API_BASE || "https://graph.instagram.com";
const TOKEN = process.env.IG_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const BASE_URL = (process.env.BASE_URL || "").replace(/\/+$/, "");
const DRY_RUN = process.env.DRY_RUN === "1";

const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function chamar(caminho, params, metodo = "GET", tentativas = 3) {
  let ultimoErro;
  for (let i = 1; i <= tentativas; i++) {
    try {
      const url = new URL(`${API}/${caminho}`);
      const corpo = new URLSearchParams({ ...params, access_token: TOKEN });
      const opcoes = metodo === "POST" ? { method: "POST", body: corpo } : { method: "GET" };
      if (metodo === "GET") url.search = corpo.toString();

      const r = await fetch(url, opcoes);
      const texto = await r.text();
      let dados;
      try { dados = JSON.parse(texto); } catch { dados = { raw: texto }; }
      if (!r.ok || dados.error) {
        const e = dados.error || {};
        const erro = new Error(`Instagram respondeu ${r.status}: ${e.message || texto} (code ${e.code ?? "?"})`);
        // erro de permissão/token não adianta repetir
        erro.semRetry = r.status === 400 || r.status === 401 || r.status === 403;
        throw erro;
      }
      return dados;
    } catch (e) {
      ultimoErro = e;
      if (e.semRetry || i === tentativas) throw e;
      console.log(`  … erro passageiro (${i}/${tentativas}): ${e.message}`);
      await dormir(3000 * i);
    }
  }
  throw ultimoErro;
}

// A Meta precisa BAIXAR a imagem: ela tem que estar pública antes de publicarmos.
async function esperarImagemNoAr(url, tentativas = 20) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "mosaicodaluz-bot", range: "bytes=0-0" },
      });
      if (r.ok || r.status === 206) return true;
    } catch { /* ainda subindo */ }
    await dormir(6000);
    console.log(`  … esperando ${basename(url)} ficar público (${i}/${tentativas})`);
  }
  throw new Error(`A imagem ${url} não ficou pública a tempo.`);
}

// Containers de mídia levam alguns segundos para ficarem prontos.
async function esperarContainer(id, tentativas = 30) {
  for (let i = 1; i <= tentativas; i++) {
    const r = await chamar(id, { fields: "status_code" });
    const situacao = r.status_code;
    if (situacao === "FINISHED" || situacao === "PUBLISHED") return true;
    if (situacao === "ERROR" || situacao === "EXPIRED") {
      throw new Error(`Container ${id} falhou (${situacao}).`);
    }
    await dormir(5000);
  }
  throw new Error(`Container ${id} não ficou pronto a tempo.`);
}

async function main() {
  const pasta = resolve(process.argv[2] || "");
  const meta = JSON.parse(readFileSync(join(pasta, "meta.json"), "utf8"));
  const urls = meta.arquivos.map((a) => `${BASE_URL}/${meta.dia}/${meta.grupo}/${a}`);

  console.log(`Carrossel: ${meta.dia} · ${meta.grupo} · ${urls.length} imagens`);
  if (urls.length > 10) throw new Error("A API aceita no máximo 10 imagens por carrossel.");

  if (DRY_RUN) {
    console.log("\n[ENSAIO] Não vou postar. Imagens:");
    urls.forEach((u) => console.log("  " + u));
    console.log("\n[ENSAIO] Legenda:\n" + meta.legenda);
    return;
  }
  if (!TOKEN || !IG_USER_ID) {
    console.log("\n⏸️  Conta ainda não conectada (falta o segredo IG_TOKEN e/ou IG_USER_ID).");
    console.log("   As imagens foram geradas, mas não vou postar. Veja o README, passos 1 a 5.");
    return;
  }
  if (!BASE_URL) throw new Error("Falta BASE_URL (endereço público das imagens).");

  for (const u of urls) await esperarImagemNoAr(u);

  const filhos = [];
  for (const u of urls) {
    const { id } = await chamar(`${IG_USER_ID}/media`, {
      image_url: u, is_carousel_item: "true",
    }, "POST");
    await esperarContainer(id);
    filhos.push(id);
    console.log(`  ✓ item ${filhos.length}/${urls.length}`);
  }

  const { id: carrossel } = await chamar(`${IG_USER_ID}/media`, {
    media_type: "CAROUSEL",
    children: filhos.join(","),
    caption: meta.legenda,
  }, "POST");
  await esperarContainer(carrossel);

  const publicado = await chamar(`${IG_USER_ID}/media_publish`, { creation_id: carrossel }, "POST");
  console.log(`\n✅ Publicado no Instagram — id ${publicado.id}`);
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
