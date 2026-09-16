# 🤖 Robô do Instagram — Mosaico da Luz

Publica **3 carrosséis por dia** no Instagram **@mosaicodaluz**, sozinho, de graça,
**sem precisar do seu computador ligado**.

Quem roda é o **GitHub Actions** (o agendador do próprio GitHub). Ele acorda no horário,
desenha as imagens com a mesma arte escura do site, escreve a legenda e publica.

| Horário (Brasília) | Carrossel |
|---|---|
| **07h** | Abraâmicas e espíritas — Cristianismo, Catolicismo, Islã, Judaísmo, Espiritismo, Bahá'í |
| **12h** | Orientais — Budismo, Hinduísmo, Taoismo, Confucionismo, Xintoísmo, Sikhismo, Jainismo, Seicho-No-Ie |
| **19h** | Brasileiras e da natureza — Umbanda, Candomblé, Jurema, Santo Daime, Xamanismo, Wicca |

Cada post = **capa do dia + 1 slide por tradição + 1 slide de convite** para o site.
A frase de cada slide é **exatamente a mesma** que o site mostra naquele dia.

**Custo: zero.** GitHub Actions é grátis para repositório público, a API do Instagram é grátis,
e o site no Netlify nem é tocado (os textos vêm direto do GitHub).

---

## ✅ O que falta você fazer (uma vez só)

### 0. Foto de perfil

Na pasta `marca/` tem duas opções prontas, 1080x1080, no estilo do site:

- `foto-perfil-A.png` — emblema menor, mais ar em volta
- `foto-perfil-B.png` — emblema maior (**recomendada**: fica mais legível no tamanho pequeno)

Baixe a que preferir e coloque no perfil (Editar perfil → Alterar foto).

### 1. Deixar o @mosaicodaluz como conta profissional

No app do Instagram, **dentro do perfil @mosaicodaluz** (troque de perfil antes):

1. Menu ☰ → **Configurações e privacidade**
2. Seção **Para profissionais** → **Tipo de conta e ferramentas**
3. **Mudar para conta profissional** → escolha a categoria (ex.: Religião/Espiritualidade)
4. Escolha **Comercial** (funciona também como Criador, mas Comercial tem mais relatórios)

> Não precisa criar Página do Facebook. O caminho que usamos aqui
> ("Instagram API with Instagram Login") dispensa isso.

### 2. Criar o aplicativo na Meta

No computador, em <https://developers.facebook.com> → **Meus Apps** → **Criar app**:

1. Caso de uso: **"Gerenciar mensagens e conteúdo no Instagram"**
2. Nome do app: `Mosaico da Luz` — e-mail: o seu
3. Depois de criado, no menu lateral: **Instagram** → **API setup with Instagram Login**
4. Clique em **Add an Instagram Account** e entre com o **@mosaicodaluz**
5. Permissões que devem aparecer marcadas:
   `instagram_business_basic` e `instagram_business_content_publish`

> Publicar **na sua própria conta não exige revisão da Meta** (App Review).
> O app pode ficar em modo "Desenvolvimento" para sempre. Se ele pedir, adicione
> o @mosaicodaluz como *Instagram Tester* e aceite o convite dentro do Instagram
> (Perfil → Apps e sites → Convites de testador).

### 3. Gerar o token

Ainda na tela **API setup with Instagram Login**, clique em **Generate token**,
autorize e **copie o token** (a Meta só mostra uma vez).

Esse token curto precisa virar um de 60 dias. Cole esta linha no navegador,
trocando `SEU_APP_SECRET` (está em Configurações do app → Básico) e `TOKEN_CURTO`:

```
https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=SEU_APP_SECRET&access_token=TOKEN_CURTO
```

A resposta traz `access_token` — **esse** é o que vamos usar.
Depois disso o robô renova sozinho todo dia (veja "Token que nunca vence" abaixo).

### 4. Colar os segredos no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository secret**

| Nome | Valor |
|---|---|
| `IG_TOKEN` | o token de 60 dias do passo 3 |
| `IG_USER_ID` | o número da conta (o passo 5 descobre para você) |
| `GH_PAT` | *(opcional, mas recomendado)* um token pessoal do GitHub com permissão **Secrets: read and write**, para o robô salvar o token renovado sozinho |

### 5. Descobrir o IG_USER_ID

Aba **Actions** → workflow **"Conferir a conta e o token"** → **Run workflow**.
Ele imprime de qual perfil é o token e o número do `IG_USER_ID`.
Cole esse número como segredo (passo 4).

### 6. Ensaiar e ligar

1. **Actions → "Testar a arte (sem postar)" → Run workflow.**
   Ao terminar, baixe o anexo `artes-do-dia` e veja as imagens dos 3 carrosséis.
2. **Actions → "Postar no Instagram" → Run workflow**, escolha o grupo e
   deixe **ensaio = true**. Ele confere tudo e mostra a legenda **sem postar**.
3. Repita com **ensaio = false** para publicar de verdade o primeiro post.
4. Dali em diante os horários automáticos (7h / 12h / 19h) funcionam sozinhos.

---

## 🔁 Token que nunca vence

O token do Instagram dura 60 dias. O workflow **"Renovar token do Instagram"** roda
todo dia de madrugada e pede um token novo (cada renovação vale mais 60 dias).

- **Com o segredo `GH_PAT`:** ele salva o token novo sozinho. Você nunca mais mexe nisso.
- **Sem o `GH_PAT`:** ele só avisa nos registros. Aí você precisa repetir o passo 3
  antes de completar 60 dias, senão o robô para de postar.

---

## 🛠️ Mexer no robô

| Quero... | Onde |
|---|---|
| Mudar horários | `.github/workflows/postar.yml` (linhas `cron`, em UTC = Brasília + 3h) |
| Mudar grupos de tradições | `scripts/config.mjs` → `GRUPOS` |
| Mudar hashtags | `scripts/config.mjs` → `HASHTAGS` |
| Mudar o texto da legenda | `scripts/gerar.mjs` → `montarLegenda` |
| Mudar a arte | `scripts/gerar.mjs` → `slideCapa`, `slideFrase`, `slideFinal` |
| **Desligar tudo** | Actions → workflow "Postar no Instagram" → ⋯ → **Disable workflow** |

### Ver as imagens no seu Mac

```bash
cd "/Volumes/Rafa SSD/claude/projetos/mosaicodaluz-bot"
node scripts/gerar.mjs manha        # ou meiodia / noite
open out/*/manha
```
(Só precisa do Google Chrome instalado. Nada de npm install.)

---

## 🧩 Como funciona por dentro

1. `scripts/gerar.mjs` baixa as frases do repositório do site
   (`raw.githubusercontent.com/.../palavra-do-dia/main/data`), escolhe a frase do dia
   com a **mesma conta do site** (dias desde 1970 % número de frases, no fuso de São Paulo),
   monta um HTML por slide e tira um print 1080x1350 com o Chrome. Converte para **JPEG**
   (a API do Instagram só aceita JPEG).
2. O workflow joga as imagens na branch `cdn` deste repositório — é daí que a Meta baixa
   as fotos (ela exige endereço público; a branch é refeita a cada post, então não incha).
3. `scripts/publicar.mjs` cria um container por imagem, junta tudo num carrossel e publica.

Limites respeitados: máximo 10 imagens por carrossel, proporção 4:5, JPEG, menos de 8 MB.
