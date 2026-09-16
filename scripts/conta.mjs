// Mostra de qual conta é o token e o IG_USER_ID que o robô deve usar.
//   IG_TOKEN=... node scripts/conta.mjs
const API = process.env.IG_API_BASE || "https://graph.instagram.com";
const TOKEN = process.env.IG_TOKEN;
if (!TOKEN) { console.error("Defina IG_TOKEN."); process.exit(1); }

const url = new URL(`${API}/me`);
url.search = new URLSearchParams({
  fields: "user_id,username,account_type,media_count",
  access_token: TOKEN,
}).toString();

const r = await fetch(url);
const d = await r.json();
if (d.error) { console.error("ERRO:", d.error.message); process.exit(1); }

console.log("Conta ................", "@" + (d.username || "?"));
console.log("Tipo .................", d.account_type || "?");
console.log("Publicações ..........", d.media_count ?? "?");
console.log("");
console.log("IG_USER_ID (copie isto para o segredo do GitHub):");
console.log(d.user_id || d.id);
