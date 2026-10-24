/**
 * Ychan - Dados Iniciais (Mock Data)
 * Contém boards padrão e threads de exemplo com imagens embutidas em SVG.
 */

// Miniaturas SVG leves e embutidas para não depender de conexão externa
const SVG_ASSETS = {
  retroPc: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%231e293b"/><rect x="40" y="30" width="320" height="200" rx="10" fill="%230f172a" stroke="%2338bdf8" stroke-width="4"/><rect x="60" y="50" width="280" height="160" fill="%230284c7"/><text x="80" y="90" font-family="monospace" font-size="14" fill="%23e0f2fe">&gt; SYSTEM BOOT OK</text><text x="80" y="115" font-family="monospace" font-size="14" fill="%23bae6fd">&gt; WELCOME TO YCHAN/TECH/</text><text x="80" y="140" font-family="monospace" font-size="14" fill="%23ffffff">&gt; COMPILING C-CORE...</text><rect x="80" y="160" width="12" height="18" fill="%2338bdf8"/><rect x="160" y="240" width="80" height="30" fill="%23334155"/><rect x="120" y="270" width="160" height="12" rx="4" fill="%23475569"/></svg>`,
  
  cyberArt: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230c1e3d"/><circle cx="200" cy="150" r="90" fill="none" stroke="%2360a5fa" stroke-width="6" stroke-dasharray="8 6"/><polygon points="200,80 260,200 140,200" fill="%231d4ed8" opacity="0.85"/><circle cx="200" cy="150" r="25" fill="%2393c5fd"/><text x="200" y="270" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="16" fill="%23bfdbfe">GEOMETRIC BLUE LAB</text></svg>`,
  
  mascot: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23dbeafe"/><circle cx="200" cy="140" r="70" fill="%233b82f6"/><ellipse cx="180" cy="130" rx="10" ry="14" fill="%23ffffff"/><circle cx="182" cy="130" r="5" fill="%230f172a"/><ellipse cx="220" cy="130" rx="10" ry="14" fill="%23ffffff"/><circle cx="218" cy="130" r="5" fill="%230f172a"/><path d="M 175 165 Q 200 190 225 165" stroke="%23ffffff" stroke-width="5" fill="none" stroke-linecap="round"/><text x="200" y="250" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="%231e3a8a">YCHAN MASCOT v1.0</text></svg>`,
  
  globe: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23172554"/><circle cx="200" cy="150" r="85" fill="%231e40af" stroke="%2360a5fa" stroke-width="3"/><ellipse cx="200" cy="150" rx="85" ry="30" fill="none" stroke="%2393c5fd" stroke-width="2"/><ellipse cx="200" cy="150" rx="40" ry="85" fill="none" stroke="%2393c5fd" stroke-width="2"/><line x1="115" y1="150" x2="285" y2="150" stroke="%2393c5fd" stroke-width="2"/><line x1="200" y1="65" x2="200" y2="235" stroke="%2393c5fd" stroke-width="2"/><text x="200" y="275" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23dbeafe">DEBATES GLOBAIS</text></svg>`
};

const DEFAULT_BOARDS = [
  {
    id: "b",
    slug: "b",
    name: "Aleatório",
    description: "Espaço livre para tópicos sem categoria fixa, memes e conversas casuais.",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "tech",
    slug: "tech",
    name: "Tecnologia",
    description: "Discussão sobre hardware, software, inteligência artificial, Linux e código.",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "art",
    slug: "art",
    name: "Arte & Design",
    description: "Compartilhe ilustrações, fotografia, renders 3D e trabalhos autorais.",
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "pol",
    slug: "pol",
    name: "Política & Notícias",
    description: "Debates de atualidades, notícias internacionais e discussões sociopolíticas.",
    createdAt: "2026-01-01T00:00:00Z"
  }
];

const DEFAULT_THREADS = [
  {
    id: "1001",
    boardSlug: "tech",
    subject: "Qual a sua configuração de desktop minimalista favorita?",
    name: "Anônimo",
    tripcode: "",
    isMod: false,
    isPinned: true,
    isLocked: false,
    timestamp: "2026-10-23T18:30:00Z",
    formattedDate: "23/10/26(Sex)18:30:00",
    text: "Tópico oficial para compartilhar setups limpos e arquiteturas minimalistas.\n>Qual SO você usa?\n>Usa window manager tipo i3 ou bspwm?\n\nDeixem suas dicas de produtividade e otimização.",
    media: {
      fileName: "setup_workstation.svg",
      fileSize: "2.8 KB",
      url: SVG_ASSETS.retroPc,
      thumbUrl: SVG_ASSETS.retroPc
    },
    replies: [
      {
        id: "1002",
        name: "Anônimo",
        tripcode: "",
        isMod: false,
        timestamp: "2026-10-23T18:42:15Z",
        formattedDate: "23/10/26(Sex)18:42:15",
        text: ">>1001\n>Usa window manager tipo i3 ou bspwm?\nUso Sway no Debian Testing. Nada supera a simplicidade de atalhos no teclado sem gastar memória à toa.",
        media: null
      },
      {
        id: "1003",
        name: "Mod",
        tripcode: "#ADMIN",
        isMod: true,
        timestamp: "2026-10-23T19:05:00Z",
        formattedDate: "23/10/26(Sex)19:05:00",
        text: "Lembrando a todos para manterem os debates amigáveis e respeitarem os outros anons. Tópico fixado por relevância.",
        media: null
      },
      {
        id: "1004",
        name: "Anônimo",
        tripcode: "",
        isMod: false,
        timestamp: "2026-10-23T19:22:30Z",
        formattedDate: "23/10/26(Sex)19:22:30",
        text: ">>1002\nBaseado. Eu configurei o Ychan como página inicial padrão do meu navegador minimalista.",
        media: null
      }
    ]
  },
  {
    id: "2001",
    boardSlug: "b",
    subject: "Bem-vindos ao Ychan!",
    name: "Anônimo",
    tripcode: "",
    isMod: false,
    isPinned: false,
    isLocked: false,
    timestamp: "2026-10-23T20:10:00Z",
    formattedDate: "23/10/26(Sex)20:10:00",
    text: "Finalmente um imageboard com visual limpo e em tons de azul.\n>sem formulários chatos de cadastro\n>navegação rápida\n>suporte a imagens locais\n\nPostem o que quiserem aqui no /b/!",
    media: {
      fileName: "ychan_mascot.svg",
      fileSize: "3.1 KB",
      url: SVG_ASSETS.mascot,
      thumbUrl: SVG_ASSETS.mascot
    },
    replies: [
      {
        id: "2002",
        name: "Anônimo",
        tripcode: "",
        isMod: false,
        timestamp: "2026-10-23T20:15:10Z",
        formattedDate: "23/10/26(Sex)20:15:10",
        text: ">>2001\nPrimeiro a responder no /b/ do Ychan!\nO design azul lembra o clássico Yotsuba B mas com uma pegada moderna bem suave aos olhos.",
        media: null
      }
    ]
  },
  {
    id: "3001",
    boardSlug: "art",
    subject: "Estudos de Composição Geométrica e Paleta Azul",
    name: "Anônimo",
    tripcode: "",
    isMod: false,
    isPinned: false,
    isLocked: false,
    timestamp: "2026-10-23T21:00:00Z",
    formattedDate: "23/10/26(Sex)21:00:00",
    text: "Fiz esta arte vetorial minimalista testando contrastes entre tons profundos de azul marinho e ciano.\nO que acharam do equilíbrio visual?",
    media: {
      fileName: "blue_geometry.svg",
      fileSize: "2.4 KB",
      url: SVG_ASSETS.cyberArt,
      thumbUrl: SVG_ASSETS.cyberArt
    },
    replies: [
      {
        id: "3002",
        name: "Anônimo",
        tripcode: "",
        isMod: false,
        timestamp: "2026-10-23T21:18:40Z",
        formattedDate: "23/10/26(Sex)21:18:40",
        text: ">>3001\nFicou excelente! O círculo tracejado dá uma sensação de blueprint técnico.",
        media: null
      }
    ]
  },
  {
    id: "4001",
    boardSlug: "pol",
    subject: "Tendências Geopolíticas Globais para 2027",
    name: "Anônimo",
    tripcode: "",
    isMod: false,
    isPinned: false,
    isLocked: false,
    timestamp: "2026-10-23T21:45:00Z",
    formattedDate: "23/10/26(Sex)21:45:00",
    text: "Com o avanço dos novos blocos econômicos e a corrida pelos semicondutores, como vocês enxergam o equilíbrio entre as potências nos próximos anos?",
    media: {
      fileName: "global_debates.svg",
      fileSize: "2.9 KB",
      url: SVG_ASSETS.globe,
      thumbUrl: SVG_ASSETS.globe
    },
    replies: []
  }
];
