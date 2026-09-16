// Configuração central do robô do Mosaico da Luz.
// Mudar horários/grupos/hashtags aqui (e nada mais).

export const SITE_URL = "https://mosaicodaluz.netlify.app";
export const SITE_LABEL = "mosaicodaluz.netlify.app";

// Os dados vêm do repositório do site (raw do GitHub) para não gastar banda/créditos do Netlify.
export const DATA_BASE =
  process.env.DATA_BASE ||
  "https://raw.githubusercontent.com/rafasilvestrinilocutor-glitch/palavra-do-dia/main/data";

// Fuso usado para decidir "que dia é hoje" — o mesmo dia que o visitante brasileiro vê no site.
export const TZ = "America/Sao_Paulo";

// Formato do post: 1080x1350 (4:5 vertical, o que mais ocupa tela no feed).
export const LARGURA = 1080;
export const ALTURA = 1350;

export const GRUPOS = {
  manha: {
    emoji: "☀️",
    titulo: "Abraâmicas e espíritas",
    horario: "07h",
    tradicoes: ["cristianismo", "catolicismo", "islamismo", "judaismo", "espiritismo", "bahai"],
  },
  meiodia: {
    emoji: "🌤",
    titulo: "Tradições orientais",
    horario: "12h",
    tradicoes: ["budismo", "hinduismo", "taoismo", "confucionismo", "xintoismo", "sikhismo", "jainismo", "seichonoie"],
  },
  noite: {
    emoji: "🌙",
    titulo: "Brasileiras e da natureza",
    horario: "19h",
    tradicoes: ["umbanda", "candomble", "jurema", "santodaime", "xamanismo", "wicca"],
  },
};

export const HASHTAGS = [
  "#mosaicodaluz", "#palavradodia", "#espiritualidade", "#fe", "#reflexao",
  "#sabedoria", "#mensagemdodia", "#luz", "#paz", "#gratidao",
  "#versiculododia", "#ensinamentos", "#religiao", "#autoconhecimento", "#oracao",
];
