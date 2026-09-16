// Teste de estresse da arte: renderiza a frase MAIS LONGA e a MAIS CURTA de
// cada uma das 20 tradições. Serve para conferir se algum texto estoura o slide.
//
//   node scripts/teste-extremos.mjs        (usa os dados do GitHub)
//   DATA_LOCAL=.../Salvacao/data node scripts/teste-extremos.mjs
//
// Saída: out/_teste/<tradicao>-longa.jpg e -curta.jpg

import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { baixarDados, paraJPEG, renderizar, slideFrase } from "./gerar.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = join(RAIZ, "out", "_teste");
rmSync(pasta, { recursive: true, force: true });
mkdirSync(pasta, { recursive: true });

const { religions } = await baixarDados("religions.json");
let maiorGeral = { n: 0 };

for (const rel of religions) {
  const dados = await baixarDados(`${rel.id}.json`);
  const frases = (Array.isArray(dados) ? dados : dados.phrases || []).filter((f) => f && f.text);
  const porTamanho = [...frases].sort((a, b) => a.text.length - b.text.length);
  const casos = [["curta", porTamanho[0]], ["longa", porTamanho[porTamanho.length - 1]]];

  for (const [rotulo, frase] of casos) {
    const nome = `${rel.id}-${rotulo}`;
    const html = slideFrase({ rel, frase, pagina: 2, total: 8 });
    renderizar(html, join(pasta, `${nome}.png`), join(pasta, `${nome}.html`));
    paraJPEG(join(pasta, `${nome}.png`), join(pasta, `${nome}.jpg`));
    rmSync(join(pasta, `${nome}.html`), { force: true });
  }
  const maior = porTamanho[porTamanho.length - 1];
  if (maior.text.length > maiorGeral.n) maiorGeral = { n: maior.text.length, id: rel.id };
  console.log(`✓ ${rel.id.padEnd(14)} curta ${porTamanho[0].text.length}  ·  longa ${maior.text.length} caracteres`);
}

console.log(`\nMaior frase do acervo: ${maiorGeral.n} caracteres (${maiorGeral.id})`);
console.log(`Imagens em out/_teste — confira principalmente as "-longa".`);
