// Renova o token de 60 dias (Instagram Login). Roda todo dia: cada renovação
// empurra o vencimento para mais 60 dias, então na prática nunca expira.
//   IG_TOKEN=... node scripts/renovar-token.mjs [arquivo-de-saida]
const API = process.env.IG_API_BASE || "https://graph.instagram.com";
const TOKEN = process.env.IG_TOKEN;
const saida = process.argv[2];
if (!TOKEN) {
  console.log("⏸️  Ainda não existe o segredo IG_TOKEN — nada para renovar. (Veja o README.)");
  process.exit(0);
}

const url = new URL(`${API}/refresh_access_token`);
url.search = new URLSearchParams({
  grant_type: "ig_refresh_token",
  access_token: TOKEN,
}).toString();

const r = await fetch(url);
const d = await r.json();
if (d.error || !d.access_token) {
  console.error("ERRO ao renovar:", d.error?.message || JSON.stringify(d));
  process.exit(1);
}
const dias = Math.round((d.expires_in || 0) / 86400);
console.log(`Token renovado. Vence em ~${dias} dias.`);
if (saida) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(saida, d.access_token);
  console.log(`Token novo gravado em ${saida} (nunca é impresso no log).`);
}
