(() => {
  "use strict";

  const STORAGE_KEY = "vida-local-finance-v3";
  const SYNC_META_KEY = `${STORAGE_KEY}-sync-meta`;
  const SYNC_CONFIG_KEY = `${STORAGE_KEY}-sync-config`;
  const BACKUP_META_KEY = `${STORAGE_KEY}-backup-meta`;
  const BACKUP_SLOT_KEYS = [`${STORAGE_KEY}-auto-backup-1`, `${STORAGE_KEY}-auto-backup-2`];
  const CLOUD_SYNC_DEBOUNCE_MS = 1200;
  const AUTO_BACKUP_KEEP_COUNT = 2;
  const WEB_SERVICE_WORKER_PATH = "./service-worker.js";
  const DEFAULT_BACKUP_SETTINGS = {
    enabled: true,
    dayOfWeek: 0,
  };
  const BACKUP_WEEKDAYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const CLT_RULES_2026 = {
    inssBrackets: [
      { limit: 1621, rate: 0.075 },
      { limit: 2902.84, rate: 0.09 },
      { limit: 4354.27, rate: 0.12 },
      { limit: 8475.55, rate: 0.14 },
    ],
    irrfBrackets: [
      { limit: 2428.8, rate: 0, deduction: 0 },
      { limit: 2826.65, rate: 0.075, deduction: 182.16 },
      { limit: 3751.05, rate: 0.15, deduction: 394.16 },
      { limit: 4664.68, rate: 0.225, deduction: 675.49 },
      { limit: Infinity, rate: 0.275, deduction: 908.73 },
    ],
    dependentDeduction: 189.59,
    simplifiedDiscount: 607.2,
    transportRate: 0.06,
    fgtsRate: 0.08,
  };
  const DEFAULT_BENEFITS = {
    mealDaily: 20,
    transportDaily: 22.6,
  };
  const BENEFIT_CALC_TYPES = {
    workday: {
      label: "Por dia util",
      detail: "Valor x dias uteis do mes",
    },
    week: {
      label: "Por semana util",
      detail: "Valor x semanas com dias uteis",
    },
    month: {
      label: "Por mes",
      detail: "Valor fixo mensal",
    },
  };
  const EMPLOYMENT_TYPES = {
    clt: {
      label: "CLT",
      salaryLabel: "Salário bruto CLT",
      note: "Cálculo com INSS, IRRF, FGTS e vale-transporte.",
    },
    pj: {
      label: "PJ",
      salaryLabel: "Faturamento bruto PJ",
      note: "Estimativa com alíquota efetiva configurável. Simples Nacional, fator R e regime tributário variam por CNPJ e atividade.",
    },
    autonomous: {
      label: "Autônomo",
      salaryLabel: "Receita bruta autônomo",
      note: "Estimativa mensal com INSS, IRPF/Carnê-leão, dependentes e deduções informadas.",
    },
    clean: {
      label: "Limpo",
      salaryLabel: "Valor mensal limpo",
      note: "Renda sem desconto, taxa, imposto ou cálculo automático. O valor entra inteiro no mês.",
    },
  };
  const DEFAULT_CDI_ANNUAL_RATE = 10.65;
  const DEFAULT_SAVINGS_CDI_PERCENT = 115;
  const REGISTER_PAGE_CONFIG = {
    salary: {
      title: "Cadastro de salário",
      subtitle: "Salário, benefícios e tipo de vínculo",
    },
    bills: {
      title: "Cadastro de contas fixas",
      subtitle: "Contas fixas do mês selecionado",
    },
    accounts: {
      title: "Cadastro de bancos",
      subtitle: "Bancos, contas e dinheiro",
    },
    cards: {
      title: "Cadastro de cartões",
      subtitle: "Cartões de crédito e limites",
    },
    savings: {
      title: "Cadastro de caixinha",
      subtitle: "Reservas, guardado e investimentos",
    },
    categories: {
      title: "Cadastro de categorias",
      subtitle: "Categorias usadas nas movimentações",
    },
    limits: {
      title: "Cadastro de limites",
      subtitle: "Limite de gasto por categoria",
    },
  };
  const WORKOUT_TYPES = {
    strength: { label: "Forca", column: "Forca" },
    cardio: { label: "Cardio", column: "Cardio" },
    mobility: { label: "Mobilidade", column: "Mobilidade" },
    sport: { label: "Esporte", column: "Esporte" },
    other: { label: "Outro", column: "Outro" },
  };
  const WORKOUT_TYPE_ORDER = ["strength", "cardio", "mobility", "sport", "other"];
  const WORKOUT_WEEKDAYS = [
    { key: "mon", label: "Seg", longLabel: "Segunda" },
    { key: "tue", label: "Ter", longLabel: "Terca" },
    { key: "wed", label: "Qua", longLabel: "Quarta" },
    { key: "thu", label: "Qui", longLabel: "Quinta" },
    { key: "fri", label: "Sex", longLabel: "Sexta" },
    { key: "sat", label: "Sab", longLabel: "Sabado" },
    { key: "sun", label: "Dom", longLabel: "Domingo" },
  ];
  const DEFAULT_WORKOUT_WEEKDAYS = ["mon", "wed", "fri"];
  const DEFAULT_WORKOUT_REWARD = 15;
  const SHOPPING_CATEGORIES = {
    market: { label: "Mercado" },
    needed: { label: "Preciso" },
    nice: { label: "Seria bom ter" },
    want: { label: "Inutil mas eu quero" },
  };
  const SHOPPING_CATEGORY_ORDER = ["market", "needed", "nice", "want"];
  const SHOPPING_WISHLIST_CATEGORY_ORDER = ["needed", "nice", "want"];
  const SHOPPING_FILTERS = ["pending", "purchased", "all"];
  const PANTRY_CATEGORIES = {
    food: { label: "Alimentos" },
    cleaning: { label: "Limpeza" },
    hygiene: { label: "Higiene" },
    supplements: { label: "Suplementos" },
    medicine: { label: "Farmacia" },
    other: { label: "Outros" },
  };
  const PANTRY_CATEGORY_ORDER = ["food", "cleaning", "hygiene", "supplements", "medicine", "other"];
  const PANTRY_LOCATIONS = {
    pantry: { label: "Despensa" },
    fridge: { label: "Geladeira" },
    freezer: { label: "Freezer" },
    bathroom: { label: "Banheiro" },
    laundry: { label: "Lavanderia" },
    other: { label: "Outros" },
  };
  const PANTRY_LOCATION_ORDER = ["pantry", "fridge", "freezer", "bathroom", "laundry", "other"];
  const PANTRY_TRACKING_MODES = {
    estimated: { label: "Consumo estimado" },
    level: { label: "Nivel manual" },
    quantity: { label: "Quantidade exata" },
  };
  const PANTRY_TRACKING_MODE_ORDER = ["estimated", "level", "quantity"];
  const PANTRY_STOCK_LEVELS = {
    full: { label: "Cheio", rank: 3 },
    medium: { label: "Medio", rank: 2 },
    low: { label: "Baixo", rank: 1 },
    empty: { label: "Acabou", rank: 0 },
  };
  const PANTRY_STOCK_LEVEL_ORDER = ["full", "medium", "low", "empty"];
  const PANTRY_STATUS_CONFIG = {
    ok: { label: "Ok" },
    low: { label: "Baixo" },
    empty: { label: "Acabou" },
    expiring: { label: "Vencendo" },
    expired: { label: "Vencido" },
  };
  const PANTRY_STATUS_ORDER = ["all", "ok", "low", "empty", "expiring", "expired"];
  const PANTRY_UNIT_OPTIONS = ["un", "kg", "g", "L", "ml", "pacote", "caixa"];
  const PANTRY_EXPIRING_DAYS = 7;
  const DEFAULT_STUDY_LINK_CATEGORIES = [
    { id: "courses", label: "Faculdade/Cursos", accent: "#238a65" },
    { id: "useful", label: "Links uteis", accent: "#7657c8" },
  ];
  const DEFAULT_STUDY_TODO_CATEGORIES = [
    { id: "draw", label: "Desenho", accent: "#7c3aed" },
    { id: "college", label: "Faculdade", accent: "#0891b2" },
    { id: "course", label: "Curso", accent: "#238a65" },
    { id: "challenge", label: "Desafio", accent: "#b7791f" },
    { id: "other", label: "Outro", accent: "#64748b" },
  ];
  const DEFAULT_STUDY_RESOURCE_CATEGORIES = [
    { id: "subject", label: "Materia", accent: "#7c3aed" },
    { id: "module", label: "Modulo", accent: "#238a65" },
    { id: "challenge", label: "Desafio", accent: "#b7791f" },
    { id: "video", label: "Video aula", accent: "#2f83d0" },
    { id: "reference", label: "Referencia", accent: "#7657c8" },
  ];
  const STUDY_CATEGORY_SCOPES = {
    link: { label: "Links", field: "linkCategories", collection: "links", itemKey: "group", defaults: DEFAULT_STUDY_LINK_CATEGORIES },
    todo: { label: "To do", field: "todoCategories", collection: "todos", itemKey: "area", defaults: DEFAULT_STUDY_TODO_CATEGORIES },
    resource: { label: "Materiais", field: "resourceCategories", collection: "resources", itemKey: "type", defaults: DEFAULT_STUDY_RESOURCE_CATEGORIES },
  };
  const STUDY_CATEGORY_SCOPE_ORDER = ["link", "todo", "resource"];
  const STUDY_POMODORO_MODES = {
    pomodoro: { label: "pomodoro", field: "pomodoroMinutes" },
    short: { label: "short break", field: "shortBreakMinutes" },
    long: { label: "long break", field: "longBreakMinutes" },
  };
  const STUDY_POMODORO_MODE_ORDER = ["pomodoro", "short", "long"];
  const CREATIVE_TYPES = {
    story: { label: "Historias", singular: "Historia", icon: "icon-edit", accent: "#c2417f" },
    code: { label: "Codigo", singular: "Experimento", icon: "icon-code", accent: "#0f766e" },
    image: { label: "Imagens", singular: "Referencia visual", icon: "icon-image", accent: "#2f83d0" },
    model3d: { label: "Modelos 3D", singular: "Modelo 3D", icon: "icon-cube", accent: "#5351ad" },
    dashboard: { label: "Dashboards", singular: "Dashboard", icon: "icon-chart", accent: "#8f5be8" },
    playlist: { label: "Playlists", singular: "Playlist", icon: "icon-list", accent: "#238a65" },
    other: { label: "Outros", singular: "Coringa", icon: "icon-layout", accent: "#b7791f" },
  };
  const CREATIVE_TYPE_ORDER = ["story", "code", "image", "model3d", "dashboard", "playlist", "other"];
  const CREATIVE_STATUSES = {
    idea: { label: "Ideia", accent: "#64748b" },
    draft: { label: "Rascunho", accent: "#c2417f" },
    testing: { label: "Teste", accent: "#2f83d0" },
    done: { label: "Feito", accent: "#238a65" },
    archived: { label: "Arquivo", accent: "#9d6fbe" },
  };
  const CREATIVE_STATUS_ORDER = ["idea", "draft", "testing", "done", "archived"];
  const CREATIVE_LANGUAGES = {
    python: "Python",
    javascript: "JavaScript",
    html: "HTML",
    text: "Texto",
  };
  const CREATIVE_LANGUAGE_ORDER = ["python", "javascript", "html", "text"];
  const CREATIVE_EXTRA_FIELDS = [
    "idea",
    "synopsis",
    "characters",
    "world",
    "outline",
    "scenes",
    "mood",
    "annotations",
    "sketchData",
    "modelBrief",
    "modelChecklist",
    "materials",
    "dashboardBrief",
    "dashboardDataset",
    "dashboardMetrics",
    "dashboardVisuals",
    "dashboardSql",
    "dashboardChecklist",
    "dashboardInsights",
    "playlistGenres",
    "playlistTracks",
    "playlistCollections",
    "playlistMood",
    "playlistRules",
    "playlistNotes",
    "storyDescription",
    "otherBrief",
    "otherSteps",
  ];
  const CREATIVE_STORY_RICH_FIELDS = ["storyDescription", "idea", "synopsis", "characters", "world", "outline", "scenes", "mood", "content"];
  const CREATIVE_STORY_FREE_COLUMNS = 12;
  const CREATIVE_STORY_FREE_ROW_HEIGHT = 92;
  const CREATIVE_RICH_CONTENT_LIMIT = 1200000;
  const CREATIVE_VISUAL_GROUP_TYPES = ["image", "model3d", "dashboard"];
  const CREATIVE_PROJECT_BLOCK_COLUMNS = 12;
  const CREATIVE_PROJECT_BLOCK_ROW_HEIGHT = 96;
  const CREATIVE_PROJECT_BLOCK_TYPES = {
    text: { label: "Texto livre", icon: "icon-edit", defaultTitle: "Texto livre" },
    views: { label: "Visualizacoes", icon: "icon-layout", defaultTitle: "Visualizacoes" },
    subpages: { label: "Subpaginas", icon: "icon-list", defaultTitle: "Subpaginas" },
    image: { label: "Imagens", icon: "icon-image", defaultTitle: "Imagens" },
    whiteboard: { label: "Lousa", icon: "icon-layout", defaultTitle: "Lousa" },
    code: { label: "Codigo", icon: "icon-code", defaultTitle: "Codigo" },
  };
  const CREATIVE_PROJECT_BLOCK_ORDER = ["text", "views", "subpages", "image", "whiteboard", "code"];
  const CREATIVE_TYPE_GUIDES = {
    story: {
      eyebrow: "Subpagina de escrita",
      title: "Historias",
      description: "Estruture premissa, personagens, mundo, cenas e escrita final no mesmo lugar.",
      steps: ["Ideia inicial", "Sinopse", "Personagens", "Mundo", "Linha de cenas", "Escrita"],
    },
    code: {
      eyebrow: "Laboratorio",
      title: "Codigo",
      description: "Teste JavaScript/HTML no navegador e use o simulador simples para Python.",
      steps: ["Desafio", "Codigo", "Rodar", "Console", "Notas", "Proxima melhoria"],
    },
    image: {
      eyebrow: "Referencias visuais",
      title: "Imagens",
      description: "Importe referencias, monte um painel semantico e rabisque ideias com mouse, touch ou caneta.",
      steps: ["Importar", "Mood", "Anotar", "Paleta", "Lousa", "Briefing"],
    },
    model3d: {
      eyebrow: "Modelagem",
      title: "Modelos 3D",
      description: "Organize referencia, escala, materiais, checklist tecnico e anotações para modelagem.",
      steps: ["Referencia", "Blockout", "Topologia", "UV", "Materiais", "Export"],
    },
    dashboard: {
      eyebrow: "BI e relatorios",
      title: "Dashboards",
      description: "Planeje dashboards, relatorios SQL/Power BI, metricas, modelo de dados, visuais e insights.",
      steps: ["Pergunta", "Base", "Modelo", "KPIs", "SQL/DAX", "Visual", "Insight"],
    },
    playlist: {
      eyebrow: "Curadoria musical",
      title: "Playlists",
      description: "Crie categorias de genero, monte playlists novas e abra listas prontas para revisar as musicas salvas.",
      steps: ["Categorias", "Nova playlist", "Nome", "Estilo", "Musicas", "Prontas"],
    },
    other: {
      eyebrow: "Coringa",
      title: "Outros",
      description: "Espaco generico para qualquer ideia que ainda nao tem quadro proprio.",
      steps: ["Briefing", "Pesquisa", "Experimento", "Protótipo", "Feedback", "Entrega"],
    },
  };
  CREATIVE_TYPE_GUIDES.other.steps = ["Objetivo", "Contexto", "Materiais", "Passos", "Notas", "Proxima acao"];
  const CREATIVE_CODE_CHALLENGES = [
    {
      title: "Contador interativo",
      tags: "JavaScript, DOM",
      language: "javascript",
      code: "let count = 0;\ncount += 1;\nconsole.log('Contador:', count);\nconsole.log('Proxima etapa: criar botoes no HTML.');",
      output: "Objetivo: criar um contador, depois transformar em UI com botões.",
    },
    {
      title: "Validador de lista",
      tags: "Python, logica",
      language: "python",
      code: "notas = 7 + 8 + 9\nmedia = notas / 3\nprint('Media:', media)",
      output: "Objetivo: praticar variaveis, operadores e saida.",
    },
    {
      title: "Mini pagina",
      tags: "HTML, prototipo",
      language: "html",
      code: "<main style=\"font-family:sans-serif;padding:24px\">\n  <h1>Meu prototipo</h1>\n  <button onclick=\"document.querySelector('p').textContent='Funcionou'\">Testar</button>\n  <p>Aguardando clique.</p>\n</main>",
      output: "Objetivo: testar HTML/CSS/JS direto no preview.",
    },
  ];
  const CREATIVE_DASHBOARD_CHALLENGES = [
    {
      title: "Vendas e meta",
      tags: "SQL, Power BI, KPI",
      brief: "Dashboard para acompanhar faturamento, meta, ticket medio e variacao por periodo.",
      dataset: "Tabelas: fato_vendas, dim_data, dim_produto, dim_cliente, dim_vendedor.",
      metrics: "Receita, meta, atingimento %, ticket medio, pedidos, margem, top produtos.",
      visuals: "Cards de KPI no topo, linha mensal, barras por categoria, ranking de produtos, filtros de periodo.",
      sql: "SELECT d.mes, p.categoria, SUM(v.valor_total) AS receita\nFROM fato_vendas v\nJOIN dim_data d ON d.data_id = v.data_id\nJOIN dim_produto p ON p.produto_id = v.produto_id\nGROUP BY d.mes, p.categoria;",
      checklist: "Definir grao da fato; validar calendario; criar medidas; revisar filtros; comparar total com fonte.",
      insights: "Perguntas: qual categoria bateu meta? onde a margem caiu? qual vendedor precisa atencao?",
    },
    {
      title: "Financeiro mensal",
      tags: "Relatorio, SQL, fluxo",
      brief: "Relatorio para visualizar receitas, despesas, saldo, inadimplencia e evolucao mensal.",
      dataset: "Tabelas: lancamentos, contas, categorias, calendario, centro_custo.",
      metrics: "Receita, despesa, saldo, % gasto por categoria, contas vencidas, variacao mensal.",
      visuals: "Cards de saldo, waterfall de entradas/saidas, barras por categoria, tabela de pendencias.",
      sql: "SELECT categoria, SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) AS saldo\nFROM lancamentos\nWHERE data_lancamento >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)\nGROUP BY categoria;",
      checklist: "Separar receita/despesa; checar sinal dos valores; criar calendario; validar total por conta.",
      insights: "Perguntas: onde o gasto passou do normal? quais contas vencem primeiro? sobrou caixa?",
    },
    {
      title: "Operacao e SLA",
      tags: "Dashboard, qualidade, tempo",
      brief: "Painel para acompanhar volume, backlog, SLA, tempo medio e gargalos por etapa.",
      dataset: "Tabelas: tickets, dim_data, dim_equipe, dim_status, dim_prioridade.",
      metrics: "Tickets abertos, fechados, backlog, SLA %, tempo medio, envelhecimento, fila por responsavel.",
      visuals: "Cards de volume/SLA, funil por status, heatmap por prioridade, ranking de filas.",
      sql: "SELECT status, prioridade, COUNT(*) AS tickets, AVG(DATEDIFF(hour, aberto_em, fechado_em)) AS horas_media\nFROM tickets\nGROUP BY status, prioridade;",
      checklist: "Definir SLA; tratar tickets sem fechamento; separar backlog atual; revisar duplicados.",
      insights: "Perguntas: onde o SLA estoura? qual fila acumula? qual prioridade tem maior atraso?",
    },
  ];
  const CREATIVE_OTHER_IDEAS = [
    { title: "Game design", text: "Loop principal, regras, recompensa, dificuldade, prototipo jogavel." },
    { title: "Roteiro de video", text: "Gancho, promessa, blocos, exemplos, chamada final." },
    { title: "Audio ou musica", text: "Clima, referencias, instrumentos, estrutura, variações." },
    { title: "UI/UX", text: "Problema, usuario, fluxo, wireframe, teste, melhoria." },
    { title: "Produto", text: "Publico, dor, proposta, prototipo, custo, validacao." },
    { title: "Pesquisa", text: "Pergunta, fontes, hipoteses, achados, proximos passos." },
  ];
  const MEDIA_TYPES = {
    reading: { label: "Leitura", itemLabel: "obra", unitLabel: "paginas" },
    movies: { label: "Filmes", itemLabel: "filme", unitLabel: "minutos" },
    series: { label: "Series", itemLabel: "serie", unitLabel: "episodios" },
    games: { label: "Jogos", itemLabel: "jogo", unitLabel: "horas" },
  };
  const MEDIA_TYPE_ORDER = ["reading", "movies", "series", "games"];
  const MEDIA_SECTIONS = {
    items: { label: "Lista" },
    categories: { label: "Categorias" },
    statuses: { label: "Status" },
  };
  const MEDIA_DEFAULT_CATEGORIES = {
    reading: ["Manga", "Livro", "Light novel", "Visual novel", "Quadrinho", "Manhwa"],
    movies: ["Filme", "Animacao", "Documentario", "Curta"],
    series: ["Serie", "Anime", "Dorama", "Documentario"],
    games: ["Jogo", "RPG", "Aventura", "Estrategia", "Simulador", "Indie"],
  };
  const MEDIA_DEFAULT_STATUSES = [
    { id: "in-progress", name: "Andamento", color: "#2f83d0" },
    { id: "not-started", name: "Nao iniciado", color: "#64748b" },
    { id: "completed", name: "Concluido", color: "#238a65" },
    { id: "dropped", name: "Dropado", color: "#b45a52" },
  ];
  const MEDIA_MAX_COVER_SIZE = 560;
  const MEDIA_COVER_MIN_SIZE = 320;
  const MEDIA_COVER_QUALITY = 0.72;
  const MEDIA_COVER_TARGET_LENGTH = 340000;
  const MEDIA_COVER_DB_NAME = "jornada-media-covers";
  const MEDIA_COVER_DB_STORE = "covers";
  const RECIPE_CATEGORIES = {
    savory: { label: "Salgado" },
    sweet: { label: "Doce" },
    meal: { label: "Refeição" },
    drink: { label: "Bebida" },
    other: { label: "Outras" },
  };
  const RECIPE_CATEGORY_ORDER = ["savory", "sweet", "meal", "drink", "other"];
  const RECIPE_STATUSES = {
    idea: { label: "Ideia" },
    planned: { label: "Planejada" },
    tested: { label: "Feita" },
  };
  const RECIPE_STATUS_ORDER = ["idea", "planned", "tested"];
  const RECIPE_FILTER_STATUSES = ["all", ...RECIPE_STATUS_ORDER, "favorite"];
  const RECIPE_DEFAULT_STATUS_COLORS = {
    idea: "#64748b",
    planned: "#b7791f",
    tested: "#238a65",
  };
  const DEFAULT_NUTRITION_PROFILE = {
    weightKg: 70,
    heightCm: 170,
    age: 30,
    sex: "male",
    activityFactor: 1.55,
    goal: "maintain",
    proteinFactor: 1.6,
    waterMlKg: 35,
  };
  const NUTRITION_GOAL_ADJUSTMENTS = {
    cut: -300,
    maintain: 0,
    gain: 300,
  };
  const FOOD_CATALOG = [
    { id: "egg", name: "Ovo", group: "Proteinas", portion: "1 unidade", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0 },
    { id: "egg-white", name: "Clara de ovo", group: "Proteinas", portion: "3 unidades", calories: 51, protein: 10.8, carbs: 0.7, fat: 0.2, fiber: 0 },
    { id: "chicken", name: "Frango", group: "Proteinas", portion: "1 file medio", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    { id: "turkey", name: "Peito de peru", group: "Proteinas", portion: "1 porcao", calories: 135, protein: 29, carbs: 0, fat: 1.7, fiber: 0 },
    { id: "beef", name: "Patinho", group: "Proteinas", portion: "1 porcao", calories: 217, protein: 26, carbs: 0, fat: 12, fiber: 0 },
    { id: "lean-beef", name: "Carne magra", group: "Proteinas", portion: "1 bife medio", calories: 220, protein: 28, carbs: 0, fat: 11, fiber: 0 },
    { id: "pork-loin", name: "Lombo suino", group: "Proteinas", portion: "1 porcao", calories: 190, protein: 27, carbs: 0, fat: 8, fiber: 0 },
    { id: "fish", name: "Tilapia", group: "Proteinas", portion: "1 file", calories: 128, protein: 26, carbs: 0, fat: 2.7, fiber: 0 },
    { id: "tuna", name: "Atum", group: "Proteinas", portion: "1 lata escorrida", calories: 132, protein: 29, carbs: 0, fat: 1, fiber: 0 },
    { id: "sardine", name: "Sardinha", group: "Proteinas", portion: "1 lata escorrida", calories: 190, protein: 23, carbs: 0, fat: 10, fiber: 0 },
    { id: "salmon", name: "Salmao", group: "Proteinas", portion: "1 posta", calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0 },
    { id: "shrimp", name: "Camarao", group: "Proteinas", portion: "1 porcao", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 },
    { id: "tofu", name: "Tofu", group: "Proteinas", portion: "1 porcao", calories: 94, protein: 10, carbs: 2, fat: 6, fiber: 0.5 },
    { id: "soy-protein", name: "Proteina de soja", group: "Proteinas", portion: "1 xicara", calories: 150, protein: 22, carbs: 9, fat: 4, fiber: 5 },
    { id: "chickpea", name: "Grao-de-bico", group: "Proteinas", portion: "1 concha", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6 },
    { id: "lentil", name: "Lentilha", group: "Proteinas", portion: "1 concha", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
    { id: "rice", name: "Arroz branco", group: "Carboidratos", portion: "1 colher de servir", calories: 104, protein: 2.1, carbs: 22.6, fat: 0.2, fiber: 0.4 },
    { id: "brown-rice", name: "Arroz integral", group: "Carboidratos", portion: "1 colher de servir", calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8 },
    { id: "beans", name: "Feijao", group: "Carboidratos", portion: "1 concha pequena", calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5 },
    { id: "black-beans", name: "Feijao preto", group: "Carboidratos", portion: "1 concha pequena", calories: 77, protein: 5.2, carbs: 13.8, fat: 0.5, fiber: 8.7 },
    { id: "sweet-potato", name: "Batata doce", group: "Carboidratos", portion: "1 unidade pequena", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3 },
    { id: "potato", name: "Batata inglesa", group: "Carboidratos", portion: "1 unidade media", calories: 130, protein: 3, carbs: 30, fat: 0.2, fiber: 3 },
    { id: "cassava", name: "Mandioca", group: "Carboidratos", portion: "1 pedaco medio", calories: 160, protein: 1.4, carbs: 38, fat: 0.3, fiber: 1.8 },
    { id: "yam", name: "Inhame", group: "Carboidratos", portion: "1 unidade pequena", calories: 118, protein: 1.5, carbs: 28, fat: 0.2, fiber: 4.1 },
    { id: "pasta", name: "Macarrao", group: "Carboidratos", portion: "1 pegador", calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8 },
    { id: "french-bread", name: "Pao frances", group: "Carboidratos", portion: "1 unidade", calories: 150, protein: 4.7, carbs: 28.5, fat: 1.6, fiber: 1.2 },
    { id: "whole-bread", name: "Pao integral", group: "Carboidratos", portion: "2 fatias", calories: 138, protein: 6, carbs: 24, fat: 2, fiber: 4 },
    { id: "oats", name: "Aveia", group: "Carboidratos", portion: "2 colheres de sopa", calories: 117, protein: 5.1, carbs: 19.9, fat: 2.1, fiber: 3.2 },
    { id: "tapioca", name: "Tapioca", group: "Carboidratos", portion: "1 disco medio", calories: 160, protein: 0.3, carbs: 39, fat: 0.1, fiber: 0.3 },
    { id: "couscous", name: "Cuscuz", group: "Carboidratos", portion: "1 fatia media", calories: 112, protein: 2.2, carbs: 25, fat: 0.7, fiber: 1.5 },
    { id: "quinoa", name: "Quinoa", group: "Carboidratos", portion: "1/2 xicara", calories: 111, protein: 4.1, carbs: 19.7, fat: 1.8, fiber: 2.6 },
    { id: "corn", name: "Milho", group: "Carboidratos", portion: "1 espiga pequena", calories: 99, protein: 3.5, carbs: 21.6, fat: 1.5, fiber: 2.5 },
    { id: "granola", name: "Granola", group: "Carboidratos", portion: "2 colheres de sopa", calories: 120, protein: 3, carbs: 18, fat: 4.5, fiber: 2.5 },
    { id: "banana", name: "Banana", group: "Frutas", portion: "1 unidade", calories: 77, protein: 1, carbs: 20, fat: 0.3, fiber: 2.1 },
    { id: "apple", name: "Maca", group: "Frutas", portion: "1 unidade", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
    { id: "orange", name: "Laranja", group: "Frutas", portion: "1 unidade", calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, fiber: 3.1 },
    { id: "papaya", name: "Mamao", group: "Frutas", portion: "1 fatia grande", calories: 59, protein: 0.9, carbs: 15, fat: 0.2, fiber: 2.5 },
    { id: "mango", name: "Manga", group: "Frutas", portion: "1/2 unidade", calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6 },
    { id: "strawberry", name: "Morango", group: "Frutas", portion: "1 xicara", calories: 49, protein: 1, carbs: 11.7, fat: 0.5, fiber: 3 },
    { id: "grapes", name: "Uva", group: "Frutas", portion: "1 cacho pequeno", calories: 62, protein: 0.6, carbs: 16, fat: 0.2, fiber: 0.8 },
    { id: "avocado", name: "Abacate", group: "Frutas", portion: "1/4 unidade", calories: 120, protein: 1.5, carbs: 6, fat: 11, fiber: 5 },
    { id: "watermelon", name: "Melancia", group: "Frutas", portion: "1 fatia", calories: 46, protein: 0.9, carbs: 11.5, fat: 0.2, fiber: 0.6 },
    { id: "pear", name: "Pera", group: "Frutas", portion: "1 unidade", calories: 101, protein: 0.6, carbs: 27, fat: 0.3, fiber: 5.5 },
    { id: "pineapple", name: "Abacaxi", group: "Frutas", portion: "1 fatia", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4 },
    { id: "kiwi", name: "Kiwi", group: "Frutas", portion: "1 unidade", calories: 42, protein: 0.8, carbs: 10, fat: 0.4, fiber: 2.1 },
    { id: "broccoli", name: "Brocolis", group: "Vegetais", portion: "1 xicara", calories: 31, protein: 2.4, carbs: 6, fat: 0.3, fiber: 2.4 },
    { id: "salad", name: "Salada de folhas", group: "Vegetais", portion: "1 prato", calories: 10, protein: 1, carbs: 2, fat: 0.1, fiber: 1.2 },
    { id: "carrot", name: "Cenoura", group: "Vegetais", portion: "1 unidade media", calories: 25, protein: 0.6, carbs: 6, fat: 0.1, fiber: 1.7 },
    { id: "tomato", name: "Tomate", group: "Vegetais", portion: "1 unidade", calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5 },
    { id: "zucchini", name: "Abobrinha", group: "Vegetais", portion: "1 xicara", calories: 20, protein: 1.5, carbs: 3.9, fat: 0.4, fiber: 1.2 },
    { id: "kale", name: "Couve", group: "Vegetais", portion: "1 xicara", calories: 33, protein: 2.2, carbs: 6.7, fat: 0.5, fiber: 1.3 },
    { id: "spinach", name: "Espinafre", group: "Vegetais", portion: "1 xicara", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    { id: "cucumber", name: "Pepino", group: "Vegetais", portion: "1/2 unidade", calories: 16, protein: 0.7, carbs: 3.8, fat: 0.1, fiber: 0.5 },
    { id: "beet", name: "Beterraba", group: "Vegetais", portion: "1 unidade pequena", calories: 35, protein: 1.3, carbs: 8, fat: 0.1, fiber: 2.3 },
    { id: "cabbage", name: "Repolho", group: "Vegetais", portion: "1 xicara", calories: 22, protein: 1.1, carbs: 5.2, fat: 0.1, fiber: 2.2 },
    { id: "cauliflower", name: "Couve-flor", group: "Vegetais", portion: "1 xicara", calories: 25, protein: 2, carbs: 5, fat: 0.3, fiber: 2 },
    { id: "pumpkin", name: "Abobora", group: "Vegetais", portion: "1 xicara", calories: 49, protein: 1.8, carbs: 12, fat: 0.2, fiber: 2.7 },
    { id: "milk", name: "Leite integral", group: "Laticinios", portion: "1 copo", calories: 122, protein: 6.4, carbs: 9.6, fat: 6.6, fiber: 0 },
    { id: "skim-milk", name: "Leite desnatado", group: "Laticinios", portion: "1 copo", calories: 83, protein: 8.3, carbs: 12, fat: 0.2, fiber: 0 },
    { id: "yogurt", name: "Iogurte natural", group: "Laticinios", portion: "1 pote", calories: 105, protein: 6, carbs: 8, fat: 5, fiber: 0 },
    { id: "greek-yogurt", name: "Iogurte grego", group: "Laticinios", portion: "1 pote", calories: 130, protein: 13, carbs: 7, fat: 5, fiber: 0 },
    { id: "cheese", name: "Queijo minas", group: "Laticinios", portion: "1 fatia", calories: 79, protein: 5.2, carbs: 0.9, fat: 6, fiber: 0 },
    { id: "cottage", name: "Cottage", group: "Laticinios", portion: "2 colheres de sopa", calories: 55, protein: 7, carbs: 2, fat: 2, fiber: 0 },
    { id: "ricotta", name: "Ricota", group: "Laticinios", portion: "1 fatia", calories: 72, protein: 5.3, carbs: 1.5, fat: 5, fiber: 0 },
    { id: "olive-oil", name: "Azeite", group: "Gorduras", portion: "1 colher de sopa", calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0 },
    { id: "nuts", name: "Castanhas", group: "Gorduras", portion: "1 punhado", calories: 170, protein: 5, carbs: 6, fat: 15, fiber: 3 },
    { id: "peanut", name: "Amendoim", group: "Gorduras", portion: "1 punhado", calories: 166, protein: 7, carbs: 6, fat: 14, fiber: 2.4 },
    { id: "peanut-butter", name: "Pasta de amendoim", group: "Gorduras", portion: "1 colher de sopa", calories: 94, protein: 4, carbs: 3.2, fat: 8, fiber: 1 },
    { id: "chia", name: "Chia", group: "Gorduras", portion: "1 colher de sopa", calories: 58, protein: 2, carbs: 5, fat: 3.7, fiber: 4.1 },
    { id: "flaxseed", name: "Linhaca", group: "Gorduras", portion: "1 colher de sopa", calories: 55, protein: 1.9, carbs: 3, fat: 4.3, fiber: 2.8 },
    { id: "sunflower-seed", name: "Semente de girassol", group: "Gorduras", portion: "1 colher de sopa", calories: 51, protein: 1.8, carbs: 2, fat: 4.5, fiber: 1 },
    { id: "pumpkin-seed", name: "Semente de abobora", group: "Gorduras", portion: "1 colher de sopa", calories: 56, protein: 2.5, carbs: 1.7, fat: 4.8, fiber: 0.7 },
    { id: "chicken-thigh", name: "Sobrecoxa sem pele", group: "Proteinas", portion: "1 unidade media", calories: 176, protein: 24, carbs: 0, fat: 8.5, fiber: 0 },
    { id: "ground-turkey", name: "Peru moido", group: "Proteinas", portion: "1 porcao", calories: 170, protein: 27, carbs: 0, fat: 7, fiber: 0 },
    { id: "hake", name: "Pescada", group: "Proteinas", portion: "1 file", calories: 115, protein: 23, carbs: 0, fat: 2.4, fiber: 0 },
    { id: "cod", name: "Bacalhau dessalgado", group: "Proteinas", portion: "1 porcao", calories: 105, protein: 23, carbs: 0, fat: 0.9, fiber: 0 },
    { id: "mackerel", name: "Cavalinha", group: "Proteinas", portion: "1 file", calories: 205, protein: 19, carbs: 0, fat: 14, fiber: 0 },
    { id: "mussel", name: "Mexilhao", group: "Proteinas", portion: "1 xicara", calories: 146, protein: 20, carbs: 6, fat: 4, fiber: 0 },
    { id: "tempeh", name: "Tempeh", group: "Proteinas", portion: "1 porcao", calories: 195, protein: 20, carbs: 9, fat: 11, fiber: 6 },
    { id: "edamame", name: "Edamame", group: "Proteinas", portion: "1/2 xicara", calories: 94, protein: 9, carbs: 7, fat: 4, fiber: 4 },
    { id: "white-beans", name: "Feijao branco", group: "Proteinas", portion: "1 concha pequena", calories: 125, protein: 8.7, carbs: 22, fat: 0.4, fiber: 6.3 },
    { id: "black-eyed-peas", name: "Feijao fradinho", group: "Proteinas", portion: "1 concha pequena", calories: 100, protein: 6.7, carbs: 17.8, fat: 0.5, fiber: 5.6 },
    { id: "peas", name: "Ervilha", group: "Proteinas", portion: "1/2 xicara", calories: 67, protein: 4.3, carbs: 12, fat: 0.4, fiber: 4.4 },
    { id: "barley", name: "Cevada", group: "Carboidratos", portion: "1/2 xicara", calories: 97, protein: 1.8, carbs: 22, fat: 0.3, fiber: 3 },
    { id: "millet", name: "Milheto", group: "Carboidratos", portion: "1/2 xicara", calories: 103, protein: 3, carbs: 20.6, fat: 0.9, fiber: 1.1 },
    { id: "amaranth", name: "Amaranto", group: "Carboidratos", portion: "1/2 xicara", calories: 126, protein: 4.7, carbs: 23, fat: 1.9, fiber: 2.6 },
    { id: "whole-pasta", name: "Macarrao integral", group: "Carboidratos", portion: "1 pegador", calories: 174, protein: 7, carbs: 37, fat: 1.2, fiber: 6.3 },
    { id: "rye-bread", name: "Pao de centeio", group: "Carboidratos", portion: "2 fatias", calories: 166, protein: 5.4, carbs: 31, fat: 2.1, fiber: 3.8 },
    { id: "plantain", name: "Banana-da-terra", group: "Carboidratos", portion: "1 unidade pequena", calories: 122, protein: 1.3, carbs: 31.9, fat: 0.4, fiber: 2.3 },
    { id: "buckwheat", name: "Trigo sarraceno", group: "Carboidratos", portion: "1/2 xicara", calories: 78, protein: 2.9, carbs: 17, fat: 0.6, fiber: 2.7 },
    { id: "guava", name: "Goiaba", group: "Frutas", portion: "1 unidade", calories: 68, protein: 2.6, carbs: 14.3, fat: 1, fiber: 5.4 },
    { id: "passion-fruit", name: "Maracuja", group: "Frutas", portion: "1 unidade", calories: 17, protein: 0.4, carbs: 4.2, fat: 0.1, fiber: 1.9 },
    { id: "melon", name: "Melao", group: "Frutas", portion: "1 fatia", calories: 54, protein: 1.3, carbs: 13, fat: 0.3, fiber: 1.4 },
    { id: "acerola", name: "Acerola", group: "Frutas", portion: "1/2 xicara", calories: 31, protein: 0.4, carbs: 7.5, fat: 0.3, fiber: 1.1 },
    { id: "peach", name: "Pessego", group: "Frutas", portion: "1 unidade", calories: 59, protein: 1.4, carbs: 14, fat: 0.4, fiber: 2.3 },
    { id: "plum", name: "Ameixa", group: "Frutas", portion: "2 unidades", calories: 61, protein: 0.8, carbs: 15.6, fat: 0.4, fiber: 2 },
    { id: "blueberry", name: "Mirtilo", group: "Frutas", portion: "1/2 xicara", calories: 42, protein: 0.5, carbs: 10.7, fat: 0.2, fiber: 1.8 },
    { id: "tangerine", name: "Mexerica", group: "Frutas", portion: "1 unidade", calories: 47, protein: 0.7, carbs: 12, fat: 0.3, fiber: 1.6 },
    { id: "coconut-water", name: "Agua de coco", group: "Frutas", portion: "1 copo", calories: 45, protein: 1.7, carbs: 9, fat: 0.5, fiber: 2.6 },
    { id: "eggplant", name: "Berinjela", group: "Vegetais", portion: "1 xicara", calories: 20, protein: 0.8, carbs: 4.8, fat: 0.1, fiber: 2.5 },
    { id: "okra", name: "Quiabo", group: "Vegetais", portion: "1 xicara", calories: 33, protein: 1.9, carbs: 7.5, fat: 0.2, fiber: 3.2 },
    { id: "green-beans", name: "Vagem", group: "Vegetais", portion: "1 xicara", calories: 44, protein: 2.4, carbs: 10, fat: 0.3, fiber: 4 },
    { id: "chayote", name: "Chuchu", group: "Vegetais", portion: "1 xicara", calories: 25, protein: 1.1, carbs: 6, fat: 0.2, fiber: 2.2 },
    { id: "bell-pepper", name: "Pimentao", group: "Vegetais", portion: "1 unidade", calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5 },
    { id: "onion", name: "Cebola", group: "Vegetais", portion: "1/2 unidade", calories: 22, protein: 0.6, carbs: 5.1, fat: 0.1, fiber: 0.9 },
    { id: "mushroom", name: "Cogumelo", group: "Vegetais", portion: "1 xicara", calories: 15, protein: 2.2, carbs: 2.3, fat: 0.2, fiber: 0.7 },
    { id: "arugula", name: "Rucula", group: "Vegetais", portion: "1 prato", calories: 10, protein: 1, carbs: 1.5, fat: 0.2, fiber: 0.6 },
    { id: "watercress", name: "Agriao", group: "Vegetais", portion: "1 prato", calories: 8, protein: 0.8, carbs: 1.3, fat: 0, fiber: 0.5 },
    { id: "asparagus", name: "Aspargos", group: "Vegetais", portion: "1 xicara", calories: 27, protein: 3, carbs: 5.2, fat: 0.2, fiber: 2.8 },
    { id: "kefir", name: "Kefir", group: "Laticinios", portion: "1 copo", calories: 104, protein: 9, carbs: 12, fat: 2.5, fiber: 0 },
    { id: "curd", name: "Coalhada", group: "Laticinios", portion: "1 pote", calories: 98, protein: 6, carbs: 7, fat: 5, fiber: 0 },
    { id: "light-cheese", name: "Queijo branco light", group: "Laticinios", portion: "1 fatia", calories: 55, protein: 6, carbs: 1, fat: 3, fiber: 0 },
    { id: "almonds", name: "Amendoas", group: "Gorduras", portion: "1 punhado", calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
    { id: "walnuts", name: "Nozes", group: "Gorduras", portion: "1 punhado", calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, fiber: 1.9 },
    { id: "cashew-nuts", name: "Castanha de caju", group: "Gorduras", portion: "1 punhado", calories: 157, protein: 5.2, carbs: 8.6, fat: 12.4, fiber: 0.9 },
    { id: "sesame", name: "Gergelim", group: "Gorduras", portion: "1 colher de sopa", calories: 52, protein: 1.6, carbs: 2.1, fat: 4.5, fiber: 1.1 },
    { id: "tahini", name: "Tahine", group: "Gorduras", portion: "1 colher de sopa", calories: 89, protein: 2.6, carbs: 3.2, fat: 8, fiber: 1.4 },
  ];
  const PLATE_IDEAS = [
    { id: "rice-beans-chicken-broccoli", title: "Arroz, feijao, frango e brocolis", tags: "PF equilibrado", items: [["rice", 1], ["beans", 1], ["chicken", 1], ["broccoli", 1]] },
    { id: "brown-rice-hake-salad-guava", title: "Arroz integral, pescada, salada e goiaba", tags: "Peixe + fibra", items: [["brown-rice", 1], ["hake", 1], ["salad", 1.5], ["guava", 1]] },
    { id: "sweet-potato-chicken-kale", title: "Batata doce, frango e couve", tags: "Pre treino", items: [["sweet-potato", 1.5], ["chicken", 1], ["kale", 1]] },
    { id: "lentil-rice-egg-salad", title: "Lentilha, arroz, ovo e salada", tags: "Barato e completo", items: [["lentil", 1], ["rice", 0.8], ["egg", 2], ["salad", 1]] },
    { id: "tuna-rye-bread-tomato", title: "Atum, pao de centeio e tomate", tags: "Rapido", items: [["tuna", 1], ["rye-bread", 1], ["tomato", 1], ["olive-oil", 0.5]] },
    { id: "oats-banana-kefir-chia", title: "Aveia, banana, kefir e chia", tags: "Cafe com fibra", items: [["oats", 1], ["banana", 1], ["kefir", 1], ["chia", 1]] },
    { id: "lean-beef-potato-green-beans", title: "Carne magra, batata e vagem", tags: "Prato forte", items: [["lean-beef", 1], ["potato", 1], ["green-beans", 1], ["salad", 1]] },
    { id: "chickpea-quinoa-egg-spinach", title: "Grao-de-bico, quinoa, ovo e espinafre", tags: "Mais fibras", items: [["chickpea", 1], ["quinoa", 1], ["egg", 1], ["spinach", 1]] },
    { id: "salmon-brown-rice-zucchini", title: "Salmao, arroz integral e abobrinha", tags: "Gorduras boas", items: [["salmon", 1], ["brown-rice", 1], ["zucchini", 1.5]] },
    { id: "turkey-couscous-tomato-arugula", title: "Peito de peru, cuscuz, tomate e rucula", tags: "Pratico", items: [["turkey", 1], ["couscous", 1], ["tomato", 1], ["arugula", 1]] },
    { id: "tofu-barley-broccoli-sesame", title: "Tofu, cevada, brocolis e gergelim", tags: "Sem carne", items: [["tofu", 1.5], ["barley", 1], ["broccoli", 1.5], ["sesame", 1]] },
    { id: "sardine-cassava-watercress", title: "Sardinha, mandioca e agriao", tags: "Omega e energia", items: [["sardine", 1], ["cassava", 1], ["watercress", 1.5]] },
    { id: "egg-rice-beans-cabbage", title: "Ovo, arroz, feijao e repolho", tags: "PF simples", items: [["egg", 2], ["rice", 1], ["beans", 1], ["cabbage", 1]] },
    { id: "chicken-whole-pasta-broccoli", title: "Frango, macarrao integral e brocolis", tags: "Pos treino", items: [["chicken", 1], ["whole-pasta", 1], ["broccoli", 1]] },
    { id: "greek-yogurt-apple-almonds", title: "Iogurte grego, maca e amendoas", tags: "Lanche", items: [["greek-yogurt", 1], ["apple", 1], ["almonds", 0.5], ["flaxseed", 1]] },
    { id: "shrimp-quinoa-salad-avocado", title: "Camarao, quinoa, salada e abacate", tags: "Leve", items: [["shrimp", 1], ["quinoa", 1], ["salad", 1.5], ["avocado", 0.5]] },
    { id: "pork-loin-yam-pumpkin", title: "Lombo, inhame e abobora", tags: "Almoco", items: [["pork-loin", 1], ["yam", 1], ["pumpkin", 1]] },
    { id: "black-beans-rice-okra-salad", title: "Feijao preto, arroz, quiabo e salada", tags: "Alta fibra", items: [["black-beans", 1], ["rice", 1], ["okra", 1], ["salad", 1]] },
    { id: "cottage-banana-oats-flaxseed", title: "Cottage, banana, aveia e linhaca", tags: "Lanche proteico", items: [["cottage", 2], ["banana", 1], ["oats", 1], ["flaxseed", 1]] },
    { id: "soy-protein-brown-rice-cauliflower", title: "Proteina de soja, arroz integral e couve-flor", tags: "Sem carne", items: [["soy-protein", 1], ["brown-rice", 1], ["cauliflower", 1.5]] },
    { id: "tapioca-egg-light-cheese-tomato", title: "Tapioca, ovo, queijo branco e tomate", tags: "Cafe reforcado", items: [["tapioca", 1], ["egg", 2], ["light-cheese", 1], ["tomato", 1]] },
    { id: "skim-milk-oats-papaya-chia", title: "Leite, aveia, mamao e chia", tags: "Cafe da manha", items: [["skim-milk", 1], ["oats", 1], ["papaya", 1], ["chia", 1]] },
    { id: "chicken-corn-salad-beet", title: "Frango, milho, salada e beterraba", tags: "Colorido", items: [["chicken", 1], ["corn", 1], ["salad", 1], ["beet", 1]] },
    { id: "tempeh-buckwheat-asparagus", title: "Tempeh, trigo sarraceno e aspargos", tags: "Vegetariano", items: [["tempeh", 1], ["buckwheat", 1], ["asparagus", 1.5]] },
    { id: "cod-potato-bell-pepper-salad", title: "Bacalhau, batata, pimentao e salada", tags: "Peixe magro", items: [["cod", 1], ["potato", 1], ["bell-pepper", 1], ["salad", 1]] },
    { id: "mackerel-rice-cucumber-tomato", title: "Cavalinha, arroz, pepino e tomate", tags: "Omega 3", items: [["mackerel", 1], ["rice", 1], ["cucumber", 1], ["tomato", 1]] },
    { id: "edamame-quinoa-mushroom-spinach", title: "Edamame, quinoa, cogumelo e espinafre", tags: "Sem carne", items: [["edamame", 1], ["quinoa", 1], ["mushroom", 1], ["spinach", 1]] },
    { id: "white-beans-brown-rice-carrot", title: "Feijao branco, arroz integral e cenoura", tags: "Alta fibra", items: [["white-beans", 1], ["brown-rice", 1], ["carrot", 1], ["olive-oil", 0.5]] },
    { id: "black-eyed-peas-couscous-kale", title: "Feijao fradinho, cuscuz e couve", tags: "Brasileiro", items: [["black-eyed-peas", 1], ["couscous", 1], ["kale", 1]] },
    { id: "chicken-thigh-plantain-cabbage", title: "Sobrecoxa, banana-da-terra e repolho", tags: "Prato completo", items: [["chicken-thigh", 1], ["plantain", 1], ["cabbage", 1]] },
    { id: "ground-turkey-whole-pasta-zucchini", title: "Peru moido, macarrao integral e abobrinha", tags: "Pos treino", items: [["ground-turkey", 1], ["whole-pasta", 1], ["zucchini", 1]] },
    { id: "mussel-barley-tomato-arugula", title: "Mexilhao, cevada, tomate e rucula", tags: "Minerais", items: [["mussel", 1], ["barley", 1], ["tomato", 1], ["arugula", 1]] },
    { id: "beef-cassava-eggplant", title: "Patinho, mandioca e berinjela", tags: "Almoco forte", items: [["beef", 1], ["cassava", 1], ["eggplant", 1]] },
    { id: "fish-millet-broccoli", title: "Tilapia, milheto e brocolis", tags: "Leve", items: [["fish", 1], ["millet", 1], ["broccoli", 1.5]] },
    { id: "yogurt-strawberry-granola-chia", title: "Iogurte, morango, granola e chia", tags: "Lanche doce", items: [["yogurt", 1], ["strawberry", 1], ["granola", 1], ["chia", 0.5]] },
    { id: "kefir-mango-oats-walnuts", title: "Kefir, manga, aveia e nozes", tags: "Cafe com gordura boa", items: [["kefir", 1], ["mango", 0.5], ["oats", 1], ["walnuts", 0.4]] },
    { id: "whole-bread-egg-avocado-tomato", title: "Pao integral, ovo, abacate e tomate", tags: "Lanche completo", items: [["whole-bread", 1], ["egg", 2], ["avocado", 0.4], ["tomato", 1]] },
    { id: "french-bread-turkey-light-cheese", title: "Pao frances, peito de peru, queijo branco e tomate", tags: "Pratico", items: [["french-bread", 1], ["turkey", 0.7], ["light-cheese", 1], ["tomato", 1]] },
    { id: "curd-papaya-flaxseed-nuts", title: "Coalhada, mamao, linhaca e castanhas", tags: "Cafe leve", items: [["curd", 1], ["papaya", 1], ["flaxseed", 1], ["nuts", 0.5]] },
    { id: "milk-banana-peanut-butter-oats", title: "Leite, banana, aveia e pasta de amendoim", tags: "Energia", items: [["milk", 1], ["banana", 1], ["oats", 1], ["peanut-butter", 1]] },
    { id: "lentil-sweet-potato-watercress", title: "Lentilha, batata doce e agriao", tags: "Vegetariano", items: [["lentil", 1], ["sweet-potato", 1], ["watercress", 1.5], ["olive-oil", 0.5]] },
    { id: "chickpea-eggplant-tahini-salad", title: "Grao-de-bico, berinjela, tahine e salada", tags: "Mediterraneo", items: [["chickpea", 1], ["eggplant", 1], ["tahini", 0.5], ["salad", 1.5]] },
    { id: "salmon-quinoa-asparagus", title: "Salmao, quinoa e aspargos", tags: "DASH", items: [["salmon", 1], ["quinoa", 1], ["asparagus", 1.5]] },
    { id: "tuna-potato-green-beans", title: "Atum, batata e vagem", tags: "Rapido", items: [["tuna", 1], ["potato", 1], ["green-beans", 1]] },
    { id: "chicken-amaranth-carrot-salad", title: "Frango, amaranto, cenoura e salada", tags: "Variado", items: [["chicken", 1], ["amaranth", 1], ["carrot", 1], ["salad", 1]] },
    { id: "tofu-rice-black-beans-bell-pepper", title: "Tofu, arroz, feijao preto e pimentao", tags: "Sem carne", items: [["tofu", 1.5], ["rice", 1], ["black-beans", 1], ["bell-pepper", 1]] },
    { id: "sardine-corn-tomato-cucumber", title: "Sardinha, milho, tomate e pepino", tags: "Rapido e leve", items: [["sardine", 1], ["corn", 1], ["tomato", 1], ["cucumber", 1]] },
    { id: "ricotta-pear-almonds-chia", title: "Ricota, pera, amendoas e chia", tags: "Lanche", items: [["ricotta", 1.5], ["pear", 1], ["almonds", 0.5], ["chia", 0.5]] },
    { id: "shrimp-brown-rice-chayote", title: "Camarao, arroz integral e chuchu", tags: "Leve", items: [["shrimp", 1], ["brown-rice", 1], ["chayote", 1.5]] },
    { id: "cod-chickpea-spinach", title: "Bacalhau, grao-de-bico e espinafre", tags: "Proteico", items: [["cod", 1], ["chickpea", 1], ["spinach", 1.5], ["olive-oil", 0.5]] },
  ];
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const percentFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  const integerFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  });
  const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  });
  const holidayDateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const VIEW_HASHES = {
    home: "#inicio",
    finance: "#financas",
    workouts: "#treinos",
    study: "#estudos",
    creative: "#area-criativa",
    media: "#biblioteca",
    recipes: "#receitas",
    pantry: "#despensa",
    shopping: "#compras",
    system: "#sistema",
  };
  const MOBILE_NAV_ITEMS = {
    home: { label: "Home", icon: "icon-home" },
    finance: { label: "Finanças", icon: "icon-wallet" },
    workouts: { label: "Treinos", icon: "icon-dumbbell" },
    shopping: { label: "Compras", icon: "icon-list" },
    pantry: { label: "Despensa", icon: "icon-cube" },
    study: { label: "Estudos", icon: "icon-book" },
    creative: { label: "Criativa", icon: "icon-code" },
    media: { label: "Biblioteca", icon: "icon-book" },
    recipes: { label: "Receitas", icon: "icon-utensils" },
  };
  const MOBILE_NAV_DEFAULT_ORDER = ["home", "finance", "workouts", "shopping", "pantry", "study", "creative", "media", "recipes"];
  const HOME_WIDGET_SIZES = {
    small: "Pequeno",
    medium: "Medio",
    wide: "Largo",
    tall: "Alto",
    large: "Grande",
  };
  const HOME_WIDGET_SIZE_CONFIG = {
    small: { cols: 1, rows: 1 },
    medium: { cols: 2, rows: 1 },
    wide: { cols: 3, rows: 1 },
    tall: { cols: 1, rows: 2 },
    large: { cols: 2, rows: 2 },
  };
  const HOME_WIDGET_MIN_COLUMNS = 1;
  const HOME_WIDGET_MAX_COLUMNS = 4;
  const HOME_WIDGET_MIN_ROWS = 1;
  const HOME_WIDGET_MAX_ROWS = 8;
  const HOME_WIDGET_GRID_ROW_HEIGHT = 74;
  const HOME_WIDGET_GRID_GAP = 16;
  const HOME_WIDGET_DEFINITIONS = {
    finance: { label: "Financas", defaultSize: "wide" },
    workouts: { label: "Treinos", defaultSize: "wide" },
    study: { label: "Estudos", defaultSize: "wide" },
    creative: { label: "Area Criativa", defaultSize: "wide" },
    media: { label: "Biblioteca", defaultSize: "wide" },
    recipes: { label: "Receitas", defaultSize: "wide" },
    pantry: { label: "Despensa", defaultSize: "small" },
    shopping: { label: "Compras", defaultSize: "small" },
  };
  const HOME_DEFAULT_WIDGET_ORDER = ["finance", "workouts", "study", "creative", "media", "recipes", "pantry", "shopping"];
  const PAGE_BLOCK_MAX_COLUMNS = 4;
  const PAGE_BLOCK_MIN_ROWS = 2;
  const PAGE_BLOCK_MAX_ROWS = 8;
  const PAGE_BLOCK_GRID_ROW_HEIGHT = 72;
  const PAGE_BLOCK_GRID_GAP = 12;
  const PAGE_LAYOUT_SCHEMA_VERSION = 6;
  const PAGE_LAYOUT_MIN_ROWS = 2;
  const PAGE_LAYOUT_MAX_ROWS = 18;
  const PAGE_LAYOUT_GRID_ROW_HEIGHT = 72;
  const PAGE_LAYOUT_GRID_GAP = 12;
  const PAGE_BLOCK_TYPES = {
    note: { label: "Texto" },
    list: { label: "Lista" },
    columns: { label: "Colunas" },
    table: { label: "Linhas" },
    board: { label: "Quadro" },
    gallery: { label: "Cards" },
  };
  const PAGE_BLOCK_TYPE_ORDER = ["note", "list", "columns", "table", "board", "gallery"];

  let state = loadState();
  let selectedMonth = startupSelectedMonth(state.settings?.selectedMonth);
  let transactionMonthFilter = normalizeTransactionMonthFilter(state.settings?.transactionMonthFilter, selectedMonth);
  let backupSettings = normalizeBackupSettings(state.settings?.backup);
  let theme = state.settings?.theme || preferredTheme();
  let activeView = hashToView(window.location.hash);
  let activeRegisterPage = normalizeRegisterPage(state.settings?.activeRegisterPage);
  let mobileNavOrder = normalizeMobileNavOrder(state.settings?.mobileNavOrder);
  let activeSalaryEntryId = "";
  let transactionsExpanded = false;
  let toastTimer = null;
  let homeDragWidgetId = "";
  let homePointerDragState = null;
  let homeResizeState = null;
  let homeWidgetContentFitFrame = 0;
  let homeDropPreview = null;
  let pageBlockDragState = null;
  let pageBlockResizeState = null;
  let pageBlockContentFitFrame = 0;
  let pageBlockDropPreview = null;
  let pageLayoutDragState = null;
  let pageLayoutResizeState = null;
  let shoppingDragItemId = "";
  let shoppingMarketPage = "pending";
  let shoppingMarketSumSelection = new Set();
  let studyCalendarMonth = state.study?.calendarMonth || currentMonth();
  let studySelectedDate = state.study?.selectedDate || todayDate();
  let studyPomodoroTimer = null;
  let activeCreativeItemId = state.settings?.activeCreativeItemId || "";
  let activeCreativeType = normalizeCreativeType(state.settings?.activeCreativeType || "story");
  let systemUpdateInfo = null;
  let creativeAutosaveTimer = null;
  let creativeRunToken = 0;
  let activeCreativeRichSelection = null;
  let activeRecipeDetailId = "";
  let autoBackupRunning = false;
  let mediaCoverDbPromise = null;
  const mediaCoverRuntimeCache = new Map();
  const filters = {
    search: "",
    type: "all",
    category: "all",
    account: "all",
    workoutStatus: normalizeWorkoutFilter(state.settings?.workoutStatusFilter),
    shoppingStatus: normalizeShoppingFilter(state.settings?.shoppingStatusFilter),
    pantrySearch: state.settings?.pantrySearch || "",
    pantryCategory: normalizePantryCategoryFilter(state.settings?.pantryCategoryFilter),
    pantryLocation: normalizePantryLocationFilter(state.settings?.pantryLocationFilter),
    pantryStatus: normalizePantryStatusFilter(state.settings?.pantryStatusFilter),
    pantryMode: normalizePantryModeFilter(state.settings?.pantryModeFilter),
    recipeCategory: normalizeRecipeCategoryFilter(state.settings?.recipeCategoryFilter),
    recipeStatus: normalizeRecipeStatusFilter(state.settings?.recipeStatusFilter),
    recipeSection: normalizeRecipeSection(state.settings?.recipeSection),
    recipeSearch: "",
  };
  const els = {};
  const initialSyncMeta = readSyncMeta();
  const cloudSync = {
    configured: false,
    client: null,
    user: null,
    channel: null,
    saveTimer: null,
    applyingRemote: false,
    stateVersion: Number(initialSyncMeta.stateVersion) || 0,
    status: "offline",
    message: "Nuvem nao configurada",
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    applyTheme(theme);
    updateThemeToggle();
    bindEvents();
    setupWebRuntime();
    els.monthPicker.value = transactionMonthFilter;
    render();
    switchView(activeView, { replaceHash: true });
    syncMediaCoverStorage()
      .then(() => {
        saveState({ sync: false });
      })
      .catch(() => {})
      .finally(() => setupCloudSync());
  }

  function isNativeMobileRuntime() {
    try {
      return Boolean(window.Capacitor?.isNativePlatform?.()) || window.Capacitor?.getPlatform?.() === "android";
    } catch (error) {
      return false;
    }
  }

  function isWebBrowserRuntime() {
    return !window.JornadaDesktop && !isNativeMobileRuntime();
  }

  function isWebFileOrigin() {
    return isWebBrowserRuntime() && window.location.protocol === "file:";
  }

  function setupWebRuntime() {
    if (!isWebBrowserRuntime()) {
      return;
    }

    if ("serviceWorker" in navigator && /^(https?:)$/i.test(window.location.protocol)) {
      navigator.serviceWorker.register(WEB_SERVICE_WORKER_PATH).catch((error) => {
        console.warn("Nao foi possivel ativar o modo web offline.", error);
      });
    }

    window.addEventListener("online", () => {
      if (cloudSync.user) {
        setCloudStatus("syncing", "Conexao voltou. Sincronizando nuvem...");
        scheduleCloudSync();
      }
    });

    window.addEventListener("offline", () => {
      if (cloudSync.user) {
        setCloudStatus("offline", "Sem internet. Alteracoes ficam neste navegador e sincronizam quando voltar.");
      }
    });
  }

  function cacheElements() {
    els.main = document.querySelector(".main");
    els.homeView = document.querySelector("#home-view");
    els.viewPanels = document.querySelectorAll("[data-view-panel]");
    els.viewButtons = document.querySelectorAll("[data-view-target]");
    els.openViewButtons = document.querySelectorAll("[data-open-view]");
    els.homeGlobalSearch = document.querySelector("#home-global-search");
    els.homeGlobalSearchResults = document.querySelector("#home-global-search-results");
    els.homeFinanceSpendable = document.querySelector("#home-finance-spendable");
    els.homeFinancePerDay = document.querySelector("#home-finance-per-day");
    els.homeFinanceIncome = document.querySelector("#home-finance-income");
    els.homeFinanceExpense = document.querySelector("#home-finance-expense");
    els.homeFinanceFixedRemaining = document.querySelector("#home-finance-fixed-remaining");
    els.homeFinanceNoSpendDays = document.querySelector("#home-finance-no-spend-days");
    els.homeFinanceNoSpendAccumulated = document.querySelector("#home-finance-no-spend-accumulated");
    els.homeFinanceStatus = document.querySelector("#home-finance-status");
    els.homeFinanceNextBills = document.querySelector("#home-finance-next-bills");
    els.homeRhythmForecast = document.querySelector("#home-rhythm-forecast");
    els.homeRhythmCalendar = document.querySelector("#home-rhythm-calendar");
    els.homeRhythmDays = document.querySelector("#home-rhythm-days");
    els.homeRhythmAccumulated = document.querySelector("#home-rhythm-accumulated");
    els.homeRhythmDaily = document.querySelector("#home-rhythm-daily");
    els.homeTodayDate = document.querySelector("#home-today-date");
    els.homeTodayList = document.querySelector("#home-today-list");
    els.homeInboxForm = document.querySelector("#home-inbox-form");
    els.homeInboxKind = document.querySelector("#home-inbox-kind");
    els.homeInboxText = document.querySelector("#home-inbox-text");
    els.homeInboxList = document.querySelector("#home-inbox-list");
    els.homeWidgetGrid = document.querySelector("#home-widget-grid");
    els.homeCustomizeToggle = document.querySelector("#home-customize-toggle");
    els.newHomeWidget = document.querySelector("#new-home-widget");
    els.resetHomeLayout = document.querySelector("#reset-home-layout");
    els.homeHudActions = document.querySelectorAll(".home-hud-action");
    els.pageEditToggle = document.querySelector("#page-edit-toggle");
    els.pageAddBlock = document.querySelector("#page-add-block");
    els.openSystem = document.querySelector("#open-system");
    els.cloudSyncButton = document.querySelector("#cloud-sync-button");
    els.cloudSyncStatus = document.querySelector("#cloud-sync-status");
    els.cloudSyncLabel = document.querySelector("#cloud-sync-label");
    els.hudBackupStatus = document.querySelector("#hud-backup-status");
    els.hudVersionStatus = document.querySelector("#hud-version-status");
    els.hudVersionLabel = document.querySelector("#hud-version-label");
    els.cloudSyncForm = document.querySelector("#cloud-sync-form");
    els.cloudSyncDetail = document.querySelector("#cloud-sync-detail");
    els.cloudSyncEmail = document.querySelector("#cloud-sync-email");
    els.cloudSyncPassword = document.querySelector("#cloud-sync-password");
    els.cloudSyncConfigAdmin = document.querySelector("#cloud-sync-config-admin");
    els.cloudSyncUrl = document.querySelector("#cloud-sync-url");
    els.cloudSyncAnonKey = document.querySelector("#cloud-sync-anon-key");
    els.saveCloudSyncConfig = document.querySelector("#save-cloud-sync-config");
    els.cloudSyncSignup = document.querySelector("#cloud-sync-signup");
    els.cloudSyncLogout = document.querySelector("#cloud-sync-logout");
    els.systemCloudState = document.querySelector("#system-cloud-state");
    els.backupEnabled = document.querySelector("#backup-enabled");
    els.backupDay = document.querySelector("#backup-day");
    els.backupStatus = document.querySelector("#backup-status");
    els.backupRunNow = document.querySelector("#backup-run-now");
    els.systemUpdateCurrent = document.querySelector("#system-update-current");
    els.systemUpdateLatest = document.querySelector("#system-update-latest");
    els.systemUpdateRuntime = document.querySelector("#system-update-runtime");
    els.systemUpdateStatus = document.querySelector("#system-update-status");
    els.systemUpdateNotes = document.querySelector("#system-update-notes");
    els.systemUpdateAction = document.querySelector("#system-update-action");
    els.mobileNavOrderList = document.querySelector("#mobile-nav-order-list");
    els.mobileBottomNav = document.querySelector("#mobile-bottom-nav");
    els.mobileMoreDialog = document.querySelector("#mobile-more-dialog");
    els.closeMobileMore = document.querySelector("#close-mobile-more");
    els.mobileMoreList = document.querySelector("#mobile-more-list");
    els.homeHiddenWidgets = document.querySelector("#home-hidden-widgets");
    els.homeWidgetDialog = document.querySelector("#home-widget-dialog");
    els.homeWidgetForm = document.querySelector("#home-widget-form");
    els.homeWidgetDialogTitle = document.querySelector("#home-widget-dialog-title");
    els.homeWidgetId = document.querySelector("#home-widget-id");
    els.homeWidgetTitle = document.querySelector("#home-widget-title");
    els.homeWidgetSize = document.querySelector("#home-widget-size");
    els.homeWidgetColor = document.querySelector("#home-widget-color");
    els.homeWidgetNote = document.querySelector("#home-widget-note");
    els.homeWidgetPageContent = document.querySelector("#home-widget-page-content");
    els.closeHomeWidgetDialog = document.querySelector("#close-home-widget-dialog");
    els.cancelHomeWidgetDialog = document.querySelector("#cancel-home-widget-dialog");
    els.pageBlockDialog = document.querySelector("#page-block-dialog");
    els.pageBlockForm = document.querySelector("#page-block-form");
    els.pageBlockPageId = document.querySelector("#page-block-page-id");
    els.pageBlockType = document.querySelector("#page-block-type");
    els.pageBlockTypeOptions = document.querySelector("#page-block-type-options");
    els.pageBlockTitle = document.querySelector("#page-block-title");
    els.pageBlockBody = document.querySelector("#page-block-body");
    els.closePageBlockDialog = document.querySelector("#close-page-block-dialog");
    els.cancelPageBlockDialog = document.querySelector("#cancel-page-block-dialog");
    els.pantryTotalCount = document.querySelector("#pantry-total-count");
    els.pantryTotalDetail = document.querySelector("#pantry-total-detail");
    els.pantryRestockCount = document.querySelector("#pantry-restock-count");
    els.pantryRestockDetail = document.querySelector("#pantry-restock-detail");
    els.pantryExpiringCount = document.querySelector("#pantry-expiring-count");
    els.pantryExpiringDetail = document.querySelector("#pantry-expiring-detail");
    els.pantryRestockEstimate = document.querySelector("#pantry-restock-estimate");
    els.pantrySearch = document.querySelector("#pantry-search");
    els.pantryCategoryFilter = document.querySelector("#pantry-category-filter");
    els.pantryLocationFilter = document.querySelector("#pantry-location-filter");
    els.pantryStatusFilter = document.querySelector("#pantry-status-filter");
    els.pantryModeFilter = document.querySelector("#pantry-mode-filter");
    els.pantryList = document.querySelector("#pantry-list");
    els.newPantryItem = document.querySelector("#new-pantry-item");
    els.pantryItemDialog = document.querySelector("#pantry-item-dialog");
    els.pantryForm = document.querySelector("#pantry-form");
    els.pantryItemDialogTitle = document.querySelector("#pantry-item-dialog-title");
    els.pantryFormSubtitle = document.querySelector("#pantry-form-subtitle");
    els.pantryItemId = document.querySelector("#pantry-item-id");
    els.pantryItemName = document.querySelector("#pantry-item-name");
    els.pantryItemCategory = document.querySelector("#pantry-item-category");
    els.pantryItemLocation = document.querySelector("#pantry-item-location");
    els.pantryItemTrackingMode = document.querySelector("#pantry-item-tracking-mode");
    els.pantryItemUnit = document.querySelector("#pantry-item-unit");
    els.pantryItemQuantity = document.querySelector("#pantry-item-quantity");
    els.pantryItemStockLevel = document.querySelector("#pantry-item-stock-level");
    els.pantryItemMinQuantity = document.querySelector("#pantry-item-min-quantity");
    els.pantryItemTargetQuantity = document.querySelector("#pantry-item-target-quantity");
    els.pantryItemAveragePrice = document.querySelector("#pantry-item-average-price");
    els.pantryItemExpirationDate = document.querySelector("#pantry-item-expiration-date");
    els.pantryItemConsumptionAmount = document.querySelector("#pantry-item-consumption-amount");
    els.pantryItemConsumptionDays = document.querySelector("#pantry-item-consumption-days");
    els.pantryItemNotes = document.querySelector("#pantry-item-notes");
    els.pantryModeHelp = document.querySelector("#pantry-mode-help");
    els.pantrySubmitLabel = document.querySelector("#pantry-submit-label");
    els.closePantryItemDialog = document.querySelector("#close-pantry-item-dialog");
    els.cancelPantryEdit = document.querySelector("#cancel-pantry-edit");
    els.pantryQuantityFields = document.querySelectorAll(".pantry-field-quantity");
    els.pantryLevelFields = document.querySelectorAll(".pantry-field-level");
    els.pantryConsumptionFields = document.querySelectorAll(".pantry-field-consumption");
    els.pantryUnitFields = document.querySelectorAll(".pantry-field-unit");
    els.pantryMinimumFields = document.querySelectorAll(".pantry-field-minimum");
    els.pantryTargetFields = document.querySelectorAll(".pantry-field-target");
    els.shoppingPendingTotal = document.querySelector("#shopping-pending-total");
    els.shoppingPendingDetail = document.querySelector("#shopping-pending-detail");
    els.shoppingPurchasedTotal = document.querySelector("#shopping-purchased-total");
    els.shoppingPurchasedDetail = document.querySelector("#shopping-purchased-detail");
    els.shoppingEstimatedTotal = document.querySelector("#shopping-estimated-total");
    els.shoppingEstimatedDetail = document.querySelector("#shopping-estimated-detail");
    els.shoppingItemTotal = document.querySelector("#shopping-item-total");
    els.shoppingListDetail = document.querySelector("#shopping-list-detail");
    els.shoppingItemDialog = document.querySelector("#shopping-item-dialog");
    els.shoppingItemDialogTitle = document.querySelector("#shopping-item-dialog-title");
    els.shoppingForm = document.querySelector("#shopping-form");
    els.shoppingFormSubtitle = document.querySelector("#shopping-form-subtitle");
    els.shoppingItemId = document.querySelector("#shopping-item-id");
    els.shoppingItemName = document.querySelector("#shopping-item-name");
    els.shoppingItemQuantity = document.querySelector("#shopping-item-quantity");
    els.shoppingItemCategory = document.querySelector("#shopping-item-category");
    els.shoppingItemPrice = document.querySelector("#shopping-item-price");
    els.shoppingItemUrl = document.querySelector("#shopping-item-url");
    els.shoppingItemPriority = document.querySelector("#shopping-item-priority");
    els.shoppingSubmitLabel = document.querySelector("#shopping-submit-label");
    els.cancelShoppingEdit = document.querySelector("#cancel-shopping-edit");
    els.closeShoppingItemDialog = document.querySelector("#close-shopping-item-dialog");
    els.shoppingMarketList = document.querySelector("#shopping-market-list");
    els.shoppingList = document.querySelector("#shopping-list");
    els.shoppingItemCategoryField = els.shoppingItemCategory?.closest(".field");
    els.shoppingItemUrlField = els.shoppingItemUrl?.closest(".field");
    els.studyScheduleTotal = document.querySelector("#study-schedule-total");
    els.studyScheduleDetail = document.querySelector("#study-schedule-detail");
    els.studyTodoOpenTotal = document.querySelector("#study-todo-open-total");
    els.studyTodoDetail = document.querySelector("#study-todo-detail");
    els.studyResourceTotal = document.querySelector("#study-resource-total");
    els.studyResourceDetail = document.querySelector("#study-resource-detail");
    els.studyReferenceTotal = document.querySelector("#study-reference-total");
    els.studyReferenceDetail = document.querySelector("#study-reference-detail");
    els.studyScheduleBoard = document.querySelector("#study-schedule-board");
    els.studyLinkForm = document.querySelector("#study-link-form");
    els.studyLinkTitle = document.querySelector("#study-link-title");
    els.studyLinkUrl = document.querySelector("#study-link-url");
    els.studyLinkGroup = document.querySelector("#study-link-group");
    els.studyLinkList = document.querySelector("#study-link-list");
    els.studyTodoForm = document.querySelector("#study-todo-form");
    els.studyTodoTitle = document.querySelector("#study-todo-title");
    els.studyTodoArea = document.querySelector("#study-todo-area");
    els.studyTodoDue = document.querySelector("#study-todo-due");
    els.studyTodoList = document.querySelector("#study-todo-list");
    els.studyCalendarMonthLabel = document.querySelector("#study-calendar-month-label");
    els.studyCalendarGrid = document.querySelector("#study-calendar-grid");
    els.studyCalendarDateLabel = document.querySelector("#study-calendar-date-label");
    els.studyCalendarNoteForm = document.querySelector("#study-calendar-note-form");
    els.studyCalendarNoteTitle = document.querySelector("#study-calendar-note-title");
    els.studyCalendarNoteBody = document.querySelector("#study-calendar-note-body");
    els.studyCalendarNoteList = document.querySelector("#study-calendar-note-list");
    els.studyResourceForm = document.querySelector("#study-resource-form");
    els.studyResourceTitle = document.querySelector("#study-resource-title");
    els.studyResourceType = document.querySelector("#study-resource-type");
    els.studyResourceUrl = document.querySelector("#study-resource-url");
    els.studyResourceNotes = document.querySelector("#study-resource-notes");
    els.studyResourceList = document.querySelector("#study-resource-list");
    els.studyPomodoroModes = document.querySelector("#study-pomodoro-modes");
    els.studyPomodoroTime = document.querySelector("#study-pomodoro-time");
    els.studyPomodoroStatus = document.querySelector("#study-pomodoro-status");
    els.studyPomodoroStart = document.querySelector("#study-pomodoro-start");
    els.studyPomodoroReset = document.querySelector("#study-pomodoro-reset");
    els.studyPomodoroDuration = document.querySelector("#study-pomodoro-duration");
    els.studyShortBreakDuration = document.querySelector("#study-short-break-duration");
    els.studyLongBreakDuration = document.querySelector("#study-long-break-duration");
    els.openStudyCategories = document.querySelector("#open-study-categories");
    els.studyCategoryDialog = document.querySelector("#study-category-dialog");
    els.closeStudyCategoryDialog = document.querySelector("#close-study-category-dialog");
    els.studyCategoryForm = document.querySelector("#study-category-form");
    els.studyCategoryScope = document.querySelector("#study-category-scope");
    els.studyCategoryName = document.querySelector("#study-category-name");
    els.studyCategoryColor = document.querySelector("#study-category-color");
    els.studyCategoryList = document.querySelector("#study-category-list");
    els.creativeTotalCount = document.querySelector("#creative-total-count");
    els.creativeTotalDetail = document.querySelector("#creative-total-detail");
    els.creativeActiveCount = document.querySelector("#creative-active-count");
    els.creativeActiveDetail = document.querySelector("#creative-active-detail");
    els.creativeReferenceCount = document.querySelector("#creative-reference-count");
    els.creativeReferenceDetail = document.querySelector("#creative-reference-detail");
    els.creativeCodeCount = document.querySelector("#creative-code-count");
    els.creativeCodeDetail = document.querySelector("#creative-code-detail");
    els.newCreativeItem = document.querySelector("#new-creative-item");
    els.creativeBoard = document.querySelector("#creative-board");
    els.creativeDetail = document.querySelector("#creative-detail");
    els.creativeItemDialog = document.querySelector("#creative-item-dialog");
    els.creativeItemForm = document.querySelector("#creative-item-form");
    els.creativeItemDialogTitle = document.querySelector("#creative-item-dialog-title");
    els.creativeItemFormSubtitle = document.querySelector("#creative-item-form-subtitle");
    els.creativeItemId = document.querySelector("#creative-item-id");
    els.creativeItemTitle = document.querySelector("#creative-item-title");
    els.creativeItemType = document.querySelector("#creative-item-type");
    els.creativeItemStatus = document.querySelector("#creative-item-status");
    els.creativeItemTags = document.querySelector("#creative-item-tags");
    els.creativeItemLink = document.querySelector("#creative-item-link");
    els.creativeItemImageUrl = document.querySelector("#creative-item-image-url");
    els.creativeItemModelUrl = document.querySelector("#creative-item-model-url");
    els.creativeItemReference = document.querySelector("#creative-item-reference");
    els.creativeItemContent = document.querySelector("#creative-item-content");
    els.creativeItemLanguage = document.querySelector("#creative-item-language");
    els.creativeItemCode = document.querySelector("#creative-item-code");
    els.creativeItemOutput = document.querySelector("#creative-item-output");
    els.creativeItemSubmitLabel = document.querySelector("#creative-item-submit-label");
    els.closeCreativeItemDialog = document.querySelector("#close-creative-item-dialog");
    els.cancelCreativeItemDialog = document.querySelector("#cancel-creative-item-dialog");
    els.creativeImageField = els.creativeItemImageUrl?.closest(".creative-image-field");
    els.creativeModelField = els.creativeItemModelUrl?.closest(".creative-model-field");
    els.creativeLanguageField = els.creativeItemLanguage?.closest(".creative-language-field");
    els.creativeCodeField = els.creativeItemCode?.closest(".creative-code-field");
    els.mediaTotalCount = document.querySelector("#media-total-count");
    els.mediaTotalDetail = document.querySelector("#media-total-detail");
    els.mediaProgressCount = document.querySelector("#media-progress-count");
    els.mediaProgressDetail = document.querySelector("#media-progress-detail");
    els.mediaCompletedCount = document.querySelector("#media-completed-count");
    els.mediaCompletedDetail = document.querySelector("#media-completed-detail");
    els.mediaTypeTabs = document.querySelector("#media-type-tabs");
    els.mediaSectionButtons = document.querySelectorAll("[data-media-section]");
    els.mediaSectionPanels = document.querySelectorAll("[data-media-section-panel]");
    els.mediaStatusTabs = document.querySelector("#media-status-tabs");
    els.mediaGrid = document.querySelector("#media-grid");
    els.newMediaItem = document.querySelector("#new-media-item");
    els.mediaCategoryForm = document.querySelector("#media-category-form");
    els.mediaCategoryName = document.querySelector("#media-category-name");
    els.mediaCategoryList = document.querySelector("#media-category-list");
    els.mediaCategoryDetail = document.querySelector("#media-category-detail");
    els.mediaStatusForm = document.querySelector("#media-status-form");
    els.mediaStatusName = document.querySelector("#media-status-name");
    els.mediaStatusList = document.querySelector("#media-status-list");
    els.mediaStatusDetail = document.querySelector("#media-status-detail");
    els.mediaItemDialog = document.querySelector("#media-item-dialog");
    els.mediaItemForm = document.querySelector("#media-item-form");
    els.mediaItemDialogTitle = document.querySelector("#media-item-dialog-title");
    els.mediaItemFormSubtitle = document.querySelector("#media-item-form-subtitle");
    els.mediaItemId = document.querySelector("#media-item-id");
    els.mediaItemCoverData = document.querySelector("#media-item-cover-data");
    els.mediaItemTitle = document.querySelector("#media-item-title");
    els.mediaItemType = document.querySelector("#media-item-type");
    els.mediaItemCategory = document.querySelector("#media-item-category");
    els.mediaItemStatus = document.querySelector("#media-item-status");
    els.mediaItemUrl = document.querySelector("#media-item-url");
    els.mediaItemProgressCurrent = document.querySelector("#media-item-progress-current");
    els.mediaItemProgressMax = document.querySelector("#media-item-progress-max");
    els.mediaItemCover = document.querySelector("#media-item-cover");
    els.mediaCoverPreview = document.querySelector("#media-cover-preview");
    els.mediaItemSubmitLabel = document.querySelector("#media-item-submit-label");
    els.closeMediaItemDialog = document.querySelector("#close-media-item-dialog");
    els.cancelMediaItemDialog = document.querySelector("#cancel-media-item-dialog");
    els.recipesTotalCount = document.querySelector("#recipes-total-count");
    els.recipesTotalDetail = document.querySelector("#recipes-total-detail");
    els.recipesPlannedCount = document.querySelector("#recipes-planned-count");
    els.recipesPlannedDetail = document.querySelector("#recipes-planned-detail");
    els.recipesFavoriteCount = document.querySelector("#recipes-favorite-count");
    els.recipesFavoriteDetail = document.querySelector("#recipes-favorite-detail");
    els.recipesDoneCount = document.querySelector("#recipes-done-count");
    els.recipesDoneDetail = document.querySelector("#recipes-done-detail");
    els.newRecipe = document.querySelector("#new-recipe");
    els.recipeSectionButtons = document.querySelectorAll("[data-recipe-section]");
    els.recipeSectionPanels = document.querySelectorAll("[data-recipe-section-panel]");
    els.recipeSearch = document.querySelector("#recipe-search");
    els.recipeCategoryFilter = document.querySelector("#recipe-category-filter");
    els.recipeStatusFilter = document.querySelector("#recipe-status-filter");
    els.recipeCategoryTabs = document.querySelector("#recipe-category-tabs");
    els.recipeGrid = document.querySelector("#recipe-grid");
    els.recipeCategoryForm = document.querySelector("#recipe-category-form");
    els.recipeCategoryName = document.querySelector("#recipe-category-name");
    els.recipeCategoryDetail = document.querySelector("#recipe-category-detail");
    els.recipeCategoryList = document.querySelector("#recipe-category-list");
    els.recipeStatusForm = document.querySelector("#recipe-status-form");
    els.recipeStatusName = document.querySelector("#recipe-status-name");
    els.recipeStatusColor = document.querySelector("#recipe-status-color");
    els.recipeStatusDetail = document.querySelector("#recipe-status-detail");
    els.recipeStatusList = document.querySelector("#recipe-status-list");
    els.recipeDialog = document.querySelector("#recipe-dialog");
    els.recipeForm = document.querySelector("#recipe-form");
    els.recipeDialogTitle = document.querySelector("#recipe-dialog-title");
    els.recipeFormSubtitle = document.querySelector("#recipe-form-subtitle");
    els.recipeId = document.querySelector("#recipe-id");
    els.recipeTitle = document.querySelector("#recipe-title");
    els.recipeCategory = document.querySelector("#recipe-category");
    els.recipeStatus = document.querySelector("#recipe-status");
    els.recipePrepTime = document.querySelector("#recipe-prep-time");
    els.recipeServings = document.querySelector("#recipe-servings");
    els.recipeUrl = document.querySelector("#recipe-url");
    els.recipeFavorite = document.querySelector("#recipe-favorite");
    els.recipeRating = document.querySelector("#recipe-rating");
    els.recipeReview = document.querySelector("#recipe-review");
    els.recipeIngredients = document.querySelector("#recipe-ingredients");
    els.recipeSteps = document.querySelector("#recipe-steps");
    els.recipeNotes = document.querySelector("#recipe-notes");
    els.recipeSubmitLabel = document.querySelector("#recipe-submit-label");
    els.closeRecipeDialog = document.querySelector("#close-recipe-dialog");
    els.cancelRecipeDialog = document.querySelector("#cancel-recipe-dialog");
    els.recipeDetailDialog = document.querySelector("#recipe-detail-dialog");
    els.recipeDetailEyebrow = document.querySelector("#recipe-detail-eyebrow");
    els.recipeDetailTitle = document.querySelector("#recipe-detail-title");
    els.recipeDetailMeta = document.querySelector("#recipe-detail-meta");
    els.recipeDetailContent = document.querySelector("#recipe-detail-content");
    els.closeRecipeDetailDialog = document.querySelector("#close-recipe-detail-dialog");
    els.closeRecipeDetailFooter = document.querySelector("#close-recipe-detail-footer");
    els.editRecipeDetail = document.querySelector("#edit-recipe-detail");
    els.financeCardStrip = document.querySelector("#finance-card-strip");
    els.workoutWeekDetail = document.querySelector("#workout-week-detail");
    els.newWorkout = document.querySelector("#new-workout");
    els.workoutDialog = document.querySelector("#workout-dialog");
    els.workoutDialogTitle = document.querySelector("#workout-dialog-title");
    els.workoutForm = document.querySelector("#workout-form");
    els.workoutFormSubtitle = document.querySelector("#workout-form-subtitle");
    els.workoutId = document.querySelector("#workout-id");
    els.workoutTitle = document.querySelector("#workout-title");
    els.workoutType = document.querySelector("#workout-type");
    els.workoutReward = document.querySelector("#workout-reward");
    els.workoutWeekdays = document.querySelectorAll("[name='workout-weekdays']");
    els.workoutRestInputs = document.querySelectorAll("[data-workout-rest-day]");
    els.workoutStatus = document.querySelector("#workout-status");
    els.workoutNotes = document.querySelector("#workout-notes");
    els.workoutExerciseRows = document.querySelector("#workout-exercise-rows");
    els.addWorkoutExercise = document.querySelector("#add-workout-exercise");
    els.closeWorkoutDialog = document.querySelector("#close-workout-dialog");
    els.cancelWorkoutEdit = document.querySelector("#cancel-workout-edit");
    els.workoutSubmitLabel = document.querySelector("#workout-submit-label");
    els.workoutListSubtitle = document.querySelector("#workout-list-subtitle");
    els.workoutList = document.querySelector("#workout-list");
    els.workoutWeekGrid = document.querySelector("#workout-week-grid");
    els.workoutHistoryList = document.querySelector("#workout-history-list");
    els.nutritionTargetNote = document.querySelector("#nutrition-target-note");
    els.nutritionWeight = document.querySelector("#nutrition-weight");
    els.nutritionHeight = document.querySelector("#nutrition-height");
    els.nutritionAge = document.querySelector("#nutrition-age");
    els.nutritionSex = document.querySelector("#nutrition-sex");
    els.nutritionActivity = document.querySelector("#nutrition-activity");
    els.nutritionGoal = document.querySelector("#nutrition-goal");
    els.nutritionProteinFactor = document.querySelector("#nutrition-protein-factor");
    els.nutritionWaterFactor = document.querySelector("#nutrition-water-factor");
    els.nutritionBmrDetail = document.querySelector("#nutrition-bmr-detail");
    els.nutritionCaloriesTarget = document.querySelector("#nutrition-calories-target");
    els.nutritionMaintenanceDetail = document.querySelector("#nutrition-maintenance-detail");
    els.nutritionProteinTarget = document.querySelector("#nutrition-protein-target");
    els.nutritionProteinDetail = document.querySelector("#nutrition-protein-detail");
    els.nutritionWaterTarget = document.querySelector("#nutrition-water-target");
    els.nutritionWaterDetail = document.querySelector("#nutrition-water-detail");
    els.nutritionBmi = document.querySelector("#nutrition-bmi");
    els.nutritionBmiDetail = document.querySelector("#nutrition-bmi-detail");
    els.plateLogDate = document.querySelector("#plate-log-date");
    els.foodDialog = document.querySelector("#food-dialog");
    els.openFoodDialog = document.querySelector("#open-food-dialog");
    els.closeFoodDialog = document.querySelector("#close-food-dialog");
    els.newPlateMeal = document.querySelector("#new-plate-meal");
    els.foodCatalogSearch = document.querySelector("#food-catalog-search");
    els.foodCatalogGroup = document.querySelector("#food-catalog-group");
    els.foodCatalogList = document.querySelector("#food-catalog-list");
    els.plateFoodQuantity = document.querySelector("#plate-food-quantity");
    els.foodDialogMealSummary = document.querySelector("#food-dialog-meal-summary");
    els.foodDialogSelectedList = document.querySelector("#food-dialog-selected-list");
    els.plateItemsList = document.querySelector("#plate-items-list");
    els.plateTotalCalories = document.querySelector("#plate-total-calories");
    els.plateTotalProtein = document.querySelector("#plate-total-protein");
    els.plateTotalCarbs = document.querySelector("#plate-total-carbs");
    els.plateTotalFat = document.querySelector("#plate-total-fat");
    els.plateTotalFiber = document.querySelector("#plate-total-fiber");
    els.plateTargetStatus = document.querySelector("#plate-target-status");
    els.refreshMealIdeas = document.querySelector("#refresh-meal-ideas");
    els.mealIdeasList = document.querySelector("#meal-ideas-list");
    els.savedMealIdeasList = document.querySelector("#saved-meal-ideas-list");
    els.mealIdeasDate = document.querySelector("#meal-ideas-date");
    els.registerButtons = document.querySelectorAll("[data-register-target]");
    els.registerPages = document.querySelectorAll("[data-register-page]");
    els.registerDialog = document.querySelector("#register-dialog");
    els.closeRegisterDialog = document.querySelector("#close-register-dialog");
    els.registerTitle = document.querySelector("#register-title");
    els.registerSubtitle = document.querySelector("#register-subtitle");
    els.accountRegisterTitle = document.querySelector("#account-register-title");
    els.accountRegisterSubtitle = document.querySelector("#account-register-subtitle");
    els.accountBalanceLabel = document.querySelector("#account-balance-label");
    els.accountLimitLabel = document.querySelector("#account-limit-label");
    els.monthPicker = document.querySelector("#month-picker");
    els.employmentType = document.querySelector("#employment-type");
    els.salaryEntryName = document.querySelector("#salary-entry-name");
    els.monthSalaryLabel = document.querySelector("#month-salary-label");
    els.monthSalary = document.querySelector("#month-salary");
    els.monthBenefits = document.querySelector("#month-benefits");
    els.benefitName = document.querySelector("#benefit-name");
    els.benefitAmount = document.querySelector("#benefit-amount");
    els.benefitFrequency = document.querySelector("#benefit-frequency");
    els.addBenefit = document.querySelector("#add-benefit");
    els.benefitEditorList = document.querySelector("#benefit-editor-list");
    els.benefitsDaysDetail = document.querySelector("#benefits-days-detail");
    els.benefitsHolidaysDetail = document.querySelector("#benefits-holidays-detail");
    els.salaryDependents = document.querySelector("#salary-dependents");
    els.salaryAdvance = document.querySelector("#salary-advance");
    els.salaryOtherDiscounts = document.querySelector("#salary-other-discounts");
    els.salaryTransportEnabled = document.querySelector("#salary-transport-enabled");
    els.pjTaxRate = document.querySelector("#pj-tax-rate");
    els.pjOtherCosts = document.querySelector("#pj-other-costs");
    els.autonomousInssRate = document.querySelector("#autonomous-inss-rate");
    els.autonomousInssBase = document.querySelector("#autonomous-inss-base");
    els.autonomousBookCash = document.querySelector("#autonomous-book-cash");
    els.employmentNote = document.querySelector("#employment-note");
    els.employmentSections = document.querySelectorAll("[data-employment-section]");
    els.employmentVisibleItems = document.querySelectorAll("[data-employment-visible]");
    els.salarySummaryInssLabel = document.querySelector("#salary-summary-inss-label");
    els.salarySummaryIrrfLabel = document.querySelector("#salary-summary-irrf-label");
    els.salarySummaryTransportLabel = document.querySelector("#salary-summary-transport-label");
    els.salarySummaryFgtsLabel = document.querySelector("#salary-summary-fgts-label");
    els.salarySummaryNetLabel = document.querySelector("#salary-summary-net-label");
    els.salarySummaryPaycheckLabel = document.querySelector("#salary-summary-paycheck-label");
    els.cltInss = document.querySelector("#clt-inss");
    els.cltIrrf = document.querySelector("#clt-irrf");
    els.cltTransport = document.querySelector("#clt-transport");
    els.cltFgts = document.querySelector("#clt-fgts");
    els.cltNetMonth = document.querySelector("#clt-net-month");
    els.cltNetPaycheck = document.querySelector("#clt-net-paycheck");
    els.salaryManagerSubtitle = document.querySelector("#salary-manager-subtitle");
    els.newSalaryEntry = document.querySelector("#new-salary-entry");
    els.salaryEditorList = document.querySelector("#salary-editor-list");
    els.fixedBillsTotal = document.querySelector("#fixed-bills-total");
    els.fixedBillName = document.querySelector("#fixed-bill-name");
    els.fixedBillCategory = document.querySelector("#fixed-bill-category");
    els.fixedBillAmount = document.querySelector("#fixed-bill-amount");
    els.addFixedBill = document.querySelector("#add-fixed-bill");
    els.fixedBillsList = document.querySelector("#fixed-bills-list");
    els.accountEditorList = document.querySelector("#account-editor-list");
    els.accountName = document.querySelector("#account-name");
    els.accountKind = document.querySelector("#account-kind");
    els.accountBalanceInput = document.querySelector("#account-balance");
    els.accountSeparateBalance = document.querySelector("#account-separate-balance");
    els.accountLimit = document.querySelector("#account-limit");
    els.accountCdiPercent = document.querySelector("#account-cdi-percent");
    els.cdiAnnualRate = document.querySelector("#cdi-annual-rate");
    els.addAccount = document.querySelector("#add-account");
    els.themeToggle = document.querySelector("#theme-toggle");
    els.quickTransactionButtons = document.querySelectorAll("[data-quick-transaction]");
    els.metricIncomeTotal = document.querySelector("#metric-income-total");
    els.metricExpenseTotal = document.querySelector("#metric-expense-total");
    els.metricFixed = document.querySelector("#metric-fixed");
    els.metricSpendable = document.querySelector("#metric-spendable");
    els.metricIncomeDetail = document.querySelector("#metric-income-detail");
    els.metricExpenseDetail = document.querySelector("#metric-expense-detail");
    els.metricFixedDetail = document.querySelector("#metric-fixed-detail");
    els.metricSpendableDetail = document.querySelector("#metric-spendable-detail");
    els.fixedDetailsButton = document.querySelector("#fixed-details-button");
    els.fixedDetailsDialog = document.querySelector("#fixed-details-dialog");
    els.closeFixedDetailsDialog = document.querySelector("#close-fixed-details-dialog");
    els.fixedDetailsSubtitle = document.querySelector("#fixed-details-subtitle");
    els.fixedDetailsList = document.querySelector("#fixed-details-list");
    els.transactionSubtitle = document.querySelector("#transaction-subtitle");
    els.transactionList = document.querySelector("#transaction-list");
    els.transactionListFooter = document.querySelector("#transaction-list-footer");
    els.transactionDetailsToggle = document.querySelector("#transaction-details-toggle");
    els.searchInput = document.querySelector("#search-input");
    els.typeFilter = document.querySelector("#type-filter");
    els.categoryFilter = document.querySelector("#category-filter");
    els.accountFilter = document.querySelector("#account-filter");
    els.cashflowChart = document.querySelector("#cashflow-chart");
    els.budgetSubtitle = document.querySelector("#budget-subtitle");
    els.budgetList = document.querySelector("#budget-list");
    els.categoryLimitSubtitle = document.querySelector("#category-limit-subtitle");
    els.categoryLimitOverview = document.querySelector("#category-limit-overview");
    els.categorySubtitle = document.querySelector("#category-subtitle");
    els.categoryBreakdown = document.querySelector("#category-breakdown");
    els.categoryComparisonSubtitle = document.querySelector("#category-comparison-subtitle");
    els.categoryComparison = document.querySelector("#category-comparison");
    els.financeMonthlyComparisonSubtitle = document.querySelector("#finance-monthly-comparison-subtitle");
    els.financeMonthlyComparison = document.querySelector("#finance-monthly-comparison");
    els.usageSubtitle = document.querySelector("#usage-subtitle");
    els.usageList = document.querySelector("#usage-list");
    els.usageName = document.querySelector("#usage-name");
    els.usagePlan = document.querySelector("#usage-plan");
    els.addUsage = document.querySelector("#add-usage");
    els.categoryManagerSubtitle = document.querySelector("#category-manager-subtitle");
    els.categoryManagerList = document.querySelector("#category-manager-list");
    els.categoryEmoji = document.querySelector("#category-emoji");
    els.categoryName = document.querySelector("#category-name");
    els.categoryType = document.querySelector("#category-type");
    els.categoryUsage = document.querySelector("#category-usage");
    els.categoryColor = document.querySelector("#category-color");
    els.addCategory = document.querySelector("#add-category");
    els.dialog = document.querySelector("#transaction-dialog");
    els.form = document.querySelector("#transaction-form");
    els.dialogTitle = document.querySelector("#dialog-title");
    els.closeDialog = document.querySelector("#close-dialog");
    els.cancelDialog = document.querySelector("#cancel-dialog");
    els.transactionId = document.querySelector("#transaction-id");
    els.transactionDescription = document.querySelector("#transaction-description");
    els.transactionAmount = document.querySelector("#transaction-amount");
    els.transactionDate = document.querySelector("#transaction-date");
    els.transactionType = document.querySelector("#transaction-type");
    els.transactionCategory = document.querySelector("#transaction-category");
    els.transactionAccountLabel = document.querySelector("#transaction-account-label");
    els.transactionAccount = document.querySelector("#transaction-account");
    els.transactionAccountBalanceField = document.querySelector("#transaction-account-balance-field");
    els.transactionAccountBalanceLabel = document.querySelector("#transaction-account-balance-label");
    els.transactionAccountBalanceScope = document.querySelector("#transaction-account-balance-scope");
    els.transactionTargetField = document.querySelector("#transaction-target-field");
    els.transactionTargetLabel = document.querySelector("#transaction-target-label");
    els.transactionTargetAccount = document.querySelector("#transaction-target-account");
    els.transactionTargetBalanceField = document.querySelector("#transaction-target-balance-field");
    els.transactionTargetBalanceLabel = document.querySelector("#transaction-target-balance-label");
    els.transactionTargetBalanceScope = document.querySelector("#transaction-target-balance-scope");
    els.transactionStatus = document.querySelector("#transaction-status");
    els.transactionNotes = document.querySelector("#transaction-notes");
    els.exportData = document.querySelector("#export-data");
    els.importData = document.querySelector("#import-data");
    els.importFile = document.querySelector("#import-file");
    els.toast = document.querySelector("#toast");
  }

  function bindEvents() {
    els.openSystem?.addEventListener("click", () => switchView("system"));
    els.cloudSyncButton?.addEventListener("click", openCloudSyncDialog);
    els.hudBackupStatus?.addEventListener("click", () => switchView("system"));
    els.hudVersionStatus?.addEventListener("click", () => switchView("system"));
    els.cloudSyncForm?.addEventListener("submit", handleCloudLogin);
    els.saveCloudSyncConfig?.addEventListener("click", handleCloudConfigSave);
    els.cloudSyncSignup?.addEventListener("click", handleCloudSignup);
    els.cloudSyncLogout?.addEventListener("click", handleCloudLogout);
    els.backupEnabled?.addEventListener("change", handleBackupSettingsChange);
    els.backupDay?.addEventListener("change", handleBackupSettingsChange);
    els.backupRunNow?.addEventListener("click", handleManualBackup);
    els.systemUpdateAction?.addEventListener("click", handleSystemUpdateAction);
    els.mobileBottomNav?.addEventListener("click", handleMobileBottomNavClick);
    els.closeMobileMore?.addEventListener("click", closeMobileMore);
    els.mobileMoreList?.addEventListener("click", handleMobileMoreClick);
    els.mobileNavOrderList?.addEventListener("click", handleMobileNavOrderClick);
    els.homeGlobalSearch?.addEventListener("input", renderHomeSearchResults);
    els.homeGlobalSearch?.addEventListener("keydown", handleHomeSearchKeydown);
    els.homeGlobalSearchResults?.addEventListener("click", handleHomeSearchResultClick);
    els.homeInboxForm?.addEventListener("submit", handleHomeInboxSubmit);
    els.homeInboxList?.addEventListener("click", handleHomeInboxListClick);
    els.homeView?.addEventListener("click", handleHomeActionClick);
    els.monthPicker.addEventListener("change", () => {
      transactionMonthFilter = normalizeTransactionMonthFilter(els.monthPicker.value, selectedMonth);
      if (transactionMonthFilter) {
        selectedMonth = transactionMonthFilter;
      }
      transactionsExpanded = false;
      saveState();
      render();
    });
    els.employmentType.addEventListener("change", handleMonthPlanLiveChange);
    els.salaryEntryName.addEventListener("input", handleMonthPlanLiveChange);
    els.salaryEntryName.addEventListener("change", handleMonthPlanChange);
    els.monthSalary.addEventListener("input", handleMonthPlanLiveChange);
    els.monthBenefits.addEventListener("input", handleMonthPlanLiveChange);
    els.salaryDependents.addEventListener("input", handleMonthPlanLiveChange);
    els.salaryAdvance.addEventListener("input", handleMonthPlanLiveChange);
    els.salaryOtherDiscounts.addEventListener("input", handleMonthPlanLiveChange);
    els.salaryTransportEnabled.addEventListener("change", handleMonthPlanLiveChange);
    els.pjTaxRate.addEventListener("input", handleMonthPlanLiveChange);
    els.pjOtherCosts.addEventListener("input", handleMonthPlanLiveChange);
    els.autonomousInssRate.addEventListener("input", handleMonthPlanLiveChange);
    els.autonomousInssBase.addEventListener("input", handleMonthPlanLiveChange);
    els.autonomousBookCash.addEventListener("input", handleMonthPlanLiveChange);
    els.monthSalary.addEventListener("change", handleMonthPlanChange);
    els.monthBenefits.addEventListener("change", handleMonthPlanChange);
    els.salaryDependents.addEventListener("change", handleMonthPlanChange);
    els.salaryAdvance.addEventListener("change", handleMonthPlanChange);
    els.salaryOtherDiscounts.addEventListener("change", handleMonthPlanChange);
    els.pjTaxRate.addEventListener("change", handleMonthPlanChange);
    els.pjOtherCosts.addEventListener("change", handleMonthPlanChange);
    els.autonomousInssRate.addEventListener("change", handleMonthPlanChange);
    els.autonomousInssBase.addEventListener("change", handleMonthPlanChange);
    els.autonomousBookCash.addEventListener("change", handleMonthPlanChange);
    els.addBenefit.addEventListener("click", addBenefitItem);
    els.benefitEditorList.addEventListener("change", handleBenefitEditorChange);
    els.benefitEditorList.addEventListener("click", handleBenefitEditorClick);
    els.newSalaryEntry.addEventListener("click", addSalaryEntry);
    els.salaryEditorList.addEventListener("click", handleSalaryEditorClick);
    els.addFixedBill.addEventListener("click", addFixedBill);
    els.fixedBillsList.addEventListener("click", handleFixedBillsClick);
    els.fixedBillsList.addEventListener("change", handleFixedBillsChange);
    els.addAccount.addEventListener("click", addAccount);
    els.accountEditorList.addEventListener("click", handleAccountEditorClick);
    els.accountEditorList.addEventListener("change", handleAccountEditorChange);
    els.cdiAnnualRate.addEventListener("change", handleCdiAnnualRateChange);
    els.financeCardStrip.addEventListener("click", handleFinanceCardClick);
    els.newWorkout.addEventListener("click", () => openWorkoutDialog());
    els.workoutForm.addEventListener("submit", handleWorkoutSubmit);
    els.addWorkoutExercise.addEventListener("click", () => addWorkoutExerciseRow());
    els.workoutExerciseRows.addEventListener("click", handleWorkoutExerciseRowsClick);
    els.closeWorkoutDialog.addEventListener("click", closeWorkoutDialog);
    els.cancelWorkoutEdit.addEventListener("click", closeWorkoutDialog);
    els.workoutList.addEventListener("click", handleWorkoutListClick);
    [
      els.nutritionWeight,
      els.nutritionHeight,
      els.nutritionAge,
      els.nutritionProteinFactor,
      els.nutritionWaterFactor,
    ].forEach((input) => input.addEventListener("input", handleNutritionProfileInput));
    [
      els.nutritionWeight,
      els.nutritionHeight,
      els.nutritionAge,
      els.nutritionSex,
      els.nutritionActivity,
      els.nutritionGoal,
      els.nutritionProteinFactor,
      els.nutritionWaterFactor,
    ].forEach((input) => input.addEventListener("change", handleNutritionProfileChange));
    els.foodCatalogSearch.addEventListener("input", renderFoodCatalog);
    els.foodCatalogGroup.addEventListener("change", renderFoodCatalog);
    els.foodCatalogList.addEventListener("click", handleFoodCatalogClick);
    els.foodDialogSelectedList.addEventListener("click", handleFoodDialogSelectedClick);
    els.foodDialogSelectedList.addEventListener("change", handleFoodDialogSelectedChange);
    els.openFoodDialog.addEventListener("click", openFoodDialog);
    els.closeFoodDialog.addEventListener("click", closeFoodDialog);
    els.newPlateMeal.addEventListener("click", createNewPlateMeal);
    els.plateItemsList.addEventListener("click", handlePlateItemsClick);
    els.refreshMealIdeas.addEventListener("click", refreshMealIdeas);
    els.mealIdeasList.addEventListener("click", handleMealIdeaClick);
    els.savedMealIdeasList.addEventListener("click", handleMealIdeaClick);
    els.newPantryItem?.addEventListener("click", () => openPantryItemDialog());
    els.pantryForm?.addEventListener("submit", handlePantrySubmit);
    els.cancelPantryEdit?.addEventListener("click", closePantryItemDialog);
    els.closePantryItemDialog?.addEventListener("click", closePantryItemDialog);
    els.pantryItemTrackingMode?.addEventListener("change", updatePantryDialogModeFields);
    els.pantryItemDialog?.addEventListener("click", (event) => {
      if (event.target === els.pantryItemDialog) {
        closePantryItemDialog();
      }
    });
    els.pantryList?.addEventListener("click", handlePantryListClick);
    els.pantryList?.addEventListener("change", handlePantryListChange);
    [els.pantrySearch, els.pantryCategoryFilter, els.pantryLocationFilter, els.pantryStatusFilter, els.pantryModeFilter].forEach((control) => {
      control?.addEventListener("input", handlePantryFilterChange);
      control?.addEventListener("change", handlePantryFilterChange);
    });
    els.shoppingForm.addEventListener("submit", handleShoppingSubmit);
    els.cancelShoppingEdit.addEventListener("click", closeShoppingItemDialog);
    els.closeShoppingItemDialog.addEventListener("click", closeShoppingItemDialog);
    els.shoppingItemCategory.addEventListener("change", () => updateShoppingDialogCategoryFields(els.shoppingItemCategory.value));
    els.shoppingItemDialog.addEventListener("click", (event) => {
      if (event.target === els.shoppingItemDialog) {
        closeShoppingItemDialog();
      }
    });
    els.mediaItemDialog?.addEventListener("click", (event) => {
      if (event.target === els.mediaItemDialog) {
        closeMediaItemDialog();
      }
    });
    els.recipeDialog?.addEventListener("click", (event) => {
      if (event.target === els.recipeDialog) {
        closeRecipeDialog();
      }
    });
    els.recipeDetailDialog?.addEventListener("click", (event) => {
      if (event.target === els.recipeDetailDialog) {
        closeRecipeDetailDialog();
      }
    });
    els.studyCategoryDialog?.addEventListener("click", (event) => {
      if (event.target === els.studyCategoryDialog) {
        closeStudyCategoryDialog();
      }
    });
    els.shoppingMarketList.addEventListener("click", handleShoppingListClick);
    els.shoppingMarketList.addEventListener("change", handleShoppingListChange);
    els.shoppingList.addEventListener("click", handleShoppingListClick);
    els.shoppingList.addEventListener("change", handleShoppingListChange);
    els.shoppingList.addEventListener("dragstart", handleShoppingDragStart);
    els.shoppingList.addEventListener("dragover", handleShoppingDragOver);
    els.shoppingList.addEventListener("dragleave", handleShoppingDragLeave);
    els.shoppingList.addEventListener("drop", handleShoppingDrop);
    els.shoppingList.addEventListener("dragend", handleShoppingDragEnd);
    els.studyScheduleBoard?.addEventListener("submit", handleStudyScheduleSubmit);
    els.studyScheduleBoard?.addEventListener("click", handleStudyScheduleClick);
    els.studyScheduleBoard?.addEventListener("change", handleStudyScheduleChange);
    els.studyLinkForm?.addEventListener("submit", handleStudyLinkSubmit);
    els.studyLinkList?.addEventListener("click", handleStudyLinkClick);
    els.studyTodoForm?.addEventListener("submit", handleStudyTodoSubmit);
    els.studyTodoList?.addEventListener("click", handleStudyTodoClick);
    els.studyTodoList?.addEventListener("change", handleStudyTodoChange);
    els.studyCalendarGrid?.addEventListener("click", handleStudyCalendarClick);
    els.studyCalendarNoteForm?.addEventListener("submit", handleStudyCalendarNoteSubmit);
    els.studyCalendarNoteList?.addEventListener("click", handleStudyCalendarNoteClick);
    els.studyResourceForm?.addEventListener("submit", handleStudyResourceSubmit);
    els.studyResourceList?.addEventListener("click", handleStudyResourceClick);
    els.studyResourceList?.addEventListener("change", handleStudyResourceChange);
    els.studyPomodoroModes?.addEventListener("click", handleStudyPomodoroModeClick);
    els.studyPomodoroStart?.addEventListener("click", toggleStudyPomodoro);
    els.studyPomodoroReset?.addEventListener("click", resetStudyPomodoro);
    [els.studyPomodoroDuration, els.studyShortBreakDuration, els.studyLongBreakDuration].forEach((input) => {
      input?.addEventListener("change", handleStudyPomodoroSettingsChange);
    });
    els.openStudyCategories?.addEventListener("click", openStudyCategoryDialog);
    els.closeStudyCategoryDialog?.addEventListener("click", closeStudyCategoryDialog);
    els.studyCategoryForm?.addEventListener("submit", handleStudyCategorySubmit);
    els.studyCategoryList?.addEventListener("click", handleStudyCategoryClick);
    els.studyCategoryList?.addEventListener("change", handleStudyCategoryChange);
    els.newCreativeItem?.addEventListener("click", () => openCreativeItemDialog());
    els.creativeBoard?.addEventListener("click", handleCreativeBoardClick);
    els.creativeDetail?.addEventListener("click", handleCreativeDetailClick);
    els.creativeDetail?.addEventListener("pointerdown", handleCreativeStoryFreeLayoutPointerDown);
    els.creativeDetail?.addEventListener("pointerdown", handleCreativeProjectBlockPointerDown);
    els.creativeDetail?.addEventListener("pointerdown", handleCreativeWhiteboardAssetPointerDown);
    els.creativeDetail?.addEventListener("input", handleCreativeDetailInput);
    els.creativeDetail?.addEventListener("change", handleCreativeDetailChange);
    els.creativeDetail?.addEventListener("paste", handleCreativeDetailPaste);
    els.creativeItemForm?.addEventListener("submit", handleCreativeItemSubmit);
    els.creativeItemType?.addEventListener("change", () => updateCreativeDialogTypeFields(els.creativeItemType.value));
    els.closeCreativeItemDialog?.addEventListener("click", closeCreativeItemDialog);
    els.cancelCreativeItemDialog?.addEventListener("click", closeCreativeItemDialog);
    els.creativeItemDialog?.addEventListener("click", (event) => {
      if (event.target === els.creativeItemDialog) {
        closeCreativeItemDialog();
      }
    });
    els.newMediaItem?.addEventListener("click", () => openMediaItemDialog());
    els.mediaSectionButtons?.forEach((button) => {
      button.addEventListener("click", () => switchMediaSection(button.dataset.mediaSection));
    });
    els.mediaTypeTabs?.addEventListener("click", handleMediaTypeTabsClick);
    els.mediaStatusTabs?.addEventListener("click", handleMediaStatusTabsClick);
    els.mediaGrid?.addEventListener("click", handleMediaGridClick);
    els.mediaGrid?.addEventListener("change", handleMediaGridChange);
    els.mediaCategoryForm?.addEventListener("submit", handleMediaCategorySubmit);
    els.mediaCategoryList?.addEventListener("change", handleMediaCategoryInput);
    els.mediaCategoryList?.addEventListener("click", handleMediaCategoryClick);
    els.mediaStatusForm?.addEventListener("submit", handleMediaStatusSubmit);
    els.mediaStatusList?.addEventListener("change", handleMediaStatusInput);
    els.mediaStatusList?.addEventListener("click", handleMediaStatusClick);
    els.mediaItemForm?.addEventListener("submit", handleMediaItemSubmit);
    els.mediaItemType?.addEventListener("change", handleMediaItemTypeChange);
    els.mediaItemCover?.addEventListener("change", handleMediaDialogCoverChange);
    els.closeMediaItemDialog?.addEventListener("click", closeMediaItemDialog);
    els.cancelMediaItemDialog?.addEventListener("click", closeMediaItemDialog);
    els.newRecipe?.addEventListener("click", () => openRecipeDialog());
    els.recipeSectionButtons?.forEach((button) => {
      button.addEventListener("click", () => switchRecipeSection(button.dataset.recipeSection));
    });
    els.recipeSearch?.addEventListener("input", () => {
      filters.recipeSearch = els.recipeSearch.value.trim().toLowerCase();
      renderRecipes();
    });
    els.recipeCategoryFilter?.addEventListener("change", () => {
      filters.recipeCategory = normalizeRecipeCategoryFilter(els.recipeCategoryFilter.value);
      saveState();
      renderRecipes();
    });
    els.recipeStatusFilter?.addEventListener("change", () => {
      filters.recipeStatus = normalizeRecipeStatusFilter(els.recipeStatusFilter.value);
      saveState();
      renderRecipes();
    });
    els.recipeCategoryTabs?.addEventListener("click", handleRecipeCategoryTabsClick);
    els.recipeGrid?.addEventListener("click", handleRecipeGridClick);
    els.recipeGrid?.addEventListener("keydown", handleRecipeGridKeydown);
    els.recipeCategoryForm?.addEventListener("submit", handleRecipeCategorySubmit);
    els.recipeCategoryList?.addEventListener("change", handleRecipeCategoryInput);
    els.recipeCategoryList?.addEventListener("click", handleRecipeCategoryClick);
    els.recipeStatusForm?.addEventListener("submit", handleRecipeStatusSubmit);
    els.recipeStatusList?.addEventListener("change", handleRecipeStatusInput);
    els.recipeStatusList?.addEventListener("click", handleRecipeStatusClick);
    els.recipeForm?.addEventListener("submit", handleRecipeSubmit);
    els.closeRecipeDialog?.addEventListener("click", closeRecipeDialog);
    els.cancelRecipeDialog?.addEventListener("click", closeRecipeDialog);
    els.closeRecipeDetailDialog?.addEventListener("click", closeRecipeDetailDialog);
    els.closeRecipeDetailFooter?.addEventListener("click", closeRecipeDetailDialog);
    els.editRecipeDetail?.addEventListener("click", handleRecipeDetailEdit);
    els.homeCustomizeToggle?.addEventListener("click", toggleHomeEditMode);
    els.newHomeWidget?.addEventListener("click", () => openHomeWidgetDialog());
    els.resetHomeLayout?.addEventListener("click", resetHomeLayout);
    els.pageEditToggle?.addEventListener("click", () => {
      if (pageBuilderIds().includes(activeView)) {
        togglePageBuilderEditMode(activeView);
      }
    });
    els.pageAddBlock?.addEventListener("click", () => {
      if (pageBuilderIds().includes(activeView)) {
        openPageBlockDialog(activeView);
      }
    });
    els.homeWidgetGrid?.addEventListener("click", handleHomeWidgetGridClick);
    els.homeWidgetGrid?.addEventListener("change", handleHomeWidgetGridChange);
    els.homeWidgetGrid?.addEventListener("pointerdown", handleHomeWidgetPointerDown);
    els.homeWidgetGrid?.addEventListener("pointerdown", handleHomeWidgetResizeStart);
    els.homeHiddenWidgets?.addEventListener("click", handleHomeHiddenWidgetsClick);
    els.homeWidgetForm?.addEventListener("submit", handleHomeWidgetSubmit);
    els.closeHomeWidgetDialog?.addEventListener("click", closeHomeWidgetDialog);
    els.cancelHomeWidgetDialog?.addEventListener("click", closeHomeWidgetDialog);
    els.pageBlockForm.addEventListener("submit", handlePageBlockDialogSubmit);
    els.pageBlockForm.addEventListener("click", handlePageBlockTypePickerClick);
    els.pageBlockType.addEventListener("change", updatePageBlockDialogDefaults);
    els.closePageBlockDialog.addEventListener("click", closePageBlockDialog);
    els.cancelPageBlockDialog.addEventListener("click", closePageBlockDialog);
    els.main.addEventListener("click", handleCustomHomePageClick);
    els.main.addEventListener("click", handlePageBuilderClick);
    els.main.addEventListener("input", handleCustomHomePageInput);
    els.main.addEventListener("input", handlePageBuilderInput);
    els.main.addEventListener("change", handlePageBuilderChange);
    els.main.addEventListener("pointerdown", handlePageBlockPointerDown);
    els.main.addEventListener("pointerdown", handlePageBlockResizeStart);
    els.main.addEventListener("pointerdown", handlePageLayoutPointerDown);

    els.themeToggle?.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      updateThemeToggle();
      saveState();
    });

    els.viewButtons.forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.viewTarget));
    });
    els.openViewButtons.forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.openView));
    });
    els.registerButtons.forEach((button) => {
      button.addEventListener("click", () => openRegisterDialog(button.dataset.registerTarget));
    });
    window.addEventListener("popstate", () => switchView(hashToView(window.location.hash), { skipHash: true }));
    window.addEventListener("hashchange", () => switchView(hashToView(window.location.hash), { skipHash: true }));
    window.addEventListener("pointermove", handleHomeWidgetResizeMove);
    window.addEventListener("pointermove", handleHomeWidgetPointerMove);
    window.addEventListener("pointermove", handlePageBlockPointerMove);
    window.addEventListener("pointermove", handlePageBlockResizeMove);
    window.addEventListener("pointermove", handlePageLayoutPointerMove);
    window.addEventListener("pointermove", handlePageLayoutResizeMove);
    window.addEventListener("pointerup", handleHomeWidgetResizeEnd);
    window.addEventListener("pointerup", handleHomeWidgetPointerUp);
    window.addEventListener("pointerup", handlePageBlockPointerUp);
    window.addEventListener("pointerup", handlePageBlockResizeEnd);
    window.addEventListener("pointerup", handlePageLayoutPointerUp);
    window.addEventListener("pointerup", handlePageLayoutResizeEnd);

    els.quickTransactionButtons.forEach((button) => {
      button.addEventListener("click", () => openTransactionDialog(null, button.dataset.quickTransaction));
    });
    els.closeDialog.addEventListener("click", closeTransactionDialog);
    els.cancelDialog.addEventListener("click", closeTransactionDialog);
    els.closeRegisterDialog.addEventListener("click", closeRegisterDialog);
    els.fixedDetailsButton.addEventListener("click", openFixedDetailsDialog);
    els.closeFixedDetailsDialog.addEventListener("click", closeFixedDetailsDialog);

    els.dialog.addEventListener("click", (event) => {
      if (event.target === els.dialog) {
        closeTransactionDialog();
      }
    });
    els.registerDialog.addEventListener("click", (event) => {
      if (event.target === els.registerDialog) {
        closeRegisterDialog();
      }
    });
    els.fixedDetailsDialog.addEventListener("click", (event) => {
      if (event.target === els.fixedDetailsDialog) {
        closeFixedDetailsDialog();
      }
    });
    els.homeWidgetDialog?.addEventListener("click", (event) => {
      if (event.target === els.homeWidgetDialog) {
        closeHomeWidgetDialog();
      }
    });
    els.pageBlockDialog.addEventListener("click", (event) => {
      if (event.target === els.pageBlockDialog) {
        closePageBlockDialog();
      }
    });
    els.workoutDialog.addEventListener("click", (event) => {
      if (event.target === els.workoutDialog) {
        closeWorkoutDialog();
      }
    });
    els.foodDialog.addEventListener("click", (event) => {
      if (event.target === els.foodDialog) {
        closeFoodDialog();
      }
    });

    els.form.addEventListener("submit", handleTransactionSubmit);
    els.transactionType.addEventListener("change", () => {
      renderFormCategoryOptions(els.transactionType.value);
      renderFormAccountOptions(els.transactionAccount.value, els.transactionType.value);
      renderFormTargetAccountOptions(els.transactionTargetAccount.value, els.transactionType.value);
      updateTransactionFormForType();
    });
    els.transactionAccount.addEventListener("change", () => {
      if (["transfer", "card_payment"].includes(els.transactionType.value)) {
        renderFormTargetAccountOptions(els.transactionTargetAccount.value, els.transactionType.value);
      }
      updateTransactionFormForType();
    });
    els.transactionTargetAccount.addEventListener("change", () => {
      updateTransactionFormForType();
    });

    els.searchInput.addEventListener("input", () => {
      filters.search = els.searchInput.value.trim().toLowerCase();
      transactionsExpanded = false;
      renderTransactions();
    });
    els.typeFilter.addEventListener("change", () => {
      filters.type = els.typeFilter.value;
      transactionsExpanded = false;
      renderTransactions();
    });
    els.categoryFilter.addEventListener("change", () => {
      filters.category = els.categoryFilter.value;
      transactionsExpanded = false;
      renderTransactions();
    });
    els.accountFilter.addEventListener("change", () => {
      filters.account = els.accountFilter.value;
      transactionsExpanded = false;
      renderTransactions();
    });

    els.transactionList.addEventListener("click", handleTransactionListClick);
    els.transactionDetailsToggle.addEventListener("click", toggleTransactionDetails);
    els.budgetList.addEventListener("change", handleBudgetChange);
    els.usageList.addEventListener("click", handleUsageClick);
    els.usageList.addEventListener("change", handleUsageChange);
    els.addUsage.addEventListener("click", addUsageType);
    els.categoryManagerList.addEventListener("click", handleCategoryManagerClick);
    els.categoryManagerList.addEventListener("change", handleCategoryManagerChange);
    els.addCategory.addEventListener("click", addCategory);
    els.exportData.addEventListener("click", exportData);
    els.importData.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", importData);
  }

  function render() {
    els.monthPicker.value = transactionMonthFilter;
    renderMonthPlan();
    renderFinanceCards();
    renderRegisterPages();
    renderFilterOptions();
    renderSummary();
    renderTransactions();
    renderCashflow();
    renderBudgets();
    renderCategoryLimitOverview();
    renderCategoryBreakdown();
    renderCategoryComparison();
    renderMonthlyFinanceComparison();
    renderUsageTypes();
    renderCategoryManager();
    renderAccountEditor();
    renderNutrition();
    renderWorkouts();
    renderStudy();
    if (applyEstimatedPantryConsumption()) {
      saveState({ backup: false });
    }
    renderPantry();
    renderShopping();
    renderCreative();
    renderMediaLibrary();
    renderRecipes();
    renderHome();
    renderCustomHomePages();
    renderPageBuilders();
    renderHomeWidgets();
    updateHudContextActions();
    renderBackupSettings();
    renderCloudSyncStatus();
    renderSystemUpdateStatus();
    renderSystemTools();
    renderMobileNavigation();
  }

  function switchView(nextView, options = {}) {
    renderCustomHomePages();
    renderPageBuilders();
    const view = normalizeView(nextView);
    activeView = view;
    els.viewPanels = document.querySelectorAll("[data-view-panel]");

    els.viewPanels.forEach((panel) => {
      const isActive = panel.dataset.viewPanel === view;
      panel.hidden = !isActive;
      panel.classList.toggle("active", isActive);
    });

    els.viewButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.viewTarget === view);
    });

    document.title = viewTitle(view);
    resetScrollPosition();

    const nextHash = viewHash(view);
    if (!options.skipHash && window.location.hash !== nextHash) {
      if (options.replaceHash) {
        window.history.replaceState(null, "", nextHash);
      } else {
        window.history.pushState(null, "", nextHash);
      }
    }
    updateHudContextActions();
    renderMobileNavigation();
  }

  function updateHudContextActions() {
    els.homeHudActions?.forEach((button) => {
      button.hidden = true;
    });

    if (els.openSystem) {
      els.openSystem.classList.toggle("active", activeView === "system");
    }

    if (els.homeCustomizeToggle) {
      const isEditingHome = Boolean(ensureHomeLayout().editMode);
      els.homeCustomizeToggle.classList.toggle("active", isEditingHome);
      const label = isEditingHome ? "Concluir edicao da Home" : "Editar Home";
      els.homeCustomizeToggle.setAttribute("aria-label", label);
      els.homeCustomizeToggle.setAttribute("title", label);
      const use = els.homeCustomizeToggle.querySelector("use");
      use?.setAttribute("href", isEditingHome ? "#icon-check" : "#icon-layout");
    }

    if (!els.pageEditToggle) {
      return;
    }

    const pageHasBuilder = activeView !== "home" && pageBuilderIds().includes(activeView);
    els.pageEditToggle.hidden = !pageHasBuilder;
    if (els.pageAddBlock) {
      els.pageAddBlock.hidden = !pageHasBuilder;
    }
    if (!pageHasBuilder) {
      return;
    }

    const builder = ensurePageBuilder(activeView);
    const isEditingPage = Boolean(builder.editMode);
    const label = isEditingPage ? "Concluir edicao da pagina" : "Editar pagina";
    els.pageEditToggle.classList.toggle("active", isEditingPage);
    els.pageEditToggle.setAttribute("aria-label", label);
    els.pageEditToggle.setAttribute("title", label);
    els.pageEditToggle.querySelector("use")?.setAttribute("href", isEditingPage ? "#icon-check" : "#icon-edit");
    if (els.pageAddBlock) {
      els.pageAddBlock.classList.toggle("active", isEditingPage);
      els.pageAddBlock.setAttribute("aria-label", isEditingPage ? "Adicionar bloco na pagina" : "Adicionar bloco");
      els.pageAddBlock.setAttribute("title", isEditingPage ? "Adicionar bloco na pagina" : "Adicionar bloco");
    }
  }

  function normalizeView(nextView) {
    const view = String(nextView || "");
    if (["finance", "workouts", "study", "creative", "media", "recipes", "pantry", "shopping", "system", "home"].includes(view)) {
      return view;
    }
    if (view.startsWith("custom:")) {
      const widgetId = view.slice("custom:".length);
      return state.customHomeWidgets.some((widget) => widget.id === widgetId) ? view : "home";
    }
    return "home";
  }

  function viewHash(view) {
    if (view.startsWith("custom:")) {
      return `#quadro-${encodeURIComponent(view.slice("custom:".length))}`;
    }
    return VIEW_HASHES[view] || VIEW_HASHES.home;
  }

  function renderMonthPlan() {
    const plan = ensureMonthPlan(selectedMonth);
    const selectedEntry = selectedSalaryEntry(plan);
    const salaryEntry = selectedEntry || blankSalaryEntry({ includeDefaultBenefits: false });
    const benefits = calculateMonthlyBenefits(selectedMonth, salaryEntry);
    if (salaryEntry.id) {
      salaryEntry.benefits = benefits.total;
    }
    const employmentType = normalizeEmploymentType(salaryEntry.employmentType);
    els.employmentType.value = employmentType;
    els.salaryEntryName.value = salaryEntry.name || "";
    els.monthSalary.value = salaryEntry.salary ? String(salaryEntry.salary) : "";
    els.monthBenefits.value = benefits.total ? benefits.total.toFixed(2) : "";
    els.salaryDependents.value = salaryEntry.salaryDependents ? String(salaryEntry.salaryDependents) : "";
    els.salaryAdvance.value = salaryEntry.salaryAdvance ? String(salaryEntry.salaryAdvance) : "";
    els.salaryOtherDiscounts.value = salaryEntry.salaryOtherDiscounts ? String(salaryEntry.salaryOtherDiscounts) : "";
    els.salaryTransportEnabled.checked = Boolean(salaryEntry.hasTransportVoucher);
    els.pjTaxRate.value = Number.isFinite(Number(salaryEntry.pjTaxRate)) ? String(salaryEntry.pjTaxRate) : "";
    els.pjOtherCosts.value = salaryEntry.pjOtherCosts ? String(salaryEntry.pjOtherCosts) : "";
    els.autonomousInssRate.value = Number.isFinite(Number(salaryEntry.autonomousInssRate)) ? String(salaryEntry.autonomousInssRate) : "";
    els.autonomousInssBase.value = salaryEntry.autonomousInssBase ? String(salaryEntry.autonomousInssBase) : "";
    els.autonomousBookCash.value = salaryEntry.autonomousBookCash ? String(salaryEntry.autonomousBookCash) : "";
    renderEmploymentTypeControls(salaryEntry, benefits);
    renderBenefitsSummary(benefits);
    renderBenefitEditor(salaryEntry, benefits);
    renderCltSummary(salaryEntry);
    renderSalaryEditor(plan);
    els.fixedBillsTotal.textContent = `${formatCurrency(sumFixedBills(plan))} fixo`;
    setSelectOptions(els.fixedBillCategory, fixedBillCategoryOptions(), els.fixedBillCategory.value);

    if (!plan.fixedBills.length) {
      els.fixedBillsList.innerHTML = '<div class="empty-state compact-empty">Nenhuma conta fixa cadastrada.</div>';
      return;
    }

    els.fixedBillsList.innerHTML = plan.fixedBills
      .map(
        (bill) => `
          <div class="fixed-bill-row" data-fixed-bill-id="${escapeHtml(bill.id)}">
            <input class="inline-input" data-fixed-bill-field="name" value="${escapeHtml(bill.name)}" aria-label="Nome da conta fixa">
            <select class="inline-input" data-fixed-bill-field="categoryId" aria-label="Categoria da conta fixa">
              ${fixedBillCategoryOptionHtml(bill.categoryId)}
            </select>
            <input class="inline-input money-input" type="number" min="0" step="0.01" data-fixed-bill-field="amount" value="${Number(bill.amount || 0).toFixed(2)}" aria-label="Valor da conta fixa">
            <button class="icon-button" type="button" data-fixed-bill-action="delete" aria-label="Excluir conta fixa" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        `,
      )
      .join("");
  }

  function renderCltSummary(plan = ensureMonthPlan(selectedMonth)) {
    const benefits = calculateMonthlyBenefits(selectedMonth, plan);
    plan.benefits = benefits.total;
    const payroll = calculateSalaryIncome(plan);
    const totalMonth = roundMoney(payroll.netMonth + benefits.total);
    const totalPaycheck = roundMoney(payroll.netPaycheck + benefits.total);
    renderSalarySummaryLabels(payroll.employmentType);
    els.cltInss.textContent = formatCurrency(payroll.summaryPrimary);
    els.cltIrrf.textContent = payroll.summarySecondaryText || formatCurrency(payroll.summarySecondary);
    els.cltTransport.textContent = formatCurrency(payroll.summaryTertiary);
    els.cltFgts.textContent = payroll.summaryQuaternaryText || formatCurrency(payroll.summaryQuaternary);
    els.cltNetMonth.textContent = formatCurrency(totalMonth);
    els.cltNetPaycheck.textContent = formatCurrency(totalPaycheck);
  }

  function renderSalaryEditor(plan = ensureMonthPlan(selectedMonth)) {
    const entries = ensureSalaryEntries(plan);
    if (!entries.length) {
      els.salaryManagerSubtitle.textContent = "Nenhuma renda cadastrada";
      els.salaryEditorList.innerHTML = '<div class="empty-state compact-empty">Adicione uma renda para começar.</div>';
      return;
    }

    els.salaryManagerSubtitle.textContent = plural(entries.length, "renda cadastrada", "rendas cadastradas");
    els.salaryEditorList.innerHTML = entries
      .map((entry) => {
        const benefits = calculateMonthlyBenefits(selectedMonth, entry);
        const payroll = calculateSalaryIncome(entry);
        const total = roundMoney(payroll.netMonth + benefits.total);
        const isActive = entry.id === activeSalaryEntryId;
        return `
          <div class="salary-editor-row ${isActive ? "is-active" : ""}" data-salary-entry-id="${escapeHtml(entry.id)}">
            <button class="salary-editor-main" type="button" data-salary-action="edit" aria-label="Editar ${escapeHtml(entry.name)}">
              <span class="salary-editor-name">${escapeHtml(entry.name || "Renda")}</span>
              <span class="salary-editor-type">${escapeHtml(employmentTypeLabel(entry.employmentType))} · ${formatCurrency(payroll.grossSalary)} bruto</span>
            </button>
            <span class="salary-editor-value">${formatCurrency(total)}</span>
            <button class="icon-button" type="button" data-salary-action="delete" aria-label="Excluir renda" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        `;
      })
      .join("");
  }

  function renderBenefitsSummary(benefits) {
    const items = Array.isArray(benefits.items) ? benefits.items : [];
    if (!items.length) {
      els.benefitsDaysDetail.textContent = "Nenhum beneficio cadastrado";
      els.benefitsHolidaysDetail.textContent = "Adicione VR, VT, auxilios ou reembolsos se essa renda tiver beneficios.";
      return;
    }

    els.benefitsDaysDetail.textContent = `${plural(items.length, "beneficio", "beneficios")} = ${formatCurrency(benefits.total)}`;
    els.benefitsHolidaysDetail.textContent = benefits.holidays.length
      ? `${benefits.workdays} dias uteis · ${benefits.payableWeeks} semanas uteis · Feriados: ${benefits.holidays.map((holiday) => `${holiday.label} (${holiday.displayDate})`).join(", ")}`
      : `${benefits.workdays} dias uteis · ${benefits.payableWeeks} semanas uteis · Nenhum feriado em dia util no mes.`;
  }

  function renderBenefitEditor(entry, benefits = calculateMonthlyBenefits(selectedMonth, entry)) {
    const items = normalizeBenefitItems(entry.benefitItems, entry);
    if (!entry.id) {
      els.benefitEditorList.innerHTML = '<div class="empty-state compact-empty">Selecione ou crie uma renda para cadastrar beneficios.</div>';
      return;
    }

    if (!items.length) {
      els.benefitEditorList.innerHTML = '<div class="empty-state compact-empty">Nenhum beneficio cadastrado para esta renda.</div>';
      return;
    }

    els.benefitEditorList.innerHTML = items
      .map((item) => {
        const calculated = benefits.items.find((benefit) => benefit.id === item.id);
        return `
          <div class="benefit-editor-row" data-benefit-id="${escapeHtml(item.id)}">
            <input class="inline-input" data-benefit-field="name" value="${escapeHtml(item.name)}" aria-label="Nome do beneficio">
            <input class="inline-input money-input" type="number" min="0" step="0.01" data-benefit-field="amount" value="${Number(item.amount || 0).toFixed(2)}" aria-label="Valor do beneficio">
            <select class="inline-input" data-benefit-field="frequency" aria-label="Calculo do beneficio">
              ${benefitFrequencyOptionHtml(item.frequency)}
            </select>
            <span class="benefit-total-pill">${escapeHtml(calculated?.detail || "")} · ${formatCurrency(calculated?.total || 0)}</span>
            <button class="icon-button" type="button" data-benefit-action="delete" aria-label="Excluir beneficio" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        `;
      })
      .join("");
  }

  function renderEmploymentTypeControls(plan, benefits = calculateMonthlyBenefits(selectedMonth, plan)) {
    const employmentType = normalizeEmploymentType(plan.employmentType);
    const config = EMPLOYMENT_TYPES[employmentType];
    els.monthSalaryLabel.textContent = config.salaryLabel;
    els.monthBenefits.readOnly = true;
    els.monthBenefits.placeholder = "Total calculado pelos beneficios cadastrados";
    els.employmentNote.textContent = config.note;

    els.employmentSections.forEach((section) => {
      section.hidden = section.dataset.employmentSection !== employmentType;
    });

    els.employmentVisibleItems.forEach((item) => {
      const visibleTypes = (item.dataset.employmentVisible || "").split(/\s+/).filter(Boolean);
      item.hidden = !visibleTypes.includes(employmentType);
    });

    els.monthBenefits.value = benefits.total ? benefits.total.toFixed(2) : "";
  }

  function renderSalarySummaryLabels(employmentType) {
    const type = normalizeEmploymentType(employmentType);

    if (type === "pj") {
      els.salarySummaryInssLabel.textContent = "Impostos PJ";
      els.salarySummaryIrrfLabel.textContent = "Alíquota";
      els.salarySummaryTransportLabel.textContent = "Custos PJ";
      els.salarySummaryFgtsLabel.textContent = "FGTS";
      els.salarySummaryNetLabel.textContent = "Líquido + benefícios";
      els.salarySummaryPaycheckLabel.textContent = "A receber + benefícios";
      return;
    }

    if (type === "autonomous") {
      els.salarySummaryInssLabel.textContent = "INSS";
      els.salarySummaryIrrfLabel.textContent = "IRPF";
      els.salarySummaryTransportLabel.textContent = "Deduções";
      els.salarySummaryFgtsLabel.textContent = "FGTS";
      els.salarySummaryNetLabel.textContent = "Líquido + benefícios";
      els.salarySummaryPaycheckLabel.textContent = "A receber + benefícios";
      return;
    }

    if (type === "clean") {
      els.salarySummaryInssLabel.textContent = "Descontos";
      els.salarySummaryIrrfLabel.textContent = "Taxas";
      els.salarySummaryTransportLabel.textContent = "Outros";
      els.salarySummaryFgtsLabel.textContent = "FGTS";
      els.salarySummaryNetLabel.textContent = "Líquido + benefícios";
      els.salarySummaryPaycheckLabel.textContent = "A receber + benefícios";
      return;
    }

    els.salarySummaryInssLabel.textContent = "INSS";
    els.salarySummaryIrrfLabel.textContent = "IRRF";
    els.salarySummaryTransportLabel.textContent = "Vale-transporte";
    els.salarySummaryFgtsLabel.textContent = "FGTS";
    els.salarySummaryNetLabel.textContent = "Líquido + benefícios";
    els.salarySummaryPaycheckLabel.textContent = "A receber + benefícios";
  }

  function renderFinanceCards() {
    const snapshot = getFinancialSnapshot(selectedMonth);
    const accounts = state.accounts.slice().sort((a, b) => accountCardOrder(a) - accountCardOrder(b) || a.name.localeCompare(b.name, "pt-BR"));
    const bankAccounts = accounts.filter((account) => !["credit_card", "savings", "investment"].includes(account.kind));
    const cardAccounts = accounts.filter((account) => account.kind === "credit_card");
    const savedAccounts = accounts.filter((account) => ["savings", "investment"].includes(account.kind));
    const salaryDetail = snapshot.salaryCount > 1 ? `${snapshot.salaryCount} rendas` : employmentTypeLabel(snapshot.employmentType);
    const salaryCard = `
      <article class="finance-card salary-card">
        <div class="finance-card-top">
          <span class="finance-card-icon salary">${svgIcon("icon-wallet")}</span>
          <h3>Salário</h3>
          <button class="icon-button finance-card-edit" type="button" data-card-edit="salary" aria-label="Editar salário" title="Editar salário">
            ${svgIcon("icon-edit")}
          </button>
        </div>
        <strong>${formatCurrency(snapshot.guaranteed)}</strong>
        <small>${formatCurrency(snapshot.salary)} líquido ${salaryDetail} · ${formatCurrency(snapshot.benefits)} benefícios</small>
      </article>
    `;
    const accountCards = [
      ...bankAccounts.map(renderAccountFinanceCard),
      ...(cardAccounts.length ? cardAccounts.map(renderAccountFinanceCard) : [renderFinancePlaceholderCard("cards", "Cartão", "Cadastre o cartão e o limite.", "icon-check", "card-account")]),
      ...(savedAccounts.length ? savedAccounts.map(renderAccountFinanceCard) : [renderFinancePlaceholderCard("savings", "Caixinha", "Cadastre uma reserva ou investimento.", "icon-wallet", "saved-account")]),
    ].join("");

    els.financeCardStrip.innerHTML = salaryCard + accountCards;
  }

  function renderAccountFinanceCard(account) {
    const balance = accountBalance(account.id);
    const separated = separateBalanceAmount(account);
    const cardLimitInfo = account.kind === "credit_card" ? getCreditCardLimitInfo(account) : null;
    const savingsYield = isSavedAccount(account) ? savingsYieldEstimate(account) : null;
    const displayBalance = cardLimitInfo ? cardLimitInfo.invoice : balance;
    const icon = account.kind === "credit_card" ? "icon-check" : "icon-wallet";
    const kind = accountKindLabel(account.kind);
    const detail =
      cardLimitInfo
        ? `${kind} · limite restante ${formatCurrency(cardLimitInfo.remaining)} de ${formatCurrency(cardLimitInfo.limit)}`
        : savingsYield
          ? `${formatPercent(accountCdiPercent(account))} CDI · rendimento estimado ${formatCurrency(savingsYield.monthlyYield)}/mês`
        : ["checking", "cash"].includes(account.kind)
          ? `${kind} · saldo separado ${formatCurrency(separated)}`
        : kind;
    const editTarget = account.kind === "credit_card" ? "cards" : ["savings", "investment"].includes(account.kind) ? "savings" : "accounts";
    const extraClass = account.kind === "credit_card" ? "card-account" : ["savings", "investment"].includes(account.kind) ? "saved-account" : "";

    return `
      <article class="finance-card ${extraClass}">
        <div class="finance-card-top">
          <span class="finance-card-icon" style="color:${safeColor(account.color)}">${svgIcon(icon)}</span>
          <h3>${escapeHtml(account.name)}</h3>
          <button class="icon-button finance-card-edit" type="button" data-card-edit="${editTarget}" aria-label="Editar ${escapeHtml(account.name)}" title="Editar">
            ${svgIcon("icon-edit")}
          </button>
        </div>
        <strong class="${displayBalance < 0 ? "negative" : ""}">${formatCurrency(displayBalance)}</strong>
        <small>${escapeHtml(detail)}</small>
      </article>
    `;
  }

  function renderFinancePlaceholderCard(target, title, detail, icon, extraClass) {
    return `
      <article class="finance-card empty-finance-card ${extraClass}">
        <div class="finance-card-top">
          <span class="finance-card-icon">${svgIcon(icon)}</span>
          <h3>${escapeHtml(title)}</h3>
          <button class="icon-button finance-card-edit" type="button" data-card-edit="${target}" aria-label="Editar ${escapeHtml(title)}" title="Editar">
            ${svgIcon("icon-edit")}
          </button>
        </div>
        <strong>${formatCurrency(0)}</strong>
        <small>${escapeHtml(detail)}</small>
      </article>
    `;
  }

  function accountCardOrder(account) {
    const order = {
      checking: 1,
      cash: 2,
      credit_card: 3,
      savings: 4,
      investment: 5,
    };
    return order[account.kind] || 9;
  }

  function switchRegisterPage(page) {
    activeRegisterPage = normalizeRegisterPage(page);
    saveState();
    renderRegisterPages();
    renderAccountEditor();
  }

  function normalizeRegisterPage(page) {
    return Object.prototype.hasOwnProperty.call(REGISTER_PAGE_CONFIG, page) ? page : "salary";
  }

  function openRegisterDialog(page = activeRegisterPage) {
    switchRegisterPage(page);
    if (typeof els.registerDialog.showModal === "function") {
      els.registerDialog.showModal();
    } else {
      els.registerDialog.setAttribute("open", "open");
    }
  }

  function closeRegisterDialog() {
    if (typeof els.registerDialog.close === "function") {
      els.registerDialog.close();
    } else {
      els.registerDialog.removeAttribute("open");
    }
  }

  function handleFinanceCardClick(event) {
    const button = event.target.closest("[data-card-edit]");
    if (!button) {
      return;
    }
    openRegisterDialog(button.dataset.cardEdit);
  }

  function renderRegisterPages() {
    const visiblePage = ["cards", "savings"].includes(activeRegisterPage) ? "accounts" : activeRegisterPage;
    const isCardRegister = activeRegisterPage === "cards";
    const isSavingsRegister = activeRegisterPage === "savings";
    const accountFormScope = isCardRegister ? "cards" : isSavingsRegister ? "savings" : "accounts";
    const currentKind = accountFormScope === "cards" ? "credit_card" : accountFormScope === "savings" ? "savings" : "checking";
    const config = REGISTER_PAGE_CONFIG[activeRegisterPage] || REGISTER_PAGE_CONFIG.salary;
    els.registerTitle.textContent = config.title;
    els.registerSubtitle.textContent = config.subtitle;
    els.registerButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.registerTarget === activeRegisterPage);
    });
    els.registerPages.forEach((page) => {
      page.hidden = page.dataset.registerPage !== visiblePage;
    });

    const accountRegisterPage = document.querySelector("[data-register-page='accounts']");
    accountRegisterPage?.classList.toggle("is-card-register", isCardRegister);
    accountRegisterPage?.classList.toggle("is-bank-register", !isCardRegister && !isSavingsRegister);
    accountRegisterPage?.classList.toggle("is-savings-register", isSavingsRegister);
    els.accountKind.disabled = isCardRegister;
    els.accountLimit.closest(".field").hidden = !isCardRegister;
    els.accountCdiPercent.closest(".account-cdi-field").hidden = !isSavingsRegister;
    els.cdiAnnualRate.closest(".cdi-annual-field").hidden = !isSavingsRegister;
    els.accountSeparateBalance.closest(".account-separate-field").hidden = isCardRegister || isSavingsRegister;
    if (isCardRegister || isSavingsRegister) {
      els.accountSeparateBalance.value = "";
    }
    if (isSavingsRegister && !els.accountCdiPercent.value) {
      els.accountCdiPercent.value = String(DEFAULT_SAVINGS_CDI_PERCENT);
    }
    els.cdiAnnualRate.value = String(getCdiAnnualRate());
    els.accountBalanceLabel.textContent = isCardRegister ? "Valor da fatura" : isSavingsRegister ? "Saldo guardado" : "Saldo atual";
    els.accountLimitLabel.textContent = isCardRegister ? "Limite total" : "Limite";
    els.accountBalanceInput.placeholder = isCardRegister ? "Ex: -142,35" : "";
    els.accountKind.innerHTML = accountKindOptions(currentKind, accountFormScope);

    if (isCardRegister) {
      els.accountRegisterTitle.textContent = "Cadastro de cartões";
      els.accountRegisterSubtitle.textContent = "Cartões de crédito, limite e fatura inicial.";
      els.accountKind.value = "credit_card";
    } else if (isSavingsRegister) {
      els.accountRegisterTitle.textContent = "Cadastro de caixinha";
      els.accountRegisterSubtitle.textContent = "Reservas, guardado e investimentos.";
      if (!["savings", "investment"].includes(els.accountKind.value)) {
        els.accountKind.value = "savings";
      }
    } else {
      els.accountRegisterTitle.textContent = "Cadastro de bancos";
      els.accountRegisterSubtitle.textContent = "Contas e dinheiro.";
      if (["credit_card", "savings", "investment"].includes(els.accountKind.value)) {
        els.accountKind.value = "checking";
      }
    }
  }

  function renderFilterOptions() {
    const categoryOptions = [
      { value: "all", label: "Todas" },
      ...state.categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((category) => ({
          value: category.id,
          label: `${category.emoji || "🏷️"} ${typeLabel(category.type)} · ${category.name}`,
        })),
    ];
    setSelectOptions(els.categoryFilter, categoryOptions, filters.category);
    filters.category = els.categoryFilter.value;

    const accountOptions = [
      { value: "all", label: "Todas" },
      ...state.accounts
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((account) => ({ value: account.id, label: account.name })),
    ];
    setSelectOptions(els.accountFilter, accountOptions, filters.account);
    filters.account = els.accountFilter.value;
  }

  function renderSummary() {
    const snapshot = getFinancialSnapshot(selectedMonth);

    els.metricIncomeTotal.textContent = formatCurrency(snapshot.actualIncome);
    els.metricExpenseTotal.textContent = formatCurrency(snapshot.cashOut);
    els.metricFixed.textContent = formatCurrency(snapshot.fixedRemaining);
    els.metricSpendable.textContent = formatCurrency(snapshot.spendableRemaining);
    els.metricExpenseTotal.classList.toggle("negative", snapshot.cashOut > snapshot.actualIncome && snapshot.actualIncome > 0);
    els.metricSpendable.classList.toggle("negative", snapshot.spendableRemaining < 0);
    els.metricIncomeDetail.textContent = `${snapshot.incomeCount} ${snapshot.incomeCount === 1 ? "entrada lançada" : "entradas lançadas"}`;
    els.metricExpenseDetail.textContent = `${snapshot.cashOutCount} ${snapshot.cashOutCount === 1 ? "saída lançada" : "saídas lançadas"}`;
    els.metricFixedDetail.textContent =
      snapshot.fixedTotal > 0
        ? `${formatCurrency(snapshot.fixedPaid)} pago de ${formatCurrency(snapshot.fixedTotal)}`
        : plural(snapshot.fixedBillCount, "conta cadastrada", "contas cadastradas");
    const extraIncomeDetail = snapshot.extraIncome > 0 ? ` + ${formatCurrency(snapshot.extraIncome)} extra` : "";
    els.metricSpendableDetail.textContent = `${formatCurrency(snapshot.baseSpendable)} mensal${extraIncomeDetail} - ${formatCurrency(snapshot.spendableCashOut)} fora dos fixos`;
  }

  function renderHome() {
    if (!els.homeFinanceSpendable) {
      return;
    }

    const snapshot = getFinancialSnapshot(selectedMonth);
    renderHomeFinanceSummary(snapshot);
    renderHomeMonthRhythm(snapshot);
    renderHomeAttention(snapshot);
    renderHomeInboxList();
    renderHomeSearchResults();
  }

  function renderHomeFinanceSummary(snapshot = getFinancialSnapshot(selectedMonth)) {
    const daysLeft = daysRemainingInMonth(selectedMonth);
    const perDay = roundMoney(snapshot.spendableRemaining / daysLeft);
    const pendingBills = homePendingFixedBills(snapshot);
    const noSpendProgress = getNoSpendProgress(selectedMonth, snapshot, perDay);

    els.homeFinanceSpendable.textContent = formatCurrency(snapshot.spendableRemaining);
    els.homeFinanceSpendable.classList.toggle("negative", snapshot.spendableRemaining < 0);
    els.homeFinancePerDay.textContent =
      snapshot.spendableRemaining >= 0
        ? `${formatCurrency(perDay)} por dia até o fim de ${shortMonth(selectedMonth)}`
        : `${formatCurrency(Math.abs(snapshot.spendableRemaining))} acima do disponível`;
    if (els.homeFinanceNoSpendDays) {
      els.homeFinanceNoSpendDays.textContent = plural(noSpendProgress.days, "dia sem gastos", "dias sem gastos");
    }
    if (els.homeFinanceNoSpendAccumulated) {
      els.homeFinanceNoSpendAccumulated.textContent = `${formatCurrency(noSpendProgress.accumulated)} acumulado`;
    }
    els.homeFinanceIncome.textContent = formatCurrency(snapshot.actualIncome);
    els.homeFinanceExpense.textContent = formatCurrency(snapshot.cashOut);
    els.homeFinanceFixedRemaining.textContent = formatCurrency(snapshot.fixedRemaining);
    els.homeFinanceStatus.textContent = pendingBills.length
      ? plural(pendingBills.length, "conta pendente", "contas pendentes")
      : "Fixos em dia";

    els.homeFinanceNextBills.innerHTML = pendingBills.length
      ? pendingBills.slice(0, 3).map((bill) => `
          <div class="home-mini-row">
            <span>
              <strong>${escapeHtml(bill.name || "Conta fixa")}</strong>
              <small>${formatCurrency(bill.paid)} pago de ${formatCurrency(bill.amount)}</small>
            </span>
            <b>${formatCurrency(bill.remaining)}</b>
          </div>
        `).join("")
      : '<div class="home-empty-state">Nenhuma conta fixa pendente neste mês.</div>';
  }

  function renderHomeMonthRhythm(snapshot = getFinancialSnapshot(selectedMonth)) {
    if (!els.homeRhythmCalendar) {
      return;
    }

    const daysLeft = daysRemainingInMonth(selectedMonth);
    const perDay = roundMoney(snapshot.spendableRemaining / daysLeft);
    const noSpendProgress = getNoSpendProgress(selectedMonth, snapshot, perDay);
    const forecast = monthRhythmForecast(selectedMonth, snapshot);

    els.homeRhythmDays.textContent = String(noSpendProgress.days);
    els.homeRhythmAccumulated.textContent = formatCurrency(noSpendProgress.accumulated);
    els.homeRhythmDaily.textContent = snapshot.spendableRemaining >= 0 ? formatCurrency(perDay) : `-${formatCurrency(Math.abs(perDay))}`;
    els.homeRhythmForecast.textContent = forecast.label;
    els.homeRhythmForecast.classList.toggle("negative", forecast.value < 0);

    els.homeRhythmCalendar.innerHTML = monthRhythmDays(selectedMonth, snapshot)
      .map((day) => `
        <span
          class="home-rhythm-day ${day.classes.join(" ")}"
          title="${escapeHtml(day.title)}"
          aria-label="${escapeHtml(day.title)}"
        >${day.label}</span>
      `)
      .join("");
  }

  function monthRhythmDays(month = selectedMonth, snapshot = getFinancialSnapshot(month)) {
    if (!isMonthKey(month)) {
      return [];
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const today = todayDate();
    const currentMonthKey = today.slice(0, 7);
    const fixedCategoryIds = new Set((snapshot.plan?.fixedBills || []).map((bill) => bill.categoryId).filter(Boolean));
    const dayMap = getMonthTransactions(month).reduce((map, transaction) => {
      if (!isNoSpendBreakingTransaction(transaction)) {
        return map;
      }
      const entry = map.get(transaction.date) || { hasSpend: false, hasFixed: false, amount: 0 };
      entry.hasSpend = true;
      entry.hasFixed = transaction.type === "expense" && fixedCategoryIds.has(transaction.categoryId) ? true : entry.hasFixed;
      entry.amount = roundMoney(entry.amount + (Number(transaction.amount) || 0));
      map.set(transaction.date, entry);
      return map;
    }, new Map());

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const date = `${month}-${String(dayNumber).padStart(2, "0")}`;
      const entry = dayMap.get(date);
      const isFuture = month > currentMonthKey || (month === currentMonthKey && date > today);
      const classes = [];
      let title = `${formatDate(date)}: sem gastos`;

      if (date === today) {
        classes.push("today");
      }
      if (isFuture) {
        classes.push("future");
        title = `${formatDate(date)}: futuro`;
      } else if (entry?.hasSpend) {
        classes.push(entry.hasFixed ? "fixed" : "spend");
        title = `${formatDate(date)}: ${entry.hasFixed ? "conta fixa" : "gasto"} de ${formatCurrency(entry.amount)}`;
      } else {
        classes.push("clean");
      }

      return {
        label: String(dayNumber),
        classes,
        title,
      };
    });
  }

  function monthRhythmForecast(month = selectedMonth, snapshot = getFinancialSnapshot(month)) {
    if (!isMonthKey(month)) {
      return { value: 0, label: "Previsão: sem dados" };
    }

    const today = todayDate();
    const currentMonthKey = today.slice(0, 7);
    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    if (month > currentMonthKey) {
      return { value: snapshot.spendable, label: `Previsão: sobra ${formatCurrency(snapshot.spendable)}` };
    }
    if (month < currentMonthKey) {
      const pastValue = roundMoney(snapshot.spendableRemaining);
      return {
        value: pastValue,
        label: pastValue >= 0 ? `Fechou com ${formatCurrency(pastValue)}` : `Fechou faltando ${formatCurrency(Math.abs(pastValue))}`,
      };
    }

    const elapsedDays = Math.max(1, Number(today.slice(8, 10)) || 1);
    const remainingDays = Math.max(0, daysInMonth - elapsedDays);
    const dailyPace = roundMoney(snapshot.spendableCashOut / elapsedDays);
    const projectedRemainingOut = roundMoney(dailyPace * remainingDays);
    const forecastValue = roundMoney(snapshot.spendableRemaining - projectedRemainingOut);
    return {
      value: forecastValue,
      label: forecastValue >= 0
        ? `Previsão: sobra ${formatCurrency(forecastValue)}`
        : `Previsão: falta ${formatCurrency(Math.abs(forecastValue))}`,
    };
  }

  function renderHomeAttention(snapshot = getFinancialSnapshot(selectedMonth)) {
    if (els.homeTodayDate) {
      els.homeTodayDate.textContent = formatDate(todayDate());
    }

    const items = homeAttentionItems(snapshot);
    els.homeTodayList.innerHTML = items.length
      ? items.slice(0, 8).map(homeAttentionItemHtml).join("")
      : `
        <div class="home-empty-state">
          Nada urgente por agora. Quando tiver conta, treino, estudo, compra prioritária ou lembrete, aparece aqui.
        </div>
      `;
  }

  function homeAttentionItemHtml(item) {
    const action = item.view ? ` data-open-view="${escapeHtml(item.view)}"` : "";
    return `
      <button class="home-focus-item" type="button"${action}>
        <span class="home-focus-type">${escapeHtml(item.type)}</span>
        <span class="home-focus-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.detail || "")}</small>
        </span>
      </button>
    `;
  }

  function homeAttentionItems(snapshot = getFinancialSnapshot(selectedMonth)) {
    const today = todayDate();
    const study = ensureStudyState();
    const items = [];
    const finance = monthlyFinanceComparisonItem(selectedMonth, snapshot);

    homePendingFixedBills(snapshot).slice(0, 2).forEach((bill) => {
      items.push({
        type: "Conta",
        title: bill.name || "Conta fixa",
        detail: `Restam ${formatCurrency(bill.remaining)} neste mês`,
        view: "finance",
        priority: 20,
      });
    });

    finance.fixedBillsOverExpected.slice(0, 2).forEach((bill) => {
      items.push({
        type: "Conta",
        title: bill.name || "Conta fixa",
        detail: `${formatCurrency(bill.overLimit)} acima do valor previsto`,
        view: "finance",
        priority: 10,
      });
    });

    finance.categoriesOverLimit.slice(0, 2).forEach((row) => {
      items.push({
        type: "Limite",
        title: row.category.name || "Categoria",
        detail: `${formatCurrency(row.overLimit)} acima do limite mensal`,
        view: "finance",
        priority: 30,
      });
    });

    getSortedPantryItems()
      .filter((item) => ["expired", "empty", "expiring", "low"].includes(getPantryItemStatus(item)))
      .slice(0, 3)
      .forEach((item) => {
        const status = getPantryItemStatus(item);
        items.push({
          type: "Despensa",
          title: item.name || "Item da despensa",
          detail: `${pantryStatusLabel(status)} - ${normalizePantryTrackingMode(item.trackingMode) === "level" ? pantryStockLevelLabel(item.stockLevel) : formatPantryQuantity(item)}`,
          view: "pantry",
          priority: 40,
        });
      });

    (state.workouts || [])
      .filter((workout) => normalizeWorkoutStatus(workout.status) === "active" && isWorkoutScheduledForDate(workout, today))
      .slice(0, 3)
      .forEach((workout) => {
        items.push({
          type: "Treino",
          title: workout.title || "Treino",
          detail: isWorkoutDoneOnDate(workout, today) ? "Concluído hoje" : `${workoutTypeConfig(workout.type).label} previsto para hoje`,
          view: "workouts",
          priority: 60,
        });
      });

    (study.schedule[workoutWeekdayKey(today)] || [])
      .filter((item) => !item.done)
      .slice(0, 2)
      .forEach((item) => {
        items.push({
          type: "Estudo",
          title: item.title || "Bloco de estudo",
          detail: "Planejado para hoje",
          view: "study",
          priority: 70,
        });
      });

    study.todos
      .filter((todo) => !todo.done)
      .sort((a, b) => String(a.dueDate || "9999-99-99").localeCompare(String(b.dueDate || "9999-99-99")))
      .filter((todo) => !todo.dueDate || todo.dueDate <= today)
      .slice(0, 2)
      .forEach((todo) => {
        items.push({
          type: "Tarefa",
          title: todo.title || "Tarefa",
          detail: todo.dueDate ? `Prazo ${formatDate(todo.dueDate)}` : "Sem prazo definido",
          view: "study",
          priority: 70,
        });
      });

    getSortedShoppingItems()
      .filter((item) => item.priority && !item.purchased)
      .slice(0, 3)
      .forEach((item) => {
        items.push({
          type: "Compra",
          title: item.name || "Item prioritário",
          detail: `${shoppingCategoryLabel(item.category)} - ${formatShoppingPrice(getShoppingItemTotal(item))}`,
          view: "shopping",
          priority: 50,
        });
      });

    study.calendarNotes
      .filter((note) => note.date === today)
      .slice(0, 2)
      .forEach((note) => {
        items.push({
          type: "Lembrete",
          title: note.title || "Lembrete",
          detail: note.body || "Anotação de hoje",
          view: "study",
          priority: 80,
        });
      });

    return items.sort((a, b) => (Number(a.priority) || 99) - (Number(b.priority) || 99));
  }

  function homePendingFixedBills(snapshot = getFinancialSnapshot(selectedMonth)) {
    return (snapshot.fixedBillDetails || [])
      .filter((bill) => Number(bill.remaining) > 0)
      .sort((a, b) => Number(b.remaining) - Number(a.remaining));
  }

  function daysRemainingInMonth(month) {
    if (!isMonthKey(month)) {
      return 1;
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const current = todayDate();
    if (month > current.slice(0, 7)) {
      return daysInMonth;
    }
    if (month < current.slice(0, 7)) {
      return 1;
    }

    return Math.max(1, daysInMonth - Number(current.slice(8, 10)) + 1);
  }

  function renderHomeInboxList() {
    if (!els.homeInboxList) {
      return;
    }

    const items = ensureHomeInboxItems().slice(0, 6);
    els.homeInboxList.innerHTML = items.length
      ? items.map((item) => `
          <div class="home-mini-row home-inbox-row ${item.done ? "is-done" : ""}" data-home-inbox-id="${escapeHtml(item.id)}">
            <span>
              <strong>${escapeHtml(item.text)}</strong>
              <small>${escapeHtml(homeInboxKindLabel(item.kind))} - ${formatDateTime(item.createdAt)}</small>
            </span>
            <span class="home-row-actions">
              <button class="icon-button" type="button" data-home-inbox-action="done" aria-label="${item.done ? "Reabrir" : "Concluir"} anotação" title="${item.done ? "Reabrir" : "Concluir"}">
                ${svgIcon("icon-check")}
              </button>
              <button class="icon-button" type="button" data-home-inbox-action="delete" aria-label="Excluir anotação" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </span>
          </div>
        `).join("")
      : '<div class="home-empty-state">Nenhuma anotação rápida ainda.</div>';
  }

  function handleHomeInboxSubmit(event) {
    event.preventDefault();
    const text = String(els.homeInboxText?.value || "").trim();
    if (!text) {
      showToast("Escreva uma anotação rápida primeiro.");
      return;
    }

    const now = new Date().toISOString();
    ensureHomeInboxItems().unshift({
      id: createId("inbox"),
      kind: normalizeHomeInboxKind(els.homeInboxKind?.value),
      text: text.slice(0, 280),
      done: false,
      createdAt: now,
      updatedAt: now,
    });
    els.homeInboxText.value = "";
    saveState();
    renderHome();
    showToast("Anotação guardada na Inbox.");
  }

  function handleHomeInboxListClick(event) {
    const button = event.target.closest("[data-home-inbox-action]");
    if (!button) {
      return;
    }

    const row = button.closest("[data-home-inbox-id]");
    const itemId = row?.dataset.homeInboxId;
    const items = ensureHomeInboxItems();
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    if (button.dataset.homeInboxAction === "delete") {
      state.homeInboxItems = items.filter((entry) => entry.id !== item.id);
      saveState();
      renderHome();
      showToast("Anotação removida.");
      return;
    }

    item.done = !item.done;
    item.updatedAt = new Date().toISOString();
    saveState();
    renderHome();
  }

  function handleHomeActionClick(event) {
    const actionButton = event.target.closest("[data-home-action]");
    if (actionButton) {
      const action = actionButton.dataset.homeAction;
      if (action === "expense" || action === "income") {
        switchView("finance");
        openTransactionDialog("", action === "income" ? "income" : "expense");
        return;
      }
    }

    const viewButton = event.target.closest("[data-open-view]");
    if (viewButton) {
      switchView(viewButton.dataset.openView);
    }
  }

  function handleHomeSearchKeydown(event) {
    if (event.key === "Escape") {
      els.homeGlobalSearch.value = "";
      renderHomeSearchResults();
    }
  }

  function renderHomeSearchResults() {
    if (!els.homeGlobalSearch || !els.homeGlobalSearchResults) {
      return;
    }

    const query = normalizeHomeSearchText(els.homeGlobalSearch.value);
    if (!query) {
      els.homeGlobalSearchResults.hidden = true;
      els.homeGlobalSearchResults.innerHTML = "";
      return;
    }

    const results = homeSearchResults(query).slice(0, 8);
    els.homeGlobalSearchResults.hidden = false;
    els.homeGlobalSearchResults.innerHTML = results.length
      ? results.map((result) => `
          <button class="home-search-result" type="button" data-home-search-view="${escapeHtml(result.view)}">
            <span>${escapeHtml(result.type)}</span>
            <strong>${escapeHtml(result.title)}</strong>
            <small>${escapeHtml(result.detail || "")}</small>
          </button>
        `).join("")
      : '<div class="home-search-empty">Nada encontrado.</div>';
  }

  function handleHomeSearchResultClick(event) {
    const button = event.target.closest("[data-home-search-view]");
    if (!button) {
      return;
    }

    switchView(button.dataset.homeSearchView);
    els.homeGlobalSearch.value = "";
    renderHomeSearchResults();
  }

  function homeSearchResults(query) {
    const study = ensureStudyState();
    const mediaLibrary = ensureMediaLibrary();
    const results = [];

    state.transactions.forEach((transaction) => {
      const category = findCategory(transaction.categoryId);
      addHomeSearchResult(results, query, {
        type: "Finanças",
        title: transaction.description || category.name || "Lançamento",
        detail: `${formatDate(transaction.date)} - ${formatCurrency(transaction.amount)} - ${category.name}`,
        view: "finance",
      });
    });

    getSortedShoppingItems().forEach((item) => {
      addHomeSearchResult(results, query, {
        type: "Compras",
        title: item.name || "Item",
        detail: `${shoppingCategoryLabel(item.category)} - ${formatShoppingPrice(getShoppingItemTotal(item))}`,
        view: "shopping",
      });
    });

    getSortedPantryItems().forEach((item) => {
      const status = getPantryItemStatus(item);
      addHomeSearchResult(results, query, {
        type: "Despensa",
        title: item.name || "Item",
        detail: `${pantryCategoryLabel(item.category)} - ${pantryLocationLabel(item.location)} - ${pantryStatusLabel(status)}`,
        view: "pantry",
      });
    });

    (state.workouts || []).forEach((workout) => {
      addHomeSearchResult(results, query, {
        type: "Treinos",
        title: workout.title || "Treino",
        detail: workoutTypeConfig(workout.type).label,
        view: "workouts",
      });
    });

    WORKOUT_WEEKDAYS.forEach((day) => {
      (study.schedule[day.key] || []).forEach((item) => {
        addHomeSearchResult(results, query, {
          type: "Estudos",
          title: item.title || "Bloco de estudo",
          detail: `Agenda - ${day.longLabel}`,
          view: "study",
        });
      });
    });

    study.todos.forEach((todo) => {
      addHomeSearchResult(results, query, {
        type: "Estudos",
        title: todo.title || "Tarefa",
        detail: todo.dueDate ? `Prazo ${formatDate(todo.dueDate)}` : studyTodoAreaLabel(todo.area),
        view: "study",
      });
    });

    study.links.forEach((link) => {
      addHomeSearchResult(results, query, {
        type: "Estudos",
        title: link.title || "Link",
        detail: link.url,
        view: "study",
      });
    });

    study.resources.forEach((resource) => {
      addHomeSearchResult(results, query, {
        type: "Estudos",
        title: resource.title || "Material",
        detail: "Material de estudo",
        view: "study",
      });
    });

    ensureCreativeItems().forEach((item) => {
      addHomeSearchResult(results, query, {
        type: "Área Criativa",
        title: item.title || "Criação",
        detail: creativeLinkLabel(item),
        view: "creative",
      });
    });

    mediaLibrary.items.forEach((item) => {
      addHomeSearchResult(results, query, {
        type: "Biblioteca",
        title: item.title || "Obra",
        detail: mediaTypeLabel(item.type),
        view: "media",
      });
    });

    ensureRecipes().forEach((recipe) => {
      addHomeSearchResult(results, query, {
        type: "Receitas",
        title: recipe.title || recipe.name || "Receita",
        detail: recipeCategoryLabel(recipe.category),
        view: "recipes",
      });
    });

    ensureHomeInboxItems().forEach((item) => {
      addHomeSearchResult(results, query, {
        type: "Inbox",
        title: item.text,
        detail: homeInboxKindLabel(item.kind),
        view: "home",
      });
    });

    return results;
  }

  function addHomeSearchResult(results, query, item) {
    const haystack = normalizeHomeSearchText(`${item.type} ${item.title} ${item.detail || ""}`);
    if (haystack.includes(query)) {
      results.push(item);
    }
  }

  function normalizeHomeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function ensureHomeInboxItems() {
    state.homeInboxItems = normalizeHomeInboxItems(state.homeInboxItems || state.home_inbox_items || []);
    return state.homeInboxItems;
  }

  function normalizeHomeInboxItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item && (item.text || item.title || item.note))
      .map((item) => ({
        id: item.id || createId("inbox"),
        kind: normalizeHomeInboxKind(item.kind || item.type),
        text: String(item.text || item.title || item.note || "").slice(0, 280),
        done: Boolean(item.done || item.completed || item.checked),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function normalizeHomeInboxKind(kind) {
    const value = String(kind || "").toLowerCase();
    return ["expense", "shopping", "idea", "music", "task"].includes(value) ? value : "task";
  }

  function homeInboxKindLabel(kind) {
    const labels = {
      expense: "Gasto",
      shopping: "Compra",
      idea: "Ideia",
      music: "Música",
      task: "Tarefa/Estudo",
    };
    return labels[normalizeHomeInboxKind(kind)] || labels.task;
  }

  function renderCreativeHomeSummary(stats = getCreativeStats()) {
    if (!els.homeCreativeTotal) {
      return;
    }

    els.homeCreativeTotal.textContent = String(stats.total);
    els.homeCreativeStories.textContent = String(stats.storyCount);
    els.homeCreativeCode.textContent = String(stats.codeCount);
    els.homeCreativeReferences.textContent = String(stats.referenceCount);
    els.homeCreativeProgress.style.width = `${stats.doneRate}%`;
    els.homeCreativeStatus.textContent =
      stats.total === 0
        ? "Sem criações"
        : stats.activeCount > 0
          ? plural(stats.activeCount, "criação aberta", "criações abertas")
          : `${stats.doneRate}% fechado`;
  }

  function renderStudyHomeSummary(stats = getStudyStats()) {
    if (!els.homeStudyWeek) {
      return;
    }

    els.homeStudyWeek.textContent = String(stats.scheduleCount);
    els.homeStudyTodo.textContent = String(stats.openTodos);
    els.homeStudyResources.textContent = String(stats.resources);
    els.homeStudyLinks.textContent = String(stats.links);
    els.homeStudyProgress.style.width = `${stats.completionRate}%`;
    els.homeStudyStatus.textContent =
      stats.scheduleCount === 0 && stats.openTodos === 0 && stats.resources === 0
        ? "Plano vazio"
        : stats.openTodos > 0
          ? plural(stats.openTodos, "pendencia aberta", "pendencias abertas")
          : `${stats.completionRate}% concluido`;
  }

  function renderMediaHomeSummary(stats = getMediaStats()) {
    if (!els.homeMediaTotal) {
      return;
    }

    els.homeMediaTotal.textContent = String(stats.total);
    els.homeMediaProgressing.textContent = String(stats.inProgressCount);
    els.homeMediaCompleted.textContent = String(stats.completedCount);
    els.homeMediaProgress.style.width = `${stats.completionRate}%`;
    els.homeMediaStatus.textContent =
      stats.total === 0
        ? "Sem obras"
        : stats.inProgressCount > 0
          ? plural(stats.inProgressCount, "obra em andamento", "obras em andamento")
          : `${stats.completionRate}% concluido`;
  }

  function renderRecipesHomeSummary(stats = getRecipeStats()) {
    if (!els.homeRecipesTotal) {
      return;
    }

    els.homeRecipesTotal.textContent = String(stats.total);
    els.homeRecipesPlanned.textContent = String(stats.plannedCount);
    els.homeRecipesFavorite.textContent = String(stats.favoriteCount);
    els.homeRecipesFast.textContent = String(stats.fastCount);
    els.homeRecipesProgress.style.width = `${stats.readyRate}%`;
    els.homeRecipesStatus.textContent =
      stats.total === 0
        ? "Caderno vazio"
        : stats.plannedCount > 0
          ? plural(stats.plannedCount, "receita planejada", "receitas planejadas")
          : stats.favoriteCount > 0
            ? plural(stats.favoriteCount, "favorita marcada", "favoritas marcadas")
            : plural(stats.total, "receita salva", "receitas salvas");
  }

  function renderShoppingHomeSummary(stats = getShoppingStats()) {
    if (!els.homeShoppingPending) {
      return;
    }

    els.homeShoppingPending.textContent = String(stats.pendingCount);
    els.homeShoppingTotal.textContent = String(stats.total);
    els.homeShoppingDone.textContent = String(stats.purchasedCount);
    els.homeShoppingEstimate.textContent = formatCurrency(stats.totalEstimate);
    els.homeShoppingProgress.style.width = `${stats.completionRate}%`;
    els.homeShoppingStatus.textContent =
      stats.total === 0
        ? "Lista vazia"
        : stats.pendingCount > 0
          ? plural(stats.pendingCount, "item pendente", "itens pendentes")
          : "Tudo comprado";
  }

  function normalizeMobileNavOrder(order) {
    const allowed = new Set(MOBILE_NAV_DEFAULT_ORDER);
    const normalized = Array.isArray(order)
      ? order.map((item) => String(item || "")).filter((item) => allowed.has(item))
      : [];
    return [...new Set([...normalized, ...MOBILE_NAV_DEFAULT_ORDER])].filter((item) => allowed.has(item));
  }

  function mobileNavItemLabel(view) {
    return MOBILE_NAV_ITEMS[view]?.label || view;
  }

  function renderSystemTools() {
    if (!els.mobileNavOrderList) {
      return;
    }

    mobileNavOrder = normalizeMobileNavOrder(mobileNavOrder);
    els.mobileNavOrderList.innerHTML = mobileNavOrder
      .map((view, index) => {
        const item = MOBILE_NAV_ITEMS[view];
        const fixedLabel = index < 4 ? "Barra" : "Mais";
        return `
          <div class="mobile-nav-order-row" data-mobile-nav-view="${escapeHtml(view)}">
            <div>
              ${svgIcon(item.icon)}
              <span>${escapeHtml(item.label)}</span>
              <small>${fixedLabel}</small>
            </div>
            <div class="mobile-nav-order-actions">
              <button class="icon-button" type="button" data-mobile-nav-action="up" ${index === 0 ? "disabled" : ""} aria-label="Subir ${escapeHtml(item.label)}">
                ${svgIcon("icon-arrow-up")}
              </button>
              <button class="icon-button" type="button" data-mobile-nav-action="down" ${index === mobileNavOrder.length - 1 ? "disabled" : ""} aria-label="Descer ${escapeHtml(item.label)}">
                ${svgIcon("icon-arrow-down")}
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderMobileNavigation() {
    if (!els.mobileBottomNav) {
      return;
    }

    mobileNavOrder = normalizeMobileNavOrder(mobileNavOrder);
    const primary = mobileNavOrder.slice(0, 4);
    const secondary = mobileNavOrder.slice(4);
    const activeInSecondary = secondary.includes(activeView);
    els.mobileBottomNav.innerHTML = [
      ...primary.map((view) => renderMobileNavButton(view, activeView === view)),
      `<button class="mobile-nav-item ${activeInSecondary ? "active" : ""}" type="button" data-mobile-nav-more="true">
        ${svgIcon("icon-more")}
        <span>Mais</span>
      </button>`,
    ].join("");

    if (els.mobileMoreList) {
      els.mobileMoreList.innerHTML = secondary
        .map((view) => `
          <button class="mobile-more-item ${activeView === view ? "active" : ""}" type="button" data-mobile-more-target="${escapeHtml(view)}">
            ${svgIcon(MOBILE_NAV_ITEMS[view].icon)}
            <span>${escapeHtml(MOBILE_NAV_ITEMS[view].label)}</span>
          </button>
        `)
        .join("");
    }
  }

  function renderMobileNavButton(view, isActive) {
    const item = MOBILE_NAV_ITEMS[view];
    return `
      <button class="mobile-nav-item ${isActive ? "active" : ""}" type="button" data-mobile-nav-target="${escapeHtml(view)}">
        ${svgIcon(item.icon)}
        <span>${escapeHtml(item.label)}</span>
      </button>
    `;
  }

  function handleMobileBottomNavClick(event) {
    const moreButton = event.target.closest("[data-mobile-nav-more]");
    if (moreButton) {
      openMobileMore();
      return;
    }

    const button = event.target.closest("[data-mobile-nav-target]");
    if (!button) {
      return;
    }
    switchView(button.dataset.mobileNavTarget);
  }

  function openMobileMore() {
    renderMobileNavigation();
    if (els.mobileMoreDialog?.showModal && !els.mobileMoreDialog.open) {
      els.mobileMoreDialog.showModal();
    }
  }

  function closeMobileMore() {
    els.mobileMoreDialog?.close();
  }

  function handleMobileMoreClick(event) {
    const button = event.target.closest("[data-mobile-more-target]");
    if (!button) {
      return;
    }
    closeMobileMore();
    switchView(button.dataset.mobileMoreTarget);
  }

  function handleMobileNavOrderClick(event) {
    const button = event.target.closest("[data-mobile-nav-action]");
    if (!button) {
      return;
    }

    const row = button.closest("[data-mobile-nav-view]");
    const view = row?.dataset.mobileNavView;
    const index = mobileNavOrder.indexOf(view);
    if (index < 0) {
      return;
    }

    const nextIndex = button.dataset.mobileNavAction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= mobileNavOrder.length) {
      return;
    }

    const nextOrder = [...mobileNavOrder];
    [nextOrder[index], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[index]];
    mobileNavOrder = normalizeMobileNavOrder(nextOrder);
    saveState();
    renderSystemTools();
    renderMobileNavigation();
  }


  function renderCustomHomePages() {
    if (!els.main) {
      return;
    }

    const customIds = new Set(state.customHomeWidgets.map((widget) => widget.id));
    els.main.querySelectorAll("[data-custom-home-page]").forEach((page) => {
      if (!customIds.has(page.dataset.customHomePage)) {
        page.remove();
      }
    });

    state.customHomeWidgets.forEach((widget) => {
      let page = els.main.querySelector(`[data-custom-home-page="${cssEscape(widget.id)}"]`);
      if (!page) {
        page = document.createElement("section");
        page.className = "view custom-widget-view";
        page.dataset.viewPanel = `custom:${widget.id}`;
        page.dataset.customHomePage = widget.id;
        page.hidden = true;
        els.main.appendChild(page);
      }

      page.id = `custom-view-${widget.id}`;
      page.innerHTML = `
        <header class="topbar custom-page-topbar">
          <div>
            <p class="eyebrow">Quadro livre</p>
            <h1>${escapeHtml(widget.title)}</h1>
          </div>
          <div class="custom-page-actions">
            <button class="button secondary" type="button" data-custom-page-action="back">
              ${svgIcon("icon-map")}
              <span>Home</span>
            </button>
            <button class="button primary" type="button" data-custom-page-action="edit" data-home-widget-id="${escapeHtml(widget.id)}">
              ${svgIcon("icon-edit")}
              <span>Editar item</span>
            </button>
          </div>
        </header>
      `;
    });

    els.viewPanels = document.querySelectorAll("[data-view-panel]");
  }

  function renderPageBuilders() {
    if (!els.main) {
      return;
    }

    ensurePageBuilders();
    const pageIds = pageBuilderIds();
    const activePageIds = new Set(pageIds);
    els.main.querySelectorAll("[data-page-builder]").forEach((panel) => {
      if (!activePageIds.has(panel.dataset.pageBuilder)) {
        panel.remove();
      }
    });

    pageIds.forEach((pageId) => {
      const page = findViewPanel(pageId);
      if (!page) {
        return;
      }

      const builder = ensurePageBuilder(pageId);
      ensurePageBuilderControls(page, pageId, builder);
      let panel = page.querySelector(`[data-page-builder="${cssEscape(pageId)}"]`);
      if (!panel) {
        panel = document.createElement("section");
        panel.className = "panel page-builder-panel";
        panel.dataset.pageBuilder = pageId;
        page.appendChild(panel);
      }

      const gridColumns = currentPageBlockMaxColumns();
      const isEditing = Boolean(builder.editMode);
      const usesPageLayout = pageLayoutShouldActivate(pageId, builder, isEditing);
      const reservedCells = usesPageLayout ? pageLayoutReservedCells(pageId, gridColumns) : null;
      const placements = resolvePageBlockPlacements(builder, gridColumns, {
        occupiedCells: reservedCells,
        commit: Boolean(usesPageLayout && shouldPersistPageLayoutGrid(gridColumns)),
      });
      panel.hidden = builder.blocks.length === 0 && !isEditing;
      panel.classList.toggle("is-editing", isEditing);
      panel.classList.toggle("is-viewing", !isEditing);
      panel.innerHTML = `
        ${
          isEditing
            ? `<div class="page-builder-edit-strip">
                <span>Modo edicao</span>
                <button class="button secondary page-builder-add-block" type="button" data-page-builder-action="open-add-block" data-page-builder-page="${escapeHtml(pageId)}">
                  ${svgIcon("icon-plus")}
                  <span>Adicionar bloco</span>
                </button>
              </div>`
            : ""
        }
        <div class="page-builder-grid" data-page-builder-grid style="--free-grid-cols:${gridColumns}; --free-grid-row-height:${PAGE_BLOCK_GRID_ROW_HEIGHT}px">
          ${
            builder.blocks.length
              ? builder.blocks.map((block) => renderPageBlock(block, placements.get(block.id), isEditing, usesPageLayout)).join("")
              : ""
          }
        </div>
      `;
      syncPageLayout(page, pageId, builder, isEditing, usesPageLayout);
    });
  }

  function ensurePageBuilderControls(page, pageId, builder) {
    page.querySelector(`[data-page-edit-controls="${cssEscape(pageId)}"]`)?.remove();
  }

  function pageLayoutShouldActivate(pageId, builder, isEditing) {
    return Boolean(isEditing);
  }

  function syncPageLayout(page, pageId, builder, isEditing, usesPageLayout) {
    if (!page) {
      return;
    }

    page.classList.toggle("has-page-layout", usesPageLayout);
    page.classList.toggle("is-page-layout-editing", Boolean(isEditing && usesPageLayout));
    const gridColumns = currentPageBlockMaxColumns();
    page.style.setProperty("--page-layout-cols", String(gridColumns));
    page.style.setProperty("--page-layout-row-height", `${PAGE_LAYOUT_GRID_ROW_HEIGHT}px`);

    const descriptors = collectPageLayoutElements(page, pageId);
    if (!usesPageLayout) {
      descriptors.forEach(({ element }) => clearPageLayoutElement(element));
      return;
    }

    const layoutItems = ensurePageLayoutItems(builder, descriptors);
    const placements = resolvePageLayoutPlacements(layoutItems, gridColumns, { commit: shouldPersistPageLayoutGrid(gridColumns) });
    descriptors.forEach((descriptor) => {
      const item = layoutItems.find((entry) => entry.id === descriptor.id);
      const placement = placements.get(descriptor.id) || pageLayoutGridPlacement(item, gridColumns);
      applyPageLayoutElement(descriptor.element, item, placement, isEditing, descriptor.label);
    });
  }

  function pageLayoutReservedCells(pageId, columns = currentPageBlockMaxColumns()) {
    const page = findViewPanel(pageId);
    const builder = ensurePageBuilder(pageId);
    const descriptors = page ? collectPageLayoutElements(page, pageId) : [];
    const occupied = new Set();
    if (!page || !descriptors.length) {
      return occupied;
    }

    const layoutItems = ensurePageLayoutItems(builder, descriptors);
    const placements = resolvePageLayoutPlacements(layoutItems, columns, { commit: shouldPersistPageLayoutGrid(columns) });
    placements.forEach((placement) => {
      markFreeGridCells(occupied, placement.x, placement.y, placement.cols, placement.rowSpan);
    });
    return occupied;
  }

  function collectPageLayoutElements(page, pageId) {
    const selectors = [
      ":scope > .finance-overview-grid > .finance-card-strip",
      ":scope > .finance-overview-grid > .finance-top-tools > .panel",
      ":scope > .summary-grid > .metric",
      ":scope > .content-grid > .content-left-column > .panel",
      ":scope > .content-grid > .transaction-panel",
      ":scope > .content-grid > .right-column > .panel",
      ":scope > .content-grid > .category-comparison-panel",
      ":scope > .study-board-shell > .panel",
      ":scope > .study-board-shell > .study-focus-column > .panel",
      ":scope > .study-board-shell > .study-material-column > .panel",
      ":scope > .creative-shell > .panel",
      ":scope > .workout-week-panel",
      ":scope > .workout-list-panel",
      ":scope > .nutrition-panel",
      ":scope > .shopping-board-shell > .shopping-market-panel",
      ":scope > .shopping-board-shell > .shopping-wishlist-panel",
    ];
    const seen = new Set();
    return selectors
      .flatMap((selector) => [...page.querySelectorAll(selector)])
      .filter((element) => {
        if (seen.has(element) || element.closest("dialog")) {
          return false;
        }
        seen.add(element);
        return true;
      })
      .sort((a, b) => {
        if (a === b) {
          return 0;
        }
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })
      .map((element, index) => {
        const label = pageLayoutElementLabel(element, index);
        return {
          element,
          id: `${pageId}:${pageLayoutSlug(label || [...element.classList].join("-") || `campo-${index + 1}`)}`,
          label,
          index,
        };
      });
  }

  function pageLayoutElementLabel(element, index) {
    const directHeading = element.querySelector(":scope > .panel-header h2, :scope > .panel-header h3, :scope > h2, :scope > h3");
    const metricLabel = element.classList.contains("metric")
      ? element.querySelector(":scope > .metric-header span, :scope > span")?.textContent
      : "";
    const nestedHeading = element.querySelector("h2, h3");
    return String(element.getAttribute("aria-label") || directHeading?.textContent || metricLabel || nestedHeading?.textContent || `Campo ${index + 1}`).trim();
  }

  function pageLayoutSlug(value) {
    return String(value || "campo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "campo";
  }

  function ensurePageLayoutItems(builder, descriptors) {
    builder.layoutItems = normalizePageLayoutItems(builder.layoutItems || builder.layout_items || []);
    const availableIds = new Set(descriptors.map((descriptor) => descriptor.id));
    builder.layoutItems = builder.layoutItems.filter((item) => availableIds.has(item.id));
    descriptors.forEach((descriptor) => {
      if (!builder.layoutItems.some((item) => item.id === descriptor.id)) {
        builder.layoutItems.push(defaultPageLayoutItem(descriptor));
      }
    });
    return builder.layoutItems;
  }

  function defaultPageLayoutItem(descriptor) {
    const key = descriptor.id;
    const element = descriptor.element;
    const isMetric = element?.classList?.contains("metric");
    const isFinanceCards = element?.classList?.contains("finance-card-strip");
    const isRegisterIndex = element?.classList?.contains("register-index-panel");
    const isTransaction = element?.classList?.contains("transaction-panel");
    const isQuickActions = element?.classList?.contains("transaction-quick-panel");
    const isCategoryLimit = element?.classList?.contains("category-limit-panel");
    const isNutrition = element?.classList?.contains("nutrition-panel");
    const isStudySchedule = element?.classList?.contains("study-schedule-panel");
    const isStudyTodo = element?.classList?.contains("study-todo-panel");
    const isStudyLinks = element?.classList?.contains("study-links-panel");
    const isStudyCalendar = element?.classList?.contains("study-calendar-panel");
    const isStudyResource = element?.classList?.contains("study-resource-panel");
    const isStudyPomodoro = element?.classList?.contains("study-pomodoro-panel");
    const isWorkoutWeek = element?.classList?.contains("workout-week-panel");
    const isWorkoutList = element?.classList?.contains("workout-list-panel");
    const isShoppingMarket = element?.classList?.contains("shopping-market-panel");
    const isShoppingWishlist = element?.classList?.contains("shopping-wishlist-panel");
    const isComparison = element?.classList?.contains("category-comparison-panel");
    const cols =
      isNutrition
        ? 4
        : isShoppingWishlist
          ? 3
        : isFinanceCards || isRegisterIndex || isTransaction || isWorkoutWeek || isWorkoutList || isComparison || isStudySchedule || isStudyCalendar || isStudyResource || isStudyPomodoro || isStudyTodo || isStudyLinks
          ? 2
          : 1;
    const rows =
      isMetric
        ? 3
        : isShoppingMarket || isShoppingWishlist
          ? 10
        : isNutrition
          ? 16
        : isTransaction || isQuickActions || key.includes("fluxo") || isWorkoutList || isStudySchedule || isStudyCalendar || isStudyResource || isStudyTodo
            ? 5
            : isCategoryLimit || isComparison || key.endsWith(":categorias") || isWorkoutWeek || key.includes("calendario") || isStudyPomodoro || isStudyLinks
              ? 4
              : 3;
    return {
      id: descriptor.id,
      cols: clampNumber(cols, 1, PAGE_BLOCK_MAX_COLUMNS),
      rows: normalizePageLayoutRows(rows),
      customized: false,
    };
  }

  function normalizePageLayoutItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    const usedIds = new Set();
    return items.reduce((list, item) => {
      const id = String(item?.id || "").trim();
      if (!id || usedIds.has(id)) {
        return list;
      }
      usedIds.add(id);
      list.push({
        id,
        cols: clampNumber(item.cols || item.columns || 1, 1, PAGE_BLOCK_MAX_COLUMNS),
        rows: normalizePageLayoutRows(item.rows),
        x: Number(item.x || item.gridX || item.column) >= 1 ? Math.round(Number(item.x || item.gridX || item.column)) : undefined,
        y: Number(item.y || item.gridY || item.row) >= 1 ? Math.round(Number(item.y || item.gridY || item.row)) : undefined,
        compactCols: Number(item.compactCols || item.compact_columns) >= 1 ? clampNumber(item.compactCols || item.compact_columns, 1, PAGE_BLOCK_MAX_COLUMNS) : undefined,
        compactRows: Number(item.compactRows || item.compact_rows) >= 1 ? normalizePageLayoutRows(item.compactRows || item.compact_rows) : undefined,
        compactX: Number(item.compactX || item.compactGridX || item.compact_column) >= 1 ? Math.round(Number(item.compactX || item.compactGridX || item.compact_column)) : undefined,
        compactY: Number(item.compactY || item.compactGridY || item.compact_row) >= 1 ? Math.round(Number(item.compactY || item.compactGridY || item.compact_row)) : undefined,
        customized: Boolean(item.customized),
      });
      return list;
    }, []);
  }

  function migratePageLayoutItemSize(item) {
    const id = String(item?.id || "");
    const minRows =
      id.includes("dieta-e-metas-diarias") || id.includes("nutrition")
        ? 16
        : id.includes("calendario")
          ? 8
          : 0;
    const minCols =
      id.includes("dieta-e-metas-diarias") || id.includes("nutrition")
        ? 4
        : id.includes("calendario")
          ? 2
          : 0;

    if (!minRows && !minCols) {
      return item;
    }

    return {
      ...item,
      cols: minCols ? clampNumber(Math.max(Number(item.cols) || 1, minCols), 1, PAGE_BLOCK_MAX_COLUMNS) : item.cols,
      rows: minRows ? normalizePageLayoutRows(Math.max(Number(item.rows) || PAGE_LAYOUT_MIN_ROWS, minRows)) : item.rows,
    };
  }

  function applyPageLayoutElement(element, item, placement, isEditing, label) {
    element.dataset.pageLayoutItem = item.id;
    element.classList.add("page-layout-item");
    element.style.setProperty("--page-layout-cols", String(placement.cols));
    element.style.setProperty("--page-layout-x", String(placement.x));
    element.style.setProperty("--page-layout-y", String(placement.y + 1));
    element.style.setProperty("--page-layout-row-span", String(placement.rowSpan));
    element.style.setProperty("--page-layout-height", `${placement.height}px`);

    if (isEditing) {
      ensurePageLayoutControls(element, label);
    } else {
      removePageLayoutControls(element);
    }
  }

  function clearPageLayoutElement(element) {
    element.classList.remove("page-layout-item", "is-dragging", "is-resizing");
    removePageLayoutControls(element);
    ["--page-layout-cols", "--page-layout-x", "--page-layout-y", "--page-layout-row-span", "--page-layout-height"].forEach((property) => {
      element.style.removeProperty(property);
    });
  }

  function ensurePageLayoutControls(element, label) {
    let controls = [...element.children].find((child) => child.dataset?.pageLayoutControls !== undefined);
    if (!controls) {
      controls = document.createElement("div");
      controls.className = "page-layout-controls";
      controls.dataset.pageLayoutControls = "";
      controls.innerHTML = `
        <button class="page-layout-drag-handle" type="button" data-page-layout-action="drag" aria-label="Arrastar ${escapeHtml(label)}" title="Arraste para mover">
          ${svgIcon("icon-layout")}
          <span>Arraste o campo</span>
        </button>
        <button class="page-layout-resize-button" type="button" data-page-layout-action="resize" aria-label="Redimensionar ${escapeHtml(label)}" title="Arraste para redimensionar">Redimensionar</button>
      `;
      element.prepend(controls);
    }

    if (![...element.children].some((child) => child.classList?.contains("page-layout-corner-resize"))) {
      const handle = document.createElement("button");
      handle.className = "page-layout-corner-resize";
      handle.type = "button";
      handle.dataset.pageLayoutAction = "resize";
      handle.setAttribute("aria-label", `Redimensionar ${label}`);
      handle.setAttribute("title", "Arraste para redimensionar");
      element.appendChild(handle);
    }
  }

  function removePageLayoutControls(element) {
    [...element.children].forEach((child) => {
      if (child.dataset?.pageLayoutControls !== undefined || child.classList?.contains("page-layout-corner-resize")) {
        child.remove();
      }
    });
  }

  function renderPageBlock(block, placement = null, isEditing = false, usesPageLayout = false) {
    const type = normalizePageBlockType(block.type);
    const cols = placement?.cols || clampNumber(block.cols || 1, 1, PAGE_BLOCK_MAX_COLUMNS);
    const x = placement?.x || 1;
    const y = (placement?.y || 1) + (usesPageLayout ? 1 : 0);
    const rows = placement?.rows || normalizePageBlockRows(block.rows);
    const rowSpan = placement?.rowSpan || pageBlockGridRowSpan(rows);
    const height = placement?.height || freeGridItemHeight(rowSpan, PAGE_BLOCK_GRID_ROW_HEIGHT, PAGE_BLOCK_GRID_GAP);
    if (!isEditing) {
      return `
      <article class="page-block page-block-kind-${escapeHtml(type)} is-readonly" data-page-block-id="${escapeHtml(block.id)}" data-page-block-type="${escapeHtml(type)}" style="--page-block-cols:${cols}; --page-block-x:${x}; --page-block-y:${y}; --page-block-row-span:${rowSpan}; --page-block-height:${height}">
        <div class="page-block-readonly-header">
          <h3>${escapeHtml(block.title)}</h3>
        </div>
        <div class="page-block-preview">
          ${renderPageBlockPreview(block)}
        </div>
      </article>
    `;
    }

    return `
      <article class="page-block page-block-kind-${escapeHtml(type)} is-editable" data-page-block-id="${escapeHtml(block.id)}" data-page-block-type="${escapeHtml(type)}" style="--page-block-cols:${cols}; --page-block-x:${x}; --page-block-y:${y}; --page-block-row-span:${rowSpan}; --page-block-height:${height}">
        <div class="page-block-toolbar">
          <button class="icon-button page-block-drag-handle" type="button" data-page-builder-action="drag-block" aria-label="Arrastar ${escapeHtml(block.title)}" title="Arraste para mover">
            ${svgIcon("icon-layout")}
          </button>
          <input class="page-block-title" data-page-block-field="title" value="${escapeHtml(block.title)}" aria-label="Titulo do bloco">
          <button class="icon-button" type="button" data-page-builder-action="delete-block" aria-label="Excluir ${escapeHtml(block.title)}" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        </div>
        ${renderPageBlockEditor(block)}
        <button class="page-block-resize-handle" type="button" data-page-builder-action="resize-block" aria-label="Redimensionar ${escapeHtml(block.title)}" title="Arraste para mudar largura"></button>
      </article>
    `;
  }

  function renderPageBlockEditor(block) {
    const type = normalizePageBlockType(block.type);
    if (type === "columns") {
      return renderPageBlockColumnsEditor(block);
    }
    if (type === "board") {
      return renderPageBlockBoardEditor(block);
    }
    if (type === "gallery") {
      return renderPageBlockGalleryEditor(block);
    }
    if (type === "table") {
      return renderPageBlockRowsEditor(block);
    }
    if (type === "list") {
      return renderPageBlockListEditor(block);
    }

    return `
      <div class="page-block-edit-surface page-block-edit-surface-note">
        <div class="page-block-body-editor" data-page-block-field="body" contenteditable="true" role="textbox" aria-label="Editar texto do bloco" data-placeholder="${escapeHtml(defaultPageBlockBody(type))}">${escapeHtml(block.body)}</div>
      </div>
    `;
  }

  function renderPageBlockListEditor(block) {
    return `
      <div class="page-block-edit-surface">
        <div class="page-block-body-editor page-block-list-body-editor" data-page-block-field="body" contenteditable="true" role="textbox" aria-label="Editar lista" data-placeholder="${escapeHtml(defaultPageBlockBody("list"))}">${escapeHtml(block.body)}</div>
        <div class="page-block-edit-actions">
          <button class="page-block-inline-add" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="list">
            ${svgIcon("icon-plus")}
            <span>Adicionar item</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderPageBlockRowsEditor(block) {
    const rows = pageBlockLines(block.body);
    const items = rows.length ? rows : ["Linha 1", "Linha 2", "Linha 3"];
    return `
      <div class="page-block-edit-surface">
        <div class="page-block-table page-block-rows-editor" data-page-block-structured-editor data-page-block-editor-type="table">
          ${items.map((row) => `<div class="page-block-row-editor" data-page-block-field="body" contenteditable="true" role="textbox" aria-label="Editar linha" data-placeholder="Linha">${escapeHtml(row)}</div>`).join("")}
        </div>
        <div class="page-block-edit-actions">
          <button class="page-block-inline-add" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="table">
            ${svgIcon("icon-plus")}
            <span>Adicionar linha</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderPageBlockColumnsEditor(block) {
    const columns = splitPageBlockColumns(pageBlockLines(block.body));
    return `
      <div class="page-block-edit-surface">
        <div class="page-block-columns page-block-columns-editor" data-page-block-structured-editor data-page-block-editor-type="columns">
          ${columns.map((column, index) => `
            <div>
              <strong>Coluna ${index + 1}</strong>
              <span class="page-block-part-editor" data-page-block-field="body" data-page-block-part="column" data-page-block-index="${index}" contenteditable="true" role="textbox" aria-label="Editar coluna ${index + 1}" data-placeholder="Itens da coluna">${escapeHtml(column.join("\n"))}</span>
              <button class="page-block-inline-add compact" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="column" data-page-block-column-index="${index}">
                ${svgIcon("icon-plus")}
                <span>Item</span>
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderPageBlockBoardEditor(block) {
    const groups = groupBoardLines(pageBlockLines(block.body));
    const laneNames = pageBlockBoardLaneNames(groups);
    return `
      <div class="page-block-edit-surface">
        <div class="page-block-board page-block-board-editor" data-page-block-structured-editor data-page-block-editor-type="board">
          ${laneNames.map((name) => `
            <section data-page-block-board-lane="${escapeHtml(name)}">
              <strong>${escapeHtml(name)}</strong>
              <span class="page-block-part-editor" data-page-block-field="body" data-page-block-part="lane" contenteditable="true" role="textbox" aria-label="Editar ${escapeHtml(name)}" data-placeholder="Itens">${escapeHtml((groups[name] || []).join("\n"))}</span>
              <button class="page-block-inline-add compact" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="board-item" data-page-block-lane="${escapeHtml(name)}">
                ${svgIcon("icon-plus")}
                <span>Item</span>
              </button>
            </section>
          `).join("")}
        </div>
        <div class="page-block-edit-actions">
          <button class="page-block-inline-add" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="board-lane">
            ${svgIcon("icon-plus")}
            <span>Adicionar etapa</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderPageBlockGalleryEditor(block) {
    const cards = pageBlockLines(block.body);
    const items = cards.length ? cards : ["Card 1", "Card 2", "Card 3"];
    return `
      <div class="page-block-edit-surface">
        <div class="page-block-gallery page-block-gallery-editor" data-page-block-structured-editor data-page-block-editor-type="gallery">
          ${items.map((item) => `<span data-page-block-field="body" contenteditable="true" role="textbox" aria-label="Editar card" data-placeholder="Card">${escapeHtml(item)}</span>`).join("")}
        </div>
        <div class="page-block-edit-actions">
          <button class="page-block-inline-add" type="button" data-page-builder-action="add-structured-item" data-page-block-add-kind="gallery">
            ${svgIcon("icon-plus")}
            <span>Adicionar card</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderPageBlockPreview(block) {
    const type = normalizePageBlockType(block.type);
    const lines = pageBlockLines(block.body);

    if (type === "list") {
      return lines.length
        ? `<ul class="page-block-list">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
        : "<p>Lista vazia.</p>";
    }

    if (type === "columns") {
      const columns = splitPageBlockColumns(lines);
      return `<div class="page-block-columns">${columns
        .map((column, index) => `<div><strong>Coluna ${index + 1}</strong>${column.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`)
        .join("")}</div>`;
    }

    if (type === "table") {
      const rows = lines.map((line) => line.split("|").map((cell) => cell.trim()));
      return rows.length
        ? `<div class="page-block-table">${rows
            .map((row) => `<div>${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`)
            .join("")}</div>`
        : "<p>Sem linhas.</p>";
    }

    if (type === "board") {
      const groups = groupBoardLines(lines);
      return `<div class="page-block-board">${Object.entries(groups)
        .map(([name, items]) => `<section><strong>${escapeHtml(name)}</strong>${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</section>`)
        .join("")}</div>`;
    }

    if (type === "gallery") {
      return lines.length
        ? `<div class="page-block-gallery">${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>`
        : "<p>Sem cards.</p>";
    }

    return `<p>${escapeHtml(block.body || "Sem texto.").replace(/\n/g, "<br>")}</p>`;
  }

  function pageBlockLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function normalizeEditableText(value, placeholder = "") {
    const placeholderText = String(placeholder || "").trim();
    let text = String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trimEnd();
    if (placeholderText && text === placeholderText) {
      text = "";
    } else if (placeholderText && text.endsWith(placeholderText)) {
      text = text.slice(0, -placeholderText.length).trimEnd();
    }
    return text.slice(0, 3000);
  }

  function splitPageBlockColumns(lines) {
    const buckets = [[], [], []];
    lines.forEach((line, index) => {
      if (line.includes("|")) {
        line.split("|").map((item) => item.trim()).filter(Boolean).forEach((item, columnIndex) => {
          buckets[Math.min(columnIndex, buckets.length - 1)].push(item);
        });
        return;
      }
      buckets[index % buckets.length].push(line);
    });
    return buckets;
  }

  function groupBoardLines(lines) {
    const groups = {};
    (lines.length ? lines : ["A fazer: Exemplo"]).forEach((line) => {
      const [rawGroup, ...rest] = line.split(":");
      const group = rest.length ? rawGroup.trim() || "Geral" : "Geral";
      const item = rest.length ? rest.join(":").trim() : line;
      groups[group] = groups[group] || [];
      groups[group].push(item || "Item");
    });
    return groups;
  }

  function pageBlockBoardLaneNames(groups) {
    const defaults = ["A fazer", "Fazendo", "Feito"];
    const names = [...defaults];
    Object.keys(groups || {}).forEach((name) => {
      if (!names.includes(name)) {
        names.push(name);
      }
    });
    return names.slice(0, 4);
  }

  function readPageBlockStructuredEditor(editor, type) {
    const blockType = normalizePageBlockType(type);
    if (blockType === "columns") {
      const columns = [...editor.querySelectorAll("[data-page-block-part='column']")].map((field) => pageBlockLines(field.innerText || field.textContent));
      return serializePageBlockColumns(columns);
    }

    if (blockType === "board") {
      return [...editor.querySelectorAll("[data-page-block-board-lane]")]
        .flatMap((section) => {
          const lane = section.dataset.pageBlockBoardLane || "Geral";
          const field = section.querySelector("[data-page-block-part='lane']");
          return pageBlockLines(field?.innerText || field?.textContent).map((item) => `${lane}: ${item}`);
        })
        .join("\n")
        .slice(0, 3000);
    }

    return [...editor.querySelectorAll("[data-page-block-field='body']")]
      .flatMap((field) => pageBlockLines(field.innerText || field.textContent))
      .join("\n")
      .slice(0, 3000);
  }

  function serializePageBlockColumns(columns) {
    const normalizedColumns = Array.isArray(columns) && columns.length ? columns : [[], [], []];
    const rowCount = Math.max(0, ...normalizedColumns.map((column) => column.length));
    const rows = [];
    for (let index = 0; index < rowCount; index += 1) {
      const cells = normalizedColumns.map((column) => column[index] || "");
      if (cells.some(Boolean)) {
        rows.push(cells.join(" | ").replace(/(\s+\|\s*)+$/g, "").trim());
      }
    }
    return rows.join("\n").slice(0, 3000);
  }

  function appendPageBlockLine(block, line) {
    const lines = pageBlockLines(block.body);
    lines.push(line);
    block.body = lines.join("\n").slice(0, 3000);
  }

  function uniquePageBlockLaneName(groups) {
    const existing = new Set(Object.keys(groups || {}));
    let index = 1;
    let name = "Nova etapa";
    while (existing.has(name)) {
      index += 1;
      name = `Nova etapa ${index}`;
    }
    return name;
  }

  function renderHomeWidgets() {
    if (!els.homeWidgetGrid) {
      return;
    }

    const layout = ensureHomeLayout();
    layout.editMode = false;
    const isEditing = Boolean(layout.editMode);
    const gridColumns = currentHomeWidgetMaxColumns();
    const placements = resolveHomeWidgetPlacements(layout, gridColumns);
    renderCustomHomeWidgets();

    els.homeWidgetGrid.classList.toggle("is-editing", isEditing);
    els.homeWidgetGrid.style.setProperty("--free-grid-cols", String(gridColumns));
    els.homeWidgetGrid.style.setProperty("--free-grid-row-height", `${HOME_WIDGET_GRID_ROW_HEIGHT}px`);
    els.homeCustomizeToggle?.classList.toggle("active", isEditing);
    const toggleLabel = els.homeCustomizeToggle?.querySelector("span");
    if (toggleLabel) {
      toggleLabel.textContent = isEditing ? "Concluir" : "Editar Home";
    }

    layout.widgets.forEach((widget) => {
      const card = findHomeWidgetCard(widget.id);
      if (!card) {
        return;
      }
      card.hidden = Boolean(widget.hidden);
      card.dataset.homeWidgetSize = normalizeHomeWidgetSize(widget.size, defaultHomeWidgetSize(widget.id));
      const grid = placements.get(widget.id) || homeWidgetGridPlacement(widget, gridColumns);
      card.dataset.homeWidgetCols = String(grid.cols);
      card.dataset.homeWidgetRows = String(grid.rows);
      card.style.setProperty("--widget-cols", String(grid.cols));
      card.style.setProperty("--widget-rows", String(grid.rows));
      card.style.setProperty("--widget-x", String(grid.x));
      card.style.setProperty("--widget-y", String(grid.y));
      card.style.setProperty("--widget-row-span", String(grid.rowSpan));
      card.style.setProperty("--widget-min-height", grid.height);
      card.style.setProperty("--widget-height", grid.height);
      card.draggable = false;
      ensureHomeWidgetControls(card, widget, isEditing);
      els.homeWidgetGrid.appendChild(card);
    });

    renderHiddenHomeWidgets(layout);
    updateHudContextActions();
    scheduleHomeWidgetContentFit();
  }

  function renderCustomHomeWidgets() {
    const customIds = new Set(state.customHomeWidgets.map((widget) => widget.id));
    els.homeWidgetGrid.querySelectorAll("[data-home-widget-custom='true']").forEach((card) => {
      if (!customIds.has(card.dataset.homeWidgetId)) {
        card.remove();
      }
    });

    state.customHomeWidgets.forEach((widget) => {
      let card = findHomeWidgetCard(widget.id);
      if (!card) {
        card = document.createElement("article");
        card.dataset.homeWidgetCard = "";
        card.dataset.homeWidgetCustom = "true";
        card.dataset.homeWidgetId = widget.id;
      }

      card.className = "game-board custom-board is-open";
      card.dataset.homeWidgetId = widget.id;
      card.style.setProperty("--board-accent", widget.color);
      card.innerHTML = `
        <div class="board-top">
          <div class="board-icon">
            ${svgIcon("icon-layout")}
          </div>
          <span class="board-badge">Livre</span>
        </div>
        <div class="board-title-row">
          <div>
            <p class="board-kicker">Quadro livre</p>
            <h2>${escapeHtml(widget.title)}</h2>
          </div>
          <svg class="icon board-corner-icon"><use href="#icon-edit"></use></svg>
        </div>
        <p class="custom-widget-note">${formatHomeWidgetNote(widget.note)}</p>
        <div class="board-footer">
          <span>Pagina propria</span>
          <button class="button primary board-action" type="button" data-home-widget-action="open">
            <span>Entrar</span>
          </button>
        </div>
      `;
      els.homeWidgetGrid.appendChild(card);
    });
  }

  function ensureHomeWidgetControls(card, widget, isEditing) {
    const existing = card.querySelector(".widget-controls");
    if (!isEditing) {
      existing?.remove();
      card.querySelector(".widget-resize-handle")?.remove();
      card.querySelector(".widget-resize-y-handle")?.remove();
      return;
    }

    const controls = existing || document.createElement("div");
    controls.className = "widget-controls";
    controls.innerHTML = `
      <div class="widget-drag-handle">
        ${svgIcon("icon-layout")}
        <span>Arraste o item</span>
      </div>
      <button class="widget-resize-inline-handle" type="button" data-home-widget-action="resize" aria-label="Redimensionar ${escapeHtml(getHomeWidgetLabel(widget.id))}" title="Arraste para redimensionar">
        <span>Redimensionar</span>
      </button>
      <div class="widget-card-actions">
        ${isCustomHomeWidget(widget.id) ? `
          <button class="icon-button" type="button" data-home-widget-action="edit" aria-label="Editar ${escapeHtml(getHomeWidgetLabel(widget.id))}" title="Editar">
            ${svgIcon("icon-edit")}
          </button>
          <button class="icon-button" type="button" data-home-widget-action="delete" aria-label="Excluir ${escapeHtml(getHomeWidgetLabel(widget.id))}" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        ` : ""}
        <button class="icon-button" type="button" data-home-widget-action="hide" aria-label="Ocultar ${escapeHtml(getHomeWidgetLabel(widget.id))}" title="Ocultar">
          ${svgIcon("icon-eye")}
        </button>
      </div>
    `;

    if (!existing) {
      card.prepend(controls);
    }

    if (!card.querySelector(".widget-resize-handle")) {
      const handle = document.createElement("button");
      handle.className = "widget-resize-handle";
      handle.type = "button";
      handle.draggable = false;
      handle.dataset.homeWidgetAction = "resize";
      handle.dataset.homeResizeAxis = "both";
      handle.setAttribute("aria-label", `Redimensionar ${getHomeWidgetLabel(widget.id)}`);
      handle.setAttribute("title", "Arraste para redimensionar");
      card.appendChild(handle);
    }

    if (!card.querySelector(".widget-resize-y-handle")) {
      const verticalHandle = document.createElement("button");
      verticalHandle.className = "widget-resize-y-handle";
      verticalHandle.type = "button";
      verticalHandle.draggable = false;
      verticalHandle.dataset.homeWidgetAction = "resize";
      verticalHandle.dataset.homeResizeAxis = "y";
      verticalHandle.setAttribute("aria-label", `Aumentar altura de ${getHomeWidgetLabel(widget.id)}`);
      verticalHandle.setAttribute("title", "Arraste para baixo ou para cima");
      card.appendChild(verticalHandle);
    }
  }

  function renderHiddenHomeWidgets(layout = ensureHomeLayout()) {
    const hiddenWidgets = layout.widgets.filter((widget) => widget.hidden);
    const isEditing = Boolean(layout.editMode);
    els.homeHiddenWidgets.hidden = !hiddenWidgets.length && !isEditing;

    if (!hiddenWidgets.length && !isEditing) {
      els.homeHiddenWidgets.innerHTML = "";
      return;
    }

    els.homeHiddenWidgets.innerHTML = `
      <span>Biblioteca</span>
      ${
        hiddenWidgets.length
          ? hiddenWidgets
              .map(
                (widget) => `
                  <button class="button secondary compact-button" type="button" data-home-widget-action="restore" data-home-widget-id="${escapeHtml(widget.id)}">
                    ${svgIcon("icon-eye")}
                    <span>Mostrar ${escapeHtml(getHomeWidgetLabel(widget.id))}</span>
                  </button>
                `,
              )
              .join("")
          : '<small>Todos os itens estao visiveis.</small>'
      }
      ${
        hiddenWidgets.length > 1
          ? `<button class="button primary compact-button" type="button" data-home-widget-action="restore-all">${svgIcon("icon-eye")}<span>Mostrar todos</span></button>`
          : ""
      }
    `;
  }

  function toggleHomeEditMode() {
    const layout = ensureHomeLayout();
    layout.editMode = !layout.editMode;
    saveState();
    renderHomeWidgets();
  }

  function handleHomeWidgetGridClick(event) {
    const button = event.target.closest("[data-home-widget-action]");
    if (!button) {
      return;
    }

    const card = button.closest("[data-home-widget-card]");
    const widgetId = card?.dataset.homeWidgetId;
    if (!widgetId) {
      return;
    }

    const action = button.dataset.homeWidgetAction;
    if (action === "move-up") {
      moveHomeWidget(widgetId, -1);
    } else if (action === "move-down") {
      moveHomeWidget(widgetId, 1);
    } else if (action === "open" && isCustomHomeWidget(widgetId)) {
      switchView(`custom:${widgetId}`);
    } else if (action === "hide") {
      setHomeWidgetHidden(widgetId, true);
    } else if (action === "edit" && isCustomHomeWidget(widgetId)) {
      openHomeWidgetDialog(widgetId);
    } else if (action === "delete" && isCustomHomeWidget(widgetId)) {
      deleteCustomHomeWidget(widgetId);
    }
  }

  function handleHomeWidgetGridChange(event) {
    const select = event.target.closest("[data-home-widget-size]");
    if (!select) {
      return;
    }

    const card = select.closest("[data-home-widget-card]");
    if (!card?.dataset.homeWidgetId) {
      return;
    }

    setHomeWidgetSize(card.dataset.homeWidgetId, select.value);
  }

  function handleHomeHiddenWidgetsClick(event) {
    const restoreAllButton = event.target.closest("[data-home-widget-action='restore-all']");
    if (restoreAllButton) {
      ensureHomeLayout().widgets.forEach((widget) => {
        widget.hidden = false;
      });
      saveState();
      renderHomeWidgets();
      return;
    }

    const button = event.target.closest("[data-home-widget-action='restore']");
    if (!button) {
      return;
    }

    setHomeWidgetHidden(button.dataset.homeWidgetId, false);
  }

  function moveHomeWidget(widgetId, direction) {
    const layout = ensureHomeLayout();
    const currentIndex = layout.widgets.findIndex((widget) => widget.id === widgetId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= layout.widgets.length) {
      return;
    }

    const [widget] = layout.widgets.splice(currentIndex, 1);
    layout.widgets.splice(nextIndex, 0, widget);
    saveState();
    renderHomeWidgets();
  }

  function handleHomeWidgetDragStart(event) {
    const card = event.target.closest("[data-home-widget-card]");
    if (!card || !ensureHomeLayout().editMode || event.target.closest("button, input, select, textarea, .widget-resize-handle")) {
      event.preventDefault();
      return;
    }

    homeDragWidgetId = card.dataset.homeWidgetId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", homeDragWidgetId);
  }

  function handleHomeWidgetDragOver(event) {
    if (!homeDragWidgetId) {
      return;
    }

    const targetCard = event.target.closest("[data-home-widget-card]");
    if (!targetCard || targetCard.dataset.homeWidgetId === homeDragWidgetId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const after = shouldDropAfterCard(event, targetCard);
    targetCard.classList.toggle("drop-after", after);
    targetCard.classList.toggle("drop-before", !after);
  }

  function handleHomeWidgetDrop(event) {
    const targetCard = event.target.closest("[data-home-widget-card]");
    if (!homeDragWidgetId || !targetCard || targetCard.dataset.homeWidgetId === homeDragWidgetId) {
      return;
    }

    event.preventDefault();
    moveHomeWidgetTo(homeDragWidgetId, targetCard.dataset.homeWidgetId, shouldDropAfterCard(event, targetCard));
  }

  function handleHomeWidgetDragEnd() {
    homeDragWidgetId = "";
    els.homeWidgetGrid.querySelectorAll(".is-dragging, .drop-before, .drop-after").forEach((card) => {
      card.classList.remove("is-dragging", "drop-before", "drop-after");
    });
  }

  function handleHomeWidgetPointerDown(event) {
    if (event.button !== 0 || homeResizeState || !ensureHomeLayout().editMode) {
      return;
    }

    const card = event.target.closest("[data-home-widget-card]");
    if (!card || event.target.closest("button, input, select, textarea, .widget-resize-handle")) {
      return;
    }

    homePointerDragState = {
      widgetId: card.dataset.homeWidgetId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(card.style.getPropertyValue("--widget-x")) || 1,
      y: Number(card.style.getPropertyValue("--widget-y")) || 1,
      startGridX: Number(card.style.getPropertyValue("--widget-x")) || 1,
      startGridY: Number(card.style.getPropertyValue("--widget-y")) || 1,
      dragging: false,
    };
    card.setPointerCapture?.(event.pointerId);
  }

  function handleHomeWidgetPointerMove(event) {
    if (!homePointerDragState || homeResizeState) {
      return;
    }

    const deltaX = event.clientX - homePointerDragState.startX;
    const deltaY = event.clientY - homePointerDragState.startY;
    if (!homePointerDragState.dragging && Math.hypot(deltaX, deltaY) < 8) {
      return;
    }

    homePointerDragState.dragging = true;
    const draggingCard = findHomeWidgetCard(homePointerDragState.widgetId);
    draggingCard?.classList.add("is-dragging");
    const widget = findHomeLayoutWidget(homePointerDragState.widgetId);
    const columns = currentHomeWidgetMaxColumns();
    const grid = homeWidgetGridPlacement(widget, columns);
    const cell = freeGridCellFromDragDelta(
      homePointerDragState.startGridX,
      homePointerDragState.startGridY,
      deltaX,
      deltaY,
      els.homeWidgetGrid,
      columns,
      HOME_WIDGET_GRID_ROW_HEIGHT,
      HOME_WIDGET_GRID_GAP,
    );
    const nextX = clampNumber(cell.x, 1, Math.max(1, columns - grid.cols + 1));
    const nextY = Math.max(1, cell.y);

    homePointerDragState.x = nextX;
    homePointerDragState.y = nextY;
    if (draggingCard) {
      draggingCard.style.setProperty("--widget-x", String(nextX));
      draggingCard.style.setProperty("--widget-y", String(nextY));
    }
    event.preventDefault();
  }

  function handleHomeWidgetPointerUp() {
    if (!homePointerDragState) {
      return;
    }

    const { widgetId, x, y, dragging } = homePointerDragState;
    homePointerDragState = null;
    els.homeWidgetGrid.querySelectorAll(".is-dragging, .drop-before, .drop-after").forEach((card) => {
      card.classList.remove("is-dragging", "drop-before", "drop-after");
    });
    clearHomeDropPreview();

    if (dragging) {
      const widget = findHomeLayoutWidget(widgetId);
      if (widget) {
        widget.x = x;
        widget.y = y;
        commitHomeWidgetPlacements(ensureHomeLayout(), currentHomeWidgetMaxColumns(), widgetId);
        saveState();
        renderHomeWidgets();
      }
    }
  }

  function shouldDropAfterCard(event, card) {
    const rect = card.getBoundingClientRect();
    const horizontal = rect.width >= rect.height;
    return horizontal ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2;
  }

  function showHomeDropPreview(sourceCard, targetCard, afterTarget) {
    if (!sourceCard || !targetCard) {
      return;
    }

    if (!homeDropPreview) {
      homeDropPreview = document.createElement("article");
      homeDropPreview.className = "game-board widget-drop-preview";
      homeDropPreview.setAttribute("aria-hidden", "true");
      homeDropPreview.innerHTML = "<span></span>";
    }

    homeDropPreview.style.setProperty("--widget-cols", sourceCard.style.getPropertyValue("--widget-cols") || "1");
    homeDropPreview.style.setProperty("--widget-rows", sourceCard.style.getPropertyValue("--widget-rows") || "1");
    homeDropPreview.style.setProperty("--widget-min-height", sourceCard.style.getPropertyValue("--widget-min-height") || "250px");
    targetCard.parentElement.insertBefore(homeDropPreview, afterTarget ? targetCard.nextSibling : targetCard);
  }

  function clearHomeDropPreview() {
    homeDropPreview?.remove();
  }

  function moveHomeWidgetTo(widgetId, targetWidgetId, afterTarget) {
    const layout = ensureHomeLayout();
    const fromIndex = layout.widgets.findIndex((widget) => widget.id === widgetId);
    const targetIndex = layout.widgets.findIndex((widget) => widget.id === targetWidgetId);
    if (fromIndex < 0 || targetIndex < 0) {
      return;
    }

    const [widget] = layout.widgets.splice(fromIndex, 1);
    const adjustedTargetIndex = layout.widgets.findIndex((item) => item.id === targetWidgetId);
    layout.widgets.splice(adjustedTargetIndex + (afterTarget ? 1 : 0), 0, widget);
    saveState();
    renderHomeWidgets();
  }

  function handleHomeWidgetResizeStart(event) {
    const handle = event.target.closest("[data-home-widget-action='resize']");
    if (!handle || !ensureHomeLayout().editMode) {
      return;
    }

    const card = handle.closest("[data-home-widget-card]");
    const widget = card ? findHomeLayoutWidget(card.dataset.homeWidgetId) : null;
    if (!card || !widget) {
      return;
    }

    const grid = homeWidgetGridFromLayout(widget, defaultHomeWidgetSize(widget.id));
    homeResizeState = {
      widgetId: widget.id,
      startX: event.clientX,
      startY: event.clientY,
      startCols: grid.cols,
      startRows: grid.rows,
      cols: grid.cols,
      rows: grid.rows,
      axis: handle.dataset.homeResizeAxis || "both",
    };
    card.classList.add("is-resizing");
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleHomeWidgetResizeMove(event) {
    if (!homeResizeState) {
      return;
    }

    const maxCols = currentHomeWidgetMaxColumns();
    const canResizeX = homeResizeState.axis !== "y";
    const canResizeY = homeResizeState.axis !== "x";
    const cols = canResizeX
      ? clampNumber(homeResizeState.startCols + Math.round((event.clientX - homeResizeState.startX) / 110), HOME_WIDGET_MIN_COLUMNS, maxCols)
      : homeResizeState.startCols;
    const rows = canResizeY
      ? clampNumber(
          homeResizeState.startRows + Math.round((event.clientY - homeResizeState.startY) / (HOME_WIDGET_GRID_ROW_HEIGHT + HOME_WIDGET_GRID_GAP)),
          HOME_WIDGET_MIN_ROWS,
          HOME_WIDGET_MAX_ROWS,
        )
      : homeResizeState.startRows;
    homeResizeState.cols = cols;
    homeResizeState.rows = rows;

    const card = findHomeWidgetCard(homeResizeState.widgetId);
    if (card) {
      const rowSpan = homeWidgetGridRowSpan(rows);
      card.dataset.homeWidgetCols = String(cols);
      card.dataset.homeWidgetRows = String(rows);
      card.style.setProperty("--widget-cols", String(cols));
      card.style.setProperty("--widget-rows", String(rows));
      card.style.setProperty("--widget-row-span", String(rowSpan));
      card.style.setProperty("--widget-min-height", freeGridItemHeight(rowSpan, HOME_WIDGET_GRID_ROW_HEIGHT, HOME_WIDGET_GRID_GAP));
      card.style.setProperty("--widget-height", freeGridItemHeight(rowSpan, HOME_WIDGET_GRID_ROW_HEIGHT, HOME_WIDGET_GRID_GAP));
    }
  }

  function handleHomeWidgetResizeEnd() {
    if (!homeResizeState) {
      return;
    }

    const widget = findHomeLayoutWidget(homeResizeState.widgetId);
    if (widget) {
      widget.cols = homeResizeState.cols;
      widget.rows = homeResizeState.rows;
      widget.size = homeWidgetSizeFromGrid(widget.cols, widget.rows);
      commitHomeWidgetPlacements(ensureHomeLayout(), currentHomeWidgetMaxColumns(), widget.id);
      saveState();
    }

    findHomeWidgetCard(homeResizeState.widgetId)?.classList.remove("is-resizing");
    homeResizeState = null;
    renderHomeWidgets();
  }

  function handleCustomHomePageClick(event) {
    const actionButton = event.target.closest("[data-custom-page-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.customPageAction;
    const page = actionButton.closest("[data-custom-home-page]");
    const widgetId = actionButton.dataset.homeWidgetId || page?.dataset.customHomePage || "";
    if (action === "back") {
      switchView("home");
    } else if (action === "edit" && widgetId) {
      openHomeWidgetDialog(widgetId);
    }
  }

  function handleCustomHomePageInput(event) {
    const editor = event.target.closest("[data-custom-widget-page-editor]");
    if (!editor) {
      return;
    }

    const widget = state.customHomeWidgets.find((item) => item.id === editor.dataset.homeWidgetId);
    if (!widget) {
      return;
    }

    widget.pageContent = editor.value;
    widget.updatedAt = new Date().toISOString();
    saveState();
  }

  function handlePageBuilderClick(event) {
    const button = event.target.closest("[data-page-builder-action]");
    if (!button || button.dataset.pageBuilderAction === "drag-block" || button.dataset.pageBuilderAction === "resize-block") {
      return;
    }

    const panel = button.closest("[data-page-builder]");
    const pageId = button.dataset.pageBuilderPage || panel?.dataset.pageBuilder;
    if (!pageId) {
      return;
    }

    const action = button.dataset.pageBuilderAction;
    if (action === "toggle-edit") {
      togglePageBuilderEditMode(pageId);
      return;
    }

    if (action === "open-add-block" || action === "add-block") {
      openPageBlockDialog(pageId);
      return;
    }

    const block = button.closest("[data-page-block-id]");
    if (!block) {
      return;
    }

    if (action === "delete-block") {
      deletePageBlock(pageId, block.dataset.pageBlockId);
      return;
    }

    if (action === "add-structured-item") {
      addPageBlockStructuredItem(pageId, block.dataset.pageBlockId, button.dataset);
    }
  }

  function handlePageBuilderInput(event) {
    const field = event.target.closest("[data-page-block-field]");
    if (!field) {
      return;
    }

    const panel = field.closest("[data-page-builder]");
    const blockElement = field.closest("[data-page-block-id]");
    const block = panel && blockElement ? findPageBlock(panel.dataset.pageBuilder, blockElement.dataset.pageBlockId) : null;
    if (!block) {
      return;
    }

    const structuredEditor = field.closest("[data-page-block-structured-editor]");
    if (structuredEditor && field.dataset.pageBlockField === "body") {
      block.body = readPageBlockStructuredEditor(structuredEditor, block.type);
      block.updatedAt = new Date().toISOString();
      saveState();
      return;
    }

    const fieldValue = field.isContentEditable
      ? normalizeEditableText(field.innerText || field.textContent, field.dataset.placeholder)
      : field.value;
    block[field.dataset.pageBlockField] = fieldValue;
    block.updatedAt = new Date().toISOString();
    saveState();

    if (field.dataset.pageBlockField === "body" && !field.isContentEditable) {
      const preview = blockElement.querySelector(".page-block-preview");
      if (preview) {
        preview.innerHTML = renderPageBlockPreview(block);
      }
    }
  }

  function handlePageBuilderChange(event) {
    const field = event.target.closest("[data-page-block-field]");
    if (!field) {
      return;
    }

    const panel = field.closest("[data-page-builder]");
    const blockElement = field.closest("[data-page-block-id]");
    const block = panel && blockElement ? findPageBlock(panel.dataset.pageBuilder, blockElement.dataset.pageBlockId) : null;
    if (!block) {
      return;
    }

    if (field.dataset.pageBlockField === "type") {
      block.type = normalizePageBlockType(field.value);
      block.updatedAt = new Date().toISOString();
      saveState();
      renderPageBuilders();
    }
  }

  function togglePageBuilderEditMode(pageId) {
    const builder = ensurePageBuilder(pageId);
    builder.editMode = !builder.editMode;
    saveState();
    renderPageBuilders();
    updateHudContextActions();
  }

  function openPageBlockDialog(pageId) {
    const builder = ensurePageBuilder(pageId);
    builder.editMode = true;
    els.pageBlockForm.reset();
    els.pageBlockPageId.value = pageId;
    els.pageBlockType.innerHTML = pageBlockTypeOptions("note");
    els.pageBlockType.value = "note";
    renderPageBlockTypePicker("note");
    els.pageBlockTitle.value = defaultPageBlockTitle("note");
    els.pageBlockBody.value = "";
    saveState();
    renderPageBuilders();

    if (typeof els.pageBlockDialog.showModal === "function") {
      els.pageBlockDialog.showModal();
    } else {
      els.pageBlockDialog.setAttribute("open", "open");
    }
  }

  function closePageBlockDialog() {
    if (typeof els.pageBlockDialog.close === "function") {
      els.pageBlockDialog.close();
    } else {
      els.pageBlockDialog.removeAttribute("open");
    }
  }

  function handlePageBlockTypePickerClick(event) {
    const option = event.target.closest("[data-page-block-type-option]");
    if (!option || !els.pageBlockForm.contains(option)) {
      return;
    }

    const type = normalizePageBlockType(option.dataset.pageBlockTypeOption);
    els.pageBlockType.value = type;
    updatePageBlockDialogDefaults();
  }

  function updatePageBlockDialogDefaults() {
    const type = normalizePageBlockType(els.pageBlockType.value);
    renderPageBlockTypePicker(type);
    els.pageBlockTitle.value = defaultPageBlockTitle(type);
    els.pageBlockBody.value = "";
  }

  function handlePageBlockDialogSubmit(event) {
    event.preventDefault();
    const pageId = els.pageBlockPageId.value;
    const type = normalizePageBlockType(els.pageBlockType.value);
    const title = els.pageBlockTitle.value.trim() || defaultPageBlockTitle(type);
    const body = els.pageBlockBody.value.trim();
    if (!pageId) {
      return;
    }

    addPageBlock(pageId, type, { title, body });
    closePageBlockDialog();
  }

  function handlePageBlockPointerDown(event) {
    if (event.button !== 0 || pageBlockResizeState) {
      return;
    }

    const handle = event.target.closest("[data-page-builder-action='drag-block']");
    const block = handle?.closest("[data-page-block-id]");
    const panel = block?.closest("[data-page-builder]");
    if (!handle || !block || !panel) {
      return;
    }

    const pageUsesLayout = Boolean(findViewPanel(panel.dataset.pageBuilder)?.classList.contains("has-page-layout"));
    const currentX = Number(block.style.getPropertyValue("--page-block-x")) || 1;
    const currentY = Math.max(1, (Number(block.style.getPropertyValue("--page-block-y")) || 1) - (pageUsesLayout ? 1 : 0));
    pageBlockDragState = {
      pageId: panel.dataset.pageBuilder,
      blockId: block.dataset.pageBlockId,
      startX: event.clientX,
      startY: event.clientY,
      x: currentX,
      y: currentY,
      startGridX: currentX,
      startGridY: currentY,
      dragging: false,
    };
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handlePageBlockPointerMove(event) {
    if (!pageBlockDragState || pageBlockResizeState) {
      return;
    }

    const deltaX = event.clientX - pageBlockDragState.startX;
    const deltaY = event.clientY - pageBlockDragState.startY;
    if (!pageBlockDragState.dragging && Math.hypot(deltaX, deltaY) < 8) {
      return;
    }

    pageBlockDragState.dragging = true;
    const draggingBlock = findPageBlockElement(pageBlockDragState.pageId, pageBlockDragState.blockId);
    draggingBlock?.classList.add("is-dragging");
    clearPageBlockDropPreview();
    const panel = draggingBlock?.closest("[data-page-builder]");
    const page = findViewPanel(pageBlockDragState.pageId);
    const usesPageLayout = Boolean(page?.classList.contains("has-page-layout"));
    const gridElement = usesPageLayout ? page : panel?.querySelector("[data-page-builder-grid]");
    const block = findPageBlock(pageBlockDragState.pageId, pageBlockDragState.blockId);
    if (!gridElement || !block) {
      return;
    }

    const columns = currentPageBlockMaxColumns();
    const grid = pageBlockGridPlacement(block, columns);
    const cell = freeGridCellFromDragDelta(
      pageBlockDragState.startGridX,
      pageBlockDragState.startGridY,
      deltaX,
      deltaY,
      gridElement,
      columns,
      usesPageLayout ? PAGE_LAYOUT_GRID_ROW_HEIGHT : PAGE_BLOCK_GRID_ROW_HEIGHT,
      usesPageLayout ? PAGE_LAYOUT_GRID_GAP : PAGE_BLOCK_GRID_GAP,
    );
    const nextX = clampNumber(cell.x, 1, Math.max(1, columns - grid.cols + 1));
    const nextY = Math.max(1, cell.y);

    pageBlockDragState.x = nextX;
    pageBlockDragState.y = nextY;
    draggingBlock.style.setProperty("--page-block-x", String(nextX));
    draggingBlock.style.setProperty("--page-block-y", String(nextY + (usesPageLayout ? 1 : 0)));
    event.preventDefault();
  }

  function handlePageBlockPointerUp() {
    if (!pageBlockDragState) {
      return;
    }

    const { pageId, blockId, x, y, dragging } = pageBlockDragState;
    pageBlockDragState = null;
    findPageBlockElement(pageId, blockId)?.classList.remove("is-dragging");
    clearPageBlockDropPreview();

    if (dragging) {
      const builder = ensurePageBuilder(pageId);
      const block = builder.blocks.find((item) => item.id === blockId);
      if (block) {
        assignResponsiveGridPosition(block, x, y, currentPageBlockMaxColumns());
        block.updatedAt = new Date().toISOString();
        commitPageBlockPlacements(builder, PAGE_BLOCK_MAX_COLUMNS, blockId, pageLayoutReservedCells(pageId, PAGE_BLOCK_MAX_COLUMNS));
        saveState();
        renderPageBuilders();
      }
    }
  }

  function handlePageBlockResizeStart(event) {
    const handle = event.target.closest("[data-page-builder-action='resize-block']");
    if (!handle) {
      return;
    }

    const blockElement = handle.closest("[data-page-block-id]");
    const panel = blockElement?.closest("[data-page-builder]");
    const block = panel && blockElement ? findPageBlock(panel.dataset.pageBuilder, blockElement.dataset.pageBlockId) : null;
    if (!block) {
      return;
    }
    const placement = pageBlockGridPlacement(block, currentPageBlockMaxColumns());

    pageBlockResizeState = {
      pageId: panel.dataset.pageBuilder,
      blockId: block.id,
      startX: event.clientX,
      startY: event.clientY,
      startCols: placement.cols,
      startRows: placement.rows,
      cols: placement.cols,
      rows: placement.rows,
    };
    blockElement.classList.add("is-resizing");
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePageBlockResizeMove(event) {
    if (!pageBlockResizeState) {
      return;
    }

    const maxCols = currentPageBlockMaxColumns();
    const cols = clampNumber(pageBlockResizeState.startCols + Math.round((event.clientX - pageBlockResizeState.startX) / 120), 1, maxCols);
    const rows = normalizePageBlockRows(pageBlockResizeState.startRows + Math.round((event.clientY - pageBlockResizeState.startY) / (PAGE_BLOCK_GRID_ROW_HEIGHT + PAGE_BLOCK_GRID_GAP)));
    pageBlockResizeState.cols = cols;
    pageBlockResizeState.rows = rows;
    const blockElement = findPageBlockElement(pageBlockResizeState.pageId, pageBlockResizeState.blockId);
    if (blockElement) {
      blockElement.style.setProperty("--page-block-cols", String(cols));
      blockElement.style.setProperty("--page-block-row-span", String(pageBlockGridRowSpan(rows)));
      blockElement.style.setProperty("--page-block-height", `${freeGridItemHeight(pageBlockGridRowSpan(rows), PAGE_BLOCK_GRID_ROW_HEIGHT, PAGE_BLOCK_GRID_GAP)}px`);
    }
  }

  function handlePageBlockResizeEnd() {
    if (!pageBlockResizeState) {
      return;
    }

    const block = findPageBlock(pageBlockResizeState.pageId, pageBlockResizeState.blockId);
    if (block) {
      assignResponsiveGridSize(
        block,
        pageBlockResizeState.cols,
        pageBlockResizeState.rows,
        currentPageBlockMaxColumns(),
        normalizePageBlockRows,
      );
      block.updatedAt = new Date().toISOString();
      commitPageBlockPlacements(
        ensurePageBuilder(pageBlockResizeState.pageId),
        PAGE_BLOCK_MAX_COLUMNS,
        block.id,
        pageLayoutReservedCells(pageBlockResizeState.pageId, PAGE_BLOCK_MAX_COLUMNS),
      );
      saveState();
    }

    findPageBlockElement(pageBlockResizeState.pageId, pageBlockResizeState.blockId)?.classList.remove("is-resizing");
    pageBlockResizeState = null;
  }

  function handlePageLayoutPointerDown(event) {
    if (event.button !== 0 || pageLayoutResizeState || pageLayoutDragState || pageBlockDragState || pageBlockResizeState) {
      return;
    }

    const handle = event.target.closest("[data-page-layout-action]");
    const itemElement = handle?.closest("[data-page-layout-item]");
    const page = itemElement?.closest("[data-view-panel]");
    const pageId = page?.dataset.viewPanel;
    if (!handle || !itemElement || !pageId) {
      return;
    }

    const builder = ensurePageBuilder(pageId);
    if (!builder.editMode) {
      return;
    }

    const item = findPageLayoutItem(pageId, itemElement.dataset.pageLayoutItem);
    if (!item) {
      return;
    }

    const placement = pageLayoutGridPlacement(item, currentPageBlockMaxColumns());
    const action = handle.dataset.pageLayoutAction;
    if (action === "resize") {
      pageLayoutResizeState = {
        pageId,
        itemId: item.id,
        startX: event.clientX,
        startY: event.clientY,
        startCols: placement.cols,
        startRows: placement.rows,
        cols: placement.cols,
        rows: placement.rows,
      };
      itemElement.classList.add("is-resizing");
    } else {
      pageLayoutDragState = {
        pageId,
        itemId: item.id,
        startX: event.clientX,
        startY: event.clientY,
        x: placement.x,
        y: placement.y,
        startGridX: placement.x,
        startGridY: placement.y,
        dragging: false,
      };
    }

    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePageLayoutPointerMove(event) {
    if (!pageLayoutDragState || pageLayoutResizeState) {
      return;
    }

    const deltaX = event.clientX - pageLayoutDragState.startX;
    const deltaY = event.clientY - pageLayoutDragState.startY;
    if (!pageLayoutDragState.dragging && Math.hypot(deltaX, deltaY) < 8) {
      return;
    }

    pageLayoutDragState.dragging = true;
    const itemElement = findPageLayoutItemElement(pageLayoutDragState.pageId, pageLayoutDragState.itemId);
    const page = findViewPanel(pageLayoutDragState.pageId);
    const item = findPageLayoutItem(pageLayoutDragState.pageId, pageLayoutDragState.itemId);
    if (!itemElement || !page || !item) {
      return;
    }

    itemElement.classList.add("is-dragging");
    const columns = currentPageBlockMaxColumns();
    const grid = pageLayoutGridPlacement(item, columns);
    const cell = freeGridCellFromDragDelta(
      pageLayoutDragState.startGridX,
      pageLayoutDragState.startGridY,
      deltaX,
      deltaY,
      page,
      columns,
      PAGE_LAYOUT_GRID_ROW_HEIGHT,
      PAGE_LAYOUT_GRID_GAP,
    );
    const nextX = clampNumber(cell.x, 1, Math.max(1, columns - grid.cols + 1));
    const nextY = Math.max(1, cell.y);

    pageLayoutDragState.x = nextX;
    pageLayoutDragState.y = nextY;
    itemElement.style.setProperty("--page-layout-x", String(nextX));
    itemElement.style.setProperty("--page-layout-y", String(nextY + 1));
    event.preventDefault();
  }

  function handlePageLayoutPointerUp() {
    if (!pageLayoutDragState) {
      return;
    }

    const { pageId, itemId, x, y, dragging } = pageLayoutDragState;
    pageLayoutDragState = null;
    findPageLayoutItemElement(pageId, itemId)?.classList.remove("is-dragging");
    if (!dragging) {
      return;
    }

    const item = findPageLayoutItem(pageId, itemId);
    if (!item) {
      return;
    }

    assignResponsiveGridPosition(item, x, y, currentPageBlockMaxColumns());
    item.customized = true;

    saveState();
    renderPageBuilders();
  }

  function handlePageLayoutResizeMove(event) {
    if (!pageLayoutResizeState) {
      return;
    }

    const maxCols = currentPageBlockMaxColumns();
    const cols = clampNumber(pageLayoutResizeState.startCols + Math.round((event.clientX - pageLayoutResizeState.startX) / 140), 1, maxCols);
    const rows = normalizePageLayoutRows(pageLayoutResizeState.startRows + Math.round((event.clientY - pageLayoutResizeState.startY) / (PAGE_LAYOUT_GRID_ROW_HEIGHT + PAGE_LAYOUT_GRID_GAP)));
    pageLayoutResizeState.cols = cols;
    pageLayoutResizeState.rows = rows;

    const itemElement = findPageLayoutItemElement(pageLayoutResizeState.pageId, pageLayoutResizeState.itemId);
    if (itemElement) {
      itemElement.style.setProperty("--page-layout-cols", String(cols));
      itemElement.style.setProperty("--page-layout-row-span", String(rows));
      itemElement.style.setProperty("--page-layout-height", `${freeGridItemHeight(rows, PAGE_LAYOUT_GRID_ROW_HEIGHT, PAGE_LAYOUT_GRID_GAP)}px`);
    }
    event.preventDefault();
  }

  function handlePageLayoutResizeEnd() {
    if (!pageLayoutResizeState) {
      return;
    }

    const item = findPageLayoutItem(pageLayoutResizeState.pageId, pageLayoutResizeState.itemId);
    if (item) {
      assignResponsiveGridSize(
        item,
        pageLayoutResizeState.cols,
        pageLayoutResizeState.rows,
        currentPageBlockMaxColumns(),
        normalizePageLayoutRows,
      );
      item.customized = true;
      saveState();
    }

    findPageLayoutItemElement(pageLayoutResizeState.pageId, pageLayoutResizeState.itemId)?.classList.remove("is-resizing");
    pageLayoutResizeState = null;
    renderPageBuilders();
  }

  function addPageBlock(pageId, type = "note", options = {}) {
    const builder = ensurePageBuilder(pageId);
    const blockType = normalizePageBlockType(type);
    const now = new Date().toISOString();
    builder.editMode = true;
    builder.blocks.push({
      id: createId("pageblock"),
      type: blockType,
      title: String(options.title || defaultPageBlockTitle(blockType)).slice(0, 90),
      body: String(Object.prototype.hasOwnProperty.call(options, "body") ? options.body : defaultPageBlockBody(blockType)).slice(0, 3000),
      cols: blockType === "board" || blockType === "columns" || blockType === "gallery" || blockType === "table" ? 2 : 1,
      rows: PAGE_BLOCK_MIN_ROWS,
      createdAt: now,
      updatedAt: now,
    });
    commitPageBlockPlacements(builder, PAGE_BLOCK_MAX_COLUMNS, "", pageLayoutReservedCells(pageId, PAGE_BLOCK_MAX_COLUMNS));
    saveState();
    renderPageBuilders();
  }

  function deletePageBlock(pageId, blockId) {
    const builder = ensurePageBuilder(pageId);
    builder.blocks = builder.blocks.filter((block) => block.id !== blockId);
    saveState();
    renderPageBuilders();
  }

  function addPageBlockStructuredItem(pageId, blockId, options = {}) {
    const block = findPageBlock(pageId, blockId);
    if (!block) {
      return;
    }

    const type = normalizePageBlockType(block.type);
    const kind = String(options.pageBlockAddKind || "");
    if (type === "columns" && kind === "column") {
      const columns = splitPageBlockColumns(pageBlockLines(block.body));
      const columnIndex = clampNumber(Number(options.pageBlockColumnIndex), 0, columns.length - 1);
      columns[columnIndex].push("Novo item");
      block.body = serializePageBlockColumns(columns);
    } else if (type === "board" && kind === "board-lane") {
      const groups = groupBoardLines(pageBlockLines(block.body));
      appendPageBlockLine(block, `${uniquePageBlockLaneName(groups)}: Novo item`);
    } else if (type === "board") {
      const lane = String(options.pageBlockLane || "").trim() || pageBlockBoardLaneNames(groupBoardLines(pageBlockLines(block.body)))[0] || "A fazer";
      appendPageBlockLine(block, `${lane}: Novo item`);
    } else if (type === "gallery") {
      appendPageBlockLine(block, "Novo card");
    } else if (type === "table") {
      appendPageBlockLine(block, "Nova linha");
    } else {
      appendPageBlockLine(block, "Novo item");
    }

    block.updatedAt = new Date().toISOString();
    saveState();
    renderPageBuilders();
    schedulePageBlockContentFit();
  }

  function movePageBlockTo(pageId, blockId, targetBlockId, afterTarget) {
    const builder = ensurePageBuilder(pageId);
    const fromIndex = builder.blocks.findIndex((block) => block.id === blockId);
    const targetIndex = builder.blocks.findIndex((block) => block.id === targetBlockId);
    if (fromIndex < 0 || targetIndex < 0) {
      return;
    }

    const [block] = builder.blocks.splice(fromIndex, 1);
    const adjustedTargetIndex = builder.blocks.findIndex((item) => item.id === targetBlockId);
    builder.blocks.splice(adjustedTargetIndex + (afterTarget ? 1 : 0), 0, block);
    saveState();
    renderPageBuilders();
  }

  function pageBuilderIds() {
    return ["finance", "workouts", "study", "creative", "media", "recipes", "shopping", ...state.customHomeWidgets.map((widget) => `custom:${widget.id}`)];
  }

  function findViewPanel(pageId) {
    return els.main.querySelector(`[data-view-panel="${cssEscape(pageId)}"]`);
  }

  function ensurePageBuilders() {
    state.pageBuilders = normalizePageBuilders(state.pageBuilders || state.page_builders || []);
    pageBuilderIds().forEach((pageId) => ensurePageBuilder(pageId));
    state.pageBuilders = state.pageBuilders.filter((builder) => pageBuilderIds().includes(builder.pageId));
    return state.pageBuilders;
  }

  function ensurePageBuilder(pageId) {
    state.pageBuilders = Array.isArray(state.pageBuilders) ? state.pageBuilders : [];
    let builder = state.pageBuilders.find((item) => item.pageId === pageId);
    if (!builder) {
      builder = {
        pageId,
        editMode: false,
        blocks: [],
        layoutVersion: PAGE_LAYOUT_SCHEMA_VERSION,
        layoutItems: [],
      };
      state.pageBuilders.push(builder);
    }
    builder.editMode = Boolean(builder.editMode);
    builder.blocks = normalizePageBlocks(builder.blocks || []);
    if (builder.layoutVersion !== PAGE_LAYOUT_SCHEMA_VERSION) {
      const migratedLayoutItems = normalizePageLayoutItems(builder.layoutItems || []).map(migratePageLayoutItemSize);
      builder.layoutItems = pageId.startsWith("custom:") ? migratedLayoutItems : [];
      builder.layoutVersion = PAGE_LAYOUT_SCHEMA_VERSION;
    } else {
      builder.layoutItems = normalizePageLayoutItems(builder.layoutItems || []);
    }
    commitPageBlockPlacements(builder, PAGE_BLOCK_MAX_COLUMNS);
    return builder;
  }

  function findPageBlock(pageId, blockId) {
    return ensurePageBuilder(pageId).blocks.find((block) => block.id === blockId) || null;
  }

  function findPageBlockElement(pageId, blockId) {
    const panel = els.main.querySelector(`[data-page-builder="${cssEscape(pageId)}"]`);
    return panel?.querySelector(`[data-page-block-id="${cssEscape(blockId)}"]`) || null;
  }

  function findPageLayoutItem(pageId, itemId) {
    return ensurePageBuilder(pageId).layoutItems.find((item) => item.id === itemId) || null;
  }

  function findPageLayoutItemElement(pageId, itemId) {
    const page = findViewPanel(pageId);
    return page?.querySelector(`[data-page-layout-item="${cssEscape(itemId)}"]`) || null;
  }

  function findPageLayoutItemElementAtPoint(pageId, x, y, excludedItemId = "") {
    const page = findViewPanel(pageId);
    if (!page) {
      return null;
    }

    return [...page.querySelectorAll("[data-page-layout-item]")]
      .filter((item) => item.dataset.pageLayoutItem !== excludedItemId)
      .find((item) => {
        const rect = item.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      }) || null;
  }

  function findPageLayoutSwapTarget(pageId, sourceItem, x, y, excludedItemId = "") {
    const pointerTarget = findPageLayoutItemElementAtPoint(pageId, x, y, excludedItemId);
    if (pointerTarget || !sourceItem) {
      return pointerTarget;
    }

    const page = findViewPanel(pageId);
    if (!page) {
      return null;
    }

    const sourceRect = sourceItem.getBoundingClientRect();
    return [...page.querySelectorAll("[data-page-layout-item]")]
      .filter((item) => item.dataset.pageLayoutItem !== excludedItemId)
      .map((item) => ({ item, area: rectIntersectionArea(sourceRect, item.getBoundingClientRect()) }))
      .filter((entry) => entry.area > 0)
      .sort((a, b) => b.area - a.area)[0]?.item || null;
  }

  function findPageBlockElementAtPoint(pageId, x, y, excludedBlockId = "") {
    const panel = els.main.querySelector(`[data-page-builder="${cssEscape(pageId)}"]`);
    if (!panel) {
      return null;
    }

    return [...panel.querySelectorAll("[data-page-block-id]")]
      .filter((block) => block.dataset.pageBlockId !== excludedBlockId)
      .find((block) => {
        const rect = block.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      }) || null;
  }

  function findPageBlockSwapTarget(pageId, sourceBlock, x, y, excludedBlockId = "") {
    const pointerTarget = findPageBlockElementAtPoint(pageId, x, y, excludedBlockId);
    if (pointerTarget || !sourceBlock) {
      return pointerTarget;
    }

    const panel = els.main.querySelector(`[data-page-builder="${cssEscape(pageId)}"]`);
    if (!panel) {
      return null;
    }

    const sourceRect = sourceBlock.getBoundingClientRect();
    return [...panel.querySelectorAll("[data-page-block-id]")]
      .filter((block) => block.dataset.pageBlockId !== excludedBlockId)
      .map((block) => ({ block, area: rectIntersectionArea(sourceRect, block.getBoundingClientRect()) }))
      .filter((item) => item.area > 0)
      .sort((a, b) => b.area - a.area)[0]?.block || null;
  }

  function showPageBlockDropPreview(sourceBlock, targetBlock, afterTarget) {
    if (!sourceBlock || !targetBlock) {
      return;
    }

    if (!pageBlockDropPreview) {
      pageBlockDropPreview = document.createElement("article");
      pageBlockDropPreview.className = "page-block-drop-preview";
      pageBlockDropPreview.setAttribute("aria-hidden", "true");
    }

    pageBlockDropPreview.style.setProperty("--page-block-cols", sourceBlock.style.getPropertyValue("--page-block-cols") || "1");
    targetBlock.parentElement.insertBefore(pageBlockDropPreview, afterTarget ? targetBlock.nextSibling : targetBlock);
  }

  function clearPageBlockDropPreview() {
    pageBlockDropPreview?.remove();
  }

  function pageBlockTypeOptions(selectedType) {
    const selected = normalizePageBlockType(selectedType);
    return PAGE_BLOCK_TYPE_ORDER.map((type) => `<option value="${type}"${type === selected ? " selected" : ""}>${PAGE_BLOCK_TYPES[type].label}</option>`).join("");
  }

  function renderPageBlockTypePicker(selectedType) {
    if (!els.pageBlockTypeOptions) {
      return;
    }
    const selected = normalizePageBlockType(selectedType);
    els.pageBlockTypeOptions.innerHTML = PAGE_BLOCK_TYPE_ORDER.map((type) => {
      const active = type === selected;
      return `
        <button class="page-block-type-option${active ? " active" : ""}" type="button" data-page-block-type-option="${type}" aria-pressed="${active ? "true" : "false"}">
          <strong>${escapeHtml(PAGE_BLOCK_TYPES[type].label)}</strong>
          <span>${escapeHtml(pageBlockTypeHelp(type))}</span>
        </button>
      `;
    }).join("");
  }

  function pageBlockTypeHelp(type) {
    const helps = {
      note: "Texto livre",
      list: "Itens em lista",
      columns: "Tres colunas separadas",
      table: "Linhas empilhadas",
      board: "Etapas por coluna",
      gallery: "Cards soltos",
    };
    return helps[normalizePageBlockType(type)] || helps.note;
  }

  function normalizePageBlockType(type) {
    return Object.prototype.hasOwnProperty.call(PAGE_BLOCK_TYPES, type) ? type : "note";
  }

  function defaultPageBlockTitle(type) {
    return PAGE_BLOCK_TYPES[normalizePageBlockType(type)].label;
  }

  function defaultPageBlockBody(type) {
    const defaults = {
      note: "Escreva aqui.",
      list: "Item 1\nItem 2\nItem 3",
      columns: "Coluna A item 1 | Coluna B item 1 | Coluna C item 1\nColuna A item 2 | Coluna B item 2 | Coluna C item 2",
      table: "Linha 1\nLinha 2\nLinha 3",
      board: "A fazer: Primeiro item\nFazendo: Segundo item\nFeito: Terceiro item",
      gallery: "Card 1\nCard 2\nCard 3",
    };
    return defaults[normalizePageBlockType(type)] || defaults.note;
  }

  function setHomeWidgetSize(widgetId, size) {
    const widget = findHomeLayoutWidget(widgetId);
    if (!widget) {
      return;
    }

    widget.size = normalizeHomeWidgetSize(size, defaultHomeWidgetSize(widgetId));
    const grid = homeWidgetGridFromSize(widget.size);
    widget.cols = grid.cols;
    widget.rows = grid.rows;
    commitHomeWidgetPlacements(ensureHomeLayout(), currentHomeWidgetMaxColumns(), widgetId);
    saveState();
    renderHomeWidgets();
  }

  function setHomeWidgetHidden(widgetId, hidden) {
    const widget = findHomeLayoutWidget(widgetId);
    if (!widget) {
      return;
    }

    widget.hidden = Boolean(hidden);
    if (!widget.hidden) {
      commitHomeWidgetPlacements(ensureHomeLayout(), currentHomeWidgetMaxColumns(), widgetId);
    }
    saveState();
    renderHomeWidgets();
  }

  function resetHomeLayout() {
    state.homeLayout = defaultHomeLayout(state.customHomeWidgets);
    saveState();
    renderHomeWidgets();
    showToast("Home resetada.");
  }

  function openHomeWidgetDialog(widgetId = "") {
    const widget = widgetId ? state.customHomeWidgets.find((item) => item.id === widgetId) : null;
    els.homeWidgetForm.reset();
    els.homeWidgetDialogTitle.textContent = widget ? "Editar item" : "Novo item";
    els.homeWidgetId.value = widget?.id || "";
    els.homeWidgetTitle.value = widget?.title || "";
    els.homeWidgetSize.value = widget ? findHomeLayoutWidget(widget.id)?.size || "medium" : "medium";
    els.homeWidgetColor.value = widget?.color || "#615bd0";
    els.homeWidgetNote.value = widget?.note || "";
    els.homeWidgetPageContent.value = widget?.pageContent || "";

    if (typeof els.homeWidgetDialog.showModal === "function") {
      els.homeWidgetDialog.showModal();
    } else {
      els.homeWidgetDialog.setAttribute("open", "open");
    }
  }

  function closeHomeWidgetDialog() {
    if (typeof els.homeWidgetDialog.close === "function") {
      els.homeWidgetDialog.close();
    } else {
      els.homeWidgetDialog.removeAttribute("open");
    }
  }

  function handleHomeWidgetSubmit(event) {
    event.preventDefault();

    const title = els.homeWidgetTitle.value.trim();
    if (!title) {
      showToast("Informe o titulo do item.");
      return;
    }

    const now = new Date().toISOString();
    const widgetId = els.homeWidgetId.value;
    const existing = state.customHomeWidgets.find((widget) => widget.id === widgetId);
    const payload = {
      id: existing?.id || createId("homewidget"),
      title,
      note: els.homeWidgetNote.value.trim(),
      pageContent: els.homeWidgetPageContent.value.trim(),
      color: sanitizeWidgetColor(els.homeWidgetColor.value),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, payload);
      setHomeWidgetSize(existing.id, els.homeWidgetSize.value);
    } else {
      state.customHomeWidgets.push(payload);
      const layoutWidget = findHomeLayoutWidget(payload.id);
      if (layoutWidget) {
        layoutWidget.size = normalizeHomeWidgetSize(els.homeWidgetSize.value, "medium");
        const grid = homeWidgetGridFromSize(layoutWidget.size);
        layoutWidget.cols = grid.cols;
        layoutWidget.rows = grid.rows;
        layoutWidget.hidden = false;
        commitHomeWidgetPlacements(ensureHomeLayout(), currentHomeWidgetMaxColumns());
      }
    }

    saveState();
    closeHomeWidgetDialog();
    renderCustomHomePages();
    renderPageBuilders();
    renderHomeWidgets();
    showToast(existing ? "Quadro atualizado." : "Quadro criado.");
  }

  function deleteCustomHomeWidget(widgetId) {
    const widget = state.customHomeWidgets.find((item) => item.id === widgetId);
    if (!widget || !window.confirm(`Excluir o item "${widget.title}"?`)) {
      return;
    }

    state.customHomeWidgets = state.customHomeWidgets.filter((item) => item.id !== widgetId);
    state.homeLayout.widgets = ensureHomeLayout().widgets.filter((item) => item.id !== widgetId);
    if (activeView === `custom:${widgetId}`) {
      switchView("home", { replaceHash: true });
    }
    saveState();
    renderCustomHomePages();
    renderPageBuilders();
    renderHomeWidgets();
    showToast("Quadro excluido.");
  }

  function findHomeWidgetCard(widgetId) {
    return [...els.homeWidgetGrid.querySelectorAll("[data-home-widget-card]")].find((card) => card.dataset.homeWidgetId === widgetId) || null;
  }

  function findHomeWidgetCardAtPoint(x, y, excludedWidgetId = "") {
    return [...els.homeWidgetGrid.querySelectorAll("[data-home-widget-card]:not([hidden])")]
      .filter((card) => card.dataset.homeWidgetId !== excludedWidgetId)
      .find((card) => {
        const rect = card.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      }) || null;
  }

  function findHomeWidgetSwapTarget(sourceCard, x, y, excludedWidgetId = "") {
    const pointerTarget = findHomeWidgetCardAtPoint(x, y, excludedWidgetId);
    if (pointerTarget || !sourceCard) {
      return pointerTarget;
    }

    const sourceRect = sourceCard.getBoundingClientRect();
    return [...els.homeWidgetGrid.querySelectorAll("[data-home-widget-card]:not([hidden])")]
      .filter((card) => card.dataset.homeWidgetId !== excludedWidgetId)
      .map((card) => ({ card, area: rectIntersectionArea(sourceRect, card.getBoundingClientRect()) }))
      .filter((item) => item.area > 0)
      .sort((a, b) => b.area - a.area)[0]?.card || null;
  }

  function findHomeLayoutWidget(widgetId) {
    return ensureHomeLayout().widgets.find((widget) => widget.id === widgetId) || null;
  }

  function ensureHomeLayout() {
    state.customHomeWidgets = normalizeCustomHomeWidgets(state.customHomeWidgets || []);
    state.homeLayout = normalizeHomeLayout(state.homeLayout, state.customHomeWidgets);
    return state.homeLayout;
  }

  function getHomeWidgetLabel(widgetId) {
    return HOME_WIDGET_DEFINITIONS[widgetId]?.label || state.customHomeWidgets.find((widget) => widget.id === widgetId)?.title || "Quadro";
  }

  function isCustomHomeWidget(widgetId) {
    return state.customHomeWidgets.some((widget) => widget.id === widgetId);
  }

  function homeWidgetSizeOptions(selectedSize) {
    const selected = normalizeHomeWidgetSize(selectedSize, "medium");
    return Object.entries(HOME_WIDGET_SIZES)
      .map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`)
      .join("");
  }

  function formatHomeWidgetNote(note) {
    const text = String(note || "").trim();
    return text ? escapeHtml(text).replace(/\n/g, "<br>") : "Sem texto cadastrado.";
  }






















  function renderStudy() {
    if (!els.studyScheduleBoard) {
      return;
    }

    ensureStudyState();
    const stats = getStudyStats();
    renderStudySummary(stats);
    renderStudyCategoryControls();
    renderStudySchedule();
    renderStudyLinks();
    renderStudyTodos();
    renderStudyCalendar();
    renderStudyResources();
    renderStudyPomodoro();
  }

  function renderStudySummary(stats = getStudyStats()) {
    els.studyScheduleTotal.textContent = String(stats.scheduleCount);
    els.studyScheduleDetail.textContent = stats.scheduleCount === 0 ? "sem blocos na semana" : plural(stats.scheduleCount, "bloco planejado", "blocos planejados");
    els.studyTodoOpenTotal.textContent = String(stats.openTodos);
    els.studyTodoDetail.textContent = stats.openTodos === 0 ? "nada pendente" : plural(stats.completedTodos, "concluido", "concluidos");
    els.studyResourceTotal.textContent = String(stats.resources);
    els.studyResourceDetail.textContent = stats.resources === 0 ? "sem materiais" : plural(stats.doneResources, "material finalizado", "materiais finalizados");
    els.studyReferenceTotal.textContent = String(stats.links + stats.notes);
    els.studyReferenceDetail.textContent = `${plural(stats.links, "link", "links")} - ${plural(stats.notes, "anotacao", "anotacoes")}`;
  }

  function openStudyCategoryDialog() {
    renderStudyCategoryControls();
    if (els.studyCategoryDialog?.showModal) {
      els.studyCategoryDialog.showModal();
    }
  }

  function closeStudyCategoryDialog() {
    els.studyCategoryDialog?.close();
  }

  function renderStudyCategoryControls() {
    renderStudyCategorySelect(els.studyLinkGroup, "link");
    renderStudyCategorySelect(els.studyTodoArea, "todo");
    renderStudyCategorySelect(els.studyResourceType, "resource");
    if (els.studyCategoryScope) {
      const selectedScope = normalizeStudyCategoryScope(els.studyCategoryScope.value);
      els.studyCategoryScope.innerHTML = STUDY_CATEGORY_SCOPE_ORDER.map((scope) => {
        const config = STUDY_CATEGORY_SCOPES[scope];
        return `<option value="${escapeHtml(scope)}"${scope === selectedScope ? " selected" : ""}>${escapeHtml(config.label)}</option>`;
      }).join("");
    }
    renderStudyCategoryList();
  }

  function renderStudyCategorySelect(select, scope, selectedId = select?.value) {
    if (!select) {
      return;
    }
    const categories = getStudyCategories(scope);
    const selected = normalizeStudyCategoryValue(selectedId, categories);
    select.innerHTML = categories.map((category) => `<option value="${escapeHtml(category.id)}"${category.id === selected ? " selected" : ""}>${escapeHtml(category.label)}</option>`).join("");
  }

  function renderStudyCategoryList() {
    if (!els.studyCategoryList) {
      return;
    }
    els.studyCategoryList.innerHTML = STUDY_CATEGORY_SCOPE_ORDER.map((scope) => {
      const config = STUDY_CATEGORY_SCOPES[scope];
      const categories = getStudyCategories(scope);
      const rows = categories.map((category) => {
        const usage = countStudyCategoryUsage(scope, category.id);
        return `
          <article class="study-category-row" data-study-category-scope="${escapeHtml(scope)}" data-study-category-id="${escapeHtml(category.id)}">
            <span class="study-category-swatch" style="--study-accent:${escapeHtml(category.accent)}"></span>
            <input type="text" maxlength="60" value="${escapeHtml(category.label)}" data-study-action="category-label" aria-label="Nome da categoria ${escapeHtml(category.label)}">
            <input type="color" value="${escapeHtml(category.accent)}" data-study-action="category-color" aria-label="Cor da categoria ${escapeHtml(category.label)}">
            <small>${plural(usage, "item", "itens")}</small>
            <button class="icon-button" type="button" data-study-action="category-delete" aria-label="Excluir categoria ${escapeHtml(category.label)}" title="Excluir" ${categories.length <= 1 ? "disabled" : ""}>
              ${svgIcon("icon-trash")}
            </button>
          </article>
        `;
      }).join("");
      return `
        <section class="study-category-group">
          <h3>${escapeHtml(config.label)}</h3>
          <div class="study-category-rows">${rows}</div>
        </section>
      `;
    }).join("");
  }

  function handleStudyCategorySubmit(event) {
    event.preventDefault();
    const scope = normalizeStudyCategoryScope(els.studyCategoryScope.value);
    const name = els.studyCategoryName.value.trim();
    if (!name) {
      return;
    }
    const study = ensureStudyState();
    const categories = getStudyCategories(scope);
    categories.push({
      id: createId("studycat"),
      label: name.slice(0, 60),
      accent: safeColor(els.studyCategoryColor.value),
    });
    study[STUDY_CATEGORY_SCOPES[scope].field] = normalizeStudyCategories(categories, STUDY_CATEGORY_SCOPES[scope].defaults);
    els.studyCategoryName.value = "";
    saveState();
    renderStudy();
  }

  function handleStudyCategoryClick(event) {
    const button = event.target.closest("[data-study-action='category-delete']");
    if (!button || button.disabled) {
      return;
    }
    const row = button.closest("[data-study-category-scope]");
    const scope = normalizeStudyCategoryScope(row?.dataset.studyCategoryScope);
    const categoryId = row?.dataset.studyCategoryId;
    deleteStudyCategory(scope, categoryId);
  }

  function handleStudyCategoryChange(event) {
    const control = event.target.closest("[data-study-action='category-label'], [data-study-action='category-color']");
    if (!control) {
      return;
    }
    const row = control.closest("[data-study-category-scope]");
    const scope = normalizeStudyCategoryScope(row?.dataset.studyCategoryScope);
    const categoryId = row?.dataset.studyCategoryId;
    const category = getStudyCategories(scope).find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }
    if (control.dataset.studyAction === "category-label") {
      const label = control.value.trim();
      if (!label) {
        control.value = category.label;
        return;
      }
      category.label = label.slice(0, 60);
    } else {
      category.accent = safeColor(control.value);
    }
    ensureStudyState()[STUDY_CATEGORY_SCOPES[scope].field] = normalizeStudyCategories(getStudyCategories(scope), STUDY_CATEGORY_SCOPES[scope].defaults);
    saveState();
    renderStudy();
  }

  function renderStudySchedule() {
    const study = ensureStudyState();
    els.studyScheduleBoard.innerHTML = WORKOUT_WEEKDAYS.map((day) => {
      const items = Array.isArray(study.schedule[day.key]) ? study.schedule[day.key] : [];
      const cards = items.length
        ? items.map((item) => renderStudyScheduleItem(item)).join("")
        : `<div class="study-empty-card">Nenhum bloco neste dia.</div>`;
      return `
        <section class="study-day-column" data-study-day="${escapeHtml(day.key)}">
          <header>
            <span>${escapeHtml(day.label)}</span>
            <strong>${escapeHtml(day.longLabel)}</strong>
          </header>
          <div class="study-day-list">
            ${cards}
          </div>
          <form class="study-day-add-form" data-study-day="${escapeHtml(day.key)}">
            <input type="text" maxlength="120" placeholder="Novo bloco">
            <textarea maxlength="700" rows="2" placeholder="Detalhes, links, objetivo, materia..."></textarea>
            <button class="icon-button" type="submit" aria-label="Adicionar em ${escapeHtml(day.longLabel)}" title="Adicionar">
              ${svgIcon("icon-plus")}
            </button>
          </form>
        </section>
      `;
    }).join("");
  }

  function renderStudyScheduleItem(item) {
    const checked = item.done ? " checked" : "";
    const expanded = item.expanded ? " is-open" : "";
    const details = String(item.details || "").trim();
    return `
      <article class="study-schedule-card${item.done ? " is-done" : ""}${expanded}" data-study-schedule-id="${escapeHtml(item.id)}">
        <div class="study-schedule-card-main">
          <label class="study-check" aria-label="Concluir ${escapeHtml(item.title)}">
            <input type="checkbox" data-study-action="schedule-toggle" data-study-id="${escapeHtml(item.id)}"${checked}>
            <span>${svgIcon("icon-check")}</span>
          </label>
          <button class="study-schedule-open" type="button" data-study-action="schedule-expand" data-study-id="${escapeHtml(item.id)}" aria-expanded="${item.expanded ? "true" : "false"}">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${details ? "com detalhes" : "abrir detalhes"}</small>
          </button>
          <button class="icon-button" type="button" data-study-action="schedule-delete" data-study-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        </div>
        ${
          item.expanded
            ? `<div class="study-schedule-details">
                <label class="field">
                  <span>Titulo</span>
                  <input type="text" maxlength="120" value="${escapeHtml(item.title)}" data-study-action="schedule-title" data-study-id="${escapeHtml(item.id)}">
                </label>
                <label class="field">
                  <span>Mais informacoes</span>
                  <textarea maxlength="700" rows="4" data-study-action="schedule-details" data-study-id="${escapeHtml(item.id)}" placeholder="Detalhes, links, objetivo, materia...">${escapeHtml(details)}</textarea>
                </label>
              </div>`
            : ""
        }
      </article>
    `;
  }

  function handleStudyScheduleSubmit(event) {
    const form = event.target.closest(".study-day-add-form");
    if (!form) {
      return;
    }
    event.preventDefault();
    const day = normalizeStudyWeekday(form.dataset.studyDay);
    const input = form.querySelector("input");
    const title = String(input?.value || "").trim();
    if (!title) {
      return;
    }

    const study = ensureStudyState();
    study.schedule[day].push({
      id: createId("studyday"),
      title: title.slice(0, 120),
      details: String(form.querySelector("textarea")?.value || "").trim().slice(0, 700),
      done: false,
      expanded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    form.reset();
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyScheduleClick(event) {
    const deleteButton = event.target.closest("[data-study-action='schedule-delete']");
    if (deleteButton) {
      event.preventDefault();
      const study = ensureStudyState();
      WORKOUT_WEEKDAYS.forEach((day) => {
        study.schedule[day.key] = (study.schedule[day.key] || []).filter((item) => item.id !== deleteButton.dataset.studyId);
      });
      saveState();
      renderStudy();
      renderHome();
      return;
    }

    const expandButton = event.target.closest("[data-study-action='schedule-expand']");
    if (expandButton) {
      const item = findStudyScheduleItem(expandButton.dataset.studyId);
      if (!item) {
        return;
      }
      item.expanded = !item.expanded;
      item.updatedAt = new Date().toISOString();
      saveState();
      renderStudySchedule();
    }
  }

  function handleStudyScheduleChange(event) {
    const control = event.target.closest("[data-study-action]");
    if (!control) {
      return;
    }
    const item = findStudyScheduleItem(control.dataset.studyId);
    if (!item) {
      return;
    }
    if (control.dataset.studyAction === "schedule-toggle") {
      item.done = Boolean(control.checked);
    } else if (control.dataset.studyAction === "schedule-title") {
      const title = control.value.trim();
      if (!title) {
        control.value = item.title;
        return;
      }
      item.title = title.slice(0, 120);
    } else if (control.dataset.studyAction === "schedule-details") {
      item.details = control.value.trim().slice(0, 700);
    } else {
      return;
    }
    item.updatedAt = new Date().toISOString();
    saveState();
    renderStudy();
    renderHome();
  }

  function renderStudyLinks() {
    const study = ensureStudyState();
    const links = study.links;
    els.studyLinkList.innerHTML = getStudyCategories("link").map((category) => {
      const group = category.id;
      const groupLinks = links.filter((link) => link.group === group);
      const content = groupLinks.length
        ? groupLinks.map(renderStudyLinkRow).join("")
        : `<div class="study-empty-card compact">Nenhum link salvo.</div>`;
      return `
        <section class="study-link-group" style="--study-accent:${escapeHtml(category.accent)}">
          <h3>${escapeHtml(category.label)}</h3>
          <div class="study-link-list">${content}</div>
        </section>
      `;
    }).join("");
  }

  function renderStudyLinkRow(link) {
    return `
      <article class="study-link-row">
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
          <span>${svgIcon("icon-book")}</span>
          <strong>${escapeHtml(link.title)}</strong>
        </a>
        <button class="icon-button" type="button" data-study-action="link-delete" data-study-id="${escapeHtml(link.id)}" aria-label="Excluir ${escapeHtml(link.title)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </article>
    `;
  }

  function handleStudyLinkSubmit(event) {
    event.preventDefault();
    const title = els.studyLinkTitle.value.trim();
    const url = normalizeShoppingUrl(els.studyLinkUrl.value);
    if (!title || !url) {
      showToast("Informe titulo e link.");
      return;
    }

    ensureStudyState().links.unshift({
      id: createId("studylink"),
      title: title.slice(0, 90),
      url,
      group: normalizeStudyLinkGroup(els.studyLinkGroup.value, getStudyCategories("link")),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    els.studyLinkForm.reset();
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyLinkClick(event) {
    const button = event.target.closest("[data-study-action='link-delete']");
    if (!button) {
      return;
    }
    const study = ensureStudyState();
    study.links = study.links.filter((link) => link.id !== button.dataset.studyId);
    saveState();
    renderStudy();
    renderHome();
  }

  function renderStudyTodos() {
    const todos = ensureStudyState().todos.slice().sort((a, b) => Number(a.done) - Number(b.done) || String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
    els.studyTodoList.innerHTML = todos.length
      ? todos.map(renderStudyTodoRow).join("")
      : `<div class="study-empty-card">Nenhuma tarefa pendente.</div>`;
  }

  function renderStudyTodoRow(todo) {
    const checked = todo.done ? " checked" : "";
    const due = todo.dueDate ? `<time datetime="${escapeHtml(todo.dueDate)}">${escapeHtml(formatDate(todo.dueDate))}</time>` : "<span>Sem prazo</span>";
    return `
      <article class="study-todo-row${todo.done ? " is-done" : ""}">
        <label class="study-check" aria-label="Concluir ${escapeHtml(todo.title)}">
          <input type="checkbox" data-study-action="todo-toggle" data-study-id="${escapeHtml(todo.id)}"${checked}>
          <span>${svgIcon("icon-check")}</span>
        </label>
        <div>
          <strong>${escapeHtml(todo.title)}</strong>
          <small>${escapeHtml(studyTodoAreaLabel(todo.area))} - ${due}</small>
        </div>
        <button class="icon-button" type="button" data-study-action="todo-delete" data-study-id="${escapeHtml(todo.id)}" aria-label="Excluir ${escapeHtml(todo.title)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </article>
    `;
  }

  function handleStudyTodoSubmit(event) {
    event.preventDefault();
    const title = els.studyTodoTitle.value.trim();
    if (!title) {
      return;
    }
    ensureStudyState().todos.unshift({
      id: createId("studytodo"),
      title: title.slice(0, 120),
      area: normalizeStudyTodoArea(els.studyTodoArea.value, getStudyCategories("todo")),
      dueDate: isDateKey(els.studyTodoDue.value) ? els.studyTodoDue.value : "",
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    els.studyTodoForm.reset();
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyTodoClick(event) {
    const button = event.target.closest("[data-study-action='todo-delete']");
    if (!button) {
      return;
    }
    const study = ensureStudyState();
    study.todos = study.todos.filter((todo) => todo.id !== button.dataset.studyId);
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyTodoChange(event) {
    const input = event.target.closest("[data-study-action='todo-toggle']");
    if (!input) {
      return;
    }
    const todo = ensureStudyState().todos.find((item) => item.id === input.dataset.studyId);
    if (!todo) {
      return;
    }
    todo.done = Boolean(input.checked);
    todo.updatedAt = new Date().toISOString();
    saveState();
    renderStudy();
    renderHome();
  }

  function renderStudyCalendar() {
    const study = ensureStudyState();
    study.calendarMonth = isMonthKey(studyCalendarMonth) ? studyCalendarMonth : currentMonth();
    study.selectedDate = isDateKey(studySelectedDate) ? studySelectedDate : todayDate();
    els.studyCalendarMonthLabel.textContent = formatMonthName(study.calendarMonth);
    els.studyCalendarDateLabel.textContent = formatDate(study.selectedDate);
    els.studyCalendarGrid.innerHTML = renderStudyCalendarGrid(study.calendarMonth);
    renderStudyCalendarNotes();
  }

  function renderStudyCalendarGrid(month) {
    const first = `${month}-01`;
    const firstDate = new Date(`${first}T00:00:00`);
    const offset = (firstDate.getDay() + 6) % 7;
    const start = addDateKeyDays(first, -offset);
    const weekdayHeader = WORKOUT_WEEKDAYS.map((day) => `<span class="study-calendar-weekday">${escapeHtml(day.label)}</span>`).join("");
    const days = Array.from({ length: 42 }, (_, index) => {
      const date = addDateKeyDays(start, index);
      const inMonth = date.startsWith(month);
      const notes = getStudyNotesForDate(date);
      const selected = date === studySelectedDate;
      const today = date === todayDate();
      return `
        <button class="study-calendar-day${inMonth ? "" : " is-outside"}${selected ? " is-selected" : ""}${today ? " is-today" : ""}" type="button" data-study-action="calendar-select" data-study-date="${escapeHtml(date)}">
          <strong>${Number(date.slice(8, 10))}</strong>
          ${notes.length ? `<small>${notes.length}</small>` : ""}
        </button>
      `;
    }).join("");
    return `${weekdayHeader}${days}`;
  }

  function renderStudyCalendarNotes() {
    const notes = getStudyNotesForDate(studySelectedDate).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    els.studyCalendarNoteList.innerHTML = notes.length
      ? notes.map((note) => `
          <article class="study-note-row">
            <div>
              <strong>${escapeHtml(note.title)}</strong>
              ${note.body ? `<p>${escapeHtml(note.body)}</p>` : ""}
            </div>
            <button class="icon-button" type="button" data-study-action="note-delete" data-study-id="${escapeHtml(note.id)}" aria-label="Excluir ${escapeHtml(note.title)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </article>
        `).join("")
      : `<div class="study-empty-card compact">Nenhuma anotacao neste dia.</div>`;
  }

  function handleStudyCalendarClick(event) {
    const button = event.target.closest("[data-study-action]");
    if (!button) {
      return;
    }

    if (button.dataset.studyAction === "calendar-prev") {
      studyCalendarMonth = addMonths(studyCalendarMonth, -1);
      ensureStudyState().calendarMonth = studyCalendarMonth;
    } else if (button.dataset.studyAction === "calendar-next") {
      studyCalendarMonth = addMonths(studyCalendarMonth, 1);
      ensureStudyState().calendarMonth = studyCalendarMonth;
    } else if (button.dataset.studyAction === "calendar-select" && isDateKey(button.dataset.studyDate)) {
      studySelectedDate = button.dataset.studyDate;
      studyCalendarMonth = studySelectedDate.slice(0, 7);
      const study = ensureStudyState();
      study.selectedDate = studySelectedDate;
      study.calendarMonth = studyCalendarMonth;
    }
    saveState();
    renderStudyCalendar();
  }

  function handleStudyCalendarNoteSubmit(event) {
    event.preventDefault();
    const title = els.studyCalendarNoteTitle.value.trim();
    if (!title) {
      return;
    }
    ensureStudyState().calendarNotes.unshift({
      id: createId("studynote"),
      date: studySelectedDate,
      title: title.slice(0, 100),
      body: els.studyCalendarNoteBody.value.trim().slice(0, 700),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    els.studyCalendarNoteForm.reset();
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyCalendarNoteClick(event) {
    const button = event.target.closest("[data-study-action='note-delete']");
    if (!button) {
      return;
    }
    const study = ensureStudyState();
    study.calendarNotes = study.calendarNotes.filter((note) => note.id !== button.dataset.studyId);
    saveState();
    renderStudy();
    renderHome();
  }

  function renderStudyResources() {
    const resources = ensureStudyState().resources.slice().sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    const categories = getStudyCategories("resource");
    els.studyResourceList.innerHTML = categories.map((category) => {
      const categoryResources = resources.filter((resource) => normalizeStudyResourceType(resource.type, categories) === category.id);
      const content = categoryResources.length
        ? categoryResources.map(renderStudyResourceCard).join("")
        : `<div class="study-empty-card compact">Nenhum material salvo.</div>`;
      return `
        <section class="study-resource-column" style="--study-accent:${escapeHtml(category.accent)}">
          <header class="study-resource-column-header">
            <div>
              <span>${escapeHtml(category.label)}</span>
              <strong>${categoryResources.length}</strong>
            </div>
          </header>
          <div class="study-resource-column-list">
            ${content}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderStudyResourceCard(resource) {
    const type = normalizeStudyResourceType(resource.type, getStudyCategories("resource"));
    const config = studyCategoryById("resource", type);
    const url = normalizeShoppingUrl(resource.url);
    const link = url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Abrir link</a>` : `<span>Sem link</span>`;
    return `
      <article class="study-resource-card" style="--study-accent:${config.accent}">
        <div class="study-resource-top">
          <span>${escapeHtml(config.label)}</span>
          <select data-study-action="resource-status" data-study-id="${escapeHtml(resource.id)}" aria-label="Status de ${escapeHtml(resource.title)}">
            <option value="queued"${resource.status === "queued" ? " selected" : ""}>Na fila</option>
            <option value="doing"${resource.status === "doing" ? " selected" : ""}>Estudando</option>
            <option value="done"${resource.status === "done" ? " selected" : ""}>Finalizado</option>
          </select>
        </div>
        <h3>${escapeHtml(resource.title)}</h3>
        ${resource.notes ? `<p>${escapeHtml(resource.notes)}</p>` : ""}
        <div class="study-resource-footer">
          ${link}
          <button class="icon-button" type="button" data-study-action="resource-delete" data-study-id="${escapeHtml(resource.id)}" aria-label="Excluir ${escapeHtml(resource.title)}" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        </div>
      </article>
    `;
  }

  function handleStudyResourceSubmit(event) {
    event.preventDefault();
    const title = els.studyResourceTitle.value.trim();
    if (!title) {
      return;
    }
    ensureStudyState().resources.unshift({
      id: createId("studyres"),
      title: title.slice(0, 120),
      type: normalizeStudyResourceType(els.studyResourceType.value, getStudyCategories("resource")),
      url: normalizeShoppingUrl(els.studyResourceUrl.value),
      notes: els.studyResourceNotes.value.trim().slice(0, 500),
      status: "queued",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    els.studyResourceForm.reset();
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyResourceClick(event) {
    const button = event.target.closest("[data-study-action='resource-delete']");
    if (!button) {
      return;
    }
    const study = ensureStudyState();
    study.resources = study.resources.filter((resource) => resource.id !== button.dataset.studyId);
    saveState();
    renderStudy();
    renderHome();
  }

  function handleStudyResourceChange(event) {
    const select = event.target.closest("[data-study-action='resource-status']");
    if (!select) {
      return;
    }
    const resource = ensureStudyState().resources.find((item) => item.id === select.dataset.studyId);
    if (!resource) {
      return;
    }
    resource.status = normalizeStudyResourceStatus(select.value);
    resource.updatedAt = new Date().toISOString();
    saveState();
    renderStudy();
    renderHome();
  }

  function renderStudyPomodoro() {
    const pomodoro = ensureStudyState().pomodoro;
    const remaining = getStudyPomodoroRemaining(pomodoro);
    if (!pomodoro.running) {
      pomodoro.remainingSeconds = remaining;
    }
    els.studyPomodoroModes.innerHTML = STUDY_POMODORO_MODE_ORDER.map((mode) => `
      <button class="study-pomodoro-mode${pomodoro.mode === mode ? " is-active" : ""}" type="button" data-study-pomodoro-mode="${escapeHtml(mode)}" aria-pressed="${pomodoro.mode === mode}">
        ${escapeHtml(STUDY_POMODORO_MODES[mode].label)}
      </button>
    `).join("");
    els.studyPomodoroTime.textContent = formatStudyPomodoroTime(remaining);
    els.studyPomodoroStart.textContent = pomodoro.running ? "Pause" : "Start";
    if (els.studyPomodoroStatus) {
      els.studyPomodoroStatus.textContent = studyPomodoroStatusLabel(pomodoro);
    }
    els.studyPomodoroDuration.value = String(pomodoro.pomodoroMinutes);
    els.studyShortBreakDuration.value = String(pomodoro.shortBreakMinutes);
    els.studyLongBreakDuration.value = String(pomodoro.longBreakMinutes);
    syncStudyPomodoroTimer();
  }

  function handleStudyPomodoroModeClick(event) {
    const button = event.target.closest("[data-study-pomodoro-mode]");
    if (!button) {
      return;
    }
    const mode = normalizeStudyPomodoroMode(button.dataset.studyPomodoroMode);
    const pomodoro = ensureStudyState().pomodoro;
    pomodoro.mode = mode;
    pomodoro.running = false;
    pomodoro.remainingSeconds = studyPomodoroDurationSeconds(pomodoro, mode);
    pomodoro.completedPomodoros = normalizeStudyPomodoroCount(pomodoro.completedPomodoros);
    pomodoro.updatedAt = new Date().toISOString();
    saveState();
    renderStudyPomodoro();
  }

  function toggleStudyPomodoro() {
    const pomodoro = ensureStudyState().pomodoro;
    const remaining = getStudyPomodoroRemaining(pomodoro);
    if (pomodoro.running) {
      pomodoro.running = false;
      pomodoro.remainingSeconds = remaining;
    } else {
      pomodoro.remainingSeconds = remaining > 0 ? remaining : studyPomodoroDurationSeconds(pomodoro, pomodoro.mode);
      pomodoro.running = true;
    }
    pomodoro.updatedAt = new Date().toISOString();
    saveState();
    renderStudyPomodoro();
  }

  function resetStudyPomodoro() {
    const pomodoro = ensureStudyState().pomodoro;
    pomodoro.mode = "pomodoro";
    pomodoro.completedPomodoros = 0;
    pomodoro.running = false;
    pomodoro.remainingSeconds = studyPomodoroDurationSeconds(pomodoro, pomodoro.mode);
    pomodoro.updatedAt = new Date().toISOString();
    saveState();
    renderStudyPomodoro();
  }

  function handleStudyPomodoroSettingsChange() {
    const pomodoro = ensureStudyState().pomodoro;
    const wasRunning = pomodoro.running;
    pomodoro.pomodoroMinutes = normalizeStudyDuration(els.studyPomodoroDuration.value, 25, 1, 120);
    pomodoro.shortBreakMinutes = normalizeStudyDuration(els.studyShortBreakDuration.value, 5, 1, 60);
    pomodoro.longBreakMinutes = normalizeStudyDuration(els.studyLongBreakDuration.value, 20, 1, 90);
    if (!wasRunning) {
      pomodoro.remainingSeconds = studyPomodoroDurationSeconds(pomodoro, pomodoro.mode);
    }
    pomodoro.updatedAt = new Date().toISOString();
    saveState();
    renderStudyPomodoro();
  }

  function syncStudyPomodoroTimer() {
    const running = Boolean(ensureStudyState().pomodoro.running);
    if (running && !studyPomodoroTimer) {
      studyPomodoroTimer = window.setInterval(tickStudyPomodoro, 1000);
    } else if (!running && studyPomodoroTimer) {
      window.clearInterval(studyPomodoroTimer);
      studyPomodoroTimer = null;
    }
  }

  function tickStudyPomodoro() {
    const pomodoro = ensureStudyState().pomodoro;
    const remaining = getStudyPomodoroRemaining(pomodoro);
    if (remaining <= 0) {
      advanceStudyPomodoroCycle();
      return;
    }
    els.studyPomodoroTime.textContent = formatStudyPomodoroTime(remaining);
  }

  function advanceStudyPomodoroCycle() {
    const pomodoro = ensureStudyState().pomodoro;
    const previousMode = normalizeStudyPomodoroMode(pomodoro.mode);
    let nextMode = "pomodoro";
    if (previousMode === "pomodoro") {
      pomodoro.completedPomodoros = Math.min(4, normalizeStudyPomodoroCount(pomodoro.completedPomodoros) + 1);
      nextMode = pomodoro.completedPomodoros >= 4 ? "long" : "short";
    } else {
      if (previousMode === "long") {
        pomodoro.completedPomodoros = 0;
      }
      nextMode = "pomodoro";
    }
    pomodoro.mode = nextMode;
    pomodoro.running = true;
    pomodoro.remainingSeconds = studyPomodoroDurationSeconds(pomodoro, nextMode);
    pomodoro.updatedAt = new Date().toISOString();
    saveState();
    renderStudyPomodoro();
    showToast(studyPomodoroTransitionLabel(previousMode, nextMode, pomodoro));
  }

  function getStudyStats() {
    const study = ensureStudyState();
    const scheduleItems = WORKOUT_WEEKDAYS.flatMap((day) => study.schedule[day.key] || []);
    const scheduleDone = scheduleItems.filter((item) => item.done).length;
    const completedTodos = study.todos.filter((todo) => todo.done).length;
    const openTodos = Math.max(0, study.todos.length - completedTodos);
    const doneResources = study.resources.filter((resource) => resource.status === "done").length;
    const actionableTotal = scheduleItems.length + study.todos.length + study.resources.length;
    const completedTotal = scheduleDone + completedTodos + doneResources;
    const completionRate = actionableTotal ? Math.round((completedTotal / actionableTotal) * 100) : 0;
    return {
      scheduleCount: scheduleItems.length,
      scheduleDone,
      todos: study.todos.length,
      openTodos,
      completedTodos,
      resources: study.resources.length,
      doneResources,
      links: study.links.length,
      notes: study.calendarNotes.length,
      completionRate,
    };
  }

  function ensureStudyState() {
    state.study = normalizeStudyState(state.study || {});
    studyCalendarMonth = isMonthKey(studyCalendarMonth) ? studyCalendarMonth : state.study.calendarMonth;
    studySelectedDate = isDateKey(studySelectedDate) ? studySelectedDate : state.study.selectedDate;
    return state.study;
  }

  function findStudyScheduleItem(itemId) {
    const study = ensureStudyState();
    for (const day of WORKOUT_WEEKDAYS) {
      const item = (study.schedule[day.key] || []).find((entry) => entry.id === itemId);
      if (item) {
        return item;
      }
    }
    return null;
  }

  function getStudyNotesForDate(date) {
    return ensureStudyState().calendarNotes.filter((note) => note.date === date);
  }

  function normalizeStudyWeekday(value) {
    const key = String(value || "").trim().toLowerCase();
    return WORKOUT_WEEKDAYS.some((day) => day.key === key) ? key : "mon";
  }

  function normalizeStudyCategoryScope(value) {
    const scope = String(value || "").trim();
    return Object.prototype.hasOwnProperty.call(STUDY_CATEGORY_SCOPES, scope) ? scope : "link";
  }

  function getStudyCategories(scope) {
    const normalizedScope = normalizeStudyCategoryScope(scope);
    const config = STUDY_CATEGORY_SCOPES[normalizedScope];
    const categories = state.study?.[config.field];
    return Array.isArray(categories) && categories.length ? categories : normalizeStudyCategories([], config.defaults);
  }

  function studyCategoryById(scope, categoryId) {
    const categories = getStudyCategories(scope);
    return categories.find((category) => category.id === categoryId) || categories[0] || { id: "", label: "Categoria", accent: "#64748b" };
  }

  function normalizeStudyCategoryValue(value, categories = []) {
    const key = String(value || "").trim();
    const safeCategories = Array.isArray(categories) && categories.length ? categories : DEFAULT_STUDY_LINK_CATEGORIES;
    if (safeCategories.some((category) => category.id === key)) {
      return key;
    }
    const legacyLinkMap = {
      references: "useful",
      videos: "useful",
      challenges: "useful",
    };
    if (legacyLinkMap[key] && safeCategories.some((category) => category.id === legacyLinkMap[key])) {
      return legacyLinkMap[key];
    }
    const keySlug = studyCategorySlug(key);
    const byLabel = safeCategories.find((category) => studyCategorySlug(category.label) === keySlug);
    return byLabel?.id || safeCategories[0]?.id || "";
  }

  function normalizeStudyLinkGroup(value, categories = getStudyCategories("link")) {
    return normalizeStudyCategoryValue(value, categories);
  }

  function normalizeStudyResourceType(value, categories = getStudyCategories("resource")) {
    return normalizeStudyCategoryValue(value, categories);
  }

  function normalizeStudyResourceStatus(value) {
    return ["queued", "doing", "done"].includes(value) ? value : "queued";
  }

  function normalizeStudyTodoArea(value, categories = getStudyCategories("todo")) {
    return normalizeStudyCategoryValue(value, categories);
  }

  function studyTodoAreaLabel(value) {
    return studyCategoryById("todo", normalizeStudyTodoArea(value)).label;
  }

  function countStudyCategoryUsage(scope, categoryId) {
    const config = STUDY_CATEGORY_SCOPES[normalizeStudyCategoryScope(scope)];
    return (ensureStudyState()[config.collection] || []).filter((item) => item[config.itemKey] === categoryId).length;
  }

  function deleteStudyCategory(scope, categoryId) {
    const normalizedScope = normalizeStudyCategoryScope(scope);
    const config = STUDY_CATEGORY_SCOPES[normalizedScope];
    const study = ensureStudyState();
    const categories = getStudyCategories(normalizedScope);
    if (categories.length <= 1 || !categories.some((category) => category.id === categoryId)) {
      return;
    }
    const fallback = categories.find((category) => category.id !== categoryId)?.id || categories[0].id;
    study[config.field] = categories.filter((category) => category.id !== categoryId);
    (study[config.collection] || []).forEach((item) => {
      if (item[config.itemKey] === categoryId) {
        item[config.itemKey] = fallback;
        item.updatedAt = new Date().toISOString();
      }
    });
    saveState();
    renderStudy();
    renderHome();
  }

  function studyCategorySlug(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeStudyPomodoroMode(value) {
    return Object.prototype.hasOwnProperty.call(STUDY_POMODORO_MODES, value) ? value : "pomodoro";
  }

  function normalizeStudyDuration(value, fallback, min, max) {
    return clampNumber(Math.round(Number(value) || fallback), min, max);
  }

  function normalizeStudyPomodoroCount(value) {
    return clampNumber(Math.floor(Number(value) || 0), 0, 4);
  }

  function studyPomodoroDurationSeconds(pomodoro, mode = pomodoro.mode) {
    const field = STUDY_POMODORO_MODES[normalizeStudyPomodoroMode(mode)].field;
    return normalizeStudyDuration(pomodoro[field], field === "pomodoroMinutes" ? 25 : field === "shortBreakMinutes" ? 5 : 20, 1, 120) * 60;
  }

  function getStudyPomodoroRemaining(pomodoro = ensureStudyState().pomodoro) {
    const rawRemaining = Number(pomodoro.remainingSeconds);
    const remaining = Number.isFinite(rawRemaining) ? Math.max(0, Math.round(rawRemaining)) : studyPomodoroDurationSeconds(pomodoro, pomodoro.mode);
    if (!pomodoro.running) {
      return remaining;
    }
    const elapsed = Math.floor((Date.now() - new Date(pomodoro.updatedAt || Date.now()).getTime()) / 1000);
    return Math.max(0, remaining - Math.max(0, elapsed));
  }

  function studyPomodoroStatusLabel(pomodoro) {
    const count = normalizeStudyPomodoroCount(pomodoro.completedPomodoros);
    const mode = normalizeStudyPomodoroMode(pomodoro.mode);
    const modeLabel = STUDY_POMODORO_MODES[mode].label;
    if (mode === "pomodoro") {
      return `Foco em andamento - ciclo ${count}/4`;
    }
    return `${modeLabel} - ciclo ${count}/4`;
  }

  function studyPomodoroTransitionLabel(previousMode, nextMode, pomodoro) {
    if (previousMode === "pomodoro" && nextMode === "long") {
      return "Quarto foco concluido. Pausa longa iniciada.";
    }
    if (previousMode === "pomodoro") {
      return "Foco concluido. Pausa curta iniciada.";
    }
    return "Pausa concluida. Novo foco iniciado.";
  }

  function formatStudyPomodoroTime(seconds) {
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function renderPantry() {
    if (!els.pantryList) {
      return;
    }

    renderPantryOptions();
    const items = getFilteredPantryItems();
    const stats = getPantryStats();

    els.pantryTotalCount.textContent = String(stats.total);
    els.pantryTotalDetail.textContent = stats.total ? `${plural(stats.total, "item cadastrado", "itens cadastrados")}` : "despensa vazia";
    els.pantryRestockCount.textContent = String(stats.restockCount);
    els.pantryRestockDetail.textContent = stats.restockCount ? plural(stats.restockCount, "item para repor", "itens para repor") : "nada baixo";
    els.pantryExpiringCount.textContent = String(stats.expiringCount + stats.expiredCount);
    els.pantryExpiringDetail.textContent =
      stats.expiredCount > 0
        ? plural(stats.expiredCount, "item vencido", "itens vencidos")
        : stats.expiringCount > 0
          ? plural(stats.expiringCount, "item vencendo", "itens vencendo")
          : "sem vencimentos";
    els.pantryRestockEstimate.textContent = formatCurrency(stats.restockEstimate);

    els.pantryList.innerHTML = items.length
      ? items.map(renderPantryItemCard).join("")
      : `
        <div class="empty-state pantry-empty-state">
          <strong>Nenhum item encontrado.</strong>
          <span>Cadastre itens da casa ou ajuste os filtros da despensa.</span>
          <button class="button primary compact-button" type="button" data-pantry-action="new">Novo item</button>
        </div>
      `;
  }

  function renderPantryOptions() {
    if (els.pantryCategoryFilter) {
      setSelectOptions(els.pantryCategoryFilter, [{ value: "all", label: "Todas" }, ...pantryCategoryOptions()], filters.pantryCategory);
    }
    if (els.pantryLocationFilter) {
      setSelectOptions(els.pantryLocationFilter, [{ value: "all", label: "Todos" }, ...pantryLocationOptions()], filters.pantryLocation);
    }
    if (els.pantryStatusFilter) {
      setSelectOptions(els.pantryStatusFilter, pantryStatusOptions(), filters.pantryStatus);
    }
    if (els.pantryModeFilter) {
      setSelectOptions(els.pantryModeFilter, [{ value: "all", label: "Todos" }, ...pantryModeOptions()], filters.pantryMode);
    }
    if (els.pantrySearch) {
      els.pantrySearch.value = filters.pantrySearch || "";
    }
    if (els.pantryItemCategory) {
      setSelectOptions(els.pantryItemCategory, pantryCategoryOptions(), els.pantryItemCategory.value);
    }
    if (els.pantryItemLocation) {
      setSelectOptions(els.pantryItemLocation, pantryLocationOptions(), els.pantryItemLocation.value);
    }
    if (els.pantryItemTrackingMode) {
      setSelectOptions(els.pantryItemTrackingMode, pantryModeOptions(), els.pantryItemTrackingMode.value);
    }
    if (els.pantryItemStockLevel) {
      setSelectOptions(els.pantryItemStockLevel, pantryStockLevelOptions(), els.pantryItemStockLevel.value);
    }
    if (els.pantryItemUnit) {
      setSelectOptions(els.pantryItemUnit, PANTRY_UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })), els.pantryItemUnit.value);
    }
  }

  function renderPantryItemCard(item) {
    const status = getPantryItemStatus(item);
    const mode = normalizePantryTrackingMode(item.trackingMode);
    const isLevelMode = mode === "level";
    const quantityLine = isLevelMode ? pantryStockLevelLabel(item.stockLevel) : formatPantryQuantity(item);
    const expiration = pantryExpirationLabel(item);
    const restockQty = getPantryRestockQuantity(item);
    const restockLabel = restockQty > 0 ? `${formatPantryNumber(restockQty)} ${escapeHtml(item.unit || "un")}` : "Nao precisa repor";
    const modeDetail =
      mode === "estimated"
        ? `${formatPantryNumber(item.consumptionAmount)} ${escapeHtml(item.unit || "un")} a cada ${plural(item.consumptionIntervalDays, "dia", "dias")}`
        : pantryTrackingModeLabel(mode);
    const quickControls = isLevelMode ? renderPantryLevelControls(item) : renderPantryQuantityControls(item);

    return `
      <article class="pantry-item-card status-${escapeHtml(status)}" data-pantry-item-id="${escapeHtml(item.id)}">
        <div class="pantry-card-header">
          <div>
            <p class="eyebrow">${escapeHtml(pantryCategoryLabel(item.category))} - ${escapeHtml(pantryLocationLabel(item.location))}</p>
            <h2>${escapeHtml(item.name)}</h2>
          </div>
          <span class="pantry-status-pill ${escapeHtml(status)}">${escapeHtml(pantryStatusLabel(status))}</span>
        </div>
        <div class="pantry-stock-overview">
          <span>Restante</span>
          <strong>${escapeHtml(quantityLine)}</strong>
          <small>${escapeHtml(modeDetail)}</small>
        </div>
        <div class="pantry-card-meta">
          <span>${escapeHtml(expiration)}</span>
          <span>Repor: ${escapeHtml(restockLabel)}</span>
          <span>${item.averagePrice ? `Preco medio ${formatCurrency(item.averagePrice)}` : "Sem preco medio"}</span>
        </div>
        ${quickControls}
        ${item.notes ? `<p class="pantry-notes">${escapeHtml(item.notes)}</p>` : ""}
        <div class="pantry-card-actions">
          <button class="button secondary compact-button" type="button" data-pantry-action="restock" data-pantry-id="${escapeHtml(item.id)}">
            ${svgIcon("icon-list")}
            <span>Mandar para compras</span>
          </button>
          <div class="row-actions">
            <button class="icon-button" type="button" data-pantry-action="edit" data-pantry-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.name)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-pantry-action="delete" data-pantry-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.name)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderPantryQuantityControls(item) {
    const mode = normalizePantryTrackingMode(item.trackingMode);
    const isEstimated = mode === "estimated";
    return `
      <div class="pantry-quick-controls">
        <button class="icon-button" type="button" data-pantry-action="decrease" data-pantry-id="${escapeHtml(item.id)}" aria-label="Diminuir ${escapeHtml(item.name)}" title="Diminuir">
          -
        </button>
        <label>
          <span>Quantidade</span>
          <input class="pantry-quantity-input" type="number" min="0" step="0.01" inputmode="decimal" data-pantry-action="quantity" data-pantry-id="${escapeHtml(item.id)}" value="${Number(item.quantity || 0)}" aria-label="Quantidade de ${escapeHtml(item.name)}">
        </label>
        <button class="icon-button" type="button" data-pantry-action="increase" data-pantry-id="${escapeHtml(item.id)}" aria-label="Aumentar ${escapeHtml(item.name)}" title="Aumentar">
          +
        </button>
        ${isEstimated ? `
          <button class="button secondary compact-button" type="button" data-pantry-action="consume-now" data-pantry-id="${escapeHtml(item.id)}">Consumir ciclo</button>
          <button class="button secondary compact-button" type="button" data-pantry-action="reset-estimate" data-pantry-id="${escapeHtml(item.id)}">Reiniciar estimativa</button>
        ` : ""}
      </div>
    `;
  }

  function renderPantryLevelControls(item) {
    return `
      <div class="pantry-level-controls" role="group" aria-label="Nivel de ${escapeHtml(item.name)}">
        ${PANTRY_STOCK_LEVEL_ORDER.map((level) => {
          const active = normalizePantryStockLevel(item.stockLevel) === level ? " is-active" : "";
          return `
            <button class="pantry-level-button${active}" type="button" data-pantry-action="level" data-pantry-level="${escapeHtml(level)}" data-pantry-id="${escapeHtml(item.id)}" aria-pressed="${active ? "true" : "false"}">
              ${escapeHtml(pantryStockLevelLabel(level))}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function handlePantrySubmit(event) {
    event.preventDefault();
    const name = String(els.pantryItemName?.value || "").trim() || "Item sem nome";
    const mode = normalizePantryTrackingMode(els.pantryItemTrackingMode?.value);
    const now = new Date().toISOString();
    const id = els.pantryItemId?.value || "";
    const existing = id ? findPantryItem(id) : null;
    const quantity = mode === "level" ? 0 : parsePantryNumber(els.pantryItemQuantity?.value, Number(existing?.quantity) || 0);
    const minQuantity = mode === "level" ? 0 : parsePantryNumber(els.pantryItemMinQuantity?.value, Number(existing?.minQuantity) || 1);
    const targetQuantity = parsePantryNumber(els.pantryItemTargetQuantity?.value, Math.max(quantity, minQuantity, 1));
    const quantityChanged = existing && mode !== "level" && Number(existing.quantity || 0) !== quantity;
    const payload = {
      id: existing?.id || createId("pantry"),
      name: name.slice(0, 100),
      category: normalizePantryCategory(els.pantryItemCategory?.value),
      location: normalizePantryLocation(els.pantryItemLocation?.value),
      trackingMode: mode,
      unit: normalizePantryUnit(els.pantryItemUnit?.value),
      quantity: roundPantryQuantity(quantity),
      stockLevel: mode === "level" ? normalizePantryStockLevel(els.pantryItemStockLevel?.value) : quantity <= 0 ? "empty" : "full",
      minQuantity: roundPantryQuantity(minQuantity),
      targetQuantity: roundPantryQuantity(targetQuantity),
      averagePrice: parsePantryMoney(els.pantryItemAveragePrice?.value),
      expirationDate: normalizePantryDate(els.pantryItemExpirationDate?.value),
      consumptionAmount: mode === "estimated" ? parsePantryNumber(els.pantryItemConsumptionAmount?.value, 1) : 0,
      consumptionIntervalDays: mode === "estimated" ? Math.max(1, Math.round(parsePantryNumber(els.pantryItemConsumptionDays?.value, 7))) : 0,
      notes: String(els.pantryItemNotes?.value || "").trim().slice(0, 500),
      linkedShoppingItemId: existing?.linkedShoppingItemId || "",
      lastStockUpdateAt: quantityChanged || !existing ? now : existing?.lastStockUpdateAt || now,
      lastConsumptionAt: mode === "estimated" ? quantityChanged || !existing ? now : existing?.lastConsumptionAt || now : "",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    state.pantryItems = ensurePantryItems();
    if (existing) {
      Object.assign(existing, payload);
      showToast("Item da despensa atualizado.");
    } else {
      state.pantryItems.unshift(payload);
      showToast("Item salvo na despensa.");
    }

    closePantryItemDialog();
    saveState();
    renderPantry();
    renderHome();
  }

  function handlePantryListClick(event) {
    const button = event.target.closest("[data-pantry-action]");
    if (!button || button.matches("input")) {
      return;
    }

    if (button.dataset.pantryAction === "new") {
      openPantryItemDialog();
      return;
    }

    const item = findPantryItem(button.dataset.pantryId);
    if (!item) {
      return;
    }

    const action = button.dataset.pantryAction;
    if (action === "edit") {
      openPantryItemDialog(item.id);
    } else if (action === "delete") {
      deletePantryItem(item);
    } else if (action === "restock") {
      sendPantryItemToShopping(item);
    } else if (action === "increase" || action === "decrease") {
      adjustPantryQuantity(item, action === "increase" ? pantryQuickStep(item) : -pantryQuickStep(item));
    } else if (action === "consume-now") {
      adjustPantryQuantity(item, -Math.max(pantryQuickStep(item), Number(item.consumptionAmount) || 0));
    } else if (action === "reset-estimate") {
      resetPantryEstimateClock(item);
    } else if (action === "level") {
      setPantryStockLevel(item, button.dataset.pantryLevel);
    }
  }

  function handlePantryListChange(event) {
    const input = event.target.closest("[data-pantry-action='quantity']");
    if (!input) {
      return;
    }
    const item = findPantryItem(input.dataset.pantryId);
    if (!item) {
      return;
    }
    setPantryQuantity(item, parsePantryNumber(input.value, item.quantity));
  }

  function handlePantryFilterChange() {
    filters.pantrySearch = String(els.pantrySearch?.value || "").trim();
    filters.pantryCategory = normalizePantryCategoryFilter(els.pantryCategoryFilter?.value);
    filters.pantryLocation = normalizePantryLocationFilter(els.pantryLocationFilter?.value);
    filters.pantryStatus = normalizePantryStatusFilter(els.pantryStatusFilter?.value);
    filters.pantryMode = normalizePantryModeFilter(els.pantryModeFilter?.value);
    saveState({ sync: false, backup: false });
    renderPantry();
  }

  function openPantryItemDialog(itemId = "") {
    const item = itemId ? findPantryItem(itemId) : null;
    renderPantryOptions();
    resetPantryForm();

    if (item) {
      els.pantryItemId.value = item.id;
      els.pantryItemName.value = item.name || "";
      els.pantryItemCategory.value = normalizePantryCategory(item.category);
      els.pantryItemLocation.value = normalizePantryLocation(item.location);
      els.pantryItemTrackingMode.value = normalizePantryTrackingMode(item.trackingMode);
      els.pantryItemUnit.value = normalizePantryUnit(item.unit);
      els.pantryItemQuantity.value = item.quantity ? String(item.quantity) : "";
      els.pantryItemStockLevel.value = normalizePantryStockLevel(item.stockLevel);
      els.pantryItemMinQuantity.value = item.minQuantity ? String(item.minQuantity) : "";
      els.pantryItemTargetQuantity.value = item.targetQuantity ? String(item.targetQuantity) : "";
      els.pantryItemAveragePrice.value = item.averagePrice ? String(item.averagePrice) : "";
      els.pantryItemExpirationDate.value = normalizePantryDate(item.expirationDate);
      els.pantryItemConsumptionAmount.value = item.consumptionAmount ? String(item.consumptionAmount) : "";
      els.pantryItemConsumptionDays.value = item.consumptionIntervalDays ? String(item.consumptionIntervalDays) : "";
      els.pantryItemNotes.value = item.notes || "";
      els.pantryItemDialogTitle.textContent = "Editar item";
      els.pantryFormSubtitle.textContent = "Atualize o controle deste item.";
      els.pantrySubmitLabel.textContent = "Salvar item";
    }

    updatePantryDialogModeFields();

    if (typeof els.pantryItemDialog.showModal === "function") {
      els.pantryItemDialog.showModal();
    } else {
      els.pantryItemDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.pantryItemName?.focus());
  }

  function closePantryItemDialog() {
    if (!els.pantryItemDialog) {
      return;
    }

    if (els.pantryItemDialog.open && typeof els.pantryItemDialog.close === "function") {
      els.pantryItemDialog.close();
    } else {
      els.pantryItemDialog.removeAttribute("open");
    }

    resetPantryForm();
  }

  function resetPantryForm() {
    if (!els.pantryForm) {
      return;
    }

    els.pantryForm.reset();
    els.pantryItemId.value = "";
    els.pantryItemCategory.value = "food";
    els.pantryItemLocation.value = "pantry";
    els.pantryItemTrackingMode.value = "estimated";
    els.pantryItemUnit.value = "un";
    els.pantryItemStockLevel.value = "full";
    els.pantryItemMinQuantity.value = "1";
    els.pantryItemTargetQuantity.value = "";
    els.pantryItemConsumptionAmount.value = "1";
    els.pantryItemConsumptionDays.value = "7";
    els.pantryItemDialogTitle.textContent = "Adicionar item";
    els.pantryFormSubtitle.textContent = "Configure como este item deve ser acompanhado.";
    els.pantrySubmitLabel.textContent = "Salvar item";
    updatePantryDialogModeFields();
  }

  function updatePantryDialogModeFields() {
    const mode = normalizePantryTrackingMode(els.pantryItemTrackingMode?.value);
    const isLevel = mode === "level";
    const isEstimated = mode === "estimated";
    togglePantryFields(els.pantryQuantityFields, !isLevel);
    togglePantryFields(els.pantryUnitFields, !isLevel);
    togglePantryFields(els.pantryMinimumFields, !isLevel);
    togglePantryFields(els.pantryLevelFields, isLevel);
    togglePantryFields(els.pantryConsumptionFields, isEstimated);
    if (els.pantryModeHelp) {
      els.pantryModeHelp.textContent =
        mode === "estimated"
          ? "O app reduz a quantidade sozinho conforme o consumo informado. Voce pode corrigir manualmente quando quiser."
          : mode === "level"
            ? "Voce escolhe apenas Cheio, Medio, Baixo ou Acabou. Bom para itens sem quantidade exata."
            : "Voce controla a quantidade atual manualmente, com alerta ao atingir o minimo.";
    }
  }

  function togglePantryFields(fields, visible) {
    fields?.forEach((field) => {
      field.hidden = !visible;
    });
  }

  function deletePantryItem(item) {
    if (!window.confirm(`Excluir "${item.name}" da despensa?`)) {
      return;
    }
    state.pantryItems = ensurePantryItems().filter((entry) => entry.id !== item.id);
    saveState();
    renderPantry();
    renderHome();
    showToast("Item removido da despensa.");
  }

  function adjustPantryQuantity(item, delta) {
    setPantryQuantity(item, Math.max(0, roundPantryQuantity((Number(item.quantity) || 0) + delta)));
  }

  function setPantryQuantity(item, quantity) {
    item.quantity = roundPantryQuantity(quantity);
    item.lastStockUpdateAt = new Date().toISOString();
    if (normalizePantryTrackingMode(item.trackingMode) === "estimated") {
      item.lastConsumptionAt = item.lastStockUpdateAt;
    }
    item.updatedAt = item.lastStockUpdateAt;
    saveState();
    renderPantry();
    renderHome();
  }

  function setPantryStockLevel(item, level) {
    item.stockLevel = normalizePantryStockLevel(level);
    item.lastStockUpdateAt = new Date().toISOString();
    item.updatedAt = item.lastStockUpdateAt;
    saveState();
    renderPantry();
    renderHome();
  }

  function resetPantryEstimateClock(item) {
    const now = new Date().toISOString();
    item.lastConsumptionAt = now;
    item.lastStockUpdateAt = item.lastStockUpdateAt || now;
    item.updatedAt = now;
    saveState();
    renderPantry();
    renderHome();
    showToast("Estimativa reiniciada a partir de hoje.");
  }

  function sendPantryItemToShopping(item) {
    state.shoppingItems = Array.isArray(state.shoppingItems) ? state.shoppingItems : [];
    const existing = state.shoppingItems.find((entry) => !entry.purchased && entry.pantryItemId === item.id);
    if (existing) {
      showToast("Esse item ja esta pendente em Compras.");
      return;
    }

    const restockQuantity = Math.max(getPantryRestockQuantity(item), pantryQuickStep(item));
    const now = new Date().toISOString();
    const shoppingItem = {
      id: createId("shopping"),
      name: item.name || "Item da despensa",
      quantity: `${formatPantryNumber(restockQuantity)} ${item.unit || "un"}`,
      category: "market",
      url: "",
      price: Number(item.averagePrice) || 0,
      priority: getPantryItemStatus(item) !== "ok",
      purchased: false,
      purchasedAt: "",
      pantryItemId: item.id,
      createdAt: now,
      updatedAt: now,
    };
    item.linkedShoppingItemId = shoppingItem.id;
    item.updatedAt = now;
    state.shoppingItems.unshift(shoppingItem);
    saveState();
    renderPantry();
    renderShopping();
    renderHome();
    showToast("Item enviado para Compras.");
  }

  function applyShoppingPurchaseToPantry(item) {
    if (!item?.pantryItemId) {
      return false;
    }
    const pantryItem = findPantryItem(item.pantryItemId);
    if (!pantryItem) {
      return false;
    }

    const now = new Date().toISOString();
    if (normalizePantryTrackingMode(pantryItem.trackingMode) === "level") {
      pantryItem.stockLevel = "full";
    } else {
      const amount = Math.max(0, parseShoppingQuantity(item.quantity, pantryQuickStep(pantryItem)));
      pantryItem.quantity = roundPantryQuantity((Number(pantryItem.quantity) || 0) + amount);
      pantryItem.lastConsumptionAt = now;
    }
    pantryItem.linkedShoppingItemId = "";
    pantryItem.lastStockUpdateAt = now;
    pantryItem.updatedAt = now;
    return true;
  }

  function applyEstimatedPantryConsumption() {
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    let changed = false;

    ensurePantryItems().forEach((item) => {
      if (normalizePantryTrackingMode(item.trackingMode) !== "estimated") {
        return;
      }
      const amount = Number(item.consumptionAmount) || 0;
      const days = Number(item.consumptionIntervalDays) || 0;
      if (amount <= 0 || days <= 0 || Number(item.quantity) <= 0) {
        return;
      }
      const anchor = Date.parse(item.lastConsumptionAt || item.lastStockUpdateAt || item.updatedAt || item.createdAt || "");
      if (!Number.isFinite(anchor)) {
        item.lastConsumptionAt = now;
        changed = true;
        return;
      }
      const intervalMs = days * 24 * 60 * 60 * 1000;
      const intervals = Math.floor((nowMs - anchor) / intervalMs);
      if (intervals <= 0) {
        return;
      }
      item.quantity = roundPantryQuantity(Math.max(0, (Number(item.quantity) || 0) - intervals * amount));
      item.lastConsumptionAt = new Date(anchor + intervals * intervalMs).toISOString();
      item.updatedAt = now;
      changed = true;
    });

    return changed;
  }

  function getFilteredPantryItems() {
    const query = normalizeHomeSearchText(filters.pantrySearch);
    return getSortedPantryItems().filter((item) => {
      const status = getPantryItemStatus(item);
      const haystack = normalizeHomeSearchText(`${item.name} ${pantryCategoryLabel(item.category)} ${pantryLocationLabel(item.location)} ${item.notes || ""} ${status}`);
      return (
        (!query || haystack.includes(query)) &&
        (filters.pantryCategory === "all" || normalizePantryCategory(item.category) === filters.pantryCategory) &&
        (filters.pantryLocation === "all" || normalizePantryLocation(item.location) === filters.pantryLocation) &&
        (filters.pantryStatus === "all" || status === filters.pantryStatus) &&
        (filters.pantryMode === "all" || normalizePantryTrackingMode(item.trackingMode) === filters.pantryMode)
      );
    });
  }

  function getSortedPantryItems() {
    return ensurePantryItems().slice().sort((a, b) => {
      const statusDiff = pantryStatusRank(getPantryItemStatus(a)) - pantryStatusRank(getPantryItemStatus(b));
      if (statusDiff) {
        return statusDiff;
      }
      return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
    });
  }

  function getPantryStats() {
    const items = ensurePantryItems();
    return items.reduce(
      (stats, item) => {
        const status = getPantryItemStatus(item);
        stats.total += 1;
        if (status === "low" || status === "empty") {
          stats.restockCount += 1;
          stats.restockEstimate = roundMoney(stats.restockEstimate + getPantryRestockQuantity(item) * (Number(item.averagePrice) || 0));
        }
        if (status === "expiring") {
          stats.expiringCount += 1;
        }
        if (status === "expired") {
          stats.expiredCount += 1;
        }
        return stats;
      },
      { total: 0, restockCount: 0, expiringCount: 0, expiredCount: 0, restockEstimate: 0 },
    );
  }

  function getPantryItemStatus(item) {
    const expiration = normalizePantryDate(item.expirationDate);
    const today = todayDate();
    if (expiration && expiration < today) {
      return "expired";
    }

    const mode = normalizePantryTrackingMode(item.trackingMode);
    if (mode === "level") {
      const level = normalizePantryStockLevel(item.stockLevel);
      if (level === "empty") {
        return "empty";
      }
      if (expiration && expiration <= addDaysDateKey(today, PANTRY_EXPIRING_DAYS)) {
        return "expiring";
      }
      return level === "low" ? "low" : "ok";
    }

    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) {
      return "empty";
    }
    if (expiration && expiration <= addDaysDateKey(today, PANTRY_EXPIRING_DAYS)) {
      return "expiring";
    }
    return quantity <= (Number(item.minQuantity) || 0) ? "low" : "ok";
  }

  function pantryStatusRank(status) {
    const ranks = { expired: 0, empty: 1, expiring: 2, low: 3, ok: 4 };
    return ranks[status] ?? 5;
  }

  function getPantryRestockQuantity(item) {
    const status = getPantryItemStatus(item);
    if (status !== "low" && status !== "empty") {
      return 0;
    }
    if (normalizePantryTrackingMode(item.trackingMode) === "level") {
      return Math.max(1, Number(item.targetQuantity) || 1);
    }
    const target = Math.max(Number(item.targetQuantity) || 0, Number(item.minQuantity) || 0, 1);
    return roundPantryQuantity(Math.max(0, target - (Number(item.quantity) || 0)));
  }

  function pantryQuickStep(item) {
    if (normalizePantryTrackingMode(item?.trackingMode) === "level") {
      return Math.max(1, Number(item?.targetQuantity) || 1);
    }
    return Math.max(0.25, Number(item?.consumptionAmount) || 1);
  }

  function pantryExpirationLabel(item) {
    const expiration = normalizePantryDate(item.expirationDate);
    if (!expiration) {
      return "Sem validade";
    }
    const today = todayDate();
    if (expiration < today) {
      return `Vencido em ${formatDate(expiration)}`;
    }
    if (expiration <= addDaysDateKey(today, PANTRY_EXPIRING_DAYS)) {
      return `Vence em ${formatDate(expiration)}`;
    }
    return `Validade ${formatDate(expiration)}`;
  }

  function ensurePantryItems() {
    state.pantryItems = normalizePantryItems(state.pantryItems || state.pantry_items || []);
    return state.pantryItems;
  }

  function normalizePantryItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item && (item.name || item.title || item.label))
      .map((item) => {
        const mode = normalizePantryTrackingMode(item.trackingMode || item.tracking_mode || item.mode);
        const quantity = mode === "level" ? 0 : parsePantryNumber(item.quantity ?? item.currentQuantity ?? item.current_quantity, 0);
        const minQuantity = mode === "level" ? 0 : parsePantryNumber(item.minQuantity ?? item.min_quantity ?? item.minimumQuantity, 1);
        const targetQuantity = parsePantryNumber(item.targetQuantity ?? item.target_quantity ?? item.fullQuantity, Math.max(quantity, minQuantity, 1));
        const now = new Date().toISOString();
        return {
          id: item.id || createId("pantry"),
          name: String(item.name || item.title || item.label || "Item").slice(0, 100),
          category: normalizePantryCategory(item.category || item.kind || item.group),
          location: normalizePantryLocation(item.location || item.place || item.storage),
          trackingMode: mode,
          unit: normalizePantryUnit(item.unit),
          quantity: roundPantryQuantity(quantity),
          stockLevel: normalizePantryStockLevel(item.stockLevel || item.stock_level || item.level),
          minQuantity: roundPantryQuantity(minQuantity),
          targetQuantity: roundPantryQuantity(targetQuantity),
          averagePrice: parsePantryMoney(item.averagePrice ?? item.average_price ?? item.price),
          expirationDate: normalizePantryDate(item.expirationDate || item.expiration_date || item.validUntil || item.valid_until),
          consumptionAmount: mode === "estimated" ? parsePantryNumber(item.consumptionAmount ?? item.consumption_amount, 1) : 0,
          consumptionIntervalDays: mode === "estimated" ? Math.max(1, Math.round(parsePantryNumber(item.consumptionIntervalDays ?? item.consumption_interval_days, 7))) : 0,
          notes: String(item.notes || item.description || "").slice(0, 500),
          linkedShoppingItemId: item.linkedShoppingItemId || item.linked_shopping_item_id || "",
          lastStockUpdateAt: normalizePantryTimestamp(item.lastStockUpdateAt || item.last_stock_update_at, item.updatedAt || item.updated_at || now),
          lastConsumptionAt: mode === "estimated" ? normalizePantryTimestamp(item.lastConsumptionAt || item.last_consumption_at, item.updatedAt || item.updated_at || now) : "",
          createdAt: normalizePantryTimestamp(item.createdAt || item.created_at, now),
          updatedAt: normalizePantryTimestamp(item.updatedAt || item.updated_at, item.createdAt || item.created_at || now),
        };
      });
  }

  function pantryCategoryOptions() {
    return PANTRY_CATEGORY_ORDER.map((category) => ({ value: category, label: pantryCategoryLabel(category) }));
  }

  function pantryLocationOptions() {
    return PANTRY_LOCATION_ORDER.map((location) => ({ value: location, label: pantryLocationLabel(location) }));
  }

  function pantryModeOptions() {
    return PANTRY_TRACKING_MODE_ORDER.map((mode) => ({ value: mode, label: pantryTrackingModeLabel(mode) }));
  }

  function pantryStockLevelOptions() {
    return PANTRY_STOCK_LEVEL_ORDER.map((level) => ({ value: level, label: pantryStockLevelLabel(level) }));
  }

  function pantryStatusOptions() {
    return PANTRY_STATUS_ORDER.map((status) => ({ value: status, label: status === "all" ? "Todos" : pantryStatusLabel(status) }));
  }

  function normalizePantryCategory(value) {
    const key = slugKey(value);
    const legacy = {
      alimento: "food",
      alimentos: "food",
      comida: "food",
      mercado: "food",
      limpeza: "cleaning",
      hygiene: "hygiene",
      higiene: "hygiene",
      suplemento: "supplements",
      suplementos: "supplements",
      farmacia: "medicine",
      remedio: "medicine",
      remedios: "medicine",
      medicine: "medicine",
    };
    return legacy[key] || (Object.prototype.hasOwnProperty.call(PANTRY_CATEGORIES, key) ? key : "food");
  }

  function normalizePantryLocation(value) {
    const key = slugKey(value);
    const legacy = {
      despensa: "pantry",
      armario: "pantry",
      geladeira: "fridge",
      freezer: "freezer",
      congelador: "freezer",
      banheiro: "bathroom",
      lavanderia: "laundry",
      cozinha: "pantry",
    };
    return legacy[key] || (Object.prototype.hasOwnProperty.call(PANTRY_LOCATIONS, key) ? key : "pantry");
  }

  function normalizePantryTrackingMode(value) {
    const key = slugKey(value);
    const legacy = {
      consumo: "estimated",
      estimado: "estimated",
      "consumo-estimado": "estimated",
      nivel: "level",
      manual: "level",
      "nivel-manual": "level",
      quantidade: "quantity",
      "quantidade-exata": "quantity",
    };
    return legacy[key] || (Object.prototype.hasOwnProperty.call(PANTRY_TRACKING_MODES, key) ? key : "estimated");
  }

  function normalizePantryStockLevel(value) {
    const key = slugKey(value);
    const legacy = {
      cheio: "full",
      full: "full",
      medio: "medium",
      metade: "medium",
      baixo: "low",
      low: "low",
      acabou: "empty",
      vazio: "empty",
      empty: "empty",
    };
    return legacy[key] || (Object.prototype.hasOwnProperty.call(PANTRY_STOCK_LEVELS, key) ? key : "full");
  }

  function normalizePantryCategoryFilter(value) {
    const key = String(value || "all");
    return key === "all" ? "all" : normalizePantryCategory(key);
  }

  function normalizePantryLocationFilter(value) {
    const key = String(value || "all");
    return key === "all" ? "all" : normalizePantryLocation(key);
  }

  function normalizePantryStatusFilter(value) {
    const key = String(value || "all");
    return PANTRY_STATUS_ORDER.includes(key) ? key : "all";
  }

  function normalizePantryModeFilter(value) {
    const key = String(value || "all");
    return key === "all" ? "all" : normalizePantryTrackingMode(key);
  }

  function normalizePantryUnit(value) {
    const unit = String(value || "un").trim().slice(0, 20);
    return unit || "un";
  }

  function normalizePantryDate(value) {
    const date = String(value || "").slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  }

  function normalizePantryTimestamp(value, fallback) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
  }

  function parsePantryNumber(value, fallback = 0) {
    const parsed = Number(String(value ?? "").trim().replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  function parsePantryMoney(value) {
    return Math.max(0, roundMoney(parsePantryNumber(value, 0)));
  }

  function roundPantryQuantity(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function formatPantryQuantity(item) {
    return `${formatPantryNumber(item.quantity)} ${item.unit || "un"}`;
  }

  function formatPantryNumber(value) {
    const amount = roundPantryQuantity(value);
    return Number.isInteger(amount) ? String(amount) : String(amount).replace(".", ",");
  }

  function pantryCategoryLabel(category) {
    return PANTRY_CATEGORIES[normalizePantryCategory(category)]?.label || PANTRY_CATEGORIES.food.label;
  }

  function pantryLocationLabel(location) {
    return PANTRY_LOCATIONS[normalizePantryLocation(location)]?.label || PANTRY_LOCATIONS.pantry.label;
  }

  function pantryTrackingModeLabel(mode) {
    return PANTRY_TRACKING_MODES[normalizePantryTrackingMode(mode)]?.label || PANTRY_TRACKING_MODES.estimated.label;
  }

  function pantryStockLevelLabel(level) {
    return PANTRY_STOCK_LEVELS[normalizePantryStockLevel(level)]?.label || PANTRY_STOCK_LEVELS.full.label;
  }

  function pantryStatusLabel(status) {
    return PANTRY_STATUS_CONFIG[status]?.label || PANTRY_STATUS_CONFIG.ok.label;
  }

  function slugKey(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function addDaysDateKey(dateKey, days) {
    const [year, month, day] = String(dateKey || todayDate()).split("-").map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    date.setDate(date.getDate() + Number(days || 0));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function findPantryItem(itemId) {
    return ensurePantryItems().find((item) => item.id === itemId) || null;
  }

  function renderShopping() {
    if (!els.shoppingList || !els.shoppingMarketList) {
      return;
    }

    const stats = getShoppingStats();
    const wishlistStats = getShoppingCategoryGroupStats(stats, SHOPPING_WISHLIST_CATEGORY_ORDER);
    els.shoppingPendingTotal.textContent = String(wishlistStats.pendingCount);
    els.shoppingPendingDetail.textContent = shoppingColumnBreakdown(stats, "pendingCount", { categories: SHOPPING_WISHLIST_CATEGORY_ORDER });
    els.shoppingPurchasedTotal.textContent = String(wishlistStats.purchasedCount);
    els.shoppingPurchasedDetail.textContent = shoppingColumnBreakdown(stats, "purchasedCount", { categories: SHOPPING_WISHLIST_CATEGORY_ORDER });
    els.shoppingEstimatedTotal.textContent = formatCurrency(wishlistStats.pendingEstimate);
    els.shoppingEstimatedDetail.textContent = shoppingColumnBreakdown(stats, "pendingEstimate", {
      categories: SHOPPING_WISHLIST_CATEGORY_ORDER,
      money: true,
    });
    els.shoppingItemTotal.textContent = String(wishlistStats.total);
    els.shoppingListDetail.textContent = shoppingColumnBreakdown(stats, "total", { categories: SHOPPING_WISHLIST_CATEGORY_ORDER });

    const marketItems = getSortedShoppingItems().filter((item) => normalizeShoppingCategory(item.category) === "market" && !item.purchased);
    syncShoppingMarketSumSelection(marketItems);
    els.shoppingMarketList.innerHTML = renderShoppingMarketPanel(marketItems, stats.columns.market);

    const wishlistPurchasedItems = getSortedShoppingItems().filter((item) => SHOPPING_WISHLIST_CATEGORY_ORDER.includes(normalizeShoppingCategory(item.category)) && item.purchased);
    const wishlistColumns = SHOPPING_WISHLIST_CATEGORY_ORDER.map((category) => {
      const items = getSortedShoppingItems().filter((item) => normalizeShoppingCategory(item.category) === category && !item.purchased);
      return renderShoppingColumn(category, items, stats.columns[category]);
    }).join("");
    els.shoppingList.innerHTML = `${wishlistColumns}${renderShoppingPurchasedPanel(wishlistPurchasedItems, wishlistStats)}`;
  }

  function renderShoppingMarketPanel(items, columnStats) {
    const activePage = shoppingMarketPage === "history" ? "history" : "pending";
    const purchasedItems = getSortedShoppingItems()
      .filter((item) => normalizeShoppingCategory(item.category) === "market" && item.purchased)
      .sort((a, b) => String(b.purchasedAt || b.updatedAt || "").localeCompare(String(a.purchasedAt || a.updatedAt || "")));
    const selectedItems = items.filter((item) => shoppingMarketSumSelection.has(item.id));
    const selectedTotal = selectedItems.reduce((total, item) => roundMoney(total + getShoppingItemTotal(item)), 0);
    const selectedCount = selectedItems.length;
    const pendingContent = items.length
      ? items.map((item) => renderShoppingItemRow(item, { market: true })).join("")
      : `<div class="shopping-column-empty">Nenhum item pendente no mercado.</div>`;
    const historyContent = renderShoppingHistory(purchasedItems);
    const content = activePage === "history" ? historyContent : pendingContent;
    const listActive = activePage === "pending" ? " is-active" : "";
    const historyActive = activePage === "history" ? " is-active" : "";

    return `
      <section class="shopping-column shopping-market-column">
        <header class="shopping-market-header">
          <div>
            <p class="eyebrow">Mercado</p>
            <h2>Mercado</h2>
            <span>${plural(columnStats.pendingCount, "item pendente", "itens pendentes")} - ${plural(columnStats.purchasedCount, "comprado", "comprados")}</span>
          </div>
          <strong>${formatCurrency(columnStats.pendingEstimate)}</strong>
        </header>
        <div class="shopping-market-tabs" role="tablist" aria-label="Subpaginas do mercado">
          <button class="shopping-market-tab${listActive}" type="button" data-shopping-action="market-page" data-shopping-page="pending" aria-pressed="${activePage === "pending"}">
            Lista
          </button>
          <button class="shopping-market-tab${historyActive}" type="button" data-shopping-action="market-page" data-shopping-page="history" aria-pressed="${activePage === "history"}">
            Compradas
          </button>
        </div>
        <div class="shopping-market-subpage${activePage === "history" ? " is-history" : ""}">
          ${activePage === "pending" ? `
            <div class="shopping-market-sum-panel" aria-live="polite">
              <span class="shopping-market-sum-label">Soma selecionada</span>
              <div>
                <strong>${formatCurrency(selectedTotal)}</strong>
                <span>${selectedCount ? plural(selectedCount, "item selecionado", "itens selecionados") : "Nenhum item selecionado"}</span>
              </div>
            </div>
          ` : ""}
          ${content}
        </div>
        <div class="shopping-market-meta">
          <span>Total cadastrado</span>
          <b>${formatCurrency(columnStats.totalEstimate)}</b>
        </div>
        <button class="shopping-column-add${activePage === "history" ? " is-hidden" : ""}" type="button" data-shopping-action="new" data-shopping-category="market" aria-label="Adicionar item no mercado" title="Adicionar item">
          ${svgIcon("icon-plus")}
          <span>Adicionar um item</span>
        </button>
      </section>
    `;
  }

  function renderShoppingPurchasedPanel(items, stats) {
    const cards = items.length
      ? items.map((item) => renderShoppingItemRow(item, { purchasedBucket: true })).join("")
      : `<div class="shopping-column-empty">Itens marcados como comprados aparecem aqui.</div>`;

    return `
      <section class="shopping-column shopping-purchased-column">
        <header class="shopping-column-header">
          <div>
            <h2>Comprados</h2>
            <span>${plural(stats.purchasedCount, "item comprado", "itens comprados")}</span>
          </div>
          <strong>${stats.purchasedCount}</strong>
        </header>
        <div class="shopping-column-subtotal">
          <span>Valor comprado</span>
          <b>${formatCurrency(stats.purchasedEstimate)}</b>
        </div>
        <div class="shopping-column-list">
          ${cards}
        </div>
      </section>
    `;
  }

  function renderShoppingColumn(category, items, columnStats) {
    const label = shoppingCategoryLabel(category);
    const cards = items.length
      ? items.map(renderShoppingItemRow).join("")
      : `<div class="shopping-column-empty">Nenhum item nesta coluna.</div>`;

    return `
      <section class="shopping-column" data-shopping-column="${escapeHtml(category)}">
        <header class="shopping-column-header">
          <div>
            <h2>${escapeHtml(label)}</h2>
            <span>${plural(columnStats.total, "item", "itens")}</span>
          </div>
          <strong>${columnStats.pendingCount}</strong>
        </header>
        <div class="shopping-column-subtotal">
          <span>${plural(columnStats.purchasedCount, "comprado", "comprados")}</span>
          <b>${formatCurrency(columnStats.totalEstimate)}</b>
        </div>
        <div class="shopping-column-list" data-shopping-dropzone="${escapeHtml(category)}">
          ${cards}
        </div>
        <button class="shopping-column-add" type="button" data-shopping-action="new" data-shopping-category="${escapeHtml(category)}" aria-label="Adicionar item em ${escapeHtml(label)}" title="Adicionar item">
          ${svgIcon("icon-plus")}
          <span>Adicionar um item</span>
        </button>
      </section>
    `;
  }

  function renderShoppingHistory(purchasedItems) {
    if (!purchasedItems.length) {
      return `
        <section class="shopping-history-panel">
          <div class="shopping-history-header">
            <div>
              <h2>Compras realizadas</h2>
              <p>Nenhuma compra registrada</p>
            </div>
          </div>
          <div class="shopping-column-empty">Itens marcados como comprados aparecem aqui com a data.</div>
        </section>
      `;
    }

    return `
      <section class="shopping-history-panel">
        <div class="shopping-history-header">
          <div>
            <h2>Compras realizadas</h2>
            <p>${plural(purchasedItems.length, "compra registrada", "compras registradas")}</p>
          </div>
          <button class="button secondary shopping-history-clear" type="button" data-shopping-action="clear-market-purchased" aria-label="Excluir itens comprados no mercado" title="Excluir comprados">
            ${svgIcon("icon-trash")}
            <span>Excluir comprados</span>
          </button>
        </div>
        <div class="shopping-history-list">
          ${purchasedItems.map(renderShoppingHistoryRow).join("")}
        </div>
      </section>
    `;
  }

  function renderShoppingHistoryRow(item) {
    const category = normalizeShoppingCategory(item.category);
    const date = String(item.purchasedAt || item.updatedAt || item.createdAt || "").slice(0, 10) || todayDate();
    const quantity = formatShoppingQuantity(item.quantity);
    const totalPrice = getShoppingItemTotal(item);

    return `
      <article class="shopping-history-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(shoppingCategoryLabel(category))} - ${escapeHtml(quantity)} - ${formatShoppingPrice(totalPrice)}</span>
        </div>
        <time datetime="${escapeHtml(date)}">${escapeHtml(formatDate(date))}</time>
        <button class="icon-button shopping-history-delete" type="button" data-shopping-action="delete" data-shopping-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.name)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </article>
    `;
  }

  function renderShoppingItemRow(item, options = {}) {
    const category = normalizeShoppingCategory(item.category);
    const isMarketCard = options.market || category === "market";
    const quantity = formatShoppingQuantity(item.quantity);
    const unitPrice = formatShoppingPrice(item.price);
    const unitPriceLabel = unitPrice === "Sem valor" ? unitPrice : `${unitPrice} un.`;
    const totalPrice = getShoppingItemTotal(item);
    const url = normalizeShoppingUrl(item.url || item.storeUrl || item.store_url || item.link || item.linkUrl || "");
    const date = String(item.purchasedAt || item.updatedAt || item.createdAt || "").slice(0, 10) || todayDate();
    const dateLabel = item.purchased ? `Comprado em ${formatDate(date)}` : `Criado em ${formatDate(date)}`;
    const checked = item.purchased ? " checked" : "";
    const isPurchasedBucket = Boolean(options.purchasedBucket);
    const isMarketSelected = isMarketCard && !item.purchased && shoppingMarketSumSelection.has(item.id);
    const priorityPressed = item.priority ? "true" : "false";
    const priorityActive = item.priority ? " is-active" : "";
    const priorityLabel = item.priority ? "Remover prioridade" : "Marcar prioridade";
    const linkHtml = url
      ? `<a class="shopping-store-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Link da loja</a>`
      : `<span>Sem link</span>`;
    const sumSelectHtml = isMarketCard && !item.purchased
      ? `
          <label class="shopping-sum-check" aria-label="Selecionar ${escapeHtml(item.name)} para soma">
            <input type="checkbox" data-shopping-action="sum-select" data-shopping-id="${escapeHtml(item.id)}"${isMarketSelected ? " checked" : ""}>
            <span>Somar</span>
          </label>
        `
      : "";
    const moveOptions = SHOPPING_WISHLIST_CATEGORY_ORDER.map((key) => {
      const selected = key === category ? " selected" : "";
      return `<option value="${escapeHtml(key)}"${selected}>${escapeHtml(shoppingCategoryLabel(key))}</option>`;
    }).join("");
    const draggable = isMarketCard || isPurchasedBucket ? "" : ` draggable="true"`;
    const moveSelectHtml = isMarketCard
      ? ""
      : `
          <select class="shopping-move-select" data-shopping-action="move" data-shopping-id="${escapeHtml(item.id)}" aria-label="Mover ${escapeHtml(item.name)} para outra categoria">
            ${moveOptions}
          </select>
        `;
    const footerLeadHtml = isMarketCard ? sumSelectHtml : linkHtml;

    return `
      <article class="shopping-item-row${item.purchased ? " is-purchased" : ""}${isMarketCard ? " is-market-item" : ""}${item.priority ? " is-priority" : ""}" data-shopping-item-id="${escapeHtml(item.id)}"${draggable}>
        <div class="shopping-item-row-top">
          <label class="shopping-check" aria-label="Marcar ${escapeHtml(item.name)} como comprado">
            <input type="checkbox" data-shopping-action="toggle" data-shopping-id="${escapeHtml(item.id)}"${checked}>
            <span>${svgIcon("icon-check")}</span>
          </label>
          <div class="shopping-item-main">
            <div class="shopping-item-title-line">
              <h3>${escapeHtml(item.name)}</h3>
            </div>
            <div class="shopping-meta">
              <span>${escapeHtml(quantity)}</span>
              <span>${escapeHtml(dateLabel)}</span>
            </div>
          </div>
        </div>
        <div class="shopping-price-line">
          <div>
            <span class="shopping-unit-price">${escapeHtml(unitPriceLabel)}</span>
            <strong class="shopping-price">${formatShoppingPrice(totalPrice)}</strong>
          </div>
          ${moveSelectHtml}
        </div>
        <div class="shopping-card-footer">
          ${footerLeadHtml}
          <div class="row-actions shopping-row-actions">
            <button class="icon-button shopping-priority-button${priorityActive}" type="button" data-shopping-action="priority" data-shopping-id="${escapeHtml(item.id)}" aria-label="${priorityLabel} ${escapeHtml(item.name)}" aria-pressed="${priorityPressed}" title="${priorityLabel}">
              ${svgIcon("icon-star")}
            </button>
            <button class="icon-button" type="button" data-shopping-action="edit" data-shopping-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.name)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-shopping-action="delete" data-shopping-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.name)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function handleShoppingSubmit(event) {
    event.preventDefault();

    const name = els.shoppingItemName.value.trim() || "Item sem nome";
    const quantity = els.shoppingItemQuantity.value.trim() || "1";
    const category = normalizeShoppingCategory(els.shoppingItemCategory.value);
    const price = parseShoppingPrice(els.shoppingItemPrice.value);
    const url = category === "market" ? "" : normalizeShoppingUrl(els.shoppingItemUrl.value);

    const now = new Date().toISOString();
    state.shoppingItems = Array.isArray(state.shoppingItems) ? state.shoppingItems : [];
    const id = els.shoppingItemId.value;
    const existing = state.shoppingItems.find((item) => item.id === id);
    const payload = {
      id: existing?.id || createId("shopping"),
      name,
      quantity,
      category,
      url,
      price,
      priority: Boolean(els.shoppingItemPriority?.checked),
      purchased: Boolean(existing?.purchased),
      purchasedAt: existing?.purchasedAt || "",
      pantryItemId: existing?.pantryItemId || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, payload);
      showToast("Item atualizado.");
    } else {
      state.shoppingItems.unshift(payload);
      showToast("Item adicionado.");
    }

    closeShoppingItemDialog();
    saveState();
    renderShopping();
    renderHome();
  }

  function handleShoppingListClick(event) {
    const button = event.target.closest("[data-shopping-action]");
    if (!button || button.matches("input")) {
      return;
    }

    if (button.dataset.shoppingAction === "new") {
      openShoppingItemDialog(button.dataset.shoppingCategory);
      return;
    }

    if (button.dataset.shoppingAction === "market-page") {
      shoppingMarketPage = button.dataset.shoppingPage === "history" ? "history" : "pending";
      renderShopping();
      return;
    }

    if (button.dataset.shoppingAction === "clear-market-purchased") {
      clearPurchasedMarketShoppingItems();
      return;
    }

    const item = findShoppingItem(button.dataset.shoppingId);
    if (!item) {
      return;
    }

    if (button.dataset.shoppingAction === "edit") {
      openShoppingItemDialog(item.category, item.id);
    } else if (button.dataset.shoppingAction === "delete") {
      deleteShoppingItem(item);
    } else if (button.dataset.shoppingAction === "priority") {
      toggleShoppingPriority(item);
    }
  }

  function handleShoppingListChange(event) {
    const control = event.target.closest("[data-shopping-action]");
    if (!control) {
      return;
    }

    const item = findShoppingItem(control.dataset.shoppingId);
    if (!item) {
      return;
    }

    if (control.dataset.shoppingAction === "sum-select") {
      setShoppingMarketSumSelected(item.id, control.checked);
      return;
    }

    if (control.dataset.shoppingAction === "toggle") {
      setShoppingPurchased(item, control.checked);
      return;
    }

    if (control.dataset.shoppingAction === "move") {
      moveShoppingItemToCategory(item.id, control.value);
    }
  }

  function handleShoppingDragStart(event) {
    const card = event.target.closest("[data-shopping-item-id]");
    if (!card || event.target.closest("button, a, input, label, select")) {
      return;
    }

    shoppingDragItemId = card.dataset.shoppingItemId || "";
    if (!shoppingDragItemId) {
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", shoppingDragItemId);
    card.classList.add("is-dragging");
  }

  function handleShoppingDragOver(event) {
    const column = event.target.closest("[data-shopping-column]");
    if (!shoppingDragItemId || !column) {
      return;
    }

    event.preventDefault();
    column.classList.add("is-drop-target");
    event.dataTransfer.dropEffect = "move";
  }

  function handleShoppingDragLeave(event) {
    const column = event.target.closest("[data-shopping-column]");
    if (!column) {
      return;
    }

    const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
    if (!related || !column.contains(related)) {
      column.classList.remove("is-drop-target");
    }
  }

  function handleShoppingDrop(event) {
    const column = event.target.closest("[data-shopping-column]");
    if (!column) {
      return;
    }

    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") || shoppingDragItemId;
    moveShoppingItemToCategory(itemId, column.dataset.shoppingColumn);
    clearShoppingDragState();
  }

  function handleShoppingDragEnd() {
    clearShoppingDragState();
  }

  function clearShoppingDragState() {
    shoppingDragItemId = "";
    document.querySelectorAll(".shopping-column.is-drop-target, .shopping-item-row.is-dragging").forEach((element) => {
      element.classList.remove("is-drop-target", "is-dragging");
    });
  }

  function moveShoppingItemToCategory(itemId, category) {
    const item = findShoppingItem(itemId);
    const nextCategory = normalizeShoppingCategory(category);
    if (!item || !SHOPPING_WISHLIST_CATEGORY_ORDER.includes(nextCategory)) {
      return;
    }

    if (normalizeShoppingCategory(item.category) === nextCategory) {
      renderShopping();
      return;
    }

    item.category = nextCategory;
    item.updatedAt = new Date().toISOString();
    saveState();
    renderShopping();
    renderHome();
    showToast(`Movido para ${shoppingCategoryLabel(nextCategory)}.`);
  }

  function openShoppingItemDialog(category = "market", itemId = "") {
    const item = itemId ? findShoppingItem(itemId) : null;
    const activeCategory = normalizeShoppingCategory(item?.category || category);
    resetShoppingForm(activeCategory);

    if (item) {
      els.shoppingItemId.value = item.id;
      els.shoppingItemName.value = item.name || "";
      els.shoppingItemQuantity.value = item.quantity || "";
      els.shoppingItemCategory.value = activeCategory;
      els.shoppingItemPrice.value = item.price ? String(item.price) : "";
      els.shoppingItemUrl.value = activeCategory === "market" ? "" : item.url || item.storeUrl || item.store_url || item.link || "";
      if (els.shoppingItemPriority) {
        els.shoppingItemPriority.checked = Boolean(item.priority);
      }
      els.shoppingItemDialogTitle.textContent = "Editar item";
      els.shoppingFormSubtitle.textContent = "Atualize os dados do item.";
      els.shoppingSubmitLabel.textContent = "Salvar item";
    }

    updateShoppingDialogCategoryFields(activeCategory);

    if (typeof els.shoppingItemDialog.showModal === "function") {
      els.shoppingItemDialog.showModal();
    } else {
      els.shoppingItemDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.shoppingItemName.focus());
  }

  function closeShoppingItemDialog() {
    if (!els.shoppingItemDialog) {
      return;
    }

    if (els.shoppingItemDialog.open && typeof els.shoppingItemDialog.close === "function") {
      els.shoppingItemDialog.close();
    } else {
      els.shoppingItemDialog.removeAttribute("open");
    }

    resetShoppingForm();
  }

  function resetShoppingForm(category = "market") {
    if (!els.shoppingForm) {
      return;
    }

    els.shoppingForm.reset();
    els.shoppingItemId.value = "";
    els.shoppingItemCategory.value = normalizeShoppingCategory(category);
    els.shoppingItemUrl.value = "";
    if (els.shoppingItemPriority) {
      els.shoppingItemPriority.checked = false;
    }
    updateShoppingDialogCategoryFields(category);
    els.shoppingItemDialogTitle.textContent = "Adicionar item";
    els.shoppingFormSubtitle.textContent = "Cadastre um item na coluna escolhida.";
    els.shoppingSubmitLabel.textContent = "Adicionar item";
  }

  function updateShoppingDialogCategoryFields(category) {
    const isMarket = normalizeShoppingCategory(category) === "market";
    if (els.shoppingItemCategoryField) {
      els.shoppingItemCategoryField.hidden = isMarket;
    }
    if (els.shoppingItemUrlField) {
      els.shoppingItemUrlField.hidden = isMarket;
    }
    if (isMarket) {
      els.shoppingItemCategory.value = "market";
      els.shoppingItemUrl.value = "";
    }
  }

  function deleteShoppingItem(item) {
    const confirmed = window.confirm(`Excluir "${item.name}" da lista de compras?`);
    if (!confirmed) {
      return;
    }

    shoppingMarketSumSelection.delete(item.id);
    state.shoppingItems = (state.shoppingItems || []).filter((entry) => entry.id !== item.id);
    saveState();
    renderShopping();
    renderHome();
    showToast("Item removido.");
  }

  function clearPurchasedMarketShoppingItems() {
    const purchasedIds = (state.shoppingItems || [])
      .filter((item) => normalizeShoppingCategory(item.category) === "market" && item.purchased)
      .map((item) => item.id);

    if (!purchasedIds.length) {
      showToast("Nenhuma compra do mercado para excluir.");
      return;
    }

    const confirmed = window.confirm(`Excluir ${plural(purchasedIds.length, "item comprado do mercado", "itens comprados do mercado")}?`);
    if (!confirmed) {
      return;
    }

    const purchasedIdSet = new Set(purchasedIds);
    state.shoppingItems = (state.shoppingItems || []).filter((item) => !purchasedIdSet.has(item.id));
    purchasedIds.forEach((id) => shoppingMarketSumSelection.delete(id));
    saveState();
    renderShopping();
    renderHome();
    showToast("Compras do mercado excluidas.");
  }

  function setShoppingPurchased(item, purchased) {
    item.purchased = Boolean(purchased);
    item.purchasedAt = purchased ? new Date().toISOString() : "";
    item.updatedAt = new Date().toISOString();
    const pantryUpdated = purchased ? applyShoppingPurchaseToPantry(item) : false;
    if (purchased) {
      shoppingMarketSumSelection.delete(item.id);
    }
    saveState();
    renderShopping();
    renderPantry();
    renderHome();
    showToast(purchased ? (pantryUpdated ? "Compra marcada e despensa atualizada." : "Compra marcada.") : "Item voltou para pendentes.");
  }

  function syncShoppingMarketSumSelection(items) {
    const availableIds = new Set(items.map((item) => item.id));
    shoppingMarketSumSelection = new Set([...shoppingMarketSumSelection].filter((id) => availableIds.has(id)));
  }

  function setShoppingMarketSumSelected(itemId, selected) {
    if (selected) {
      shoppingMarketSumSelection.add(itemId);
    } else {
      shoppingMarketSumSelection.delete(itemId);
    }
    renderShopping();
  }

  function toggleShoppingPriority(item) {
    item.priority = !item.priority;
    saveState();
    renderShopping();
    renderHome();
    showToast(item.priority ? "Item marcado como prioridade." : "Prioridade removida.");
  }

  function findShoppingItem(itemId) {
    return (state.shoppingItems || []).find((item) => item.id === itemId) || null;
  }

  function getSortedShoppingItems() {
    return (state.shoppingItems || []).slice().sort((a, b) => {
      if (Boolean(a.purchased) !== Boolean(b.purchased)) {
        return a.purchased ? 1 : -1;
      }
      if (Boolean(a.priority) !== Boolean(b.priority)) {
        return a.priority ? -1 : 1;
      }
      return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
    });
  }

  function getShoppingStats() {
    const items = Array.isArray(state.shoppingItems) ? state.shoppingItems : [];
    const columns = SHOPPING_CATEGORY_ORDER.reduce((acc, category) => {
      acc[category] = blankShoppingColumnStats();
      return acc;
    }, {});
    let pendingCount = 0;
    let purchasedCount = 0;
    let pendingEstimate = 0;
    let purchasedEstimate = 0;
    let totalEstimate = 0;

    items.forEach((item) => {
      const category = normalizeShoppingCategory(item.category);
      const itemTotal = getShoppingItemTotal(item);
      const column = columns[category] || columns.needed;

      column.total += 1;
      column.totalEstimate = roundMoney(column.totalEstimate + itemTotal);
      totalEstimate += itemTotal;

      if (item.purchased) {
        purchasedCount += 1;
        purchasedEstimate += itemTotal;
        column.purchasedCount += 1;
        column.purchasedEstimate = roundMoney(column.purchasedEstimate + itemTotal);
      } else {
        pendingCount += 1;
        pendingEstimate += itemTotal;
        column.pendingCount += 1;
        column.pendingEstimate = roundMoney(column.pendingEstimate + itemTotal);
      }
    });

    const total = items.length;
    return {
      total,
      pendingCount,
      purchasedCount,
      pendingEstimate: roundMoney(pendingEstimate),
      purchasedEstimate: roundMoney(purchasedEstimate),
      totalEstimate: roundMoney(totalEstimate),
      completionRate: total ? Math.round((purchasedCount / total) * 100) : 0,
      columns,
    };
  }

  function blankShoppingColumnStats() {
    return {
      total: 0,
      pendingCount: 0,
      purchasedCount: 0,
      pendingEstimate: 0,
      purchasedEstimate: 0,
      totalEstimate: 0,
    };
  }

  function getShoppingCategoryGroupStats(stats, categories) {
    return categories.reduce((acc, category) => {
      const column = stats.columns[category] || blankShoppingColumnStats();
      acc.total += column.total;
      acc.pendingCount += column.pendingCount;
      acc.purchasedCount += column.purchasedCount;
      acc.pendingEstimate = roundMoney(acc.pendingEstimate + column.pendingEstimate);
      acc.purchasedEstimate = roundMoney(acc.purchasedEstimate + column.purchasedEstimate);
      acc.totalEstimate = roundMoney(acc.totalEstimate + column.totalEstimate);
      return acc;
    }, blankShoppingColumnStats());
  }

  function shoppingColumnBreakdown(stats, field, options = {}) {
    const categories = options.categories || SHOPPING_CATEGORY_ORDER;
    return categories.map((category) => {
      const value = stats.columns[category]?.[field] || 0;
      const formatted = options.money ? formatCurrency(value) : String(value);
      return `${shoppingCategoryLabel(category)}: ${formatted}`;
    }).join(" | ");
  }

  function parseShoppingPrice(value) {
    const parsed = Number(String(value ?? "").trim().replace(",", "."));
    return Math.max(0, roundMoney(Number.isFinite(parsed) ? parsed : 0));
  }

  function formatShoppingPrice(value) {
    const amount = Number(value) || 0;
    return amount > 0 ? formatCurrency(amount) : "Sem valor";
  }

  function parseShoppingQuantity(value, fallback = 1) {
    const text = String(value ?? "").trim().replace(",", ".");
    const match = text.match(/\d+(?:\.\d+)?/);
    const parsed = match ? Number(match[0]) : fallback;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  function formatShoppingQuantity(value) {
    const text = String(value ?? "").trim();
    return text || "1";
  }

  function getShoppingQuantity(item) {
    return parseShoppingQuantity(item?.quantity, 1);
  }

  function getShoppingItemTotal(item) {
    return roundMoney((Number(item?.price) || 0) * getShoppingQuantity(item));
  }

  function normalizeShoppingUrl(value) {
    const url = String(value || "").trim();
    if (!url) {
      return "";
    }
    if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      return url.slice(0, 500);
    }
    return `https://${url}`.slice(0, 500);
  }

  function normalizeShoppingFilter(value) {
    const filter = String(value || "").trim();
    return SHOPPING_FILTERS.includes(filter) ? filter : "pending";
  }

  function normalizeShoppingCategory(value) {
    const key = String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const legacyMap = {
      groceries: "market",
      grocery: "market",
      market: "market",
      mercado: "market",
      needed: "needed",
      preciso: "needed",
      home: "needed",
      higiene: "needed",
      hygiene: "needed",
      pharmacy: "needed",
      farmacia: "needed",
      pet: "needed",
      nice: "nice",
      other: "nice",
      "seria-bom-ter": "nice",
      want: "want",
      desejo: "want",
      inutil: "want",
      "inutil-mas-eu-quero": "want",
    };
    return legacyMap[key] || (Object.prototype.hasOwnProperty.call(SHOPPING_CATEGORIES, key) ? key : "needed");
  }

  function shoppingCategoryLabel(category) {
    return SHOPPING_CATEGORIES[normalizeShoppingCategory(category)]?.label || SHOPPING_CATEGORIES.needed.label;
  }

  function renderCreative() {
    if (!els.creativeBoard || !els.creativeDetail) {
      return;
    }

    const items = ensureCreativeItems();
    const stats = getCreativeStats();
    renderCreativeSummary(stats);
    ensureCreativeActiveItem(items);
    ensureCreativeActiveType();
    els.creativeBoard.innerHTML = renderCreativeTypeHub(items);
    renderCreativeSubpageCards();
  }

  function renderCreativeSummary(stats = getCreativeStats()) {
    if (!els.creativeTotalCount) {
      return;
    }

    els.creativeTotalCount.textContent = String(stats.total);
    els.creativeTotalDetail.textContent = stats.total === 0 ? "quadro vazio" : plural(stats.total, "criação", "criações");
    els.creativeActiveCount.textContent = String(stats.activeCount);
    els.creativeActiveDetail.textContent = stats.activeCount === 0 ? "sem ideias abertas" : plural(stats.activeCount, "item aberto", "itens abertos");
    els.creativeReferenceCount.textContent = String(stats.referenceCount);
    els.creativeReferenceDetail.textContent = stats.referenceCount === 0 ? "sem referencias" : "texto, imagem ou link";
    els.creativeCodeCount.textContent = String(stats.codeCount);
    els.creativeCodeDetail.textContent = stats.codeCount === 0 ? "sem testes" : plural(stats.codeCount, "teste de codigo", "testes de codigo");
  }

  function renderCreativeTypeHub(items = ensureCreativeItems()) {
    const visibleEntries = ["story", "code", "visuals", "playlist", "other"];
    return `
      <div class="creative-subpage-grid">
        ${visibleEntries.map((entry) => entry === "visuals" ? renderCreativeVisualGroupCard(items) : renderCreativeTypeCard(entry, items)).join("")}
      </div>
    `;
  }

  function renderCreativeVisualGroupCard(allItems = ensureCreativeItems()) {
    const items = allItems
      .filter((item) => CREATIVE_VISUAL_GROUP_TYPES.includes(item.type))
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    const active = CREATIVE_VISUAL_GROUP_TYPES.includes(activeCreativeType);
    const openType = active ? activeCreativeType : items[0]?.type || "image";
    const activeItem = activeCreativeItemForType(openType, creativeItemsByType(openType));
    return `
      <article class="creative-subpage-card creative-visual-group-card ${active ? "is-active" : ""}" style="--creative-type-accent:#5351ad">
        <button class="creative-subpage-button" type="button" data-creative-action="open-type" data-creative-type="${escapeHtml(openType)}">
          <span class="creative-card-icon">${svgIcon("icon-layout")}</span>
          <span>
            <small>Projetos visuais</small>
            <strong>Imagens, 3D e BI</strong>
            <em>${items.length} ${items.length === 1 ? "item" : "itens"}</em>
          </span>
        </button>
        <p>Um unico quadro para referencias visuais, modelos 3D e dashboards, mantendo os campos especificos de cada projeto.</p>
        <div class="creative-visual-group-tabs" aria-label="Subtipos visuais">
          ${CREATIVE_VISUAL_GROUP_TYPES.map((type) => {
            const config = creativeTypeConfig(type);
            const count = allItems.filter((item) => item.type === type).length;
            return `
              <button type="button" class="${activeCreativeType === type ? "is-active" : ""}" data-creative-action="open-type" data-creative-type="${escapeHtml(type)}">
                ${svgIcon(config.icon)}
                <span>${escapeHtml(config.label)}</span>
                <strong>${count}</strong>
              </button>
            `;
          }).join("")}
        </div>
        <div class="creative-subpage-actions">
          ${activeItem ? `<button class="button secondary compact-button" type="button" data-creative-action="select" data-creative-id="${escapeHtml(activeItem.id)}">Abrir ultimo</button>` : ""}
          <button class="button ${active ? "primary" : "secondary"} compact-button" type="button" data-creative-action="new" data-creative-type="${escapeHtml(openType)}">Criar</button>
        </div>
      </article>
    `;
  }

  function renderCreativeTypeCard(type, allItems = ensureCreativeItems()) {
    const config = creativeTypeConfig(type);
    const guide = creativeTypeGuide(type);
    const items = allItems.filter((item) => item.type === type);
    const active = activeCreativeType === type;
    const activeItem = activeCreativeItemForType(type, items);
    return `
      <article class="creative-subpage-card ${active ? "is-active" : ""}" style="--creative-type-accent:${escapeHtml(config.accent)}">
        <button class="creative-subpage-button" type="button" data-creative-action="open-type" data-creative-type="${escapeHtml(type)}">
          <span class="creative-card-icon">${svgIcon(config.icon)}</span>
          <span>
            <small>${escapeHtml(guide.eyebrow)}</small>
            <strong>${escapeHtml(config.label)}</strong>
            <em>${items.length} ${items.length === 1 ? "item" : "itens"}</em>
          </span>
        </button>
        <p>${escapeHtml(guide.description)}</p>
        <div class="creative-subpage-steps">
          ${guide.steps.slice(0, 4).map((step) => `<b>${escapeHtml(step)}</b>`).join("")}
        </div>
        <div class="creative-subpage-actions">
          ${activeItem ? `<button class="button secondary compact-button" type="button" data-creative-action="select" data-creative-id="${escapeHtml(activeItem.id)}">Abrir ultimo</button>` : ""}
          <button class="button ${active ? "primary" : "secondary"} compact-button" type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}">Criar</button>
        </div>
      </article>
    `;
  }

  function renderCreativeColumn(type, allItems = ensureCreativeItems()) {
    const config = creativeTypeConfig(type);
    const items = allItems
      .filter((item) => item.type === type)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    const content = items.length
      ? items.map(renderCreativeCard).join("")
      : `<div class="creative-column-empty">Nenhum item em ${escapeHtml(config.label.toLowerCase())}.</div>`;

    return `
      <section class="creative-column" data-creative-column="${escapeHtml(type)}" style="--creative-type-accent:${escapeHtml(config.accent)}">
        <header class="creative-column-header">
          <div>
            <span>${escapeHtml(config.singular)}</span>
            <h2>${escapeHtml(config.label)}</h2>
          </div>
          <strong>${items.length}</strong>
        </header>
        <div class="creative-column-list">
          ${content}
        </div>
        <button class="creative-column-add" type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}" aria-label="Adicionar em ${escapeHtml(config.label)}" title="Adicionar">
          ${svgIcon("icon-plus")}
          <span>Adicionar</span>
        </button>
      </section>
    `;
  }

  function renderCreativeCard(item) {
    const typeConfig = creativeTypeConfig(item.type);
    const status = creativeStatusConfig(item.status);
    const selected = item.id === activeCreativeItemId;
    const tags = creativeTagList(item.tags);
    const preview = creativeItemPreview(item);
    const visual = creativeCardVisual(item);
    const linkLabel = creativeLinkLabel(item);

    return `
      <article class="creative-card${selected ? " is-active" : ""}" data-creative-id="${escapeHtml(item.id)}">
        <button class="creative-card-main" type="button" data-creative-action="select" data-creative-id="${escapeHtml(item.id)}">
          <span class="creative-card-icon">${svgIcon(typeConfig.icon)}</span>
          <span class="creative-card-body">
            <span class="creative-card-title">${escapeHtml(item.title)}</span>
            <span class="creative-card-status" style="--creative-status-accent:${escapeHtml(status.accent)}">${escapeHtml(status.label)}</span>
            ${preview ? `<span class="creative-card-preview">${escapeHtml(preview)}</span>` : ""}
            ${tags.length ? `<span class="creative-card-tags">${tags.map((tag) => `<b>${escapeHtml(tag)}</b>`).join("")}</span>` : ""}
          </span>
        </button>
        ${visual}
        <div class="creative-card-footer">
          <span>${escapeHtml(linkLabel)}</span>
          <div class="row-actions creative-row-actions">
            <button class="icon-button" type="button" data-creative-action="edit" data-creative-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-creative-action="delete" data-creative-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCreativeSubpageCards() {
    ensureCreativeActiveType();
    const type = activeCreativeType;
    const typeConfig = creativeTypeConfig(type);
    const guide = creativeTypeGuide(type);
    const items = creativeItemsByType(type);
    const selectedItem = selectedCreativeItemForType(type, items);

    if (!items.length) {
      els.creativeDetail.innerHTML = `
        <div class="creative-workspace" style="--creative-type-accent:${escapeHtml(typeConfig.accent)}">
          ${renderCreativeWorkspaceIntro(type, null)}
          <div class="empty-state creative-empty-state">
            <strong>Nenhum item em ${escapeHtml(typeConfig.label.toLowerCase())}.</strong>
            <span>${escapeHtml(guide.description)}</span>
            <button class="button primary" type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}">
              ${svgIcon("icon-plus")}
              <span>Criar ${escapeHtml(typeConfig.singular.toLowerCase())}</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    const status = selectedItem ? creativeStatusConfig(selectedItem.status) : null;
    els.creativeDetail.innerHTML = `
      <div class="creative-workspace" style="--creative-type-accent:${escapeHtml(typeConfig.accent)}">
        ${renderCreativeWorkspaceIntro(type, selectedItem)}
        ${renderCreativeTypeItemGallery(type, items, selectedItem)}
        ${selectedItem ? `
          <div class="creative-open-overlay" role="presentation">
            <button class="creative-open-backdrop" type="button" data-creative-action="close-open" aria-label="Fechar criacao aberta"></button>
            <div class="creative-open-detail" role="dialog" aria-modal="true" aria-label="${escapeHtml(selectedItem.title)}">
              <div class="creative-detail-head">
                <div>
                  <p class="eyebrow">${escapeHtml(typeConfig.singular)}</p>
                  <h2>${escapeHtml(selectedItem.title)}</h2>
                  <span>${escapeHtml(status.label)} - atualizado ${escapeHtml(formatCreativeDate(selectedItem.updatedAt))}</span>
                </div>
                <div class="creative-detail-actions">
                  <button class="icon-button" type="button" data-creative-action="edit" data-creative-id="${escapeHtml(selectedItem.id)}" aria-label="Editar ${escapeHtml(selectedItem.title)}" title="Editar">
                    ${svgIcon("icon-edit")}
                  </button>
                  <button class="icon-button" type="button" data-creative-action="delete" data-creative-id="${escapeHtml(selectedItem.id)}" aria-label="Excluir ${escapeHtml(selectedItem.title)}" title="Excluir">
                    ${svgIcon("icon-trash")}
                  </button>
                  <button class="icon-button" type="button" data-creative-action="close-open" aria-label="Fechar ${escapeHtml(selectedItem.title)}" title="Fechar">
                    ${svgIcon("icon-close")}
                  </button>
                </div>
              </div>
              <div class="creative-detail-meta">
                <label class="field compact">
                  <span>Status</span>
                  <select data-creative-live-field="status" aria-label="Status da criacao">
                    ${CREATIVE_STATUS_ORDER.map((key) => `<option value="${key}"${selectedItem.status === key ? " selected" : ""}>${escapeHtml(creativeStatusConfig(key).label)}</option>`).join("")}
                  </select>
                </label>
                <span>${escapeHtml(selectedItem.tags || "Sem tags")}</span>
              </div>
              ${renderCreativeDetailBody(selectedItem)}
            </div>
          </div>
        ` : ""}
      </div>
    `;

    if (selectedItem) {
      requestAnimationFrame(() => setupCreativeCanvases(selectedItem));
    }
  }

  function renderCreativeTypeItemGallery(type, items = creativeItemsByType(type), activeItem = null) {
    const typeConfig = creativeTypeConfig(type);
    return `
      <section class="creative-item-gallery">
        <div class="creative-item-gallery-head">
          <div>
            <strong>Criacoes em ${escapeHtml(typeConfig.label.toLowerCase())}</strong>
            <span>Os cards ficam limpos. Abra uma criacao para ver campos, arquivos, anotacoes e testes.</span>
          </div>
          <button class="button primary compact-button" type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}">
            ${svgIcon("icon-plus")}
            <span>Nova criacao</span>
          </button>
        </div>
        <div class="creative-item-card-grid">
          ${items.map((item) => renderCreativeOpenCard(item, activeItem)).join("")}
        </div>
      </section>
    `;
  }

  function renderCreativeOpenCard(item, activeItem = null) {
    const typeConfig = creativeTypeConfig(item.type);
    const selected = activeItem?.id === item.id;
    return `
      <article class="creative-item-open-card ${selected ? "is-active" : ""}" data-creative-id="${escapeHtml(item.id)}">
        <button class="creative-item-open-main" type="button" data-creative-action="select" data-creative-id="${escapeHtml(item.id)}" aria-label="Abrir ${escapeHtml(item.title)}">
          <span class="creative-card-icon">${svgIcon(typeConfig.icon)}</span>
          <span class="creative-card-body">
            <span class="creative-card-title">${escapeHtml(item.title)}</span>
          </span>
        </button>
        <div class="creative-item-open-footer">
          <div class="row-actions creative-row-actions">
            <button class="button ${selected ? "primary" : "secondary"} compact-button" type="button" data-creative-action="select" data-creative-id="${escapeHtml(item.id)}">
              ${selected ? "Aberto" : "Abrir"}
            </button>
            <button class="icon-button" type="button" data-creative-action="edit" data-creative-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-creative-action="delete" data-creative-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCreativeSubpage() {
    ensureCreativeActiveType();
    const type = activeCreativeType;
    const typeConfig = creativeTypeConfig(type);
    const guide = creativeTypeGuide(type);
    const item = activeCreativeItemForType(type);
    if (!item) {
      els.creativeDetail.innerHTML = `
        <div class="creative-workspace" style="--creative-type-accent:${escapeHtml(typeConfig.accent)}">
          ${renderCreativeWorkspaceIntro(type, null)}
          <div class="empty-state creative-empty-state">
            <strong>Nenhum item em ${escapeHtml(typeConfig.label.toLowerCase())}.</strong>
            <span>${escapeHtml(guide.description)}</span>
            <button class="button primary" type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}">
              ${svgIcon("icon-plus")}
              <span>Criar ${escapeHtml(typeConfig.singular.toLowerCase())}</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    activeCreativeItemId = item.id;
    const status = creativeStatusConfig(item.status);
    els.creativeDetail.innerHTML = `
      <div class="creative-workspace" style="--creative-type-accent:${escapeHtml(typeConfig.accent)}">
        ${renderCreativeWorkspaceIntro(type, item)}
        <div class="creative-detail-head">
          <div>
            <p class="eyebrow">${escapeHtml(typeConfig.singular)}</p>
            <h2>${escapeHtml(item.title)}</h2>
            <span>${escapeHtml(status.label)} - atualizado ${escapeHtml(formatCreativeDate(item.updatedAt))}</span>
          </div>
          <div class="creative-detail-actions">
            <button class="icon-button" type="button" data-creative-action="edit" data-creative-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-creative-action="delete" data-creative-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
        <div class="creative-detail-meta">
          <label class="field compact">
            <span>Status</span>
            <select data-creative-live-field="status" aria-label="Status da criação">
              ${CREATIVE_STATUS_ORDER.map((key) => `<option value="${key}"${item.status === key ? " selected" : ""}>${escapeHtml(creativeStatusConfig(key).label)}</option>`).join("")}
            </select>
          </label>
          <span>${escapeHtml(item.tags || "Sem tags")}</span>
        </div>
        ${renderCreativeTypeItemSwitcher(type, item)}
        ${renderCreativeDetailBody(item)}
      </div>
    `;
    requestAnimationFrame(() => setupCreativeCanvases(item));
  }

  function renderCreativeWorkspaceIntro(type, item) {
    const guide = creativeTypeGuide(type);
    const typeItems = creativeItemsByType(type);
    const counts = item ? creativeWorkspaceCounts(item) : [];
    return `
      <section class="creative-workspace-intro">
        <div>
          <p class="eyebrow">${escapeHtml(guide.eyebrow)}</p>
          <h2>${escapeHtml(guide.title)}</h2>
          <span>${escapeHtml(guide.description)}</span>
        </div>
        <div class="creative-workspace-steps">
          ${guide.steps.map((step) => `<b>${escapeHtml(step)}</b>`).join("")}
        </div>
        <div class="creative-workspace-stats">
          <span>${typeItems.length} ${typeItems.length === 1 ? "item" : "itens"}</span>
          ${counts.map((entry) => `<span>${escapeHtml(entry)}</span>`).join("")}
        </div>
      </section>
    `;
  }

  function renderCreativeTypeItemSwitcher(type, activeItem) {
    const items = creativeItemsByType(type);
    if (!items.length) {
      return "";
    }
    return `
      <div class="creative-item-switcher">
        <div>
          <strong>Itens desta subpagina</strong>
          <span>Troque o projeto ativo sem sair da categoria.</span>
        </div>
        <div class="creative-item-switcher-list">
          ${items.map((item) => `
            <button class="${item.id === activeItem.id ? "is-active" : ""}" type="button" data-creative-action="select" data-creative-id="${escapeHtml(item.id)}">
              ${escapeHtml(item.title)}
            </button>
          `).join("")}
          <button type="button" data-creative-action="new" data-creative-type="${escapeHtml(type)}">+ Novo</button>
        </div>
      </div>
    `;
  }

  function renderCreativeDetail() {
    const item = findCreativeItem(activeCreativeItemId);
    if (!item) {
      els.creativeDetail.innerHTML = `
        <div class="empty-state creative-empty-state">
          <strong>Area criativa vazia.</strong>
          <span>Crie uma historia, teste de codigo, referencia visual ou modelo 3D.</span>
          <button class="button primary" type="button" data-creative-action="new">
            ${svgIcon("icon-plus")}
            <span>Nova criação</span>
          </button>
        </div>
      `;
      return;
    }

    const typeConfig = creativeTypeConfig(item.type);
    const status = creativeStatusConfig(item.status);
    els.creativeDetail.innerHTML = `
      <div class="creative-detail-head" style="--creative-type-accent:${escapeHtml(typeConfig.accent)}">
        <div>
          <p class="eyebrow">${escapeHtml(typeConfig.singular)}</p>
          <h2>${escapeHtml(item.title)}</h2>
          <span>${escapeHtml(status.label)} - atualizado ${escapeHtml(formatCreativeDate(item.updatedAt))}</span>
        </div>
        <div class="creative-detail-actions">
          <button class="icon-button" type="button" data-creative-action="edit" data-creative-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}" title="Editar">
            ${svgIcon("icon-edit")}
          </button>
          <button class="icon-button" type="button" data-creative-action="delete" data-creative-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        </div>
      </div>
      <div class="creative-detail-meta">
        <label class="field compact">
          <span>Status</span>
          <select data-creative-live-field="status" aria-label="Status da criação">
            ${CREATIVE_STATUS_ORDER.map((key) => `<option value="${key}"${item.status === key ? " selected" : ""}>${escapeHtml(creativeStatusConfig(key).label)}</option>`).join("")}
          </select>
        </label>
        <span>${escapeHtml(item.tags || "Sem tags")}</span>
      </div>
      ${renderCreativeDetailBody(item)}
    `;
  }

  function renderCreativeDetailBody(item) {
    let body = "";
    if (item.type === "story") {
      body = renderCreativeStoryLab(item);
    } else if (item.type === "code") {
      body = renderCreativeCodeLab(item);
    } else if (item.type === "image") {
      body = renderCreativeImageWorkspace(item);
    } else if (item.type === "model3d") {
      body = renderCreativeModelWorkspace(item);
    } else if (item.type === "dashboard") {
      body = renderCreativeDashboardWorkspace(item);
    } else if (item.type === "playlist") {
      body = renderCreativePlaylistWorkspace(item);
    } else if (item.type === "other") {
      body = renderCreativeWildcardLab(item);
    } else {
      body = renderCreativeWritingLab(item);
    }
    return `${body}${renderCreativeProjectBlocks(item)}`;
  }

  function renderCreativeStoryLab(item) {
    const workspace = ensureCreativeStoryWorkspace(item);
    const totalWords = creativeStoryWordCount(item, workspace);
    return `
      <div class="creative-story-layout rich">
        <section class="creative-tool-card creative-story-free-fields">
          <div class="creative-tool-card-head">
            <h3>Campos livres</h3>
            <button class="button secondary compact-button" type="button" data-creative-action="story-add-free-card" data-creative-id="${escapeHtml(item.id)}">
              ${svgIcon("icon-plus")}
              <span>Campo</span>
            </button>
          </div>
          <p class="creative-story-section-note">Adicione blocos livres para premissa, sinopse, cenas, rascunhos ou qualquer anotacao. Arraste pelo topo e redimensione pelo canto.</p>
          ${renderCreativeStoryFreeBoard(item, workspace)}
        </section>

        <section class="creative-tool-card creative-story-views-card">
          <div class="creative-tool-card-head">
            <h3>Visualizacoes</h3>
            <button class="button secondary compact-button" type="button" data-creative-action="story-add-view" data-creative-id="${escapeHtml(item.id)}">
              ${svgIcon("icon-plus")}
              <span>Nova visualizacao</span>
            </button>
          </div>
          <div class="creative-story-view-grid">
            ${workspace.views.map((view) => renderCreativeStoryView(item, view)).join("")}
          </div>
        </section>

        <section class="creative-tool-card creative-story-loose-shell">
          <div class="creative-tool-card-head">
            <h3>Historias soltas</h3>
            <button class="button secondary compact-button" type="button" data-creative-action="story-add-loose-page" data-creative-id="${escapeHtml(item.id)}">
              ${svgIcon("icon-plus")}
              <span>Subpagina</span>
            </button>
          </div>
          <div class="creative-story-loose-list">
            ${workspace.loosePages.length ? workspace.loosePages.map((page) => renderCreativeStoryLoosePageCard(item, page)).join("") : `
              <div class="creative-story-empty">Adicione subpaginas com titulo ou sem titulo para escrever qualquer parte da historia.</div>
            `}
          </div>
        </section>
      </div>
      ${renderCreativeStoryEditorOverlay(item, workspace)}
      <div class="creative-detail-foot">
        <span>${totalWords} palavras no projeto</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function creativePlainInputField(label, field, value, placeholder) {
    return `
      <label class="field creative-live-field creative-plain-field">
        <span>${escapeHtml(label)}</span>
        <input data-creative-live-field="${escapeHtml(field)}" type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}">
      </label>
    `;
  }

  function creativeRichField(label, field, value, placeholder, className = "") {
    return `
      <div class="creative-rich-field ${escapeHtml(className)}">
        <div class="creative-rich-head">
          <span>${escapeHtml(label)}</span>
        </div>
        ${creativeRichToolbar()}
        <div class="creative-rich-editor" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true" data-creative-rich-field="true" data-creative-live-field="${escapeHtml(field)}" data-placeholder="${escapeHtml(placeholder)}">${normalizeCreativeRichHtml(value)}</div>
      </div>
    `;
  }

  function creativeStoryRichField(label, storyField, value, placeholder, dataAttrs, className = "") {
    return `
      <div class="creative-rich-field ${escapeHtml(className)}">
        <div class="creative-rich-head">
          <span>${escapeHtml(label)}</span>
        </div>
        ${creativeRichToolbar()}
        <div class="creative-rich-editor" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true" data-creative-rich-field="true" data-creative-story-field="${escapeHtml(storyField)}" ${dataAttrs} data-placeholder="${escapeHtml(placeholder)}">${normalizeCreativeRichHtml(value)}</div>
      </div>
    `;
  }

  function creativeRichToolbar() {
    return `
      <div class="creative-rich-toolbar" aria-label="Formatacao de texto">
        <select data-creative-rich-format="fontName" aria-label="Fonte">
          <option value="">Fonte</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Serif</option>
          <option value="Courier New">Mono</option>
        </select>
        <select data-creative-rich-format="fontSize" aria-label="Tamanho">
          <option value="">Tamanho</option>
          <option value="2">Pequeno</option>
          <option value="3">Normal</option>
          <option value="4">Medio</option>
          <option value="5">Grande</option>
          <option value="6">Titulo</option>
        </select>
        <button class="icon-button" type="button" data-creative-rich-command="bold" aria-label="Negrito" title="Negrito">B</button>
        <button class="icon-button" type="button" data-creative-rich-command="italic" aria-label="Italico" title="Italico">I</button>
        <button class="icon-button" type="button" data-creative-rich-command="underline" aria-label="Sublinhado" title="Sublinhado">U</button>
        <button class="button secondary compact-button" type="button" data-creative-rich-command="removeFormat">Normal</button>
        <button class="button secondary compact-button creative-rich-image-button" type="button" data-creative-rich-image aria-label="Inserir imagem" title="Inserir imagem">
          ${svgIcon("icon-image")}
          <span>Imagem</span>
        </button>
        <input data-creative-rich-image-input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
      </div>
    `;
  }

  function renderCreativeStoryFreeBoard(item, workspace) {
    const cards = workspace.freeCards || [];
    const height = creativeStoryFreeBoardHeight(cards);
    if (!cards.length) {
      return `
        <div class="creative-story-free-board is-empty" data-creative-story-free-board style="min-height:${height}px">
          <div class="creative-story-empty">Nenhum campo livre ainda.</div>
        </div>
      `;
    }

    return `
      <div class="creative-story-free-board" data-creative-story-free-board style="min-height:${height}px">
        ${cards.map((card) => renderCreativeStoryFreeCard(item, card)).join("")}
      </div>
    `;
  }

  function renderCreativeStoryFreeCard(item, card) {
    return `
      <article class="creative-story-free-card" data-story-free-id="${escapeHtml(card.id)}" style="--story-free-x:${card.x}; --story-free-y:${card.y}; --story-free-w:${card.w}; --story-free-h:${card.h};">
        <div class="creative-story-free-card-head" data-creative-story-free-layout="move" data-creative-id="${escapeHtml(item.id)}" data-story-free-id="${escapeHtml(card.id)}" title="Arraste para mover">
          ${svgIcon("icon-layout")}
          <span>Arraste</span>
        </div>
        <button class="creative-story-free-card-main" type="button" data-creative-action="story-open-free-card" data-creative-id="${escapeHtml(item.id)}" data-story-free-id="${escapeHtml(card.id)}">
          <strong>${escapeHtml(card.title || "Sem titulo")}</strong>
          <span>${escapeHtml(creativeRichExcerpt(card.body, "Sem texto"))}</span>
        </button>
        <button class="creative-story-free-resize" type="button" data-creative-story-free-layout="resize" data-creative-id="${escapeHtml(item.id)}" data-story-free-id="${escapeHtml(card.id)}" aria-label="Redimensionar ${escapeHtml(card.title || "campo livre")}" title="Arraste para redimensionar">
          <span>Redimensionar</span>
        </button>
      </article>
    `;
  }

  function creativeStoryFreeBoardHeight(cards) {
    const rows = Math.max(4, ...cards.map((card) => Number(card.y || 0) + Number(card.h || 2)));
    return rows * CREATIVE_STORY_FREE_ROW_HEIGHT + 12;
  }

  function renderCreativeStoryView(item, view) {
    const activePage = activeCreativeStoryPage(view);
    const pageTitle = activePage?.title || "Sem pagina";
    return `
      <article class="creative-story-view-panel">
        <div class="creative-story-view-head">
          <input data-creative-story-field="viewTitle" data-story-view-id="${escapeHtml(view.id)}" value="${escapeHtml(view.title)}" aria-label="Nome da visualizacao">
          <button class="icon-button" type="button" data-creative-action="story-add-page" data-creative-id="${escapeHtml(item.id)}" data-story-view-id="${escapeHtml(view.id)}" aria-label="Adicionar pagina em ${escapeHtml(view.title)}" title="Adicionar pagina">
            ${svgIcon("icon-plus")}
          </button>
        </div>
        <div class="creative-story-page-tabs" role="tablist" aria-label="Paginas de ${escapeHtml(view.title)}">
          ${view.pages.map((page) => `
            <button class="creative-story-page-tab${page.id === view.activePageId ? " active" : ""}" type="button" data-creative-action="story-select-page" data-creative-id="${escapeHtml(item.id)}" data-story-view-id="${escapeHtml(view.id)}" data-story-page-id="${escapeHtml(page.id)}">
              ${escapeHtml(page.title || "Sem titulo")}
            </button>
          `).join("")}
          <button class="creative-story-page-tab add" type="button" data-creative-action="story-add-page" data-creative-id="${escapeHtml(item.id)}" data-story-view-id="${escapeHtml(view.id)}">
            ${svgIcon("icon-plus")}
            <span>Pagina</span>
          </button>
        </div>
        <div class="creative-story-page-title">
          <input data-creative-story-field="pageTitle" data-story-view-id="${escapeHtml(view.id)}" data-story-page-id="${escapeHtml(activePage?.id || "")}" value="${escapeHtml(pageTitle)}" aria-label="Titulo da pagina aberta">
        </div>
        <div class="creative-story-card-grid">
          ${activePage?.cards.length ? activePage.cards.map((card) => renderCreativeStoryCard(item, view, activePage, card)).join("") : `
            <div class="creative-story-empty">Nenhum quadro nesta pagina.</div>
          `}
          <button class="creative-story-add-card" type="button" data-creative-action="story-add-card" data-creative-id="${escapeHtml(item.id)}" data-story-view-id="${escapeHtml(view.id)}" data-story-page-id="${escapeHtml(activePage?.id || "")}">
            ${svgIcon("icon-plus")}
            <span>Nova pagina</span>
          </button>
        </div>
      </article>
    `;
  }

  function renderCreativeStoryCard(item, view, page, card) {
    return `
      <button class="creative-story-card" type="button" data-creative-action="story-open-card" data-creative-id="${escapeHtml(item.id)}" data-story-view-id="${escapeHtml(view.id)}" data-story-page-id="${escapeHtml(page.id)}" data-story-card-id="${escapeHtml(card.id)}">
        <p>${escapeHtml(creativeRichExcerpt(card.description, "Sem descricao"))}</p>
        <strong>${escapeHtml(card.title || "Sem titulo")}</strong>
      </button>
    `;
  }

  function renderCreativeStoryLoosePageCard(item, page) {
    return `
      <button class="creative-story-loose-row" type="button" data-creative-action="story-open-loose-page" data-creative-id="${escapeHtml(item.id)}" data-story-loose-id="${escapeHtml(page.id)}">
        ${svgIcon("icon-edit")}
        <span>${escapeHtml(page.title || "Sem titulo")}</span>
        <small>${escapeHtml(creativeRichExcerpt(page.body, "Sem texto"))}</small>
      </button>
    `;
  }

  function renderCreativeStoryEditorOverlay(item, workspace) {
    const freeCard = findCreativeStoryFreeCard(workspace, workspace.openFreeCardId);
    if (freeCard) {
      return renderCreativeStoryFreeEditor(item, freeCard);
    }
    const cardContext = findCreativeStoryCard(workspace, workspace.openCardId);
    if (cardContext) {
      return renderCreativeStoryCardEditor(item, cardContext);
    }
    const loosePage = findCreativeStoryLoosePage(workspace, workspace.openLoosePageId);
    if (loosePage) {
      return renderCreativeStoryLooseEditor(item, loosePage);
    }
    return "";
  }

  function renderCreativeStoryFreeEditor(item, card) {
    const attrs = `data-story-free-id="${escapeHtml(card.id)}"`;
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar campo livre"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(card.title || "Campo livre")}">
          <div class="creative-story-editor-head">
            <div>
              <span>Campo livre</span>
              <input data-creative-story-field="freeTitle" ${attrs} value="${escapeHtml(card.title)}" placeholder="Titulo opcional" aria-label="Titulo do campo livre">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="story-delete-free-card" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir campo livre" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar campo livre" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${creativeStoryRichField("Texto livre", "freeBody", card.body, "Escreva qualquer descricao, cena, anotacao ou referencia.", attrs, "tall")}
          </div>
        </div>
      </div>
    `;
  }

  function renderCreativeStoryCardEditor(item, context) {
    const attrs = `data-story-view-id="${escapeHtml(context.view.id)}" data-story-page-id="${escapeHtml(context.page.id)}" data-story-card-id="${escapeHtml(context.card.id)}"`;
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar quadro"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(context.card.title || "Quadro de historia")}">
          <div class="creative-story-editor-head">
            <div>
              <span>${escapeHtml(context.view.title)} / ${escapeHtml(context.page.title)}</span>
              <input data-creative-story-field="cardTitle" ${attrs} value="${escapeHtml(context.card.title)}" placeholder="Titulo do quadro" aria-label="Titulo do quadro">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="story-delete-card" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir quadro" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar quadro" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${creativeStoryRichField("Descricao", "cardDescription", context.card.description, "Escreva descricao, topicos, listas, referencias e detalhes deste quadro.", attrs, "tall")}
          </div>
        </div>
      </div>
    `;
  }

  function renderCreativeStoryLooseEditor(item, page) {
    const attrs = `data-story-loose-id="${escapeHtml(page.id)}"`;
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar subpagina"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(page.title || "Subpagina")}">
          <div class="creative-story-editor-head">
            <div>
              <span>Historia solta</span>
              <input data-creative-story-field="looseTitle" ${attrs} value="${escapeHtml(page.title)}" placeholder="Titulo opcional" aria-label="Titulo da subpagina">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="story-delete-loose-page" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir subpagina" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="story-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar subpagina" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${creativeStoryRichField("Texto livre", "looseBody", page.body, "Escreva qualquer cena, capitulo, anotacao ou rascunho.", attrs, "tall")}
          </div>
        </div>
      </div>
    `;
  }

  function defaultCreativeStoryWorkspace() {
    const firstPages = ["Racas", "Person.", "Bestiario"].map((title) => createCreativeStoryPage(title));
    const secondPages = ["Mundos", "Biomas", "Reinos"].map((title) => createCreativeStoryPage(title));
    return {
      views: [
        { id: createId("story-view"), title: "Racas e personagens", activePageId: firstPages[0].id, pages: firstPages },
        { id: createId("story-view"), title: "Mundos", activePageId: secondPages[0].id, pages: secondPages },
      ],
      freeCards: [],
      freeCardsInitialized: false,
      loosePages: [],
      openFreeCardId: "",
      openCardId: "",
      openLoosePageId: "",
    };
  }

  function createCreativeStoryView(title = "Nova visualizacao") {
    const page = createCreativeStoryPage("Nova pagina");
    return {
      id: createId("story-view"),
      title,
      activePageId: page.id,
      pages: [page],
    };
  }

  function createCreativeStoryPage(title = "Nova pagina") {
    return {
      id: createId("story-page"),
      title,
      cards: [],
    };
  }

  function createCreativeStoryCard(title = "Novo quadro") {
    return {
      id: createId("story-card"),
      title,
      description: "",
    };
  }

  function createCreativeStoryLoosePage(title = "") {
    return {
      id: createId("story-loose"),
      title,
      body: "",
    };
  }

  function createCreativeStoryFreeCard(title = "Campo livre", body = "", layout = {}) {
    return {
      id: createId("story-free"),
      title,
      body: normalizeCreativeRichHtml(body, CREATIVE_RICH_CONTENT_LIMIT),
      x: clampNumber(layout.x ?? 0, 0, CREATIVE_STORY_FREE_COLUMNS - 1),
      y: Math.max(0, Math.round(Number(layout.y) || 0)),
      w: clampNumber(layout.w ?? 4, 2, CREATIVE_STORY_FREE_COLUMNS),
      h: clampNumber(layout.h ?? 2, 1, 8),
    };
  }

  function ensureCreativeStoryWorkspace(item) {
    item.storyWorkspace = normalizeCreativeStoryWorkspace(item.storyWorkspace);
    hydrateCreativeStoryFreeCards(item, item.storyWorkspace);
    return item.storyWorkspace;
  }

  function normalizeCreativeStoryWorkspace(workspace) {
    const defaults = defaultCreativeStoryWorkspace();
    const source = workspace && typeof workspace === "object" ? workspace : defaults;
    const rawViews = Array.isArray(source.views) ? source.views : [];
    const views = rawViews.map((view, index) => normalizeCreativeStoryView(view, index)).filter(Boolean);
    const rawLoosePages = Array.isArray(source.loosePages)
      ? source.loosePages
      : Array.isArray(source.loose_pages)
        ? source.loose_pages
        : Array.isArray(source.subpages)
          ? source.subpages
          : [];
    const rawFreeCards = Array.isArray(source.freeCards)
      ? source.freeCards
      : Array.isArray(source.free_cards)
        ? source.free_cards
        : [];
    return {
      views: views.length ? views : defaults.views,
      freeCards: rawFreeCards.map(normalizeCreativeStoryFreeCard).filter(Boolean),
      freeCardsInitialized: Boolean(source.freeCardsInitialized || source.free_cards_initialized),
      loosePages: rawLoosePages.map(normalizeCreativeStoryLoosePage).filter(Boolean),
      openFreeCardId: normalizeCreativeText(source.openFreeCardId || source.open_free_card_id || "", 120),
      openCardId: normalizeCreativeText(source.openCardId || source.open_card_id || "", 120),
      openLoosePageId: normalizeCreativeText(source.openLoosePageId || source.open_loose_page_id || "", 120),
    };
  }

  function hydrateCreativeStoryFreeCards(item, workspace) {
    if (workspace.freeCardsInitialized) {
      return;
    }

    workspace.freeCards = createCreativeStoryDefaultFreeCards(item);
    workspace.freeCardsInitialized = true;
  }

  function createCreativeStoryDefaultFreeCards(item) {
    const defaults = [
      ["Descricao", item.storyDescription, { x: 0, y: 0, w: 6, h: 2 }],
      ["Premissa", item.idea, { x: 6, y: 0, w: 6, h: 2 }],
      ["Sinopse", item.synopsis, { x: 0, y: 2, w: 6, h: 2 }],
      ["Genero e tom", item.mood, { x: 6, y: 2, w: 6, h: 2 }],
      ["Personagens", item.characters, { x: 0, y: 4, w: 4, h: 2 }],
      ["Construcao de mundo", item.world, { x: 4, y: 4, w: 4, h: 2 }],
      ["Cenas soltas", item.scenes, { x: 8, y: 4, w: 4, h: 2 }],
      ["Texto principal", item.content, { x: 0, y: 6, w: 12, h: 3 }],
    ];
    return defaults.map(([title, body, layout]) => createCreativeStoryFreeCard(title, body, layout));
  }

  function normalizeCreativeStoryView(view, index = 0) {
    if (!view || typeof view !== "object") {
      return null;
    }
    const pages = (Array.isArray(view.pages) ? view.pages : [])
      .map((page, pageIndex) => normalizeCreativeStoryPage(page, pageIndex))
      .filter(Boolean);
    if (!pages.length) {
      pages.push(createCreativeStoryPage(index === 0 ? "Racas" : "Mundos"));
    }
    const requestedPageId = normalizeCreativeText(view.activePageId || view.active_page_id || "", 120);
    return {
      id: normalizeCreativeText(view.id, 120) || createId("story-view"),
      title: normalizeCreativeText(view.title || view.name || `Visualizacao ${index + 1}`, 80),
      activePageId: pages.some((page) => page.id === requestedPageId) ? requestedPageId : pages[0].id,
      pages,
    };
  }

  function normalizeCreativeStoryPage(page, index = 0) {
    if (!page || typeof page !== "object") {
      return null;
    }
    return {
      id: normalizeCreativeText(page.id, 120) || createId("story-page"),
      title: normalizeCreativeText(page.title || page.name || `Pagina ${index + 1}`, 80),
      cards: (Array.isArray(page.cards) ? page.cards : [])
        .map((card, cardIndex) => normalizeCreativeStoryCard(card, cardIndex))
        .filter(Boolean),
    };
  }

  function normalizeCreativeStoryCard(card, index = 0) {
    if (!card || typeof card !== "object") {
      return null;
    }
    return {
      id: normalizeCreativeText(card.id, 120) || createId("story-card"),
      title: normalizeCreativeText(card.title || card.name || `Quadro ${index + 1}`, 100),
      description: normalizeCreativeRichHtml(card.description || card.body || card.content || "", CREATIVE_RICH_CONTENT_LIMIT),
    };
  }

  function normalizeCreativeStoryLoosePage(page, index = 0) {
    if (!page || typeof page !== "object") {
      return null;
    }
    return {
      id: normalizeCreativeText(page.id, 120) || createId("story-loose"),
      title: normalizeCreativeText(page.title || page.name || "", 100),
      body: normalizeCreativeRichHtml(page.body || page.content || page.text || "", CREATIVE_RICH_CONTENT_LIMIT),
    };
  }

  function normalizeCreativeStoryFreeCard(card, index = 0) {
    if (!card || typeof card !== "object") {
      return null;
    }
    const width = clampNumber(card.w || card.width || 4, 2, CREATIVE_STORY_FREE_COLUMNS);
    const x = clampNumber(card.x ?? card.column ?? ((index % 2) * 6), 0, CREATIVE_STORY_FREE_COLUMNS - width);
    return {
      id: normalizeCreativeText(card.id, 120) || createId("story-free"),
      title: normalizeCreativeText(card.title || card.name || `Campo ${index + 1}`, 100),
      body: normalizeCreativeRichHtml(card.body || card.description || card.content || card.text || "", CREATIVE_RICH_CONTENT_LIMIT),
      x,
      y: Math.max(0, Math.round(Number(card.y ?? card.row ?? Math.floor(index / 2) * 2) || 0)),
      w: width,
      h: clampNumber(card.h || card.height || 2, 1, 8),
    };
  }

  function activeCreativeStoryPage(view) {
    return view.pages.find((page) => page.id === view.activePageId) || view.pages[0] || null;
  }

  function findCreativeStoryView(workspace, viewId) {
    return workspace?.views?.find((view) => view.id === viewId) || null;
  }

  function findCreativeStoryPage(view, pageId) {
    return view?.pages.find((page) => page.id === pageId) || null;
  }

  function findCreativeStoryCard(workspace, cardId) {
    if (!cardId) {
      return null;
    }
    for (const view of workspace.views) {
      for (const page of view.pages) {
        const card = page.cards.find((candidate) => candidate.id === cardId);
        if (card) {
          return { view, page, card };
        }
      }
    }
    return null;
  }

  function findCreativeStoryLoosePage(workspace, pageId) {
    return pageId ? workspace.loosePages.find((page) => page.id === pageId) || null : null;
  }

  function findCreativeStoryFreeCard(workspace, cardId) {
    return cardId ? workspace.freeCards.find((card) => card.id === cardId) || null : null;
  }

  function creativeRichExcerpt(value, fallback = "") {
    const text = creativeRichText(value).replace(/\s+/g, " ").trim();
    if (!text) {
      return fallback;
    }
    return text.length > 220 ? `${text.slice(0, 217)}...` : text;
  }

  function creativeStoryWordCount(item, workspace) {
    const values = [
      item.title,
      item.storyDescription,
      item.idea,
      item.synopsis,
      item.mood,
      item.characters,
      item.world,
      item.outline,
      item.scenes,
      item.content,
      ...workspace.freeCards.flatMap((card) => [card.title, card.body]),
      ...workspace.views.flatMap((view) => view.pages.flatMap((page) => page.cards.flatMap((card) => [card.title, card.description]))),
      ...workspace.loosePages.flatMap((page) => [page.title, page.body]),
    ];
    return creativeWordCount(values.map(creativeRichText).join(" "));
  }

  function renderCreativeProjectBlocks(item) {
    const blocks = ensureCreativeProjectBlocks(item);
    const height = creativeProjectBlockBoardHeight(blocks);
    return `
      <section class="creative-tool-card creative-project-blocks">
        <div class="creative-tool-card-head creative-project-blocks-head">
          <div>
            <h3>Campos do projeto</h3>
            <span>Escolha o tipo, depois arraste pelo topo e redimensione pelo canto.</span>
          </div>
          <div class="creative-project-block-add">
            <select data-creative-project-block-kind aria-label="Tipo de campo">
              ${CREATIVE_PROJECT_BLOCK_ORDER.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(creativeProjectBlockTypeConfig(type).label)}</option>`).join("")}
            </select>
            <button class="button secondary compact-button" type="button" data-creative-action="project-add-block" data-creative-id="${escapeHtml(item.id)}">
              ${svgIcon("icon-plus")}
              <span>Campo</span>
            </button>
          </div>
        </div>
        <div class="creative-project-block-board ${blocks.length ? "" : "is-empty"}" data-creative-project-block-board style="min-height:${height}px">
          ${blocks.length ? blocks.map((block) => renderCreativeProjectBlock(item, block)).join("") : `
            <div class="creative-story-empty">Adicione texto, visualizacoes, subpaginas, imagens, lousa ou codigo neste projeto.</div>
          `}
        </div>
      </section>
      ${renderCreativeProjectEditorOverlay(item)}
    `;
  }

  function renderCreativeProjectBlock(item, block) {
    const config = creativeProjectBlockTypeConfig(block.type);
    return `
      <article class="creative-project-block" data-project-block-id="${escapeHtml(block.id)}" data-project-block-type="${escapeHtml(block.type)}" style="--project-block-x:${block.x}; --project-block-y:${block.y}; --project-block-w:${block.w}; --project-block-h:${block.h};">
        <div class="creative-project-block-head" data-creative-project-layout="move" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" title="Arraste para mover">
          <span class="creative-card-icon">${svgIcon(config.icon)}</span>
          <div>
            <strong>${escapeHtml(block.title || config.defaultTitle)}</strong>
            <small>${escapeHtml(config.label)}</small>
          </div>
          <div class="creative-project-block-actions">
            <button class="icon-button" type="button" data-creative-action="project-open-block" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" aria-label="Editar ${escapeHtml(block.title || config.defaultTitle)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-creative-action="project-delete-block" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" aria-label="Excluir ${escapeHtml(block.title || config.defaultTitle)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
        <div class="creative-project-block-main">
          ${renderCreativeProjectBlockContent(item, block)}
        </div>
        <button class="creative-project-block-resize" type="button" data-creative-project-layout="resize" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" aria-label="Redimensionar ${escapeHtml(block.title || config.defaultTitle)}" title="Arraste para redimensionar">
          <span>Redimensionar</span>
        </button>
      </article>
    `;
  }

  function renderCreativeProjectBlockContent(item, block) {
    if (block.type === "views") {
      return renderCreativeProjectViewsBlock(item, block);
    }
    if (block.type === "subpages") {
      return renderCreativeProjectSubpagesBlock(item, block);
    }
    if (block.type === "image") {
      return renderCreativeProjectImagesBlock(item, block);
    }
    if (block.type === "whiteboard") {
      return renderCreativeWhiteboard(item, { scope: "block", block, title: block.title || "Lousa" });
    }
    if (block.type === "code") {
      return `
        <button class="creative-project-preview-button" type="button" data-creative-action="project-open-block" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}">
          <strong>${escapeHtml(block.title || "Codigo")}</strong>
          <span>${escapeHtml(block.code ? block.code.slice(0, 260) : "Abra para escrever um trecho de codigo, pseudocodigo ou teste.")}</span>
        </button>
      `;
    }
    return `
      <button class="creative-project-preview-button" type="button" data-creative-action="project-open-block" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}">
        <strong>${escapeHtml(block.title || "Texto livre")}</strong>
        <span>${escapeHtml(creativeRichExcerpt(block.body, "Abra para escrever livremente."))}</span>
      </button>
    `;
  }

  function renderCreativeProjectViewsBlock(item, block) {
    const views = block.views?.length ? block.views : [createCreativeStoryView("Visualizacao 1")];
    block.views = views;
    return `
      <div class="creative-project-views">
        <div class="creative-project-mini-actions">
          <button class="button secondary compact-button" type="button" data-creative-action="project-add-view" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}">
            ${svgIcon("icon-plus")}
            <span>Visualizacao</span>
          </button>
        </div>
        ${views.map((view) => renderCreativeProjectView(item, block, view)).join("")}
      </div>
    `;
  }

  function renderCreativeProjectView(item, block, view) {
    const activePage = activeCreativeStoryPage(view);
    return `
      <article class="creative-project-view-panel">
        <div class="creative-story-view-head">
          <input data-creative-project-field="viewTitle" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" value="${escapeHtml(view.title)}" aria-label="Nome da visualizacao">
          <button class="icon-button" type="button" data-creative-action="project-add-page" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" aria-label="Adicionar pagina em ${escapeHtml(view.title)}" title="Adicionar pagina">
            ${svgIcon("icon-plus")}
          </button>
        </div>
        <div class="creative-story-page-tabs" role="tablist" aria-label="Paginas de ${escapeHtml(view.title)}">
          ${view.pages.map((page) => `
            <button class="creative-story-page-tab${page.id === view.activePageId ? " active" : ""}" type="button" data-creative-action="project-select-page" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" data-project-page-id="${escapeHtml(page.id)}">
              ${escapeHtml(page.title || "Sem titulo")}
            </button>
          `).join("")}
          <button class="creative-story-page-tab add" type="button" data-creative-action="project-add-page" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}">
            ${svgIcon("icon-plus")}
            <span>Pagina</span>
          </button>
        </div>
        <div class="creative-story-page-title">
          <input data-creative-project-field="pageTitle" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" data-project-page-id="${escapeHtml(activePage?.id || "")}" value="${escapeHtml(activePage?.title || "Sem pagina")}" aria-label="Titulo da pagina aberta">
        </div>
        <div class="creative-story-card-grid compact">
          ${activePage?.cards.length ? activePage.cards.map((card) => renderCreativeProjectViewCard(item, block, view, activePage, card)).join("") : `
            <div class="creative-story-empty">Nenhum quadro nesta pagina.</div>
          `}
          <button class="creative-story-add-card" type="button" data-creative-action="project-add-card" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" data-project-page-id="${escapeHtml(activePage?.id || "")}">
            ${svgIcon("icon-plus")}
            <span>Quadro</span>
          </button>
        </div>
      </article>
    `;
  }

  function renderCreativeProjectViewCard(item, block, view, page, card) {
    return `
      <button class="creative-story-card" type="button" data-creative-action="project-open-card" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-view-id="${escapeHtml(view.id)}" data-project-page-id="${escapeHtml(page.id)}" data-project-card-id="${escapeHtml(card.id)}">
        <p>${escapeHtml(creativeRichExcerpt(card.description, "Sem descricao"))}</p>
        <strong>${escapeHtml(card.title || "Sem titulo")}</strong>
      </button>
    `;
  }

  function renderCreativeProjectSubpagesBlock(item, block) {
    return `
      <div class="creative-story-loose-list">
        ${block.loosePages.length ? block.loosePages.map((page) => `
          <button class="creative-story-loose-row" type="button" data-creative-action="project-open-subpage" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-subpage-id="${escapeHtml(page.id)}">
            ${svgIcon("icon-edit")}
            <span>${escapeHtml(page.title || "Sem titulo")}</span>
            <small>${escapeHtml(creativeRichExcerpt(page.body, "Sem texto"))}</small>
          </button>
        `).join("") : `<div class="creative-story-empty">Nenhuma subpagina ainda.</div>`}
        <button class="creative-story-add-card compact" type="button" data-creative-action="project-add-subpage" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}">
          ${svgIcon("icon-plus")}
          <span>Subpagina</span>
        </button>
      </div>
    `;
  }

  function renderCreativeProjectImagesBlock(item, block) {
    return `
      <div class="creative-project-images" data-project-block-id="${escapeHtml(block.id)}" data-project-block-type="image">
        <input data-creative-project-image-input data-project-block-id="${escapeHtml(block.id)}" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
        <button class="creative-project-image-drop" type="button" data-creative-action="project-add-image" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}">
          ${svgIcon("icon-image")}
          <span>Clique ou cole Ctrl+V aqui</span>
        </button>
        <div class="creative-project-image-grid">
          ${block.images.length ? block.images.map((image) => `
            <figure>
              <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "Imagem")}">
              <button class="icon-button" type="button" data-creative-action="project-delete-image" data-creative-id="${escapeHtml(item.id)}" data-project-block-id="${escapeHtml(block.id)}" data-project-image-id="${escapeHtml(image.id)}" aria-label="Excluir imagem" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </figure>
          `).join("") : `<div class="creative-story-empty">Nenhuma imagem anexada.</div>`}
        </div>
      </div>
    `;
  }

  function renderCreativeProjectEditorOverlay(item) {
    const openBlock = findCreativeProjectBlock(item, item.projectOpenBlockId);
    if (openBlock) {
      return renderCreativeProjectBlockEditor(item, openBlock);
    }
    const cardContext = findCreativeProjectCard(item, item.projectOpenCardId);
    if (cardContext) {
      return renderCreativeProjectCardEditor(item, cardContext);
    }
    const looseContext = findCreativeProjectLoosePage(item, item.projectOpenSubpageId);
    if (looseContext) {
      return renderCreativeProjectLooseEditor(item, looseContext);
    }
    return "";
  }

  function renderCreativeProjectBlockEditor(item, block) {
    const config = creativeProjectBlockTypeConfig(block.type);
    const attrs = `data-project-block-id="${escapeHtml(block.id)}"`;
    const body = block.type === "code"
      ? `
        <label class="field creative-code-editor">
          <span>Codigo</span>
          <textarea data-creative-project-field="blockCode" ${attrs} rows="18" maxlength="40000" spellcheck="false" placeholder="Cole codigo, pseudocodigo ou anotacoes tecnicas.">${escapeHtml(block.code || "")}</textarea>
        </label>
      `
      : block.type === "image"
        ? renderCreativeProjectImagesBlock(item, block)
        : block.type === "whiteboard"
          ? renderCreativeWhiteboard(item, { scope: "block", block, title: block.title || "Lousa" })
          : creativeProjectRichField("Conteudo", "blockBody", block.body, "Escreva livremente.", attrs, "tall");
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar campo"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(block.title || config.defaultTitle)}">
          <div class="creative-story-editor-head">
            <div>
              <span>${escapeHtml(config.label)}</span>
              <input data-creative-project-field="blockTitle" ${attrs} value="${escapeHtml(block.title || "")}" placeholder="${escapeHtml(config.defaultTitle)}" aria-label="Titulo do campo">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="project-delete-block" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir campo" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar campo" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${body}
          </div>
        </div>
      </div>
    `;
  }

  function renderCreativeProjectCardEditor(item, context) {
    const attrs = `data-project-block-id="${escapeHtml(context.block.id)}" data-project-view-id="${escapeHtml(context.view.id)}" data-project-page-id="${escapeHtml(context.page.id)}" data-project-card-id="${escapeHtml(context.card.id)}"`;
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar quadro"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(context.card.title || "Quadro")}">
          <div class="creative-story-editor-head">
            <div>
              <span>${escapeHtml(context.block.title || "Visualizacao")} / ${escapeHtml(context.page.title || "Pagina")}</span>
              <input data-creative-project-field="cardTitle" ${attrs} value="${escapeHtml(context.card.title)}" placeholder="Titulo do quadro" aria-label="Titulo do quadro">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="project-delete-card" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir quadro" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar quadro" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${creativeProjectRichField("Descricao", "cardDescription", context.card.description, "Detalhe o quadro, referencias, checklist ou observacoes.", attrs, "tall")}
          </div>
        </div>
      </div>
    `;
  }

  function renderCreativeProjectLooseEditor(item, context) {
    const attrs = `data-project-block-id="${escapeHtml(context.block.id)}" data-project-subpage-id="${escapeHtml(context.page.id)}"`;
    return `
      <div class="creative-story-editor-overlay" role="presentation">
        <button class="creative-story-editor-backdrop" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar subpagina"></button>
        <div class="creative-story-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(context.page.title || "Subpagina")}">
          <div class="creative-story-editor-head">
            <div>
              <span>${escapeHtml(context.block.title || "Subpaginas")}</span>
              <input data-creative-project-field="looseTitle" ${attrs} value="${escapeHtml(context.page.title)}" placeholder="Titulo opcional" aria-label="Titulo da subpagina">
            </div>
            <div class="creative-detail-actions">
              <button class="icon-button" type="button" data-creative-action="project-delete-subpage" data-creative-id="${escapeHtml(item.id)}" ${attrs} aria-label="Excluir subpagina" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
              <button class="icon-button" type="button" data-creative-action="project-close-editor" data-creative-id="${escapeHtml(item.id)}" aria-label="Fechar subpagina" title="Fechar">
                ${svgIcon("icon-close")}
              </button>
            </div>
          </div>
          <div class="creative-story-editor-body">
            ${creativeProjectRichField("Texto livre", "looseBody", context.page.body, "Escreva qualquer coisa desta subpagina.", attrs, "tall")}
          </div>
        </div>
      </div>
    `;
  }

  function creativeProjectRichField(label, projectField, value, placeholder, dataAttrs, className = "") {
    return `
      <div class="creative-rich-field ${escapeHtml(className)}">
        <div class="creative-rich-head">
          <span>${escapeHtml(label)}</span>
        </div>
        ${creativeRichToolbar()}
        <div class="creative-rich-editor" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true" data-creative-rich-field="true" data-creative-project-field="${escapeHtml(projectField)}" ${dataAttrs} data-placeholder="${escapeHtml(placeholder)}">${normalizeCreativeRichHtml(value)}</div>
      </div>
    `;
  }

  function createCreativeProjectBlock(type = "text", title = "", layout = {}) {
    const normalizedType = normalizeCreativeProjectBlockType(type);
    const config = creativeProjectBlockTypeConfig(normalizedType);
    return {
      id: createId("project-block"),
      type: normalizedType,
      title: normalizeCreativeText(title || config.defaultTitle, 100),
      body: "",
      code: "",
      images: [],
      assets: [],
      sketchData: "",
      views: normalizedType === "views" ? [createCreativeStoryView("Visualizacao 1")] : [],
      loosePages: [],
      x: clampNumber(layout.x ?? 0, 0, CREATIVE_PROJECT_BLOCK_COLUMNS - 1),
      y: Math.max(0, Math.round(Number(layout.y) || 0)),
      w: clampNumber(layout.w ?? defaultCreativeProjectBlockSize(normalizedType).w, 2, CREATIVE_PROJECT_BLOCK_COLUMNS),
      h: clampNumber(layout.h ?? defaultCreativeProjectBlockSize(normalizedType).h, 1, 10),
    };
  }

  function defaultCreativeProjectBlockSize(type) {
    if (type === "views" || type === "whiteboard") {
      return { w: 12, h: 4 };
    }
    if (type === "subpages" || type === "image" || type === "code") {
      return { w: 6, h: 3 };
    }
    return { w: 4, h: 2 };
  }

  function ensureCreativeProjectBlocks(item) {
    item.projectBlocks = normalizeCreativeProjectBlocks(item.projectBlocks || []);
    item.projectOpenBlockId = normalizeCreativeText(item.projectOpenBlockId || "", 120);
    item.projectOpenCardId = normalizeCreativeText(item.projectOpenCardId || "", 120);
    item.projectOpenSubpageId = normalizeCreativeText(item.projectOpenSubpageId || "", 120);
    return item.projectBlocks;
  }

  function normalizeCreativeProjectBlocks(blocks) {
    if (!Array.isArray(blocks)) {
      return [];
    }
    return blocks.map((block, index) => normalizeCreativeProjectBlock(block, index)).filter(Boolean);
  }

  function normalizeCreativeProjectBlock(block, index = 0) {
    if (!block || typeof block !== "object") {
      return null;
    }
    const type = normalizeCreativeProjectBlockType(block.type || block.kind || block.mode);
    const defaults = defaultCreativeProjectBlockSize(type);
    const width = clampNumber(block.w || block.width || defaults.w, 2, CREATIVE_PROJECT_BLOCK_COLUMNS);
    const x = clampNumber(block.x ?? block.column ?? ((index % 2) * 6), 0, CREATIVE_PROJECT_BLOCK_COLUMNS - width);
    const rawViews = Array.isArray(block.views) ? block.views : [];
    return {
      id: normalizeCreativeText(block.id, 120) || createId("project-block"),
      type,
      title: normalizeCreativeText(block.title || block.name || creativeProjectBlockTypeConfig(type).defaultTitle, 100),
      body: normalizeCreativeRichHtml(block.body || block.description || block.content || block.text || "", CREATIVE_RICH_CONTENT_LIMIT),
      code: normalizeCreativeText(block.code || block.snippet || "", 40000),
      images: normalizeCreativeProjectImages(block.images || block.imageList || block.image_list || []),
      assets: normalizeCreativeWhiteboardAssets(block.assets || block.whiteboardAssets || block.whiteboard_assets || []),
      sketchData: normalizeCreativeImageSource(block.sketchData || block.sketch_data || "", CREATIVE_RICH_CONTENT_LIMIT),
      views: rawViews.map((view, viewIndex) => normalizeCreativeStoryView(view, viewIndex)).filter(Boolean),
      loosePages: (Array.isArray(block.loosePages) ? block.loosePages : Array.isArray(block.subpages) ? block.subpages : [])
        .map((page, pageIndex) => normalizeCreativeStoryLoosePage(page, pageIndex))
        .filter(Boolean),
      x,
      y: Math.max(0, Math.round(Number(block.y ?? block.row ?? Math.floor(index / 2) * defaults.h) || 0)),
      w: width,
      h: clampNumber(block.h || block.height || defaults.h, 1, 10),
    };
  }

  function normalizeCreativeProjectBlockType(value) {
    const key = String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const legacyMap = {
      note: "text",
      notes: "text",
      texto: "text",
      livre: "text",
      visualizacao: "views",
      visualizacoes: "views",
      view: "views",
      views: "views",
      paginas: "subpages",
      subpagina: "subpages",
      subpaginas: "subpages",
      page: "subpages",
      pages: "subpages",
      imagem: "image",
      imagens: "image",
      foto: "image",
      fotos: "image",
      board: "whiteboard",
      lousa: "whiteboard",
      canvas: "whiteboard",
      mapa: "whiteboard",
      codigo: "code",
      code: "code",
      programacao: "code",
    };
    return legacyMap[key] || (Object.prototype.hasOwnProperty.call(CREATIVE_PROJECT_BLOCK_TYPES, key) ? key : "text");
  }

  function creativeProjectBlockTypeConfig(type) {
    return CREATIVE_PROJECT_BLOCK_TYPES[normalizeCreativeProjectBlockType(type)] || CREATIVE_PROJECT_BLOCK_TYPES.text;
  }

  function creativeProjectBlockBoardHeight(blocks) {
    const rows = Math.max(4, ...blocks.map((block) => Number(block.y || 0) + Number(block.h || 2)));
    return rows * CREATIVE_PROJECT_BLOCK_ROW_HEIGHT + 12;
  }

  function nextCreativeProjectBlockLayout(blocks = [], type = "text") {
    const size = defaultCreativeProjectBlockSize(normalizeCreativeProjectBlockType(type));
    const y = blocks.length ? Math.max(...blocks.map((block) => Number(block.y || 0) + Number(block.h || 2))) : 0;
    return { x: 0, y, w: size.w, h: size.h };
  }

  function findCreativeProjectBlock(item, blockId) {
    return blockId ? ensureCreativeProjectBlocks(item).find((block) => block.id === blockId) || null : null;
  }

  function findCreativeProjectCard(item, cardId) {
    if (!cardId) {
      return null;
    }
    for (const block of ensureCreativeProjectBlocks(item)) {
      for (const view of block.views || []) {
        for (const page of view.pages || []) {
          const card = page.cards.find((candidate) => candidate.id === cardId);
          if (card) {
            return { block, view, page, card };
          }
        }
      }
    }
    return null;
  }

  function findCreativeProjectLoosePage(item, pageId) {
    if (!pageId) {
      return null;
    }
    for (const block of ensureCreativeProjectBlocks(item)) {
      const page = block.loosePages.find((candidate) => candidate.id === pageId);
      if (page) {
        return { block, page };
      }
    }
    return null;
  }

  function normalizeCreativeProjectImages(images) {
    if (!Array.isArray(images)) {
      return [];
    }
    return images.map((image, index) => normalizeCreativeProjectImage(image, index)).filter(Boolean).slice(0, 48);
  }

  function normalizeCreativeProjectImage(image, index = 0) {
    if (!image) {
      return null;
    }
    const source = typeof image === "string" ? image : image.src || image.url || image.dataUrl || image.data_url || "";
    const src = normalizeCreativeImageSource(source, CREATIVE_RICH_CONTENT_LIMIT);
    if (!src) {
      return null;
    }
    return {
      id: normalizeCreativeText(typeof image === "object" ? image.id : "", 120) || createId("project-image"),
      src,
      alt: normalizeCreativeText(typeof image === "object" ? image.alt || image.name || `Imagem ${index + 1}` : `Imagem ${index + 1}`, 120),
      createdAt: typeof image === "object" ? image.createdAt || image.created_at || new Date().toISOString() : new Date().toISOString(),
    };
  }

  function createCreativeProjectImage(src, alt = "Imagem") {
    return {
      id: createId("project-image"),
      src: normalizeCreativeImageSource(src, CREATIVE_RICH_CONTENT_LIMIT),
      alt: normalizeCreativeText(alt || "Imagem", 120),
      createdAt: new Date().toISOString(),
    };
  }

  function normalizeCreativeImageSource(value, limit = CREATIVE_RICH_CONTENT_LIMIT) {
    const source = normalizeCreativeText(value, limit).trim();
    if (/^(https?:\/\/|file:\/\/|data:image\/(?:png|jpe?g|webp|gif);base64,)/i.test(source)) {
      return source;
    }
    return "";
  }

  function renderCreativeWhiteboard(item, options = {}) {
    const scope = options.scope === "block" ? "block" : "item";
    const block = options.block || null;
    const target = scope === "block" ? block : item;
    const title = options.title || "Lousa";
    const assets = normalizeCreativeWhiteboardAssets(target?.assets || target?.whiteboardAssets || []);
    if (scope === "block" && block) {
      block.assets = assets;
    } else if (item) {
      item.whiteboardAssets = assets;
    }
    const attrs = scope === "block"
      ? `data-whiteboard-scope="block" data-project-block-id="${escapeHtml(block?.id || "")}"`
      : `data-whiteboard-scope="item"`;
    return `
      <div class="creative-whiteboard" data-creative-whiteboard ${attrs} tabindex="0" aria-label="${escapeHtml(title)}">
        <canvas class="creative-sketch-canvas" width="900" height="420" data-creative-canvas></canvas>
        <div class="creative-whiteboard-assets" aria-label="Imagens anexadas na lousa">
          ${assets.map((asset) => renderCreativeWhiteboardAsset(asset)).join("")}
        </div>
        <div class="creative-whiteboard-toolbar">
          <input data-creative-whiteboard-image-input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
          <button class="button secondary compact-button" type="button" data-creative-action="add-whiteboard-image" data-creative-id="${escapeHtml(item.id)}">
            ${svgIcon("icon-image")}
            <span>Imagem</span>
          </button>
          <button class="button secondary compact-button" type="button" data-creative-action="clear-canvas" data-creative-id="${escapeHtml(item.id)}">Limpar lousa</button>
        </div>
      </div>
    `;
  }

  function renderCreativeWhiteboardAsset(asset) {
    return `
      <div class="creative-whiteboard-asset" data-whiteboard-asset-id="${escapeHtml(asset.id)}" data-creative-whiteboard-asset-layout="move" style="--whiteboard-asset-x:${asset.x}; --whiteboard-asset-y:${asset.y}; --whiteboard-asset-w:${asset.w}; --whiteboard-asset-h:${asset.h};" title="Arraste para mover">
        <img src="${escapeHtml(asset.src)}" alt="${escapeHtml(asset.alt || "Imagem")}">
        <button class="creative-whiteboard-asset-resize" type="button" data-creative-whiteboard-asset-layout="resize" data-whiteboard-asset-id="${escapeHtml(asset.id)}" aria-label="Redimensionar imagem" title="Redimensionar">
          <span>Redimensionar</span>
        </button>
      </div>
    `;
  }

  function normalizeCreativeWhiteboardAssets(assets) {
    if (!Array.isArray(assets)) {
      return [];
    }
    return assets.map((asset, index) => normalizeCreativeWhiteboardAsset(asset, index)).filter(Boolean).slice(0, 32);
  }

  function normalizeCreativeWhiteboardAsset(asset, index = 0) {
    if (!asset) {
      return null;
    }
    const source = typeof asset === "string" ? asset : asset.src || asset.url || asset.dataUrl || asset.data_url || "";
    const src = normalizeCreativeImageSource(source, CREATIVE_RICH_CONTENT_LIMIT);
    if (!src) {
      return null;
    }
    return {
      id: normalizeCreativeText(typeof asset === "object" ? asset.id : "", 120) || createId("whiteboard-asset"),
      src,
      alt: normalizeCreativeText(typeof asset === "object" ? asset.alt || asset.name || `Imagem ${index + 1}` : `Imagem ${index + 1}`, 120),
      x: clampNumber(typeof asset === "object" ? asset.x ?? asset.left ?? 8 + (index % 4) * 6 : 8 + (index % 4) * 6, 0, 96),
      y: clampNumber(typeof asset === "object" ? asset.y ?? asset.top ?? 8 + (index % 3) * 8 : 8 + (index % 3) * 8, 0, 96),
      w: clampNumber(typeof asset === "object" ? asset.w ?? asset.width ?? 28 : 28, 6, 100),
      h: clampNumber(typeof asset === "object" ? asset.h ?? asset.height ?? 28 : 28, 6, 100),
    };
  }

  function createCreativeWhiteboardAsset(src, alt = "Imagem", layout = {}) {
    return normalizeCreativeWhiteboardAsset({
      id: createId("whiteboard-asset"),
      src,
      alt,
      x: layout.x ?? 8,
      y: layout.y ?? 8,
      w: layout.w ?? 28,
      h: layout.h ?? 28,
    });
  }

  function creativeWhiteboardTargetForElement(item, whiteboard) {
    if (!item || !whiteboard) {
      return null;
    }
    if (whiteboard.dataset.whiteboardScope === "block") {
      const block = findCreativeProjectBlock(item, whiteboard.dataset.projectBlockId);
      if (!block) {
        return null;
      }
      block.assets = normalizeCreativeWhiteboardAssets(block.assets || []);
      return {
        target: block,
        getSketch: () => block.sketchData || "",
        setSketch: (value) => { block.sketchData = normalizeCreativeImageSource(value, CREATIVE_RICH_CONTENT_LIMIT); },
        getAssets: () => block.assets,
        setAssets: (assets) => { block.assets = normalizeCreativeWhiteboardAssets(assets); },
      };
    }
    item.whiteboardAssets = normalizeCreativeWhiteboardAssets(item.whiteboardAssets || []);
    return {
      target: item,
      getSketch: () => item.sketchData || "",
      setSketch: (value) => { item.sketchData = normalizeCreativeImageSource(value, CREATIVE_RICH_CONTENT_LIMIT); },
      getAssets: () => item.whiteboardAssets,
      setAssets: (assets) => { item.whiteboardAssets = normalizeCreativeWhiteboardAssets(assets); },
    };
  }

  function renderCreativeDashboardWorkspace(item) {
    return `
      <div class="creative-visual-layout">
        <section class="creative-tool-card">
          <div class="creative-tool-card-head">
            <h3>Arquivo / fonte</h3>
            <span>PBIX, SQL, CSV, Excel, RDL ou link</span>
          </div>
          <label class="field creative-live-field">
            <span>Link, arquivo ou pasta</span>
            <input data-creative-live-field="link" type="text" value="${escapeHtml(item.link)}" placeholder="Power BI, SQL, pasta, planilha, relatorio...">
          </label>
          <label class="field">
            <span>Registrar arquivo local</span>
            <input data-creative-file-import="dashboard" type="file" accept=".pbix,.pbit,.xlsx,.csv,.sql,.rdl,.pdf">
          </label>
          <div class="creative-asset-box">
            ${svgIcon("icon-chart")}
            <span>${escapeHtml(item.link || "Nenhum arquivo ou link informado")}</span>
          </div>
        </section>
        <section class="creative-tool-card">
          <h3>Pergunta de negocio</h3>
          <textarea data-creative-live-field="dashboardBrief" rows="10" maxlength="12000" placeholder="Quem vai usar, qual decisao precisa tomar, frequencia, contexto e recorte.">${escapeHtml(item.dashboardBrief || item.content)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Base e modelo</h3>
          <textarea data-creative-live-field="dashboardDataset" rows="10" maxlength="12000" placeholder="Fontes, tabelas fato/dimensao, grao, relacionamentos, calendario, filtros e qualidade dos dados.">${escapeHtml(item.dashboardDataset || item.reference)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Metricas e KPIs</h3>
          <textarea data-creative-live-field="dashboardMetrics" rows="10" maxlength="12000" placeholder="Medidas, metas, alertas, calculos DAX, regras de negocio e limites.">${escapeHtml(item.dashboardMetrics)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Layout e visuais</h3>
          <textarea data-creative-live-field="dashboardVisuals" rows="10" maxlength="12000" placeholder="Cards, barras, linhas, mapas, tabelas, filtros, drill-through, leitura mobile e tela principal.">${escapeHtml(item.dashboardVisuals)}</textarea>
        </section>
        <section class="creative-tool-card creative-writing-desk">
          <div class="creative-tool-card-head">
            <h3>SQL / DAX / Power Query</h3>
            <span>Consultas e medidas</span>
          </div>
          <textarea data-creative-live-field="dashboardSql" rows="14" maxlength="12000" spellcheck="false" placeholder="Cole SQL, DAX, M/Power Query ou pseudo-consulta.">${escapeHtml(item.dashboardSql || item.code)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Checklist de validacao</h3>
          <textarea data-creative-live-field="dashboardChecklist" rows="10" maxlength="12000" placeholder="Conferir total com fonte, periodo, filtros, duplicados, nulos, grao, performance, responsividade e permissao.">${escapeHtml(item.dashboardChecklist)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Insights e proximas perguntas</h3>
          <textarea data-creative-live-field="dashboardInsights" rows="10" maxlength="12000" placeholder="Achados, anomalias, hipoteses, perguntas abertas e decisoes possiveis.">${escapeHtml(item.dashboardInsights || item.output)}</textarea>
        </section>
        <section class="creative-tool-card creative-canvas-card">
          <div class="creative-tool-card-head">
            <h3>Rascunho do painel</h3>
            <span>Desenhe, cole imagens e reposicione referencias.</span>
          </div>
          ${renderCreativeWhiteboard(item, { scope: "item", title: "Rascunho do painel" })}
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.dashboardBrief} ${item.dashboardDataset} ${item.dashboardMetrics} ${item.dashboardVisuals} ${item.dashboardChecklist} ${item.dashboardInsights}`)} palavras de planejamento</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativePlaylistWorkspace(item) {
    const categories = creativePlaylistCategories(item);
    const playlistState = parseCreativePlaylistState(item);
    const activePlaylist = playlistState.playlists.find((playlist) => playlist.id === playlistState.activeId) || null;
    const selectedGenre = activePlaylist?.genre || categories[0] || "Geral";
    const editorTracks = activePlaylist?.tracks?.length
      ? activePlaylist.tracks.join("\n")
      : String(item.playlistTracks || item.content || "");

    return `
      <div class="creative-playlist-layout">
        <section class="creative-tool-card playlist-category-panel">
          <div class="creative-tool-card-head">
            <h3>Categorias de genero</h3>
            <span>${categories.length} ${categories.length === 1 ? "categoria" : "categorias"}</span>
          </div>
          <textarea data-creative-live-field="playlistGenres" rows="8" maxlength="12000" placeholder="Uma categoria por linha. Ex.: Rock, Eletronica, Lo-fi, Funk, Treino, Foco.">${escapeHtml(item.playlistGenres || item.tags)}</textarea>
          <div class="playlist-category-list" aria-label="Categorias cadastradas">
            ${categories.map((category) => `<span>${escapeHtml(category)}</span>`).join("")}
          </div>
        </section>
        <section class="creative-tool-card playlist-creator-card">
          <div class="creative-tool-card-head">
            <h3>Nova playlist</h3>
            <button class="button secondary compact-button" type="button" data-creative-action="new-playlist-draft" data-creative-id="${escapeHtml(item.id)}">Nova playlist</button>
          </div>
          <input data-playlist-editor-id type="hidden" value="${escapeHtml(activePlaylist?.id || "")}">
          <div class="playlist-creator-form">
            <label class="field">
              <span>Genero</span>
              <select data-playlist-editor-field="genre">
                ${creativePlaylistCategoryOptions(categories, selectedGenre)}
              </select>
            </label>
            <label class="field">
              <span>Nome</span>
              <input data-playlist-editor-field="name" type="text" maxlength="120" value="${escapeHtml(activePlaylist?.name || "")}" placeholder="Ex.: Treino pesado, noite calma, foco">
            </label>
            <label class="field span-2">
              <span>Descricao / estilo</span>
              <textarea data-playlist-editor-field="style" rows="4" maxlength="2000" placeholder="Descreva o estilo, energia, ocasiao, transicoes ou regra principal.">${escapeHtml(activePlaylist?.style || item.playlistRules || "")}</textarea>
            </label>
            <label class="field span-2">
              <span>Lista de musicas</span>
              <textarea data-playlist-editor-field="tracks" rows="14" maxlength="20000" placeholder="Uma por linha: artista - musica. Pode adicionar observacao depois do nome.">${escapeHtml(editorTracks)}</textarea>
            </label>
          </div>
          <div class="playlist-editor-actions">
            <button class="button primary" type="button" data-creative-action="save-playlist" data-creative-id="${escapeHtml(item.id)}">
              ${svgIcon("icon-plus")}
              <span>Salvar playlist</span>
            </button>
          </div>
        </section>
        <section class="creative-tool-card playlist-ready-panel">
          <div class="creative-tool-card-head">
            <h3>Playlists prontas</h3>
            <span>${playlistState.playlists.length} ${playlistState.playlists.length === 1 ? "salva" : "salvas"}</span>
          </div>
          <div class="playlist-ready-list">
            ${playlistState.playlists.length
              ? playlistState.playlists.map((playlist) => renderCreativeReadyPlaylist(playlist, playlist.id === playlistState.activeId)).join("")
              : `<div class="playlist-empty-state">Nenhuma playlist salva ainda. Preencha o formulario e salve a primeira.</div>`}
          </div>
        </section>
        <section class="creative-tool-card playlist-notes-panel">
          <h3>Opcoes e referencias</h3>
          <textarea data-creative-live-field="playlistNotes" rows="8" maxlength="12000" placeholder="Links de playlists, artistas, albuns, radios, observacoes para expandir depois.">${escapeHtml(item.playlistNotes || item.reference)}</textarea>
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativePlaylistTrackCount(playlistState.playlists)} musicas em playlists prontas</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function creativePlaylistCategoryOptions(categories, selectedGenre) {
    const selectedKey = creativePlaylistSlug(selectedGenre);
    return categories.map((category) => {
      const selected = creativePlaylistSlug(category) === selectedKey;
      return `<option value="${escapeHtml(category)}"${selected ? " selected" : ""}>${escapeHtml(category)}</option>`;
    }).join("");
  }

  function renderCreativeReadyPlaylist(playlist, expanded) {
    const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
    return `
      <article class="playlist-ready-card ${expanded ? "is-expanded" : ""}">
        <div class="playlist-ready-head">
          <div>
            <strong>${escapeHtml(playlist.name || "Playlist sem nome")}</strong>
            <span>${escapeHtml(playlist.genre || "Geral")} - ${tracks.length} ${tracks.length === 1 ? "musica" : "musicas"}</span>
          </div>
          <div class="row-actions">
            <button class="button ${expanded ? "primary" : "secondary"} compact-button" type="button" data-creative-action="select-playlist" data-playlist-id="${escapeHtml(playlist.id)}">
              ${expanded ? "Aberta" : "Ampliar"}
            </button>
            <button class="icon-button" type="button" data-creative-action="delete-playlist" data-playlist-id="${escapeHtml(playlist.id)}" aria-label="Excluir playlist ${escapeHtml(playlist.name)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
        ${playlist.style ? `<p>${escapeHtml(playlist.style)}</p>` : ""}
        ${expanded ? `
          <ol class="playlist-ready-tracks">
            ${tracks.length
              ? tracks.map((track) => `<li>${escapeHtml(track)}</li>`).join("")
              : `<li>Nenhuma musica cadastrada.</li>`}
          </ol>
        ` : ""}
      </article>
    `;
  }

  function parseCreativePlaylistState(item) {
    const raw = String(item?.playlistCollections || "").trim();
    const fallbackGenre = creativePlaylistCategories(item)[0] || "Geral";
    if (!raw) {
      return { playlists: [], activeId: "" };
    }

    if (raw.startsWith("{") || raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        const sourcePlaylists = Array.isArray(parsed) ? parsed : parsed.playlists;
        const explicitActiveId = !Array.isArray(parsed) && (Object.prototype.hasOwnProperty.call(parsed, "activeId") || Object.prototype.hasOwnProperty.call(parsed, "active_id"));
        const playlists = Array.isArray(sourcePlaylists)
          ? sourcePlaylists.map((playlist, index) => normalizeCreativePlaylistEntry(playlist, index, fallbackGenre)).filter(Boolean)
          : [];
        const parsedActiveId = String(parsed.activeId || parsed.active_id || "").trim();
        return {
          playlists,
          activeId: explicitActiveId ? parsedActiveId : parsedActiveId || playlists[0]?.id || "",
        };
      } catch (error) {
        return parseLegacyCreativePlaylists(raw, fallbackGenre);
      }
    }

    return parseLegacyCreativePlaylists(raw, fallbackGenre);
  }

  function parseLegacyCreativePlaylists(raw, fallbackGenre) {
    const lines = String(raw || "").split(/\r?\n/);
    const playlists = [];
    let current = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      const heading = trimmed.match(/^\[([^\]]+)\]$/);
      if (heading) {
        if (current) {
          playlists.push(current);
        }
        current = {
          id: `playlist-${playlists.length}-${creativePlaylistSlug(heading[1]) || "lista"}`,
          name: heading[1].trim(),
          genre: fallbackGenre,
          style: "",
          tracks: [],
        };
        return;
      }
      if (!current) {
        current = {
          id: "playlist-0-lista-salva",
          name: "Lista salva",
          genre: fallbackGenre,
          style: "",
          tracks: [],
        };
      }
      current.tracks.push(trimmed);
    });

    if (current) {
      playlists.push(current);
    }

    return {
      playlists: playlists.map((playlist, index) => normalizeCreativePlaylistEntry(playlist, index, fallbackGenre)).filter(Boolean),
      activeId: playlists[0]?.id || "",
    };
  }

  function normalizeCreativePlaylistEntry(entry, index, fallbackGenre) {
    if (!entry) {
      return null;
    }
    const name = normalizeCreativeText(entry.name || entry.title || `Playlist ${index + 1}`, 120).trim();
    const tracks = Array.isArray(entry.tracks)
      ? entry.tracks
      : String(entry.tracks || entry.songs || entry.musicas || "").split(/\r?\n/);
    const normalizedTracks = tracks
      .map((track) => normalizeCreativeText(track, 220).trim())
      .filter(Boolean)
      .slice(0, 180);

    if (!name && !normalizedTracks.length) {
      return null;
    }

    const idSource = entry.id || `${index}-${name || "playlist"}`;
    return {
      id: normalizeCreativeText(String(idSource || createId("playlist")), 120),
      genre: normalizeCreativeText(entry.genre || entry.category || entry.genero || fallbackGenre || "Geral", 80).trim() || "Geral",
      name: name || "Playlist sem nome",
      style: normalizeCreativeText(entry.style || entry.description || entry.descricao || "", 2000),
      tracks: normalizedTracks,
      updatedAt: entry.updatedAt || entry.updated_at || "",
    };
  }

  function serializeCreativePlaylistState(playlists, activeId) {
    return JSON.stringify({
      version: 1,
      activeId: activeId || "",
      playlists: playlists.map((playlist) => ({
        id: playlist.id,
        genre: playlist.genre,
        name: playlist.name,
        style: playlist.style,
        tracks: playlist.tracks,
        updatedAt: playlist.updatedAt || "",
      })),
    });
  }

  function creativePlaylistCategories(item) {
    const categories = String(item?.playlistGenres || item?.tags || "")
      .split(/[\n,;]+/)
      .map((category) => normalizeCreativeText(category, 80).trim())
      .filter(Boolean);
    const unique = [];
    categories.forEach((category) => {
      const key = creativePlaylistSlug(category);
      if (key && !unique.some((entry) => creativePlaylistSlug(entry) === key)) {
        unique.push(category);
      }
    });
    return unique.length ? unique.slice(0, 24) : ["Geral"];
  }

  function creativePlaylistTextLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => normalizeCreativeText(line, 220).trim())
      .filter(Boolean)
      .slice(0, 180);
  }

  function creativePlaylistSlug(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function renderCreativeOtherLab(item) {
    return `
      <div class="creative-other-layout">
        <section class="creative-tool-card">
          <div class="creative-tool-card-head">
            <h3>Ideias de uso</h3>
            <span>Escolha uma direção</span>
          </div>
          <div class="creative-challenge-grid">
            ${CREATIVE_OTHER_IDEAS.map((idea, index) => `
              <article class="creative-challenge-card">
                <strong>${escapeHtml(idea.title)}</strong>
                <span>${escapeHtml(idea.text)}</span>
                <button class="button secondary compact-button" type="button" data-creative-action="apply-other-template" data-template-index="${index}">Usar</button>
              </article>
            `).join("")}
          </div>
        </section>
        <section class="creative-tool-card">
          <h3>Briefing</h3>
          <textarea data-creative-live-field="otherBrief" rows="10" maxlength="12000" placeholder="O que é, para quem é, qual problema resolve, restrições e resultado esperado.">${escapeHtml(item.otherBrief || item.content)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Passos e validação</h3>
          <textarea data-creative-live-field="otherSteps" rows="10" maxlength="12000" placeholder="Pesquisa, protótipo, teste, feedback, ajustes e próxima entrega.">${escapeHtml(item.otherSteps || item.reference)}</textarea>
        </section>
        <section class="creative-tool-card creative-writing-desk">
          <h3>Anotações livres</h3>
          <textarea data-creative-live-field="content" rows="14" maxlength="12000" placeholder="Notas, rascunhos, links e decisões.">${escapeHtml(item.content)}</textarea>
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.otherBrief} ${item.otherSteps} ${item.content}`)} palavras</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeWildcardLab(item) {
    return `
      <div class="creative-other-layout">
        <section class="creative-tool-card">
          <h3>Objetivo</h3>
          <textarea data-creative-live-field="otherBrief" rows="10" maxlength="12000" placeholder="O que e, para que serve, contexto, limite, resultado esperado e criterio de pronto.">${escapeHtml(item.otherBrief || item.content)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Materiais e referencias</h3>
          <textarea data-creative-live-field="reference" rows="10" maxlength="4000" placeholder="Links, arquivos, exemplos, pessoas, restricoes e qualquer coisa de apoio.">${escapeHtml(item.reference)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Passos</h3>
          <textarea data-creative-live-field="otherSteps" rows="10" maxlength="12000" placeholder="Proximas acoes, checklist, pendencias, testes e decisoes.">${escapeHtml(item.otherSteps)}</textarea>
        </section>
        <section class="creative-tool-card creative-writing-desk">
          <h3>Anotacoes livres</h3>
          <textarea data-creative-live-field="content" rows="14" maxlength="12000" placeholder="Notas, rascunhos, links e decisoes.">${escapeHtml(item.content)}</textarea>
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.otherBrief} ${item.otherSteps} ${item.content}`)} palavras</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeWritingLab(item) {
    const label = item.type === "story" ? "Texto da historia" : "Anotações";
    return `
      <div class="creative-live-grid">
        <label class="field span-2 creative-live-field">
          <span>${escapeHtml(label)}</span>
          <textarea data-creative-live-field="content" rows="16" maxlength="12000" placeholder="Escreva aqui.">${escapeHtml(item.content)}</textarea>
        </label>
        <label class="field span-2 creative-live-field">
          <span>Referencias e notas</span>
          <textarea data-creative-live-field="reference" rows="6" maxlength="4000" placeholder="Ideias, links, tom, personagem, cenas, regras.">${escapeHtml(item.reference)}</textarea>
        </label>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(item.content)} palavras</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeImageLab(item) {
    const image = creativeImagePreview(item.imageUrl);
    return `
      <div class="creative-live-grid">
        <label class="field span-2 creative-live-field">
          <span>Ideia / prompt</span>
          <textarea data-creative-live-field="content" rows="8" maxlength="12000" placeholder="Descreva a imagem, personagem, cena, luz, paleta e composição.">${escapeHtml(item.content)}</textarea>
        </label>
        <label class="field span-2 creative-live-field">
          <span>Referencia escrita</span>
          <textarea data-creative-live-field="reference" rows="6" maxlength="4000" placeholder="Cole referencias escritas, observacoes e variações.">${escapeHtml(item.reference)}</textarea>
        </label>
        <label class="field span-2 creative-live-field">
          <span>Imagem de referencia</span>
          <input data-creative-live-field="imageUrl" type="text" value="${escapeHtml(item.imageUrl)}" placeholder="URL da imagem ou data:image">
        </label>
      </div>
      ${image}
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.content} ${item.reference}`)} palavras de referencia</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeImageWorkspace(item) {
    const image = creativeImagePreview(item.imageUrl);
    return `
      <div class="creative-visual-layout">
        <section class="creative-tool-card">
          <div class="creative-tool-card-head">
            <h3>Importar referencia</h3>
            <span>URL ou arquivo local</span>
          </div>
          <label class="field creative-live-field">
            <span>URL / data:image</span>
            <input data-creative-live-field="imageUrl" type="text" value="${escapeHtml(item.imageUrl)}" placeholder="URL da imagem ou data:image">
          </label>
          <label class="field">
            <span>Arquivo de imagem</span>
            <input data-creative-file-import="image" type="file" accept="image/*">
          </label>
          ${image}
        </section>
        <section class="creative-tool-card">
          <h3>Painel semantico</h3>
          <textarea data-creative-live-field="mood" rows="10" maxlength="12000" placeholder="Clima, emoções, palavras-chave, cores, formas, materiais, iluminação, composição.">${escapeHtml(item.mood)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Anotações da referencia</h3>
          <textarea data-creative-live-field="annotations" rows="10" maxlength="12000" placeholder="O que aproveitar, o que evitar, partes importantes, observações por imagem.">${escapeHtml(item.annotations || item.reference)}</textarea>
        </section>
        <section class="creative-tool-card creative-canvas-card">
          <div class="creative-tool-card-head">
            <h3>Lousa</h3>
            <span>Desenhe, cole imagens e reposicione referencias.</span>
          </div>
          ${renderCreativeWhiteboard(item, { scope: "item", title: "Lousa" })}
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.content} ${item.reference} ${item.mood} ${item.annotations}`)} palavras de referencia</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeModelLab(item) {
    return `
      <div class="creative-live-grid">
        <label class="field span-2 creative-live-field">
          <span>Plano do modelo / teste</span>
          <textarea data-creative-live-field="content" rows="8" maxlength="12000" placeholder="O que modelar, escala, peças, materiais, rig, animação ou teste.">${escapeHtml(item.content)}</textarea>
        </label>
        <label class="field span-2 creative-live-field">
          <span>Referencias</span>
          <textarea data-creative-live-field="reference" rows="6" maxlength="4000" placeholder="Referencias visuais, medidas, links e checklist.">${escapeHtml(item.reference)}</textarea>
        </label>
        <label class="field span-2 creative-live-field">
          <span>Arquivo / modelo</span>
          <input data-creative-live-field="modelUrl" type="text" value="${escapeHtml(item.modelUrl)}" placeholder="Link, pasta ou arquivo .blend/.glb/.obj">
        </label>
      </div>
      <div class="creative-asset-box">
        ${svgIcon("icon-cube")}
        <span>${escapeHtml(item.modelUrl || "Nenhum arquivo de modelo informado")}</span>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.content} ${item.reference}`)} palavras de briefing</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeModelWorkspace(item) {
    return `
      <div class="creative-visual-layout">
        <section class="creative-tool-card">
          <div class="creative-tool-card-head">
            <h3>Arquivo / referencia 3D</h3>
            <span>glb, glTF, obj, blend ou pasta</span>
          </div>
          <label class="field creative-live-field">
            <span>Modelo 3D / caminho</span>
            <input data-creative-live-field="modelUrl" type="text" value="${escapeHtml(item.modelUrl)}" placeholder="Link, pasta ou arquivo .blend/.glb/.obj">
          </label>
          <label class="field">
            <span>Registrar arquivo local</span>
            <input data-creative-file-import="model" type="file" accept=".glb,.gltf,.obj,.fbx,.blend,.stl,.dae">
          </label>
          <div class="creative-asset-box">
            ${svgIcon("icon-cube")}
            <span>${escapeHtml(item.modelUrl || "Nenhum arquivo de modelo informado")}</span>
          </div>
        </section>
        <section class="creative-tool-card">
          <h3>Briefing do modelo</h3>
          <textarea data-creative-live-field="modelBrief" rows="10" maxlength="12000" placeholder="Objetivo, escala, silhueta, proporções, partes móveis, uso final, limitações.">${escapeHtml(item.modelBrief || item.content)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Materiais e acabamento</h3>
          <textarea data-creative-live-field="materials" rows="10" maxlength="12000" placeholder="Materiais, textura, luz, cor, desgaste, acabamento, referencias.">${escapeHtml(item.materials)}</textarea>
        </section>
        <section class="creative-tool-card">
          <h3>Checklist tecnico</h3>
          <textarea data-creative-live-field="modelChecklist" rows="10" maxlength="12000" placeholder="Blockout, proporções, topologia, UV, materiais, rig, animação, exportação, revisão.">${escapeHtml(item.modelChecklist)}</textarea>
        </section>
        <section class="creative-tool-card creative-canvas-card">
          <div class="creative-tool-card-head">
            <h3>Lousa de formas</h3>
            <span>Desenhe, cole imagens e reposicione referencias.</span>
          </div>
          ${renderCreativeWhiteboard(item, { scope: "item", title: "Lousa de formas" })}
        </section>
      </div>
      <div class="creative-detail-foot">
        <span>${creativeWordCount(`${item.modelBrief} ${item.materials} ${item.modelChecklist} ${item.reference}`)} palavras de briefing</span>
        ${creativeLinkHtml(item)}
      </div>
    `;
  }

  function renderCreativeCodeLab(item) {
    return `
      <div class="creative-code-lab">
        <section class="creative-tool-card">
          <div class="creative-tool-card-head">
            <h3>Desafios e ideias</h3>
            <span>Use como ponto de partida</span>
          </div>
          <div class="creative-challenge-grid">
            ${CREATIVE_CODE_CHALLENGES.map((challenge, index) => `
              <article class="creative-challenge-card">
                <strong>${escapeHtml(challenge.title)}</strong>
                <span>${escapeHtml(challenge.tags)}</span>
                <button class="button secondary compact-button" type="button" data-creative-action="apply-code-template" data-template-index="${index}">Usar desafio</button>
              </article>
            `).join("")}
          </div>
        </section>
        <div class="creative-code-toolbar">
          <label class="field compact">
            <span>Linguagem</span>
            <select data-creative-live-field="language" aria-label="Linguagem do codigo">
              ${CREATIVE_LANGUAGE_ORDER.map((key) => `<option value="${key}"${item.language === key ? " selected" : ""}>${escapeHtml(CREATIVE_LANGUAGES[key])}</option>`).join("")}
            </select>
          </label>
          <button class="button primary" type="button" data-creative-action="run" data-creative-id="${escapeHtml(item.id)}">
            ${svgIcon("icon-code")}
            <span>Rodar teste</span>
          </button>
        </div>
        <label class="field creative-code-editor">
          <span>Codigo</span>
          <textarea data-creative-live-field="code" rows="16" maxlength="20000" spellcheck="false">${escapeHtml(item.code)}</textarea>
        </label>
        <div class="creative-output-panel">
          <div class="panel-header">
            <div>
              <h2>Console / terminal</h2>
              <p>Resultado do ultimo teste, erros e logs.</p>
            </div>
          </div>
          <div class="creative-run-output" data-creative-run-output>${escapeHtml(item.lastRunOutput || item.output || "Nada executado ainda.")}</div>
        </div>
        <label class="field creative-live-field">
          <span>Notas do teste</span>
          <textarea data-creative-live-field="output" rows="5" maxlength="4000" placeholder="Resultado esperado, bugs, proximos testes.">${escapeHtml(item.output)}</textarea>
        </label>
      </div>
    `;
  }

  function handleCreativeBoardClick(event) {
    const button = event.target.closest("[data-creative-action]");
    if (!button) {
      return;
    }

    handleCreativeAction(button);
  }

  function handleCreativeDetailClick(event) {
    const clickedEditor = event.target.closest("[data-creative-rich-field]");
    if (clickedEditor) {
      saveCreativeRichSelection(clickedEditor);
    }

    const imageButton = event.target.closest("[data-creative-rich-image]");
    if (imageButton) {
      event.preventDefault();
      handleCreativeRichImageButton(imageButton);
      return;
    }

    const richButton = event.target.closest("[data-creative-rich-command]");
    if (richButton) {
      event.preventDefault();
      handleCreativeRichCommand(richButton);
      return;
    }

    const button = event.target.closest("[data-creative-action]");
    if (!button) {
      return;
    }

    handleCreativeAction(button);
  }

  function handleCreativeAction(button) {
    const action = button.dataset.creativeAction;
    if (action === "open-type") {
      activeCreativeType = normalizeCreativeType(button.dataset.creativeType);
      const activeItem = findCreativeItem(activeCreativeItemId);
      if (!activeItem || activeItem.type !== activeCreativeType) {
        activeCreativeItemId = "";
      }
      saveState({ backup: false });
      renderCreative();
      return;
    }
    if (action === "new") {
      openCreativeItemDialog("", button.dataset.creativeType || "");
      return;
    }
    if (action === "close-open") {
      activeCreativeItemId = "";
      saveState({ backup: false });
      renderCreative();
      return;
    }

    const item = findCreativeItem(button.dataset.creativeId || activeCreativeItemId);
    if (!item) {
      return;
    }

    if (action.startsWith("story-")) {
      handleCreativeStoryAction(item, action, button);
      return;
    }

    if (action.startsWith("project-")) {
      handleCreativeProjectAction(item, action, button);
      return;
    }

    if (action === "select") {
      activeCreativeItemId = item.id;
      activeCreativeType = normalizeCreativeType(item.type);
      saveState({ backup: false });
      renderCreative();
    } else if (action === "edit") {
      openCreativeItemDialog(item.id);
    } else if (action === "delete") {
      deleteCreativeItem(item);
    } else if (action === "run") {
      runCreativeCodeFromDetail(item);
    } else if (action === "apply-code-template") {
      applyCreativeCodeTemplate(item, button.dataset.templateIndex);
    } else if (action === "apply-dashboard-template") {
      applyCreativeDashboardTemplate(item, button.dataset.templateIndex);
    } else if (action === "apply-other-template") {
      applyCreativeOtherTemplate(item, button.dataset.templateIndex);
    } else if (action === "clear-canvas") {
      clearCreativeCanvas(item, button);
    } else if (action === "add-whiteboard-image") {
      openCreativeWhiteboardImageInput(button);
    } else if (action === "save-playlist") {
      saveCreativePlaylist(item);
    } else if (action === "select-playlist") {
      selectCreativePlaylist(item, button.dataset.playlistId || "");
    } else if (action === "delete-playlist") {
      deleteCreativePlaylist(item, button.dataset.playlistId || "");
    } else if (action === "new-playlist-draft") {
      resetCreativePlaylistDraft(item);
    }
  }

  function handleCreativeDetailInput(event) {
    const projectField = event.target.closest("[data-creative-project-field]");
    if (projectField) {
      const item = findCreativeItem(activeCreativeItemId);
      if (!item) {
        return;
      }

      saveCreativeRichSelection(projectField);
      updateCreativeProjectNestedField(item, projectField);
      item.updatedAt = new Date().toISOString();
      scheduleCreativeAutosave();
      return;
    }

    const storyField = event.target.closest("[data-creative-story-field]");
    if (storyField) {
      const item = findCreativeItem(activeCreativeItemId);
      if (!item) {
        return;
      }

      saveCreativeRichSelection(storyField);
      updateCreativeStoryNestedField(item, storyField);
      item.updatedAt = new Date().toISOString();
      scheduleCreativeAutosave();
      return;
    }

    const field = event.target.closest("[data-creative-live-field]");
    if (!field) {
      return;
    }

    const item = findCreativeItem(activeCreativeItemId);
    if (!item) {
      return;
    }

    saveCreativeRichSelection(field);
    updateCreativeItemField(item, field.dataset.creativeLiveField, getCreativeFieldValue(field));
    item.updatedAt = new Date().toISOString();
    scheduleCreativeAutosave();
  }

  function handleCreativeDetailChange(event) {
    const whiteboardImageInput = event.target.closest("[data-creative-whiteboard-image-input]");
    if (whiteboardImageInput) {
      handleCreativeWhiteboardImageInput(whiteboardImageInput);
      return;
    }

    const projectImageInput = event.target.closest("[data-creative-project-image-input]");
    if (projectImageInput) {
      handleCreativeProjectImageInput(projectImageInput);
      return;
    }

    const richImageInput = event.target.closest("[data-creative-rich-image-input]");
    if (richImageInput) {
      handleCreativeRichImageInput(richImageInput);
      return;
    }

    const richFormat = event.target.closest("[data-creative-rich-format]");
    if (richFormat) {
      handleCreativeRichFormat(richFormat);
      return;
    }

    const fileInput = event.target.closest("[data-creative-file-import]");
    if (fileInput) {
      handleCreativeFileImport(fileInput);
      return;
    }

    const projectField = event.target.closest("[data-creative-project-field]");
    if (projectField) {
      const item = findCreativeItem(activeCreativeItemId);
      if (!item) {
        return;
      }

      updateCreativeProjectNestedField(item, projectField);
      item.updatedAt = new Date().toISOString();
      saveState();
      renderCreative();
      renderHome();
      return;
    }

    const storyField = event.target.closest("[data-creative-story-field]");
    if (storyField) {
      const item = findCreativeItem(activeCreativeItemId);
      if (!item) {
        return;
      }

      updateCreativeStoryNestedField(item, storyField);
      item.updatedAt = new Date().toISOString();
      saveState();
      renderCreative();
      renderHome();
      return;
    }

    const field = event.target.closest("[data-creative-live-field]");
    if (!field) {
      return;
    }

    const item = findCreativeItem(activeCreativeItemId);
    if (!item) {
      return;
    }

    updateCreativeItemField(item, field.dataset.creativeLiveField, getCreativeFieldValue(field));
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    renderHome();
  }

  function handleCreativeDetailPaste(event) {
    const whiteboard = event.target.closest("[data-creative-whiteboard]");
    const imageFiles = Array.from(event.clipboardData?.items || [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (whiteboard && imageFiles.length) {
      const item = findCreativeItem(activeCreativeItemId);
      if (!item) {
        return;
      }

      event.preventDefault();
      insertCreativeWhiteboardImageFiles(item, whiteboard, imageFiles);
      return;
    }

    const imageBlock = event.target.closest("[data-project-block-type='image']");
    if (imageBlock && imageFiles.length) {
      const item = findCreativeItem(activeCreativeItemId);
      const block = item ? findCreativeProjectBlock(item, imageBlock.dataset.projectBlockId) : null;
      if (!item || !block) {
        return;
      }

      event.preventDefault();
      insertCreativeProjectImageFiles(item, block, imageFiles);
      return;
    }

    const editor = event.target.closest("[data-creative-rich-field]");
    if (!editor) {
      return;
    }

    if (!imageFiles.length) {
      return;
    }

    event.preventDefault();
    saveCreativeRichSelection(editor);
    insertCreativeRichImageFiles(editor, imageFiles);
  }

  function scheduleCreativeAutosave() {
    window.clearTimeout(creativeAutosaveTimer);
    creativeAutosaveTimer = window.setTimeout(() => {
      saveState();
      renderHome();
    }, 500);
  }

  function updateCreativeItemField(item, field, value) {
    if (field === "title") {
      item.title = normalizeCreativeText(value, 120) || creativeTypeConfig(item.type).singular;
    } else if (field === "status") {
      item.status = normalizeCreativeStatus(value);
    } else if (field === "language") {
      item.language = normalizeCreativeLanguage(value);
    } else if (field === "imageUrl") {
      item.imageUrl = normalizeCreativeImageSource(value);
    } else if (field === "modelUrl") {
      item.modelUrl = normalizeCreativeText(value, 1200);
    } else if (field === "link") {
      item.link = normalizeCreativeText(value, 600);
    } else if (field === "code") {
      item.code = normalizeCreativeText(value, 20000);
    } else if (field === "output") {
      item.output = normalizeCreativeText(value, 4000);
    } else if (field === "reference") {
      item.reference = normalizeCreativeText(value, 4000);
    } else if (item.type === "story" && CREATIVE_STORY_RICH_FIELDS.includes(field)) {
      item[field] = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    } else if (CREATIVE_EXTRA_FIELDS.includes(field)) {
      const fieldLimit = field === "sketchData" ? CREATIVE_RICH_CONTENT_LIMIT : field === "playlistCollections" ? 40000 : 12000;
      item[field] = field === "sketchData" ? normalizeCreativeImageSource(value, fieldLimit) : normalizeCreativeText(value, fieldLimit);
    } else {
      item.content = normalizeCreativeText(value, 12000);
    }
  }

  function getCreativeFieldValue(field) {
    if (field.dataset.creativeRichField === "true" || field.isContentEditable) {
      return normalizeCreativeRichHtml(field.innerHTML, CREATIVE_RICH_CONTENT_LIMIT);
    }
    return field.value ?? field.textContent ?? "";
  }

  function handleCreativeRichCommand(button) {
    const editor = button.closest(".creative-rich-field")?.querySelector("[data-creative-rich-field]");
    if (!editor) {
      return;
    }

    restoreCreativeRichSelection(editor);
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(button.dataset.creativeRichCommand, false, null);
    saveCreativeRichSelection(editor);
    persistCreativeRichEditor(editor);
  }

  function handleCreativeRichFormat(select) {
    const editor = select.closest(".creative-rich-field")?.querySelector("[data-creative-rich-field]");
    if (!editor || !select.value) {
      return;
    }

    restoreCreativeRichSelection(editor);
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(select.dataset.creativeRichFormat, false, select.value);
    select.value = "";
    saveCreativeRichSelection(editor);
    persistCreativeRichEditor(editor);
  }

  function handleCreativeRichImageButton(button) {
    const field = button.closest(".creative-rich-field");
    const editor = field?.querySelector("[data-creative-rich-field]");
    const input = field?.querySelector("[data-creative-rich-image-input]");
    if (!editor || !input) {
      return;
    }

    saveCreativeRichSelection(editor);
    input.value = "";
    input.click();
  }

  function handleCreativeRichImageInput(input) {
    const field = input.closest(".creative-rich-field");
    const editor = field?.querySelector("[data-creative-rich-field]");
    const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
    if (!editor || !files.length) {
      return;
    }

    insertCreativeRichImageFiles(editor, files);
    input.value = "";
  }

  function saveCreativeRichSelection(editor) {
    if (!editor || editor.dataset.creativeRichField !== "true") {
      return;
    }

    const selection = window.getSelection();
    if (selection?.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) {
      activeCreativeRichSelection = {
        editor,
        range: selection.getRangeAt(0).cloneRange(),
      };
    }
  }

  function restoreCreativeRichSelection(editor) {
    editor.focus();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    const savedRange = activeCreativeRichSelection?.editor === editor ? activeCreativeRichSelection.range : null;
    if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
      selection.addRange(savedRange);
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
  }

  function insertCreativeRichImageFiles(editor, files) {
    files.reduce((promise, file) => promise
      .then(() => readCreativeRichImageFile(file))
      .then((image) => {
        insertCreativeRichImage(editor, image.src, image.alt);
      })
      .catch(() => {
        showToast("Nao foi possivel inserir a imagem.");
      }), Promise.resolve());
  }

  function insertCreativeRichImage(editor, src, alt = "Imagem") {
    restoreCreativeRichSelection(editor);
    const figure = document.createElement("figure");
    figure.className = "creative-rich-image-block";
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt || "Imagem";
    image.setAttribute("style", "max-width: 100%; height: auto;");
    figure.appendChild(image);
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (range) {
      range.deleteContents();
      range.insertNode(figure);
      const spacer = document.createElement("p");
      spacer.appendChild(document.createElement("br"));
      figure.after(spacer);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(spacer);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    } else {
      editor.appendChild(figure);
    }
    saveCreativeRichSelection(editor);
    persistCreativeRichEditor(editor);
  }

  function readCreativeRichImageFile(file) {
    return readFileAsDataUrl(file).then((dataUrl) => {
      const alt = file.name ? file.name.replace(/\.[^.]+$/, "") : "Imagem";
      if (file.type === "image/gif") {
        return { src: dataUrl, alt };
      }
      return resizeCreativeRichImage(dataUrl, file.type).then((src) => ({ src, alt }));
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resizeCreativeRichImage(dataUrl, mimeType) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 1600;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
        if (scale >= 1) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(outputType, 0.86));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  function handleCreativeProjectImageInput(input) {
    const item = findCreativeItem(activeCreativeItemId);
    const block = item ? findCreativeProjectBlock(item, input.dataset.projectBlockId) : null;
    const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
    if (!item || !block || !files.length) {
      return;
    }

    insertCreativeProjectImageFiles(item, block, files);
    input.value = "";
  }

  function insertCreativeProjectImageFiles(item, block, files) {
    const scrollSnapshot = captureCreativeScrollSnapshot();
    files.reduce((promise, file) => promise
      .then(() => readCreativeRichImageFile(file))
      .then((image) => {
        const entry = createCreativeProjectImage(image.src, image.alt);
        if (entry) {
          block.images.push(entry);
        }
      })
      .catch(() => {
        showToast("Nao foi possivel anexar a imagem.");
      }), Promise.resolve()).then(() => {
        block.images = normalizeCreativeProjectImages(block.images);
        item.updatedAt = new Date().toISOString();
        saveState();
        renderCreative();
        restoreCreativeScrollSnapshot(scrollSnapshot);
        renderHome();
      });
  }

  function openCreativeWhiteboardImageInput(button) {
    const whiteboard = button.closest("[data-creative-whiteboard]");
    const input = whiteboard?.querySelector("[data-creative-whiteboard-image-input]");
    if (!whiteboard || !input) {
      return;
    }
    whiteboard.focus({ preventScroll: true });
    input.value = "";
    input.click();
  }

  function handleCreativeWhiteboardImageInput(input) {
    const item = findCreativeItem(activeCreativeItemId);
    const whiteboard = input.closest("[data-creative-whiteboard]");
    const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
    if (!item || !whiteboard || !files.length) {
      return;
    }

    insertCreativeWhiteboardImageFiles(item, whiteboard, files);
    input.value = "";
  }

  function insertCreativeWhiteboardImageFiles(item, whiteboard, files) {
    const target = creativeWhiteboardTargetForElement(item, whiteboard);
    if (!target) {
      return;
    }

    const scrollSnapshot = captureCreativeScrollSnapshot();
    files.reduce((promise, file, index) => promise
      .then(() => readCreativeRichImageFile(file))
      .then((image) => {
        const asset = createCreativeWhiteboardAsset(image.src, image.alt, {
          x: 8 + (index % 4) * 5,
          y: 8 + (index % 3) * 6,
          w: 28,
          h: 28,
        });
        if (asset) {
          target.getAssets().push(asset);
        }
      })
      .catch(() => {
        showToast("Nao foi possivel anexar a imagem na lousa.");
      }), Promise.resolve()).then(() => {
        target.setAssets(target.getAssets());
        item.updatedAt = new Date().toISOString();
        saveState();
        renderCreative();
        restoreCreativeScrollSnapshot(scrollSnapshot);
        renderHome();
      });
  }

  function persistCreativeRichEditor(editor) {
    const item = findCreativeItem(activeCreativeItemId);
    if (!item) {
      return;
    }

    if (editor.dataset.creativeStoryField) {
      updateCreativeStoryNestedField(item, editor);
    } else if (editor.dataset.creativeProjectField) {
      updateCreativeProjectNestedField(item, editor);
    } else if (editor.dataset.creativeLiveField) {
      updateCreativeItemField(item, editor.dataset.creativeLiveField, getCreativeFieldValue(editor));
    }
    item.updatedAt = new Date().toISOString();
    saveState();
    renderHome();
  }

  function handleCreativeStoryFreeLayoutPointerDown(event) {
    const handle = event.target.closest("[data-creative-story-free-layout]");
    if (!handle) {
      return;
    }

    const item = findCreativeItem(handle.dataset.creativeId || activeCreativeItemId);
    if (!item || item.type !== "story") {
      return;
    }

    const workspace = ensureCreativeStoryWorkspace(item);
    const card = findCreativeStoryFreeCard(workspace, handle.dataset.storyFreeId);
    const board = handle.closest("[data-creative-story-free-board]");
    const cardElement = handle.closest(".creative-story-free-card");
    if (!card || !board || !cardElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const action = handle.dataset.creativeStoryFreeLayout;
    const start = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: card.x,
      y: card.y,
      w: card.w,
      h: card.h,
      cellWidth: Math.max(1, board.clientWidth / CREATIVE_STORY_FREE_COLUMNS),
    };

    cardElement.classList.add("is-layout-editing");

    const updateLayout = (moveEvent) => {
      const deltaColumns = Math.round((moveEvent.clientX - start.pointerX) / start.cellWidth);
      const deltaRows = Math.round((moveEvent.clientY - start.pointerY) / CREATIVE_STORY_FREE_ROW_HEIGHT);
      if (action === "resize") {
        card.w = clampNumber(start.w + deltaColumns, 2, CREATIVE_STORY_FREE_COLUMNS - start.x);
        card.h = clampNumber(start.h + deltaRows, 1, 8);
      } else {
        card.x = clampNumber(start.x + deltaColumns, 0, CREATIVE_STORY_FREE_COLUMNS - start.w);
        card.y = Math.max(0, Math.round(start.y + deltaRows));
      }
      cardElement.style.setProperty("--story-free-x", card.x);
      cardElement.style.setProperty("--story-free-y", card.y);
      cardElement.style.setProperty("--story-free-w", card.w);
      cardElement.style.setProperty("--story-free-h", card.h);
      board.style.minHeight = `${creativeStoryFreeBoardHeight(workspace.freeCards)}px`;
    };

    const finishLayout = () => {
      window.removeEventListener("pointermove", updateLayout);
      window.removeEventListener("pointerup", finishLayout);
      window.removeEventListener("pointercancel", finishLayout);
      cardElement.classList.remove("is-layout-editing");
      item.updatedAt = new Date().toISOString();
      saveState();
      renderHome();
    };

    window.addEventListener("pointermove", updateLayout);
    window.addEventListener("pointerup", finishLayout);
    window.addEventListener("pointercancel", finishLayout);
  }

  function nextCreativeStoryFreeCardLayout(cards = []) {
    const y = cards.length ? Math.max(...cards.map((card) => Number(card.y || 0) + Number(card.h || 2))) : 0;
    return { x: 0, y, w: 4, h: 2 };
  }

  function handleCreativeProjectBlockPointerDown(event) {
    const handle = event.target.closest("[data-creative-project-layout]");
    if (!handle) {
      return;
    }
    if (event.target.closest(".creative-project-block-actions")) {
      return;
    }

    const item = findCreativeItem(handle.dataset.creativeId || activeCreativeItemId);
    const block = item ? findCreativeProjectBlock(item, handle.dataset.projectBlockId) : null;
    const board = handle.closest("[data-creative-project-block-board]");
    const blockElement = handle.closest(".creative-project-block");
    if (!item || !block || !board || !blockElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const action = handle.dataset.creativeProjectLayout;
    const start = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      cellWidth: Math.max(1, board.clientWidth / CREATIVE_PROJECT_BLOCK_COLUMNS),
    };

    blockElement.classList.add("is-layout-editing");

    const updateLayout = (moveEvent) => {
      const deltaColumns = Math.round((moveEvent.clientX - start.pointerX) / start.cellWidth);
      const deltaRows = Math.round((moveEvent.clientY - start.pointerY) / CREATIVE_PROJECT_BLOCK_ROW_HEIGHT);
      if (action === "resize") {
        block.w = clampNumber(start.w + deltaColumns, 2, CREATIVE_PROJECT_BLOCK_COLUMNS - start.x);
        block.h = clampNumber(start.h + deltaRows, 1, 10);
      } else {
        block.x = clampNumber(start.x + deltaColumns, 0, CREATIVE_PROJECT_BLOCK_COLUMNS - start.w);
        block.y = Math.max(0, Math.round(start.y + deltaRows));
      }
      blockElement.style.setProperty("--project-block-x", block.x);
      blockElement.style.setProperty("--project-block-y", block.y);
      blockElement.style.setProperty("--project-block-w", block.w);
      blockElement.style.setProperty("--project-block-h", block.h);
      board.style.minHeight = `${creativeProjectBlockBoardHeight(item.projectBlocks || [])}px`;
    };

    const finishLayout = () => {
      window.removeEventListener("pointermove", updateLayout);
      window.removeEventListener("pointerup", finishLayout);
      window.removeEventListener("pointercancel", finishLayout);
      blockElement.classList.remove("is-layout-editing");
      item.updatedAt = new Date().toISOString();
      saveState();
      renderHome();
    };

    window.addEventListener("pointermove", updateLayout);
    window.addEventListener("pointerup", finishLayout);
    window.addEventListener("pointercancel", finishLayout);
  }

  function handleCreativeWhiteboardAssetPointerDown(event) {
    const handle = event.target.closest("[data-creative-whiteboard-asset-layout]");
    if (!handle) {
      return;
    }

    const item = findCreativeItem(activeCreativeItemId);
    const whiteboard = handle.closest("[data-creative-whiteboard]");
    const target = creativeWhiteboardTargetForElement(item, whiteboard);
    const assetId = handle.dataset.whiteboardAssetId || handle.closest("[data-whiteboard-asset-id]")?.dataset.whiteboardAssetId;
    const asset = target?.getAssets().find((candidate) => candidate.id === assetId);
    const assetElement = handle.closest(".creative-whiteboard-asset");
    if (!item || !whiteboard || !target || !asset || !assetElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const action = handle.dataset.creativeWhiteboardAssetLayout;
    const rect = whiteboard.getBoundingClientRect();
    const start = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: asset.x,
      y: asset.y,
      w: asset.w,
      h: asset.h,
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };

    assetElement.classList.add("is-moving");

    const updateLayout = (moveEvent) => {
      const deltaX = ((moveEvent.clientX - start.pointerX) / start.width) * 100;
      const deltaY = ((moveEvent.clientY - start.pointerY) / start.height) * 100;
      if (action === "resize") {
        asset.w = clampNumber(start.w + deltaX, 6, 100 - start.x);
        asset.h = clampNumber(start.h + deltaY, 6, 100 - start.y);
      } else {
        asset.x = clampNumber(start.x + deltaX, 0, 100 - start.w);
        asset.y = clampNumber(start.y + deltaY, 0, 100 - start.h);
      }
      assetElement.style.setProperty("--whiteboard-asset-x", asset.x);
      assetElement.style.setProperty("--whiteboard-asset-y", asset.y);
      assetElement.style.setProperty("--whiteboard-asset-w", asset.w);
      assetElement.style.setProperty("--whiteboard-asset-h", asset.h);
    };

    const finishLayout = () => {
      window.removeEventListener("pointermove", updateLayout);
      window.removeEventListener("pointerup", finishLayout);
      window.removeEventListener("pointercancel", finishLayout);
      assetElement.classList.remove("is-moving");
      target.setAssets(target.getAssets());
      item.updatedAt = new Date().toISOString();
      saveState();
      renderHome();
    };

    window.addEventListener("pointermove", updateLayout);
    window.addEventListener("pointerup", finishLayout);
    window.addEventListener("pointercancel", finishLayout);
  }

  function captureCreativeScrollSnapshot() {
    const selectors = [".main", ".creative-detail-panel", ".creative-open-detail", "#creative-detail"];
    return {
      windowX: window.scrollX,
      windowY: window.scrollY,
      elements: selectors.map((selector) => {
        const element = document.querySelector(selector);
        return element ? { selector, scrollLeft: element.scrollLeft, scrollTop: element.scrollTop } : null;
      }).filter(Boolean),
    };
  }

  function restoreCreativeScrollSnapshot(snapshot) {
    requestAnimationFrame(() => {
      snapshot.elements.forEach((entry) => {
        const element = document.querySelector(entry.selector);
        if (element) {
          element.scrollLeft = entry.scrollLeft;
          element.scrollTop = entry.scrollTop;
        }
      });
      window.scrollTo(snapshot.windowX, snapshot.windowY);
    });
  }

  function handleCreativeProjectAction(item, action, button) {
    const blocks = ensureCreativeProjectBlocks(item);
    const scrollSnapshot = captureCreativeScrollSnapshot();
    let changed = true;

    if (action === "project-add-block") {
      const selector = button.closest(".creative-project-blocks-head")?.querySelector("[data-creative-project-block-kind]");
      const type = normalizeCreativeProjectBlockType(selector?.value || "text");
      const block = createCreativeProjectBlock(type, "", nextCreativeProjectBlockLayout(blocks, type));
      blocks.push(block);
      item.projectOpenBlockId = ["text", "code", "image"].includes(block.type) ? block.id : "";
      item.projectOpenCardId = "";
      item.projectOpenSubpageId = "";
    } else if (action === "project-open-block") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      if (block) {
        item.projectOpenBlockId = block.id;
        item.projectOpenCardId = "";
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-close-editor") {
      item.projectOpenBlockId = "";
      item.projectOpenCardId = "";
      item.projectOpenSubpageId = "";
    } else if (action === "project-delete-block") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      if (block && window.confirm(`Excluir campo "${block.title || creativeProjectBlockTypeConfig(block.type).defaultTitle}"?`)) {
        item.projectBlocks = blocks.filter((candidate) => candidate.id !== block.id);
        item.projectOpenBlockId = "";
        item.projectOpenCardId = "";
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-add-view") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      if (block) {
        block.views.push(createCreativeStoryView(`Visualizacao ${block.views.length + 1}`));
      } else {
        changed = false;
      }
    } else if (action === "project-select-page") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      const view = findCreativeStoryView(block, button.dataset.projectViewId);
      const page = findCreativeStoryPage(view, button.dataset.projectPageId);
      if (view && page) {
        view.activePageId = page.id;
        item.projectOpenBlockId = "";
        item.projectOpenCardId = "";
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-add-page") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      const view = findCreativeStoryView(block, button.dataset.projectViewId);
      if (view) {
        const page = createCreativeStoryPage(`Pagina ${view.pages.length + 1}`);
        view.pages.push(page);
        view.activePageId = page.id;
      } else {
        changed = false;
      }
    } else if (action === "project-add-card") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      const view = findCreativeStoryView(block, button.dataset.projectViewId);
      const page = findCreativeStoryPage(view, button.dataset.projectPageId) || activeCreativeStoryPage(view);
      if (page) {
        const card = createCreativeStoryCard(`Novo quadro ${page.cards.length + 1}`);
        page.cards.push(card);
        item.projectOpenBlockId = "";
        item.projectOpenCardId = card.id;
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-open-card") {
      const context = findCreativeProjectCard(item, button.dataset.projectCardId);
      if (context) {
        item.projectOpenBlockId = "";
        item.projectOpenCardId = context.card.id;
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-delete-card") {
      const context = findCreativeProjectCard(item, button.dataset.projectCardId);
      if (context) {
        context.page.cards = context.page.cards.filter((card) => card.id !== context.card.id);
        item.projectOpenCardId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-add-subpage") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      if (block) {
        const page = createCreativeStoryLoosePage("");
        block.loosePages.push(page);
        item.projectOpenBlockId = "";
        item.projectOpenCardId = "";
        item.projectOpenSubpageId = page.id;
      } else {
        changed = false;
      }
    } else if (action === "project-open-subpage") {
      const context = findCreativeProjectLoosePage(item, button.dataset.projectSubpageId);
      if (context) {
        item.projectOpenBlockId = "";
        item.projectOpenCardId = "";
        item.projectOpenSubpageId = context.page.id;
      } else {
        changed = false;
      }
    } else if (action === "project-delete-subpage") {
      const context = findCreativeProjectLoosePage(item, button.dataset.projectSubpageId);
      if (context) {
        context.block.loosePages = context.block.loosePages.filter((page) => page.id !== context.page.id);
        item.projectOpenSubpageId = "";
      } else {
        changed = false;
      }
    } else if (action === "project-add-image") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      const container = button.closest(".creative-project-images") || button.closest(".creative-project-block") || button.closest(".creative-story-editor-body");
      const input = container?.querySelector("[data-creative-project-image-input]");
      if (block && input) {
        input.value = "";
        input.click();
        changed = false;
      } else {
        changed = false;
      }
    } else if (action === "project-delete-image") {
      const block = findCreativeProjectBlock(item, button.dataset.projectBlockId);
      if (block) {
        block.images = block.images.filter((image) => image.id !== button.dataset.projectImageId);
      } else {
        changed = false;
      }
    } else {
      changed = false;
    }

    if (!changed) {
      return;
    }
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    setupCreativeCanvases(item);
    restoreCreativeScrollSnapshot(scrollSnapshot);
    renderHome();
  }

  function handleCreativeStoryAction(item, action, button) {
    if (item.type !== "story") {
      return;
    }

    const workspace = ensureCreativeStoryWorkspace(item);
    const scrollSnapshot = captureCreativeScrollSnapshot();
    let changed = true;
    if (action === "story-add-view") {
      workspace.views.push(createCreativeStoryView(`Visualizacao ${workspace.views.length + 1}`));
      workspace.openFreeCardId = "";
      workspace.openCardId = "";
      workspace.openLoosePageId = "";
    } else if (action === "story-select-page") {
      const view = findCreativeStoryView(workspace, button.dataset.storyViewId);
      const page = findCreativeStoryPage(view, button.dataset.storyPageId);
      if (view && page) {
        view.activePageId = page.id;
        workspace.openFreeCardId = "";
        workspace.openCardId = "";
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-add-page") {
      const view = findCreativeStoryView(workspace, button.dataset.storyViewId);
      if (view) {
        const page = createCreativeStoryPage(`Pagina ${view.pages.length + 1}`);
        view.pages.push(page);
        view.activePageId = page.id;
        workspace.openFreeCardId = "";
        workspace.openCardId = "";
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-add-card") {
      const view = findCreativeStoryView(workspace, button.dataset.storyViewId);
      const page = findCreativeStoryPage(view, button.dataset.storyPageId) || activeCreativeStoryPage(view);
      if (page) {
        const card = createCreativeStoryCard(`Novo quadro ${page.cards.length + 1}`);
        page.cards.push(card);
        workspace.openFreeCardId = "";
        workspace.openCardId = card.id;
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-open-card") {
      const context = findCreativeStoryCard(workspace, button.dataset.storyCardId);
      if (context) {
        workspace.openFreeCardId = "";
        workspace.openCardId = context.card.id;
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-close-editor") {
      workspace.openFreeCardId = "";
      workspace.openCardId = "";
      workspace.openLoosePageId = "";
    } else if (action === "story-delete-card") {
      const context = findCreativeStoryCard(workspace, button.dataset.storyCardId);
      if (context) {
        context.page.cards = context.page.cards.filter((card) => card.id !== context.card.id);
        workspace.openCardId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-add-free-card") {
      const card = createCreativeStoryFreeCard(`Campo ${workspace.freeCards.length + 1}`, "", nextCreativeStoryFreeCardLayout(workspace.freeCards));
      workspace.freeCards.push(card);
      workspace.openFreeCardId = card.id;
      workspace.openCardId = "";
      workspace.openLoosePageId = "";
    } else if (action === "story-open-free-card") {
      const card = findCreativeStoryFreeCard(workspace, button.dataset.storyFreeId);
      if (card) {
        workspace.openFreeCardId = card.id;
        workspace.openCardId = "";
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-delete-free-card") {
      const card = findCreativeStoryFreeCard(workspace, button.dataset.storyFreeId);
      if (card) {
        workspace.freeCards = workspace.freeCards.filter((candidate) => candidate.id !== card.id);
        workspace.openFreeCardId = "";
      } else {
        changed = false;
      }
    } else if (action === "story-add-loose-page") {
      const page = createCreativeStoryLoosePage("");
      workspace.loosePages.push(page);
      workspace.openFreeCardId = "";
      workspace.openCardId = "";
      workspace.openLoosePageId = page.id;
    } else if (action === "story-open-loose-page") {
      const page = findCreativeStoryLoosePage(workspace, button.dataset.storyLooseId);
      if (page) {
        workspace.openFreeCardId = "";
        workspace.openCardId = "";
        workspace.openLoosePageId = page.id;
      } else {
        changed = false;
      }
    } else if (action === "story-delete-loose-page") {
      const page = findCreativeStoryLoosePage(workspace, button.dataset.storyLooseId);
      if (page) {
        workspace.loosePages = workspace.loosePages.filter((candidate) => candidate.id !== page.id);
        workspace.openLoosePageId = "";
      } else {
        changed = false;
      }
    } else {
      changed = false;
    }

    if (!changed) {
      return;
    }
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    restoreCreativeScrollSnapshot(scrollSnapshot);
    renderHome();
  }

  function updateCreativeStoryNestedField(item, field) {
    const workspace = ensureCreativeStoryWorkspace(item);
    const value = getCreativeFieldValue(field);
    const storyField = field.dataset.creativeStoryField;
    const view = findCreativeStoryView(workspace, field.dataset.storyViewId);
    const page = findCreativeStoryPage(view, field.dataset.storyPageId);
    const card = field.dataset.storyCardId ? findCreativeStoryCard(workspace, field.dataset.storyCardId)?.card : null;
    const loosePage = findCreativeStoryLoosePage(workspace, field.dataset.storyLooseId);
    const freeCard = findCreativeStoryFreeCard(workspace, field.dataset.storyFreeId);

    if (storyField === "viewTitle" && view) {
      view.title = normalizeCreativeText(value, 80) || "Sem titulo";
    } else if (storyField === "pageTitle" && page) {
      page.title = normalizeCreativeText(value, 80) || "Sem titulo";
    } else if (storyField === "cardTitle" && card) {
      card.title = normalizeCreativeText(value, 100);
    } else if (storyField === "cardDescription" && card) {
      card.description = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    } else if (storyField === "looseTitle" && loosePage) {
      loosePage.title = normalizeCreativeText(value, 100);
    } else if (storyField === "looseBody" && loosePage) {
      loosePage.body = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    } else if (storyField === "freeTitle" && freeCard) {
      freeCard.title = normalizeCreativeText(value, 100);
    } else if (storyField === "freeBody" && freeCard) {
      freeCard.body = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    }
  }

  function updateCreativeProjectNestedField(item, field) {
    const value = getCreativeFieldValue(field);
    const projectField = field.dataset.creativeProjectField;
    const block = findCreativeProjectBlock(item, field.dataset.projectBlockId);
    const view = findCreativeStoryView(block, field.dataset.projectViewId);
    const page = findCreativeStoryPage(view, field.dataset.projectPageId);
    const card = field.dataset.projectCardId ? findCreativeProjectCard(item, field.dataset.projectCardId)?.card : null;
    const loosePage = field.dataset.projectSubpageId ? findCreativeProjectLoosePage(item, field.dataset.projectSubpageId)?.page : null;

    if (projectField === "blockTitle" && block) {
      block.title = normalizeCreativeText(value, 100) || creativeProjectBlockTypeConfig(block.type).defaultTitle;
    } else if (projectField === "blockBody" && block) {
      block.body = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    } else if (projectField === "blockCode" && block) {
      block.code = normalizeCreativeText(value, 40000);
    } else if (projectField === "viewTitle" && view) {
      view.title = normalizeCreativeText(value, 80) || "Sem titulo";
    } else if (projectField === "pageTitle" && page) {
      page.title = normalizeCreativeText(value, 80) || "Sem titulo";
    } else if (projectField === "cardTitle" && card) {
      card.title = normalizeCreativeText(value, 100);
    } else if (projectField === "cardDescription" && card) {
      card.description = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    } else if (projectField === "looseTitle" && loosePage) {
      loosePage.title = normalizeCreativeText(value, 100);
    } else if (projectField === "looseBody" && loosePage) {
      loosePage.body = normalizeCreativeRichHtml(value, CREATIVE_RICH_CONTENT_LIMIT);
    }
  }

  function handleCreativeItemSubmit(event) {
    event.preventDefault();

    const items = ensureCreativeItems();
    const now = new Date().toISOString();
    const id = els.creativeItemId.value;
    const existing = id ? items.find((item) => item.id === id) : null;
    const type = normalizeCreativeType(els.creativeItemType.value);
    const payload = {
      id: existing?.id || createId("creative"),
      type,
      title: normalizeCreativeText(els.creativeItemTitle.value, 120) || creativeTypeConfig(type).singular,
      status: normalizeCreativeStatus(els.creativeItemStatus.value),
      tags: normalizeCreativeText(els.creativeItemTags.value, 160),
      link: normalizeCreativeText(els.creativeItemLink.value, 600),
      imageUrl: normalizeCreativeImageSource(els.creativeItemImageUrl.value),
      modelUrl: normalizeCreativeText(els.creativeItemModelUrl.value, 1200),
      reference: normalizeCreativeText(els.creativeItemReference.value, 4000),
      content: normalizeCreativeText(els.creativeItemContent.value, 12000),
      language: normalizeCreativeLanguage(els.creativeItemLanguage.value),
      code: normalizeCreativeText(els.creativeItemCode.value, 20000),
      output: normalizeCreativeText(els.creativeItemOutput.value, 4000),
      lastRunOutput: existing?.lastRunOutput || "",
      sketchData: existing?.sketchData || "",
      whiteboardAssets: existing?.whiteboardAssets || [],
      projectBlocks: existing?.projectBlocks || [],
      projectOpenBlockId: existing?.projectOpenBlockId || "",
      projectOpenCardId: existing?.projectOpenCardId || "",
      projectOpenSubpageId: existing?.projectOpenSubpageId || "",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, payload);
      showToast("Criacao atualizada.");
    } else {
      items.unshift(payload);
      showToast("Criacao adicionada.");
    }

    activeCreativeItemId = payload.id;
    activeCreativeType = payload.type;
    closeCreativeItemDialog();
    saveState();
    renderCreative();
    renderHome();
  }

  function openCreativeItemDialog(itemId = "", type = "") {
    const item = itemId ? findCreativeItem(itemId) : null;
    resetCreativeItemForm(type || item?.type || "story");

    if (item) {
      els.creativeItemId.value = item.id;
      els.creativeItemTitle.value = item.title || "";
      els.creativeItemType.value = normalizeCreativeType(item.type);
      els.creativeItemStatus.value = normalizeCreativeStatus(item.status);
      els.creativeItemTags.value = item.tags || "";
      els.creativeItemLink.value = item.link || "";
      els.creativeItemImageUrl.value = item.imageUrl || "";
      els.creativeItemModelUrl.value = item.modelUrl || "";
      els.creativeItemReference.value = item.reference || "";
      els.creativeItemContent.value = item.content || "";
      els.creativeItemLanguage.value = normalizeCreativeLanguage(item.language);
      els.creativeItemCode.value = item.code || "";
      els.creativeItemOutput.value = item.output || "";
      els.creativeItemDialogTitle.textContent = "Editar criação";
      els.creativeItemFormSubtitle.textContent = creativeTypeConfig(item.type).label;
      els.creativeItemSubmitLabel.textContent = "Salvar criação";
      updateCreativeDialogTypeFields(item.type);
    }

    if (typeof els.creativeItemDialog.showModal === "function") {
      els.creativeItemDialog.showModal();
    } else {
      els.creativeItemDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.creativeItemTitle.focus());
  }

  function closeCreativeItemDialog() {
    if (!els.creativeItemDialog) {
      return;
    }

    if (els.creativeItemDialog.open && typeof els.creativeItemDialog.close === "function") {
      els.creativeItemDialog.close();
    } else {
      els.creativeItemDialog.removeAttribute("open");
    }

    resetCreativeItemForm();
  }

  function resetCreativeItemForm(type = "story") {
    if (!els.creativeItemForm) {
      return;
    }

    const normalizedType = normalizeCreativeType(type);
    els.creativeItemForm.reset();
    els.creativeItemId.value = "";
    els.creativeItemType.value = normalizedType;
    els.creativeItemStatus.value = "idea";
    els.creativeItemLanguage.value = normalizedType === "code" ? "python" : "text";
    els.creativeItemDialogTitle.textContent = "Nova criação";
    els.creativeItemFormSubtitle.textContent = creativeTypeConfig(normalizedType).label;
    els.creativeItemSubmitLabel.textContent = "Adicionar criação";
    updateCreativeDialogTypeFields(normalizedType);
  }

  function updateCreativeDialogTypeFields(type) {
    const normalizedType = normalizeCreativeType(type);
    const isCode = normalizedType === "code";
    const isImage = normalizedType === "image";
    const isModel = normalizedType === "model3d";
    if (els.creativeImageField) {
      els.creativeImageField.hidden = !isImage;
    }
    if (els.creativeModelField) {
      els.creativeModelField.hidden = !isModel;
    }
    if (els.creativeLanguageField) {
      els.creativeLanguageField.hidden = !isCode;
    }
    if (els.creativeCodeField) {
      els.creativeCodeField.hidden = !isCode;
    }
    if (els.creativeItemFormSubtitle) {
      els.creativeItemFormSubtitle.textContent = creativeTypeConfig(normalizedType).label;
    }
    if (isCode && els.creativeItemLanguage.value === "text") {
      els.creativeItemLanguage.value = "python";
    }
  }

  function deleteCreativeItem(item) {
    if (!window.confirm(`Excluir "${item.title}" da area criativa?`)) {
      return;
    }

    state.creativeItems = ensureCreativeItems().filter((entry) => entry.id !== item.id);
    if (activeCreativeItemId === item.id) {
      activeCreativeItemId = "";
    }
    saveState();
    renderCreative();
    renderHome();
    showToast("Criacao removida.");
  }

  function saveCreativePlaylist(item) {
    const container = els.creativeDetail?.querySelector(".creative-playlist-layout");
    if (!container) {
      return;
    }

    const genreField = container.querySelector("[data-playlist-editor-field='genre']");
    const nameField = container.querySelector("[data-playlist-editor-field='name']");
    const styleField = container.querySelector("[data-playlist-editor-field='style']");
    const tracksField = container.querySelector("[data-playlist-editor-field='tracks']");
    const playlistIdField = container.querySelector("[data-playlist-editor-id]");
    const categoriesField = container.querySelector("[data-creative-live-field='playlistGenres']");

    if (categoriesField) {
      item.playlistGenres = normalizeCreativeText(categoriesField.value, 12000);
    }

    const categories = creativePlaylistCategories(item);
    const genre = normalizeCreativeText(genreField?.value || categories[0] || "Geral", 80).trim() || "Geral";
    const name = normalizeCreativeText(nameField?.value || "", 120).trim();
    const style = normalizeCreativeText(styleField?.value || "", 2000).trim();
    const tracks = creativePlaylistTextLines(tracksField?.value || "");

    if (!name) {
      showToast("Informe o nome da playlist.");
      nameField?.focus();
      return;
    }

    if (!tracks.length) {
      showToast("Adicione pelo menos uma musica.");
      tracksField?.focus();
      return;
    }

    const now = new Date().toISOString();
    const playlistState = parseCreativePlaylistState(item);
    const existingId = String(playlistIdField?.value || "").trim();
    const existingIndex = playlistState.playlists.findIndex((playlist) => playlist.id === existingId);
    const playlist = {
      id: existingIndex >= 0 ? playlistState.playlists[existingIndex].id : createId("playlist"),
      genre,
      name,
      style,
      tracks,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      playlistState.playlists.splice(existingIndex, 1, playlist);
    } else {
      playlistState.playlists.unshift(playlist);
    }

    item.playlistTracks = normalizeCreativeText(tracks.join("\n"), 12000);
    item.playlistCollections = normalizeCreativeText(serializeCreativePlaylistState(playlistState.playlists, playlist.id), 40000);
    item.updatedAt = now;
    saveState();
    renderCreative();
    renderHome();
    showToast(existingIndex >= 0 ? "Playlist atualizada." : "Playlist salva.");
  }

  function selectCreativePlaylist(item, playlistId) {
    const playlistState = parseCreativePlaylistState(item);
    const selected = playlistState.playlists.find((playlist) => playlist.id === playlistId);
    if (!selected) {
      return;
    }
    item.playlistTracks = normalizeCreativeText(selected.tracks.join("\n"), 12000);
    item.playlistCollections = normalizeCreativeText(serializeCreativePlaylistState(playlistState.playlists, selected.id), 40000);
    item.updatedAt = new Date().toISOString();
    saveState({ backup: false });
    renderCreative();
  }

  function deleteCreativePlaylist(item, playlistId) {
    const playlistState = parseCreativePlaylistState(item);
    const selected = playlistState.playlists.find((playlist) => playlist.id === playlistId);
    if (!selected) {
      return;
    }
    if (!window.confirm(`Excluir playlist "${selected.name}"?`)) {
      return;
    }
    const playlists = playlistState.playlists.filter((playlist) => playlist.id !== playlistId);
    const activeId = playlistState.activeId === playlistId ? playlists[0]?.id || "" : playlistState.activeId;
    item.playlistCollections = normalizeCreativeText(serializeCreativePlaylistState(playlists, activeId), 40000);
    item.playlistTracks = activeId ? normalizeCreativeText((playlists.find((playlist) => playlist.id === activeId)?.tracks || []).join("\n"), 12000) : "";
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    renderHome();
    showToast("Playlist removida.");
  }

  function resetCreativePlaylistDraft(item) {
    const playlistState = parseCreativePlaylistState(item);
    item.playlistCollections = normalizeCreativeText(serializeCreativePlaylistState(playlistState.playlists, ""), 40000);
    item.playlistTracks = "";
    item.updatedAt = new Date().toISOString();
    saveState({ backup: false });
    renderCreative();
  }

  function runCreativeCodeFromDetail(item) {
    const codeField = els.creativeDetail?.querySelector("[data-creative-live-field='code']");
    const languageField = els.creativeDetail?.querySelector("[data-creative-live-field='language']");
    const output = els.creativeDetail?.querySelector("[data-creative-run-output]");
    const code = normalizeCreativeText(codeField?.value ?? item.code, 20000);
    const language = normalizeCreativeLanguage(languageField?.value || item.language);
    item.code = code;
    item.language = language;
    item.updatedAt = new Date().toISOString();

    if (!output) {
      return;
    }

    if (!code.trim()) {
      output.textContent = "Nada para executar.";
      item.lastRunOutput = output.textContent;
      saveState();
      return;
    }

    if (language === "html") {
      output.textContent = "";
      const frame = document.createElement("iframe");
      frame.className = "creative-preview-frame";
      frame.sandbox = "allow-scripts";
      frame.srcdoc = code;
      output.replaceChildren(frame);
      item.lastRunOutput = "Preview HTML renderizada.";
      saveState();
      showToast("Preview HTML atualizado.");
      return;
    }

    output.textContent = "Executando...";
    if (language === "javascript") {
      runCreativeJavaScript(code).then((result) => {
        item.lastRunOutput = result;
        output.textContent = result;
        saveState();
      });
      return;
    }

    const result = runCreativePythonSimulation(code);
    item.lastRunOutput = result;
    output.textContent = result;
    saveState();
  }

  function applyCreativeCodeTemplate(item, templateIndex) {
    const template = CREATIVE_CODE_CHALLENGES[Number(templateIndex)] || CREATIVE_CODE_CHALLENGES[0];
    if (!template || item.type !== "code") {
      return;
    }
    item.title = item.title || template.title;
    item.tags = template.tags;
    item.language = normalizeCreativeLanguage(template.language);
    item.code = template.code;
    item.output = template.output;
    item.lastRunOutput = "";
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    showToast("Desafio aplicado.");
  }

  function applyCreativeDashboardTemplate(item, templateIndex) {
    const template = CREATIVE_DASHBOARD_CHALLENGES[Number(templateIndex)] || CREATIVE_DASHBOARD_CHALLENGES[0];
    if (!template || item.type !== "dashboard") {
      return;
    }
    item.title = item.title || template.title;
    item.tags = template.tags;
    item.dashboardBrief = template.brief;
    item.dashboardDataset = template.dataset;
    item.dashboardMetrics = template.metrics;
    item.dashboardVisuals = template.visuals;
    item.dashboardSql = template.sql;
    item.dashboardChecklist = template.checklist;
    item.dashboardInsights = template.insights;
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    showToast("Desafio de dashboard aplicado.");
  }

  function applyCreativeOtherTemplate(item, templateIndex) {
    const template = CREATIVE_OTHER_IDEAS[Number(templateIndex)] || CREATIVE_OTHER_IDEAS[0];
    if (!template || item.type !== "other") {
      return;
    }
    item.title = item.title || template.title;
    item.otherBrief = template.text;
    item.otherSteps = "1. Pesquisar referencias\n2. Montar prototipo pequeno\n3. Testar\n4. Anotar melhoria\n5. Fazer proxima versao";
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    showToast("Ideia aplicada.");
  }

  function handleCreativeFileImport(input) {
    const item = findCreativeItem(activeCreativeItemId);
    const file = input.files?.[0];
    if (!item || !file) {
      return;
    }

    const importType = input.dataset.creativeFileImport;
    if (importType === "dashboard") {
      item.link = file.name;
      item.updatedAt = new Date().toISOString();
      saveState();
      renderCreative();
      showToast("Arquivo de dashboard registrado.");
      return;
    }
    if (importType === "model") {
      item.modelUrl = file.name;
      item.updatedAt = new Date().toISOString();
      saveState();
      renderCreative();
      showToast("Arquivo de modelo registrado.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Escolha um arquivo de imagem.");
      return;
    }

    readCreativeRichImageFile(file)
      .then((image) => {
        item.imageUrl = normalizeCreativeImageSource(image.src);
        item.updatedAt = new Date().toISOString();
        saveState();
        renderCreative();
        showToast("Imagem importada.");
      })
      .catch(() => {
        showToast("Nao foi possivel importar a imagem.");
      });
  }

  function setupCreativeCanvases(item) {
    if (!els.creativeDetail || !item) {
      return;
    }
    els.creativeDetail.querySelectorAll("[data-creative-canvas]").forEach((canvas) => setupCreativeCanvasElement(item, canvas));
  }

  function setupCreativeCanvasElement(item, canvas) {
    const whiteboard = canvas.closest("[data-creative-whiteboard]");
    const target = creativeWhiteboardTargetForElement(item, whiteboard);
    if (!canvas || !target) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#f6f7fb";
    context.lineWidth = 3;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#090915";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const sketchData = target.getSketch();
    if (sketchData) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.src = sketchData;
    }

    let drawing = false;
    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
        width: Math.max(2, (event.pressure || 0.5) * 6),
      };
    };
    const saveSketch = () => {
      target.setSketch(canvas.toDataURL("image/png"));
      item.updatedAt = new Date().toISOString();
      saveState({ backup: false });
      renderHome();
    };
    canvas.onpointerdown = (event) => {
      whiteboard?.focus({ preventScroll: true });
      drawing = true;
      canvas.setPointerCapture?.(event.pointerId);
      const start = point(event);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineWidth = start.width;
    };
    canvas.onpointermove = (event) => {
      if (!drawing) {
        return;
      }
      const next = point(event);
      context.lineWidth = next.width;
      context.lineTo(next.x, next.y);
      context.stroke();
    };
    canvas.onpointerup = (event) => {
      if (!drawing) {
        return;
      }
      drawing = false;
      canvas.releasePointerCapture?.(event.pointerId);
      saveSketch();
    };
    canvas.onpointercancel = () => {
      drawing = false;
      saveSketch();
    };
  }

  function clearCreativeCanvas(item, button = null) {
    const whiteboard = button?.closest("[data-creative-whiteboard]") || els.creativeDetail?.querySelector("[data-creative-whiteboard]");
    const target = creativeWhiteboardTargetForElement(item, whiteboard);
    if (!item || !target) {
      return;
    }
    target.setSketch("");
    target.setAssets([]);
    item.updatedAt = new Date().toISOString();
    saveState();
    renderCreative();
    renderHome();
    showToast("Lousa limpa.");
  }

  function runCreativeJavaScript(code) {
    const token = `creative-${Date.now()}-${creativeRunToken += 1}`;
    return new Promise((resolve) => {
      const frame = document.createElement("iframe");
      frame.className = "creative-sandbox-frame";
      frame.sandbox = "allow-scripts";
      let settled = false;
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        frame.remove();
      };
      const finish = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(result || "Sem saida.");
      };
      const onMessage = (event) => {
        if (event.source !== frame.contentWindow || event.data?.source !== "creative-runner" || event.data?.token !== token) {
          return;
        }
        finish(String(event.data.output || ""));
      };
      window.addEventListener("message", onMessage);
      window.setTimeout(() => finish("Tempo limite atingido."), 1800);
      frame.srcdoc = `
        <!doctype html>
        <html><body><script>
          const logs = [];
          const push = (...args) => logs.push(args.map((value) => {
            if (typeof value === "string") return value;
            try { return JSON.stringify(value); } catch (error) { return String(value); }
          }).join(" "));
          const consoleProxy = { log: push, warn: push, error: push, info: push };
          try {
            const result = Function("console", ${JSON.stringify(code)})(consoleProxy);
            if (result !== undefined) push(result);
          } catch (error) {
            push((error && error.name ? error.name : "Erro") + ": " + (error && error.message ? error.message : String(error)));
          }
          parent.postMessage({ source: "creative-runner", token: ${JSON.stringify(token)}, output: logs.join("\\n") || "Sem saida." }, "*");
        <\/script></body></html>
      `;
      frame.hidden = true;
      document.body.appendChild(frame);
    });
  }

  function runCreativePythonSimulation(code) {
    const scope = {};
    const output = [];
    const lines = String(code || "").split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      try {
        const printMatch = trimmed.match(/^print\((.*)\)$/);
        if (printMatch) {
          output.push(splitCreativePythonArgs(printMatch[1]).map((part) => String(evaluateCreativePythonExpression(part, scope))).join(" "));
          return;
        }

        const assignmentMatch = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (assignmentMatch) {
          scope[assignmentMatch[1]] = evaluateCreativePythonExpression(assignmentMatch[2], scope);
          return;
        }

        output.push(String(evaluateCreativePythonExpression(trimmed, scope)));
      } catch (error) {
        output.push(`Linha ${index + 1}: ${error.message}`);
      }
    });

    return output.length
      ? output.join("\n")
      : "Simulador Python simples: use print(...), variaveis e expressoes numericas.";
  }

  function splitCreativePythonArgs(value) {
    const parts = [];
    let current = "";
    let quote = "";
    for (const char of String(value || "")) {
      if ((char === '"' || char === "'") && !quote) {
        quote = char;
      } else if (char === quote) {
        quote = "";
      }

      if (char === "," && !quote) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      parts.push(current.trim());
    }
    return parts.length ? parts : [String(value || "")];
  }

  function evaluateCreativePythonExpression(expression, scope) {
    const value = String(expression || "").trim();
    if (!value) {
      return "";
    }
    if (/^(['"]).*\1$/.test(value)) {
      return value.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    }
    if (/^(True|False)$/i.test(value)) {
      return /^true$/i.test(value);
    }
    if (/^[A-Za-z_]\w*$/.test(value)) {
      if (Object.prototype.hasOwnProperty.call(scope, value)) {
        return scope[value];
      }
      throw new Error(`variavel "${value}" nao existe`);
    }

    const numericExpression = value.replace(/\b[A-Za-z_]\w*\b/g, (name) => {
      if (!Object.prototype.hasOwnProperty.call(scope, name)) {
        throw new Error(`variavel "${name}" nao existe`);
      }
      const scopedValue = scope[name];
      if (typeof scopedValue !== "number") {
        throw new Error(`"${name}" nao e numerico`);
      }
      return String(scopedValue);
    });

    if (!/^[\d\s+\-*/%().]+$/.test(numericExpression)) {
      throw new Error("comando fora do simulador simples");
    }

    const result = Function(`"use strict"; return (${numericExpression});`)();
    if (!Number.isFinite(Number(result))) {
      throw new Error("resultado invalido");
    }
    return result;
  }

  function ensureCreativeItems() {
    state.creativeItems = normalizeCreativeItems(state.creativeItems || []);
    return state.creativeItems;
  }

  function ensureCreativeActiveItem(items = ensureCreativeItems()) {
    if (activeCreativeItemId && items.some((item) => item.id === activeCreativeItemId)) {
      return;
    }
    activeCreativeItemId = "";
  }

  function ensureCreativeActiveType() {
    activeCreativeType = normalizeCreativeType(activeCreativeType || findCreativeItem(activeCreativeItemId)?.type || "story");
  }

  function creativeTypeGuide(type) {
    return CREATIVE_TYPE_GUIDES[normalizeCreativeType(type)] || CREATIVE_TYPE_GUIDES.story;
  }

  function creativeItemsByType(type) {
    const normalizedType = normalizeCreativeType(type);
    return ensureCreativeItems()
      .filter((item) => item.type === normalizedType)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }

  function activeCreativeItemForType(type, items = creativeItemsByType(type)) {
    const normalizedType = normalizeCreativeType(type);
    if (activeCreativeItemId) {
      const active = items.find((item) => item.id === activeCreativeItemId && item.type === normalizedType);
      if (active) {
        return active;
      }
    }
    return items[0] || null;
  }

  function selectedCreativeItemForType(type, items = creativeItemsByType(type)) {
    const normalizedType = normalizeCreativeType(type);
    if (!activeCreativeItemId) {
      return null;
    }
    return items.find((item) => item.id === activeCreativeItemId && item.type === normalizedType) || null;
  }

  function findCreativeItem(itemId) {
    return ensureCreativeItems().find((item) => item.id === itemId) || null;
  }

  function getCreativeStats() {
    const items = ensureCreativeItems();
    const total = items.length;
    const doneCount = items.filter((item) => item.status === "done").length;
    const activeCount = items.filter((item) => !["done", "archived"].includes(item.status)).length;
    const storyCount = items.filter((item) => item.type === "story").length;
    const codeCount = items.filter((item) => item.type === "code").length;
    const referenceCount = items.filter((item) => item.reference || item.imageUrl || item.link || item.modelUrl).length;
    const doneRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    return {
      total,
      doneCount,
      activeCount,
      storyCount,
      codeCount,
      referenceCount,
      doneRate,
    };
  }

  function creativeWorkspaceCounts(item) {
    if (!item) {
      return [];
    }
    if (item.type === "story") {
      return [
        `${creativeWordCount(item.content)} palavras`,
        item.characters ? "personagens" : "sem personagens",
        item.world ? "mundo iniciado" : "sem mundo",
      ];
    }
    if (item.type === "code") {
      return [
        CREATIVE_LANGUAGES[item.language] || "Codigo",
        item.lastRunOutput ? "testado" : "nao testado",
      ];
    }
    if (item.type === "image") {
      return [
        item.imageUrl ? "imagem importada" : "sem imagem",
        item.sketchData ? "lousa salva" : "lousa vazia",
      ];
    }
    if (item.type === "model3d") {
      return [
        item.modelUrl ? "arquivo registrado" : "sem arquivo",
        item.modelChecklist ? "checklist iniciado" : "sem checklist",
      ];
    }
    if (item.type === "dashboard") {
      return [
        item.dashboardMetrics ? "metricas definidas" : "sem metricas",
        item.dashboardSql ? "SQL/DAX salvo" : "sem SQL/DAX",
        item.dashboardChecklist ? "checklist iniciado" : "sem checklist",
      ];
    }
    if (item.type === "playlist") {
      const playlistState = parseCreativePlaylistState(item);
      return [
        `${creativePlaylistCategories(item).length} categorias`,
        `${playlistState.playlists.length} playlists`,
        `${creativePlaylistTrackCount(playlistState.playlists)} musicas`,
      ];
    }
    return [
      item.otherBrief ? "briefing" : "sem briefing",
      item.otherSteps ? "passos" : "sem passos",
    ];
  }

  function normalizeCreativeItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item && (item.title || item.name || item.content || item.code || item.reference || item.storyDescription || item.storyWorkspace || item.projectBlocks || item.project_blocks))
      .map((item) => {
        const type = normalizeCreativeType(item.type || item.kind || item.category);
        const now = new Date().toISOString();
        const normalizeStoryBody = (value, limit = 12000) => type === "story" ? normalizeCreativeRichHtml(value, limit) : normalizeCreativeText(value, limit);
        return {
          id: item.id || createId("creative"),
          type,
          title: normalizeCreativeText(item.title || item.name || creativeTypeConfig(type).singular, 120),
          status: normalizeCreativeStatus(item.status || item.stage),
          tags: normalizeCreativeText(Array.isArray(item.tags) ? item.tags.join(", ") : item.tags || "", 160),
          link: normalizeCreativeText(item.link || item.url || item.path || "", 600),
          imageUrl: normalizeCreativeImageSource(item.imageUrl || item.image_url || item.image || item.cover || ""),
          modelUrl: normalizeCreativeText(item.modelUrl || item.model_url || item.model || item.file || "", 1200),
          reference: normalizeCreativeText(item.reference || item.references || item.brief || item.notes || "", 4000),
          content: normalizeStoryBody(item.content || item.text || item.body || item.story || "", CREATIVE_RICH_CONTENT_LIMIT),
          language: normalizeCreativeLanguage(item.language || item.lang || (type === "code" ? "python" : "text")),
          code: normalizeCreativeText(item.code || item.snippet || "", 20000),
          output: normalizeCreativeText(item.output || item.result || item.expectedOutput || item.expected_output || "", 4000),
          lastRunOutput: normalizeCreativeText(item.lastRunOutput || item.last_run_output || "", 4000),
          storyDescription: normalizeCreativeRichHtml(item.storyDescription || item.story_description || item.descriptionHtml || item.description || "", CREATIVE_RICH_CONTENT_LIMIT),
          idea: normalizeStoryBody(item.idea || item.initialIdea || item.initial_idea || "", CREATIVE_RICH_CONTENT_LIMIT),
          synopsis: normalizeStoryBody(item.synopsis || item.sinopse || "", CREATIVE_RICH_CONTENT_LIMIT),
          characters: normalizeStoryBody(item.characters || item.personagens || "", CREATIVE_RICH_CONTENT_LIMIT),
          world: normalizeStoryBody(item.world || item.worldbuilding || item.mundo || "", CREATIVE_RICH_CONTENT_LIMIT),
          outline: normalizeStoryBody(item.outline || item.structure || item.estrutura || "", CREATIVE_RICH_CONTENT_LIMIT),
          scenes: normalizeStoryBody(item.scenes || item.cenas || "", CREATIVE_RICH_CONTENT_LIMIT),
          mood: normalizeStoryBody(item.mood || item.moodboard || "", CREATIVE_RICH_CONTENT_LIMIT),
          annotations: normalizeCreativeText(item.annotations || item.anotacoes || "", 12000),
          sketchData: normalizeCreativeImageSource(item.sketchData || item.sketch_data || "", CREATIVE_RICH_CONTENT_LIMIT),
          whiteboardAssets: normalizeCreativeWhiteboardAssets(item.whiteboardAssets || item.whiteboard_assets || []),
          modelBrief: normalizeCreativeText(item.modelBrief || item.model_brief || "", 12000),
          modelChecklist: normalizeCreativeText(item.modelChecklist || item.model_checklist || "", 12000),
          materials: normalizeCreativeText(item.materials || item.materiais || "", 12000),
          dashboardBrief: normalizeCreativeText(item.dashboardBrief || item.dashboard_brief || "", 12000),
          dashboardDataset: normalizeCreativeText(item.dashboardDataset || item.dashboard_dataset || "", 12000),
          dashboardMetrics: normalizeCreativeText(item.dashboardMetrics || item.dashboard_metrics || "", 12000),
          dashboardVisuals: normalizeCreativeText(item.dashboardVisuals || item.dashboard_visuals || "", 12000),
          dashboardSql: normalizeCreativeText(item.dashboardSql || item.dashboard_sql || "", 12000),
          dashboardChecklist: normalizeCreativeText(item.dashboardChecklist || item.dashboard_checklist || "", 12000),
          dashboardInsights: normalizeCreativeText(item.dashboardInsights || item.dashboard_insights || "", 12000),
          playlistGenres: normalizeCreativeText(item.playlistGenres || item.playlist_genres || "", 12000),
          playlistTracks: normalizeCreativeText(item.playlistTracks || item.playlist_tracks || "", 12000),
          playlistCollections: normalizeCreativeText(item.playlistCollections || item.playlist_collections || "", 40000),
          playlistMood: normalizeCreativeText(item.playlistMood || item.playlist_mood || "", 12000),
          playlistRules: normalizeCreativeText(item.playlistRules || item.playlist_rules || "", 12000),
          playlistNotes: normalizeCreativeText(item.playlistNotes || item.playlist_notes || "", 12000),
          storyWorkspace: type === "story" ? normalizeCreativeStoryWorkspace(item.storyWorkspace || item.story_workspace || item.storyViews || item.story_views || null) : null,
          projectBlocks: normalizeCreativeProjectBlocks(item.projectBlocks || item.project_blocks || item.blocks || []),
          projectOpenBlockId: normalizeCreativeText(item.projectOpenBlockId || item.project_open_block_id || "", 120),
          projectOpenCardId: normalizeCreativeText(item.projectOpenCardId || item.project_open_card_id || "", 120),
          projectOpenSubpageId: normalizeCreativeText(item.projectOpenSubpageId || item.project_open_subpage_id || "", 120),
          otherBrief: normalizeCreativeText(item.otherBrief || item.other_brief || "", 12000),
          otherSteps: normalizeCreativeText(item.otherSteps || item.other_steps || "", 12000),
          createdAt: item.createdAt || item.created_at || now,
          updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || now,
        };
      });
  }

  function normalizeCreativeType(value) {
    const key = String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const legacyMap = {
      historia: "story",
      historias: "story",
      story: "story",
      text: "story",
      texto: "story",
      code: "code",
      codigo: "code",
      programacao: "code",
      python: "code",
      javascript: "code",
      image: "image",
      imagem: "image",
      imagens: "image",
      ilustracao: "image",
      ilustracoes: "image",
      "3d": "model3d",
      model: "model3d",
      modelo: "model3d",
      "modelo-3d": "model3d",
      model3d: "model3d",
      dashboard: "dashboard",
      dashboards: "dashboard",
      relatorio: "dashboard",
      relatorios: "dashboard",
      powerbi: "dashboard",
      "power-bi": "dashboard",
      bi: "dashboard",
      sql: "dashboard",
      playlist: "playlist",
      playlists: "playlist",
      musica: "playlist",
      musicas: "playlist",
      music: "playlist",
      other: "other",
      outro: "other",
      outros: "other",
      coringa: "other",
      teste: "other",
    };
    return legacyMap[key] || (Object.prototype.hasOwnProperty.call(CREATIVE_TYPES, key) ? key : "story");
  }

  function normalizeCreativeStatus(value) {
    const key = String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const legacyMap = {
      ideia: "idea",
      idea: "idea",
      draft: "draft",
      rascunho: "draft",
      testing: "testing",
      teste: "testing",
      testando: "testing",
      done: "done",
      feito: "done",
      concluido: "done",
      archived: "archived",
      arquivo: "archived",
      arquivado: "archived",
    };
    return legacyMap[key] || (Object.prototype.hasOwnProperty.call(CREATIVE_STATUSES, key) ? key : "idea");
  }

  function normalizeCreativeLanguage(value) {
    const key = String(value || "").trim().toLowerCase();
    if (key === "js") {
      return "javascript";
    }
    return Object.prototype.hasOwnProperty.call(CREATIVE_LANGUAGES, key) ? key : "python";
  }

  function normalizeCreativeText(value, limit) {
    return String(value || "").slice(0, limit);
  }

  function normalizeCreativeRichHtml(value, limit = CREATIVE_RICH_CONTENT_LIMIT) {
    const raw = String(value || "").slice(0, limit);
    if (!raw.trim()) {
      return "";
    }

    const html = /<\/?[a-z][\s\S]*>/i.test(raw) ? raw : escapeHtml(raw).replace(/\r?\n/g, "<br>");
    const template = document.createElement("template");
    template.innerHTML = html;
    const allowedTags = new Set(["a", "b", "blockquote", "br", "div", "em", "figure", "font", "h1", "h2", "h3", "i", "img", "li", "ol", "p", "span", "strong", "u", "ul"]);
    const allowedStyles = new Set(["border-radius", "color", "display", "font-family", "font-size", "font-style", "font-weight", "height", "margin", "max-width", "text-decoration", "width"]);
    const sanitizeNode = (node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) {
          child.remove();
          continue;
        }

        const tag = child.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
          const fragment = document.createDocumentFragment();
          while (child.firstChild) {
            fragment.appendChild(child.firstChild);
          }
          child.replaceWith(fragment);
          sanitizeNode(node);
          return;
        }

        for (const attribute of Array.from(child.attributes)) {
          const name = attribute.name.toLowerCase();
          if (name.startsWith("on")) {
            child.removeAttribute(attribute.name);
          } else if (name === "style") {
            const style = attribute.value
              .split(";")
              .map((entry) => entry.trim())
              .filter((entry) => {
                const [property, styleValue] = entry.split(":").map((part) => part?.trim());
                return allowedStyles.has(property) && styleValue && !/url\s*\(|expression\s*\(/i.test(styleValue);
              })
              .join("; ");
            if (style) {
              child.setAttribute("style", style);
            } else {
              child.removeAttribute("style");
            }
          } else if (tag === "a" && name === "href") {
            const href = attribute.value.trim();
            if (/^(https?:|mailto:|#)/i.test(href)) {
              child.setAttribute("href", href);
              child.setAttribute("target", "_blank");
              child.setAttribute("rel", "noopener");
            } else {
              child.removeAttribute("href");
            }
          } else if (tag === "img" && name === "src") {
            const src = attribute.value.trim();
            if (/^(https?:|data:image\/(?:png|jpe?g|webp|gif);base64,)/i.test(src)) {
              child.setAttribute("src", src);
              child.setAttribute("loading", "lazy");
            } else {
              child.removeAttribute("src");
            }
          } else if (tag === "img" && ["alt", "width", "height", "loading"].includes(name)) {
            continue;
          } else if (tag === "font" && ["size", "face", "color"].includes(name)) {
            continue;
          } else if (!["target", "rel"].includes(name)) {
            child.removeAttribute(attribute.name);
          }
        }

        if (tag === "img" && !child.getAttribute("src")) {
          child.remove();
          continue;
        }

        sanitizeNode(child);
      }
    };
    sanitizeNode(template.content);
    return template.innerHTML.slice(0, limit);
  }

  function creativeRichText(value) {
    return String(value || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h1|h2|h3|blockquote)>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function creativeTypeConfig(type) {
    return CREATIVE_TYPES[normalizeCreativeType(type)] || CREATIVE_TYPES.story;
  }

  function creativeStatusConfig(status) {
    return CREATIVE_STATUSES[normalizeCreativeStatus(status)] || CREATIVE_STATUSES.idea;
  }

  function creativeTagList(tags) {
    return String(tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  function creativeItemPreview(item) {
    const source = item.type === "playlist"
      ? creativePlaylistPreview(item)
      : item.type === "code"
      ? item.code || item.output
      : item.idea || item.synopsis || item.modelBrief || item.dashboardBrief || item.dashboardMetrics || item.playlistGenres || item.playlistTracks || item.otherBrief || item.mood || item.content || item.reference || item.link || item.modelUrl;
    return String(source || "").replace(/\s+/g, " ").trim().slice(0, 140);
  }

  function creativePlaylistPreview(item) {
    const playlistState = parseCreativePlaylistState(item);
    if (playlistState.playlists.length) {
      return playlistState.playlists
        .slice(0, 3)
        .map((playlist) => `${playlist.name} (${playlist.tracks.length})`)
        .join(" - ");
    }
    return item.playlistGenres || item.playlistTracks || item.playlistNotes || item.content || "";
  }

  function creativePlaylistTrackCount(playlists) {
    return (Array.isArray(playlists) ? playlists : []).reduce((total, playlist) => total + (Array.isArray(playlist.tracks) ? playlist.tracks.length : 0), 0);
  }

  function creativeCardVisual(item) {
    if (item.type !== "image" || !item.imageUrl) {
      return "";
    }

    return `
      <div class="creative-card-image">
        <img src="${escapeHtml(item.imageUrl)}" alt="Referencia de ${escapeHtml(item.title)}" loading="lazy">
      </div>
    `;
  }

  function creativeImagePreview(imageUrl) {
    const value = String(imageUrl || "").trim();
    if (!value) {
      return `<div class="creative-asset-box">${svgIcon("icon-image")}<span>Nenhuma imagem informada</span></div>`;
    }
    return `
      <figure class="creative-reference-preview">
        <img src="${escapeHtml(value)}" alt="Referencia visual">
        <figcaption>${escapeHtml(value)}</figcaption>
      </figure>
    `;
  }

  function creativeLinkLabel(item) {
    if (item.modelUrl) {
      return "Modelo/arquivo";
    }
    if (item.imageUrl) {
      return "Referencia visual";
    }
    if (item.link) {
      return "Link salvo";
    }
    return "Sem link";
  }

  function creativeLinkHtml(item) {
    const value = String(item.link || item.modelUrl || "").trim();
    if (!value) {
      return `<span>Sem link externo</span>`;
    }
    if (/^(https?:\/\/|mailto:|tel:|file:\/\/)/i.test(value)) {
      return `<a class="creative-link" href="${escapeHtml(value)}" target="_blank" rel="noopener">Abrir referencia</a>`;
    }
    return `<span>${escapeHtml(value)}</span>`;
  }

  function creativeWordCount(value) {
    return String(value || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function countCreativeLines(value) {
    return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).length;
  }

  function formatCreativeDate(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) {
      return "agora";
    }
    return dateFormatter.format(date);
  }

  function renderMediaLibrary() {
    if (!els.mediaGrid) {
      return;
    }

    const library = ensureMediaLibrary();
    ensureMediaActiveStatus(library);
    renderMediaSummary(library);
    renderMediaTypeTabs(library);
    renderMediaSections(library);
    renderMediaManagers(library);
    renderMediaStatusTabs(library);
    renderMediaCards(library);
  }

  function renderMediaSummary(library = ensureMediaLibrary()) {
    const type = normalizeMediaType(library.activeType);
    const stats = getMediaStats(type);
    const typeLabel = mediaTypeLabel(type);

    els.mediaTotalCount.textContent = String(stats.total);
    els.mediaTotalDetail.textContent = typeLabel;
    els.mediaProgressCount.textContent = String(stats.inProgressCount);
    els.mediaProgressDetail.textContent = plural(stats.inProgressCount, "obra aberta", "obras abertas");
    els.mediaCompletedCount.textContent = String(stats.completedCount);
    els.mediaCompletedDetail.textContent = `${stats.completionRate}% fechado`;
  }

  function renderMediaTypeTabs(library = ensureMediaLibrary()) {
    const counts = getMediaTypeCounts(library);
    els.mediaTypeTabs.innerHTML = MEDIA_TYPE_ORDER.map((type) => {
      const active = type === library.activeType;
      return `
        <button class="media-type-tab${active ? " active" : ""}" type="button" data-media-type="${escapeHtml(type)}" role="tab" aria-selected="${active ? "true" : "false"}">
          ${svgIcon(mediaTypeIcon(type))}
          <span>${escapeHtml(mediaTypeLabel(type))}</span>
          <strong>${counts[type] || 0}</strong>
        </button>
      `;
    }).join("");
  }

  function renderMediaSections(library = ensureMediaLibrary()) {
    const activeSection = normalizeMediaSection(library.activeSection);
    library.activeSection = activeSection;
    els.mediaSectionButtons?.forEach((button) => {
      const isActive = button.dataset.mediaSection === activeSection;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    els.mediaSectionPanels?.forEach((panel) => {
      panel.hidden = panel.dataset.mediaSectionPanel !== activeSection;
    });
  }

  function switchMediaSection(section) {
    const library = ensureMediaLibrary();
    library.activeSection = normalizeMediaSection(section);
    saveState();
    renderMediaLibrary();
  }

  function renderMediaManagers(library = ensureMediaLibrary()) {
    const type = normalizeMediaType(library.activeType);
    const categories = mediaCategoriesForType(type, library);
    const statuses = library.statuses || [];

    els.mediaCategoryDetail.textContent = plural(categories.length, "categoria", "categorias");
    els.mediaCategoryList.innerHTML = categories.map((category) => `
      <div class="media-manager-row" data-media-category-id="${escapeHtml(category.id)}">
        <input class="inline-input" data-media-category-field="name" value="${escapeHtml(category.name)}" aria-label="Nome da categoria">
        <button class="icon-button" type="button" data-media-category-action="delete" aria-label="Excluir ${escapeHtml(category.name)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    `).join("");

    els.mediaStatusDetail.textContent = plural(statuses.length, "status", "status");
    els.mediaStatusList.innerHTML = statuses.map((status) => `
      <div class="media-manager-row media-status-manager-row" data-media-status-id="${escapeHtml(status.id)}">
        <input class="inline-input" data-media-status-field="name" value="${escapeHtml(status.name)}" aria-label="Nome do status">
        <input class="inline-input color-input" type="color" data-media-status-field="color" value="${safeColor(status.color)}" aria-label="Cor de ${escapeHtml(status.name)}">
        <button class="icon-button" type="button" data-media-status-action="delete" aria-label="Excluir ${escapeHtml(status.name)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    `).join("");
  }

  function renderMediaStatusTabs(library = ensureMediaLibrary()) {
    const type = normalizeMediaType(library.activeType);
    const counts = getMediaStatusCounts(type, library);
    els.mediaStatusTabs.innerHTML = (library.statuses || []).map((status) => {
      const active = status.id === library.activeStatus;
      const color = safeColor(status.color);
      return `
        <button class="media-status-tab${active ? " active" : ""}" type="button" data-media-status="${escapeHtml(status.id)}" role="tab" aria-selected="${active ? "true" : "false"}" style="--media-status-color:${color}">
          ${svgIcon("icon-layout")}
          <span>${escapeHtml(status.name)}</span>
          <strong>${counts[status.id] || 0}</strong>
        </button>
      `;
    }).join("");
  }

  function renderMediaCards(library = ensureMediaLibrary()) {
    const type = normalizeMediaType(library.activeType);
    const statusId = library.activeStatus;
    const items = getSortedMediaItems(library).filter((item) => item.type === type && item.statusId === statusId);
    const status = mediaStatusById(statusId, library);
    const emptyLabel = status ? status.name.toLowerCase() : "este status";

    if (!items.length) {
      els.mediaGrid.innerHTML = `
        <div class="empty-state media-empty-state">
          <strong>Nenhuma obra em ${escapeHtml(emptyLabel)}.</strong>
          <button class="button primary" type="button" data-media-action="new">
            ${svgIcon("icon-plus")}
            <span>Adicionar obra</span>
          </button>
        </div>
      `;
      return;
    }

    els.mediaGrid.innerHTML = items.map((item) => renderMediaCard(item, library)).join("");
    hydrateMediaCoverImages(els.mediaGrid);
  }

  function renderMediaCard(item, library = ensureMediaLibrary()) {
    const type = normalizeMediaType(item.type);
    const category = mediaCategoryById(type, item.categoryId, library);
    const status = mediaStatusById(item.statusId, library);
    const statusColor = safeColor(status?.color || "#64748b");
    const progressPercent = mediaItemProgressPercent(item);
    const progressLabel = mediaItemProgressLabel(item);
    const coverKey = mediaItemCoverKey(item);
    const coverHtml = item.cover
      ? `<img src="${escapeHtml(item.cover)}" alt="Capa de ${escapeHtml(item.title)}">`
      : coverKey
        ? `<img src="" alt="Capa de ${escapeHtml(item.title)}" data-media-cover-image data-media-id="${escapeHtml(item.id)}" data-media-cover-key="${escapeHtml(coverKey)}" hidden><div class="media-cover-placeholder" data-media-cover-placeholder>${svgIcon(mediaTypeIcon(type))}</div>`
        : `<div class="media-cover-placeholder">${svgIcon(mediaTypeIcon(type))}</div>`;
    const url = normalizeShoppingUrl(item.url);
    const linkHtml = url
      ? `<a class="media-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(mediaLinkLabel(url))}</a>`
      : `<span class="media-link is-empty">Sem link</span>`;
    const progressBar = Number(item.progressMax) > 0
      ? `<div class="media-card-progress" aria-hidden="true"><span style="width:${progressPercent}%"></span></div>`
      : "";

    return `
      <article class="media-card" data-media-item-id="${escapeHtml(item.id)}">
        <div class="media-cover">
          ${coverHtml}
          <input type="file" accept="image/*" hidden data-media-cover-input data-media-id="${escapeHtml(item.id)}">
          <button class="media-cover-action" type="button" data-media-action="cover" data-media-id="${escapeHtml(item.id)}">
            ${svgIcon("icon-upload")}
            <span>Capa</span>
          </button>
        </div>
        <div class="media-card-body">
          <div class="media-card-title">
            ${svgIcon("icon-book")}
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <div class="media-card-tags">
            <span>${escapeHtml(category?.name || "Sem categoria")}</span>
            <b style="--media-status-color:${statusColor}">${escapeHtml(status?.name || "Sem status")}</b>
          </div>
          <div class="media-card-progress-line">
            <span>${escapeHtml(progressLabel)}</span>
            ${Number(item.progressMax) > 0 ? `<strong>${progressPercent}%</strong>` : ""}
          </div>
          ${progressBar}
          <div class="media-card-footer">
            ${linkHtml}
            <div class="row-actions media-row-actions">
              <button class="icon-button" type="button" data-media-action="edit" data-media-id="${escapeHtml(item.id)}" aria-label="Editar ${escapeHtml(item.title)}" title="Editar">
                ${svgIcon("icon-edit")}
              </button>
              <button class="icon-button" type="button" data-media-action="delete" data-media-id="${escapeHtml(item.id)}" aria-label="Excluir ${escapeHtml(item.title)}" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function handleMediaTypeTabsClick(event) {
    const button = event.target.closest("[data-media-type]");
    if (!button) {
      return;
    }

    const library = ensureMediaLibrary();
    library.activeType = normalizeMediaType(button.dataset.mediaType);
    ensureMediaActiveStatus(library);
    saveState();
    renderMediaLibrary();
  }

  function handleMediaStatusTabsClick(event) {
    const button = event.target.closest("[data-media-status]");
    if (!button) {
      return;
    }

    const library = ensureMediaLibrary();
    const status = mediaStatusById(button.dataset.mediaStatus, library);
    if (!status) {
      return;
    }

    library.activeStatus = status.id;
    saveState();
    renderMediaLibrary();
  }

  function handleMediaGridClick(event) {
    const button = event.target.closest("[data-media-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.mediaAction;
    if (action === "new") {
      openMediaItemDialog();
      return;
    }

    const item = findMediaItem(button.dataset.mediaId);
    if (!item) {
      return;
    }

    if (action === "cover") {
      const card = button.closest("[data-media-item-id]");
      card?.querySelector("[data-media-cover-input]")?.click();
    } else if (action === "edit") {
      openMediaItemDialog(item.id);
    } else if (action === "delete") {
      deleteMediaItem(item);
    }
  }

  async function handleMediaGridChange(event) {
    const input = event.target.closest("[data-media-cover-input]");
    if (!input) {
      return;
    }

    const item = findMediaItem(input.dataset.mediaId);
    const file = input.files?.[0];
    if (!item || !file) {
      return;
    }

    const previousCover = item.cover || "";
    const previousCoverKey = mediaItemCoverKey(item);
    try {
      const cover = await resizeMediaCoverFile(file);
      const coverKey = previousCoverKey || createId("mediacover");
      await cacheMediaCoverData(coverKey, cover);
      item.cover = cover;
      item.coverKey = coverKey;
      item.updatedAt = new Date().toISOString();
      try {
        saveState();
      } catch (error) {
        item.cover = previousCover;
        item.coverKey = previousCoverKey;
        throw error;
      }
      renderMediaLibrary();
      renderHome();
      showToast("Capa atualizada.");
    } catch (error) {
      item.cover = previousCover;
      item.coverKey = previousCoverKey;
      showToast(mediaCoverErrorMessage(error));
    } finally {
      input.value = "";
    }
  }

  function handleMediaCategorySubmit(event) {
    event.preventDefault();
    const name = els.mediaCategoryName.value.trim();
    if (!name) {
      showToast("Preencha o nome da categoria.");
      return;
    }

    const library = ensureMediaLibrary();
    const type = normalizeMediaType(library.activeType);
    const categories = mediaCategoriesForType(type, library);
    const duplicate = categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast("Categoria ja existe.");
      return;
    }

    const now = new Date().toISOString();
    categories.push({
      id: createId("media-cat"),
      name,
      createdAt: now,
      updatedAt: now,
    });
    els.mediaCategoryName.value = "";
    saveState();
    renderMediaLibrary();
    showToast("Categoria adicionada.");
  }

  function handleMediaCategoryInput(event) {
    const input = event.target.closest("[data-media-category-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-media-category-id]");
    const library = ensureMediaLibrary();
    const category = mediaCategoryById(library.activeType, row?.dataset.mediaCategoryId, library);
    if (!category) {
      return;
    }

    category.name = input.value.trim() || "Categoria";
    category.updatedAt = new Date().toISOString();
    saveState();
    renderMediaLibrary();
  }

  function handleMediaCategoryClick(event) {
    const button = event.target.closest("[data-media-category-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-media-category-id]");
    deleteMediaCategory(row?.dataset.mediaCategoryId);
  }

  function handleMediaStatusSubmit(event) {
    event.preventDefault();
    const name = els.mediaStatusName.value.trim();
    if (!name) {
      showToast("Preencha o nome do status.");
      return;
    }

    const library = ensureMediaLibrary();
    const duplicate = library.statuses.some((status) => status.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast("Status ja existe.");
      return;
    }

    const now = new Date().toISOString();
    library.statuses.push({
      id: createId("media-status"),
      name,
      color: mediaStatusColor(library.statuses.length),
      createdAt: now,
      updatedAt: now,
    });
    els.mediaStatusName.value = "";
    saveState();
    renderMediaLibrary();
    showToast("Status adicionado.");
  }

  function handleMediaStatusInput(event) {
    const input = event.target.closest("[data-media-status-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-media-status-id]");
    const library = ensureMediaLibrary();
    const status = mediaStatusById(row?.dataset.mediaStatusId, library);
    if (!status) {
      return;
    }

    if (input.dataset.mediaStatusField === "color") {
      status.color = safeColor(input.value);
    } else {
      status.name = input.value.trim() || "Status";
    }
    status.updatedAt = new Date().toISOString();
    saveState();
    renderMediaLibrary();
  }

  function handleMediaStatusClick(event) {
    const button = event.target.closest("[data-media-status-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-media-status-id]");
    deleteMediaStatus(row?.dataset.mediaStatusId);
  }

  function handleMediaItemTypeChange() {
    const type = normalizeMediaType(els.mediaItemType.value);
    renderMediaItemCategoryOptions(type);
  }

  async function handleMediaDialogCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const cover = await resizeMediaCoverFile(file);
      els.mediaItemCoverData.value = cover;
      renderMediaCoverPreview(cover);
    } catch (error) {
      showToast(mediaCoverErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function handleMediaItemSubmit(event) {
    event.preventDefault();

    const library = ensureMediaLibrary();
    const now = new Date().toISOString();
    const id = els.mediaItemId.value;
    const existing = id ? library.items.find((item) => item.id === id) : null;
    const type = normalizeMediaType(els.mediaItemType.value || library.activeType);
    const categories = mediaCategoriesForType(type, library);
    const categoryId = categories.some((category) => category.id === els.mediaItemCategory.value)
      ? els.mediaItemCategory.value
      : categories[0]?.id || "";
    const status = mediaStatusById(els.mediaItemStatus.value, library) || library.statuses[0];
    const title = els.mediaItemTitle.value.trim() || "Obra sem nome";
    const progressCurrent = parseMediaProgressNumber(els.mediaItemProgressCurrent.value);
    const progressMax = parseMediaProgressNumber(els.mediaItemProgressMax.value);
    const selectedCover = els.mediaItemCoverData.value || "";
    let nextCoverKey = existing ? mediaItemCoverKey(existing) : "";
    if (selectedCover) {
      nextCoverKey = nextCoverKey || createId("mediacover");
      await cacheMediaCoverData(nextCoverKey, selectedCover);
    }

    const payload = {
      id: existing?.id || createId("media"),
      type,
      title,
      categoryId,
      statusId: status?.id || "",
      url: normalizeShoppingUrl(els.mediaItemUrl.value),
      progressCurrent,
      progressMax,
      cover: selectedCover || existing?.cover || "",
      coverKey: nextCoverKey,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const previousActiveType = library.activeType;
    const previousActiveStatus = library.activeStatus;
    let rollbackMediaItem = () => {};

    if (existing) {
      const previousItem = { ...existing };
      Object.assign(existing, payload);
      rollbackMediaItem = () => Object.assign(existing, previousItem);
    } else {
      library.items.unshift(payload);
      rollbackMediaItem = () => {
        library.items = library.items.filter((item) => item.id !== payload.id);
      };
    }

    library.activeType = type;
    library.activeStatus = payload.statusId || library.activeStatus;
    try {
      saveState();
    } catch (error) {
      rollbackMediaItem();
      library.activeType = previousActiveType;
      library.activeStatus = previousActiveStatus;
      showToast(mediaCoverErrorMessage(error));
      return;
    }

    closeMediaItemDialog();
    renderMediaLibrary();
    renderHome();
    showToast(existing ? "Obra atualizada." : "Obra adicionada.");
  }

  function openMediaItemDialog(itemId = "") {
    const library = ensureMediaLibrary();
    const item = itemId ? library.items.find((entry) => entry.id === itemId) : null;
    const type = item ? normalizeMediaType(item.type) : normalizeMediaType(library.activeType);
    resetMediaItemForm(type);

    if (item) {
      els.mediaItemId.value = item.id;
      els.mediaItemTitle.value = item.title || "";
      els.mediaItemType.value = normalizeMediaType(item.type);
      renderMediaItemCategoryOptions(els.mediaItemType.value, item.categoryId);
      renderMediaItemStatusOptions(item.statusId);
      els.mediaItemUrl.value = item.url || "";
      els.mediaItemProgressCurrent.value = Number(item.progressCurrent) ? String(item.progressCurrent) : "";
      els.mediaItemProgressMax.value = Number(item.progressMax) ? String(item.progressMax) : "";
      els.mediaItemCoverData.value = item.cover || "";
      renderMediaCoverPreview(item.cover || "");
      if (!item.cover && mediaItemCoverKey(item)) {
        hydrateMediaCoverPreview(mediaItemCoverKey(item));
      }
      els.mediaItemDialogTitle.textContent = "Editar obra";
      els.mediaItemFormSubtitle.textContent = mediaTypeLabel(type);
      els.mediaItemSubmitLabel.textContent = "Salvar obra";
    }

    if (typeof els.mediaItemDialog.showModal === "function") {
      els.mediaItemDialog.showModal();
    } else {
      els.mediaItemDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.mediaItemTitle.focus());
  }

  function closeMediaItemDialog() {
    if (!els.mediaItemDialog) {
      return;
    }

    if (els.mediaItemDialog.open && typeof els.mediaItemDialog.close === "function") {
      els.mediaItemDialog.close();
    } else {
      els.mediaItemDialog.removeAttribute("open");
    }

    resetMediaItemForm();
  }

  function resetMediaItemForm(type = ensureMediaLibrary().activeType) {
    if (!els.mediaItemForm) {
      return;
    }

    const normalizedType = normalizeMediaType(type);
    els.mediaItemForm.reset();
    els.mediaItemId.value = "";
    els.mediaItemCoverData.value = "";
    els.mediaItemDialogTitle.textContent = "Nova obra";
    els.mediaItemFormSubtitle.textContent = mediaTypeLabel(normalizedType);
    els.mediaItemSubmitLabel.textContent = "Adicionar obra";
    setSelectOptions(
      els.mediaItemType,
      MEDIA_TYPE_ORDER.map((itemType) => ({ value: itemType, label: mediaTypeLabel(itemType) })),
      normalizedType,
    );
    renderMediaItemCategoryOptions(normalizedType);
    renderMediaItemStatusOptions(ensureMediaLibrary().activeStatus);
    renderMediaCoverPreview("");
  }

  function renderMediaItemCategoryOptions(type, selectedCategoryId = "") {
    const categories = mediaCategoriesForType(type);
    setSelectOptions(
      els.mediaItemCategory,
      categories.map((category) => ({ value: category.id, label: category.name })),
      selectedCategoryId || categories[0]?.id || "",
    );
  }

  function renderMediaItemStatusOptions(selectedStatusId = "") {
    const library = ensureMediaLibrary();
    setSelectOptions(
      els.mediaItemStatus,
      library.statuses.map((status) => ({ value: status.id, label: status.name })),
      selectedStatusId || library.activeStatus || library.statuses[0]?.id || "",
    );
  }

  function renderMediaCoverPreview(cover) {
    if (!els.mediaCoverPreview) {
      return;
    }

    els.mediaCoverPreview.innerHTML = cover
      ? `<img src="${escapeHtml(cover)}" alt="Previa da capa">`
      : `<div>${svgIcon("icon-upload")}<span>Sem capa</span></div>`;
  }

  function deleteMediaItem(item) {
    if (!window.confirm(`Excluir "${item.title}" da biblioteca?`)) {
      return;
    }

    const library = ensureMediaLibrary();
    const coverKey = mediaItemCoverKey(item);
    library.items = library.items.filter((entry) => entry.id !== item.id);
    saveState();
    if (coverKey) {
      deleteMediaCoverData(coverKey).catch(() => {});
    }
    renderMediaLibrary();
    renderHome();
    showToast("Obra removida.");
  }

  function deleteMediaCategory(categoryId) {
    const library = ensureMediaLibrary();
    const type = normalizeMediaType(library.activeType);
    const categories = mediaCategoriesForType(type, library);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }
    if (categories.length <= 1) {
      showToast("Mantenha pelo menos uma categoria.");
      return;
    }

    const inUse = library.items.some((item) => item.type === type && item.categoryId === category.id);
    if (inUse && !window.confirm("Essa categoria esta em uso. Remover e mover obras para outra categoria?")) {
      return;
    }

    const fallback = categories.find((item) => item.id !== category.id);
    library.categories[type] = categories.filter((item) => item.id !== category.id);
    library.items.forEach((item) => {
      if (item.type === type && item.categoryId === category.id) {
        item.categoryId = fallback?.id || "";
        item.updatedAt = new Date().toISOString();
      }
    });
    saveState();
    renderMediaLibrary();
    showToast("Categoria removida.");
  }

  function deleteMediaStatus(statusId) {
    const library = ensureMediaLibrary();
    const status = mediaStatusById(statusId, library);
    if (!status) {
      return;
    }
    if (library.statuses.length <= 1) {
      showToast("Mantenha pelo menos um status.");
      return;
    }

    const inUse = library.items.some((item) => item.statusId === status.id);
    if (inUse && !window.confirm("Esse status esta em uso. Remover e mover obras para outro status?")) {
      return;
    }

    const fallback = library.statuses.find((item) => item.id !== status.id);
    library.statuses = library.statuses.filter((item) => item.id !== status.id);
    library.items.forEach((item) => {
      if (item.statusId === status.id) {
        item.statusId = fallback?.id || "";
        item.updatedAt = new Date().toISOString();
      }
    });
    if (library.activeStatus === status.id) {
      library.activeStatus = fallback?.id || library.statuses[0]?.id || "";
    }
    saveState();
    renderMediaLibrary();
    renderHome();
    showToast("Status removido.");
  }

  function ensureMediaLibrary() {
    const current = state.mediaLibrary || state.media_library;
    if (
      !current ||
      typeof current !== "object" ||
      !Array.isArray(current.items) ||
      !current.categories ||
      !Array.isArray(current.statuses)
    ) {
      state.mediaLibrary = normalizeMediaLibrary(current || {});
    } else {
      state.mediaLibrary = current;
      state.mediaLibrary.activeType = normalizeMediaType(state.mediaLibrary.activeType);
      state.mediaLibrary.activeSection = normalizeMediaSection(state.mediaLibrary.activeSection);
      if (!state.mediaLibrary.statuses.length) {
        state.mediaLibrary.statuses = normalizeMediaStatuses([]);
      }
      MEDIA_TYPE_ORDER.forEach((type) => mediaCategoriesForType(type, state.mediaLibrary));
      ensureMediaActiveStatus(state.mediaLibrary);
    }
    return state.mediaLibrary;
  }

  function normalizeMediaLibrary(candidate = {}) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const categories = normalizeMediaCategories(source.categories || source.mediaCategories || source.media_categories || {});
    const statuses = normalizeMediaStatuses(source.statuses || source.mediaStatuses || source.media_statuses || []);
    const activeType = normalizeMediaType(source.activeType || source.active_type);
    const activeStatus = normalizeMediaStatusId(source.activeStatus || source.active_status, statuses) || statuses[0]?.id || "";
    const activeSection = normalizeMediaSection(source.activeSection || source.active_section);
    const library = {
      items: [],
      categories,
      statuses,
      activeType,
      activeStatus,
      activeSection,
    };
    library.items = normalizeMediaItems(source.items || source.mediaItems || source.media_items || [], library);
    ensureMediaActiveStatus(library);
    return library;
  }

  function normalizeMediaCategories(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    return MEDIA_TYPE_ORDER.reduce((acc, type) => {
      const sourceCategories = Array.isArray(source[type]) ? source[type] : [];
      const base = sourceCategories.length ? sourceCategories : defaultMediaCategoriesForType(type);
      const usedIds = new Set();
      const usedNames = new Set();
      acc[type] = base.reduce((list, category) => {
        const name = String(category?.name || category?.label || category || "").trim() || "Categoria";
        const nameKey = name.toLowerCase();
        if (usedNames.has(nameKey)) {
          return list;
        }
        const candidateId = String(category?.id || "").trim();
        const id = candidateId && !usedIds.has(candidateId) ? candidateId : `media-${type}-${mediaSlug(name) || createId("cat")}`;
        usedIds.add(id);
        usedNames.add(nameKey);
        list.push({
          id,
          name: name.slice(0, 60),
          createdAt: category?.createdAt || category?.created_at || new Date().toISOString(),
          updatedAt: category?.updatedAt || category?.updated_at || category?.createdAt || new Date().toISOString(),
        });
        return list;
      }, []);
      if (!acc[type].length) {
        acc[type] = defaultMediaCategoriesForType(type);
      }
      return acc;
    }, {});
  }

  function normalizeMediaStatuses(statuses = []) {
    const source = Array.isArray(statuses) && statuses.length ? statuses : MEDIA_DEFAULT_STATUSES;
    const usedIds = new Set();
    const usedNames = new Set();
    const normalized = source.reduce((list, status, index) => {
      const name = String(status?.name || status?.label || status || "").trim() || "Status";
      const nameKey = name.toLowerCase();
      if (usedNames.has(nameKey)) {
        return list;
      }
      const candidateId = String(status?.id || "").trim();
      const id = candidateId && !usedIds.has(candidateId) ? candidateId : `status-${mediaSlug(name) || index}`;
      usedIds.add(id);
      usedNames.add(nameKey);
      list.push({
        id,
        name: name.slice(0, 60),
        color: safeColor(status?.color || mediaStatusColor(index)),
        createdAt: status?.createdAt || status?.created_at || new Date().toISOString(),
        updatedAt: status?.updatedAt || status?.updated_at || status?.createdAt || new Date().toISOString(),
      });
      return list;
    }, []);
    return normalized.length ? normalized : MEDIA_DEFAULT_STATUSES.map((status) => ({ ...status }));
  }

  function normalizeMediaItems(items = [], library = ensureMediaLibrary()) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item && (item.title || item.name))
      .map((item) => {
        const type = normalizeMediaType(item.type || item.productionType || item.production_type || item.kind);
        const categories = mediaCategoriesForType(type, library);
        const categoryId = categories.some((category) => category.id === (item.categoryId || item.category_id))
          ? item.categoryId || item.category_id
          : categories[0]?.id || "";
        const statusId = normalizeMediaStatusId(item.statusId || item.status_id || item.status, library.statuses) || library.statuses[0]?.id || "";
        const createdAt = item.createdAt || item.created_at || new Date().toISOString();
        return {
          id: item.id || createId("media"),
          type,
          title: String(item.title || item.name || "Obra sem nome").slice(0, 120),
          categoryId,
          statusId,
          url: normalizeShoppingUrl(item.url || item.link || item.href || ""),
          progressCurrent: parseMediaProgressNumber(item.progressCurrent ?? item.current ?? item.pagesRead ?? item.pages_read),
          progressMax: parseMediaProgressNumber(item.progressMax ?? item.max ?? item.totalPages ?? item.total_pages),
          cover: normalizeMediaCover(item.cover || item.coverData || item.cover_data || item.image || ""),
          coverKey: normalizeMediaCoverKey(item.coverKey || item.cover_key || item.coverId || item.cover_id),
          createdAt,
          updatedAt: item.updatedAt || item.updated_at || createdAt,
        };
      });
  }

  function defaultMediaLibrary() {
    return {
      items: [],
      categories: normalizeMediaCategories({}),
      statuses: MEDIA_DEFAULT_STATUSES.map((status) => ({ ...status })),
      activeType: "reading",
      activeStatus: "in-progress",
      activeSection: "items",
    };
  }

  function defaultMediaCategoriesForType(type) {
    return (MEDIA_DEFAULT_CATEGORIES[normalizeMediaType(type)] || MEDIA_DEFAULT_CATEGORIES.reading).map((name) => ({
      id: `media-${normalizeMediaType(type)}-${mediaSlug(name)}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  function ensureMediaActiveStatus(library = ensureMediaLibrary()) {
    if (!mediaStatusById(library.activeStatus, library)) {
      library.activeStatus = library.statuses[0]?.id || "";
    }
  }

  function getMediaStats(type = "") {
    const library = ensureMediaLibrary();
    const normalizedType = type ? normalizeMediaType(type) : "";
    const items = library.items.filter((item) => !normalizedType || item.type === normalizedType);
    const completedCount = items.filter((item) => item.statusId === "completed").length;
    const inProgressCount = items.filter((item) => item.statusId === "in-progress").length;
    const progressCurrent = items.reduce((total, item) => total + (Number(item.progressCurrent) || 0), 0);
    const progressMax = items.reduce((total, item) => total + (Number(item.progressMax) || 0), 0);
    const total = items.length;
    return {
      total,
      completedCount,
      inProgressCount,
      progressCurrent,
      progressMax,
      completionRate: total ? Math.round((completedCount / total) * 100) : 0,
    };
  }

  function getMediaTypeCounts(library = ensureMediaLibrary()) {
    return MEDIA_TYPE_ORDER.reduce((acc, type) => {
      acc[type] = library.items.filter((item) => item.type === type).length;
      return acc;
    }, {});
  }

  function getMediaStatusCounts(type, library = ensureMediaLibrary()) {
    return (library.statuses || []).reduce((acc, status) => {
      acc[status.id] = library.items.filter((item) => item.type === type && item.statusId === status.id).length;
      return acc;
    }, {});
  }

  function getSortedMediaItems(library = ensureMediaLibrary()) {
    return (library.items || []).slice().sort((a, b) => {
      const statusDiff = mediaStatusIndex(a.statusId, library) - mediaStatusIndex(b.statusId, library);
      return statusDiff || String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
    });
  }

  function findMediaItem(itemId) {
    const library = ensureMediaLibrary();
    return library.items.find((item) => item.id === itemId) || null;
  }

  function mediaCategoriesForType(type, library = ensureMediaLibrary()) {
    const normalizedType = normalizeMediaType(type);
    library.categories = library.categories || {};
    if (!Array.isArray(library.categories[normalizedType]) || !library.categories[normalizedType].length) {
      library.categories[normalizedType] = defaultMediaCategoriesForType(normalizedType);
    }
    return library.categories[normalizedType];
  }

  function mediaCategoryById(type, categoryId, library = ensureMediaLibrary()) {
    return mediaCategoriesForType(type, library).find((category) => category.id === categoryId) || null;
  }

  function mediaStatusById(statusId, library = ensureMediaLibrary()) {
    return (library.statuses || []).find((status) => status.id === statusId) || null;
  }

  function mediaStatusIndex(statusId, library = ensureMediaLibrary()) {
    const index = (library.statuses || []).findIndex((status) => status.id === statusId);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
  }

  function normalizeMediaType(type) {
    const key = String(type || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const aliases = {
      book: "reading",
      books: "reading",
      leitura: "reading",
      leituras: "reading",
      manga: "reading",
      movie: "movies",
      movies: "movies",
      filme: "movies",
      filmes: "movies",
      serie: "series",
      series: "series",
      show: "series",
      shows: "series",
      game: "games",
      games: "games",
      jogo: "games",
      jogos: "games",
    };
    return aliases[key] || (MEDIA_TYPES[key] ? key : "reading");
  }

  function normalizeMediaSection(section) {
    const value = String(section || "").trim();
    return Object.prototype.hasOwnProperty.call(MEDIA_SECTIONS, value) ? value : "items";
  }

  function normalizeMediaStatusId(statusId, statuses = ensureMediaLibrary().statuses) {
    const value = String(statusId || "").trim();
    if (!value) {
      return "";
    }
    const direct = statuses.find((status) => status.id === value);
    if (direct) {
      return direct.id;
    }
    const slug = mediaSlug(value);
    const byName = statuses.find((status) => mediaSlug(status.name) === slug);
    return byName?.id || "";
  }

  function normalizeMediaCover(value) {
    const cover = String(value || "").trim();
    if (!cover) {
      return "";
    }
    if (/^data:image\//i.test(cover)) {
      return cover;
    }
    if (/^https?:\/\//i.test(cover)) {
      return cover.slice(0, 500);
    }
    return "";
  }

  function normalizeMediaCoverKey(value) {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9:_-]/g, "")
      .slice(0, 120);
  }

  function mediaItemCoverKey(item) {
    return normalizeMediaCoverKey(item?.coverKey || item?.cover_key || item?.coverId || item?.cover_id || "");
  }

  function parseMediaProgressNumber(value) {
    const number = Number(String(value ?? "").trim().replace(",", "."));
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }

  function mediaItemProgressPercent(item) {
    const max = Number(item.progressMax) || 0;
    if (max <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(((Number(item.progressCurrent) || 0) / max) * 100)));
  }

  function mediaItemProgressLabel(item) {
    const type = normalizeMediaType(item.type);
    const current = Number(item.progressCurrent) || 0;
    const max = Number(item.progressMax) || 0;
    const unit = mediaTypeUnitLabel(type);
    if (max > 0) {
      return `${integerFormatter.format(current)}/${integerFormatter.format(max)} ${unit}`;
    }
    return current > 0 ? `${integerFormatter.format(current)} ${unit}` : `0 ${unit}`;
  }

  function mediaTypeLabel(type) {
    return MEDIA_TYPES[normalizeMediaType(type)]?.label || MEDIA_TYPES.reading.label;
  }

  function mediaTypeUnitLabel(type) {
    return MEDIA_TYPES[normalizeMediaType(type)]?.unitLabel || MEDIA_TYPES.reading.unitLabel;
  }

  function mediaTypeIcon(type) {
    const icons = {
      reading: "icon-book",
      movies: "icon-chart",
      series: "icon-list",
      games: "icon-star",
    };
    return icons[normalizeMediaType(type)] || icons.reading;
  }

  function mediaLinkLabel(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "") || "Abrir link";
    } catch (error) {
      return "Abrir link";
    }
  }

  function mediaStatusColor(index) {
    const colors = ["#2f83d0", "#64748b", "#238a65", "#b45a52", "#7c3aed", "#0891b2", "#b7791f"];
    return colors[index % colors.length];
  }

  function mediaSlug(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function resizeMediaCoverFile(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      throw new Error("Arquivo invalido");
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadMediaImage(dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const maxSide = Math.max(sourceWidth, sourceHeight);
    let targetSize = MEDIA_MAX_COVER_SIZE;
    let quality = MEDIA_COVER_QUALITY;
    let cover = "";

    while (targetSize >= MEDIA_COVER_MIN_SIZE) {
      const scale = Math.min(1, targetSize / maxSide);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      cover = drawMediaCoverToDataUrl(image, width, height, quality);
      if (cover.length <= MEDIA_COVER_TARGET_LENGTH || targetSize === MEDIA_COVER_MIN_SIZE) {
        return cover;
      }
      targetSize = Math.max(MEDIA_COVER_MIN_SIZE, Math.round(targetSize * 0.75));
      quality = Math.max(0.55, quality - 0.08);
    }

    return cover || dataUrl;
  }

  function drawMediaCoverToDataUrl(image, width, height, quality) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas-unavailable");
    }
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
  }

  function loadMediaImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("cover-unsupported"));
      image.src = src;
    });
  }

  function openMediaCoverDb() {
    if (!window.indexedDB) {
      return Promise.reject(new Error("indexeddb-unavailable"));
    }
    if (!mediaCoverDbPromise) {
      mediaCoverDbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(MEDIA_COVER_DB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(MEDIA_COVER_DB_STORE)) {
            db.createObjectStore(MEDIA_COVER_DB_STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("indexeddb-open-failed"));
      });
    }
    return mediaCoverDbPromise;
  }

  async function putMediaCoverData(key, cover) {
    const coverKey = normalizeMediaCoverKey(key);
    if (!coverKey || !cover) {
      throw new Error("cover-invalid");
    }
    const db = await openMediaCoverDb();
    await runMediaCoverTransaction(db, "readwrite", (store) => store.put(cover, coverKey));
    mediaCoverRuntimeCache.set(coverKey, cover);
    return coverKey;
  }

  async function cacheMediaCoverData(key, cover) {
    const coverKey = normalizeMediaCoverKey(key);
    if (!coverKey || !cover) {
      return "";
    }

    mediaCoverRuntimeCache.set(coverKey, cover);
    try {
      await putMediaCoverData(coverKey, cover);
    } catch (error) {
      // The synced state remains the source of truth; IndexedDB is only a local cache.
    }
    return coverKey;
  }

  async function getMediaCoverData(key) {
    const coverKey = normalizeMediaCoverKey(key);
    if (!coverKey) {
      return "";
    }
    if (mediaCoverRuntimeCache.has(coverKey)) {
      return mediaCoverRuntimeCache.get(coverKey);
    }
    const db = await openMediaCoverDb();
    const cover = await runMediaCoverTransaction(db, "readonly", (store) => store.get(coverKey));
    if (cover) {
      mediaCoverRuntimeCache.set(coverKey, cover);
    }
    return cover || "";
  }

  async function deleteMediaCoverData(key) {
    const coverKey = normalizeMediaCoverKey(key);
    if (!coverKey) {
      return;
    }
    mediaCoverRuntimeCache.delete(coverKey);
    const db = await openMediaCoverDb();
    await runMediaCoverTransaction(db, "readwrite", (store) => store.delete(coverKey));
  }

  function runMediaCoverTransaction(db, mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_COVER_DB_STORE, mode);
      const request = operation(transaction.objectStore(MEDIA_COVER_DB_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("indexeddb-request-failed"));
      transaction.onerror = () => reject(transaction.error || new Error("indexeddb-transaction-failed"));
    });
  }

  function hydrateMediaCoverImages(root = document) {
    root.querySelectorAll("[data-media-cover-image]").forEach((image) => {
      const coverKey = image.dataset.mediaCoverKey || "";
      getMediaCoverData(coverKey)
        .then((cover) => {
          if (!cover || !image.isConnected) {
            return;
          }
          image.src = cover;
          image.hidden = false;
          const placeholder = image.parentElement?.querySelector("[data-media-cover-placeholder]");
          if (placeholder) {
            placeholder.hidden = true;
          }
          const item = findMediaItem(image.dataset.mediaId);
          if (item && !item.cover) {
            item.cover = normalizeMediaCover(cover);
            item.coverKey = mediaItemCoverKey(item) || coverKey;
            item.updatedAt = new Date().toISOString();
            saveState({ backup: false });
          }
        })
        .catch(() => {});
    });
  }

  async function hydrateMediaCoverPreview(coverKey) {
    try {
      const cover = await getMediaCoverData(coverKey);
      if (cover && !els.mediaItemCoverData.value) {
        renderMediaCoverPreview(cover);
      }
    } catch (error) {
      renderMediaCoverPreview("");
    }
  }

  async function syncMediaCoverStorage() {
    const library = ensureMediaLibrary();
    const items = Array.isArray(library.items) ? library.items : [];
    if (!items.length) {
      return;
    }

    let changed = false;
    for (const item of items) {
      const currentCover = normalizeMediaCover(item.cover || "");
      const currentCoverKey = mediaItemCoverKey(item);
      if (currentCover) {
        const coverKey = currentCoverKey || createId("mediacover");
        item.cover = currentCover;
        item.coverKey = coverKey;
        await cacheMediaCoverData(coverKey, currentCover);
        changed = changed || coverKey !== currentCoverKey;
        continue;
      }

      if (!currentCoverKey) {
        continue;
      }

      try {
        const cachedCover = normalizeMediaCover(await getMediaCoverData(currentCoverKey));
        if (cachedCover) {
          item.cover = cachedCover;
          item.coverKey = currentCoverKey;
          item.updatedAt = new Date().toISOString();
          changed = true;
        }
      } catch (error) {
        // Missing local cache is expected on other devices; keep the item itself intact.
      }
    }

    if (changed) {
      saveState({ sync: false });
      renderMediaLibrary();
    }
  }

  function mediaCoverErrorMessage(error) {
    if (isStorageQuotaError(error)) {
      return "Sem espaco para salvar a capa. Remova capas antigas ou use uma imagem menor.";
    }
    const message = String(error?.message || error || "");
    if (message.includes("indexeddb-unavailable")) {
      return "O navegador nao liberou armazenamento local para capas.";
    }
    if (message.includes("cover-unsupported")) {
      return "Formato de capa nao suportado. Use PNG, JPG ou WebP.";
    }
    if (message.includes("Arquivo invalido")) {
      return "Escolha um arquivo de imagem para a capa.";
    }
    return "Nao foi possivel carregar a capa.";
  }

  function isStorageQuotaError(error) {
    const name = String(error?.name || "");
    const message = String(error?.message || error || "").toLowerCase();
    return name === "QuotaExceededError" || error?.code === 22 || message.includes("quota") || message.includes("storage");
  }

  function renderRecipes() {
    if (!els.recipeGrid) {
      return;
    }

    const recipes = ensureRecipes();
    const categories = ensureRecipeCategories();
    const statuses = ensureRecipeStatuses();
    const stats = getRecipeStats(recipes);
    renderRecipeSummary(stats);
    renderRecipeSections();
    renderRecipeFilters(recipes, categories, statuses);
    renderRecipeCategoryTabs(recipes, categories);
    renderRecipeManagers(categories, statuses);
    renderRecipeCards(getVisibleRecipes(recipes));
  }

  function renderRecipeSummary(stats = getRecipeStats()) {
    els.recipesTotalCount.textContent = String(stats.total);
    els.recipesTotalDetail.textContent = stats.total ? plural(stats.total, "receita salva", "receitas salvas") : "caderno vazio";
    els.recipesPlannedCount.textContent = String(stats.plannedCount);
    els.recipesPlannedDetail.textContent = plural(stats.plannedCount, "para cozinhar", "para cozinhar");
    els.recipesFavoriteCount.textContent = String(stats.favoriteCount);
    els.recipesFavoriteDetail.textContent = plural(stats.favoriteCount, "marcada", "marcadas");
    els.recipesDoneCount.textContent = String(stats.doneCount);
    els.recipesDoneDetail.textContent = plural(stats.doneCount, "marcada como feita", "marcadas como feitas");
  }

  function renderRecipeSections() {
    const activeSection = normalizeRecipeSection(filters.recipeSection);
    filters.recipeSection = activeSection;
    els.recipeSectionButtons?.forEach((button) => {
      const isActive = button.dataset.recipeSection === activeSection;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    els.recipeSectionPanels?.forEach((panel) => {
      panel.hidden = panel.dataset.recipeSectionPanel !== activeSection;
    });
  }

  function switchRecipeSection(section) {
    filters.recipeSection = normalizeRecipeSection(section);
    saveState();
    renderRecipes();
  }

  function renderRecipeFilters(recipes = ensureRecipes(), categories = ensureRecipeCategories(), statuses = ensureRecipeStatuses()) {
    const categoryOptions = [
      { value: "all", label: `Todas (${recipes.length})` },
      ...categories.map((category) => ({
        value: category.id,
        label: `${category.name} (${recipes.filter((recipe) => recipe.category === category.id).length})`,
      })),
    ];
    setSelectOptions(els.recipeCategoryFilter, categoryOptions, filters.recipeCategory);
    filters.recipeCategory = normalizeRecipeCategoryFilter(els.recipeCategoryFilter.value);

    const statusOptions = [
      { value: "all", label: `Todos (${recipes.length})` },
      ...statuses.map((status) => ({
        value: status.id,
        label: `${status.name} (${recipes.filter((recipe) => recipe.status === status.id).length})`,
      })),
      { value: "favorite", label: `Favoritas (${recipes.filter((recipe) => recipe.favorite).length})` },
    ];
    setSelectOptions(els.recipeStatusFilter, statusOptions, filters.recipeStatus);
    filters.recipeStatus = normalizeRecipeStatusFilter(els.recipeStatusFilter.value);

    if (document.activeElement !== els.recipeSearch) {
      els.recipeSearch.value = filters.recipeSearch;
    }
  }

  function renderRecipeCategoryTabs(recipes = ensureRecipes(), categories = ensureRecipeCategories()) {
    const counts = getRecipeCategoryCounts(recipes, categories);
    const tabs = [
      { value: "all", label: "Todas", count: recipes.length },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
        count: counts[category.id] || 0,
      })),
    ];

    els.recipeCategoryTabs.innerHTML = tabs.map((tab) => {
      const active = filters.recipeCategory === tab.value;
      return `
        <button class="recipe-category-tab${active ? " active" : ""}" type="button" data-recipe-category="${escapeHtml(tab.value)}" role="tab" aria-selected="${active ? "true" : "false"}">
          ${svgIcon(tab.value === "all" ? "icon-list" : "icon-utensils")}
          <span>${escapeHtml(tab.label)}</span>
          <strong>${tab.count}</strong>
        </button>
      `;
    }).join("");
  }

  function renderRecipeManagers(categories = ensureRecipeCategories(), statuses = ensureRecipeStatuses()) {
    els.recipeCategoryDetail.textContent = plural(categories.length, "categoria", "categorias");
    els.recipeCategoryList.innerHTML = categories.map((category) => `
      <div class="recipe-manager-row" data-recipe-category-id="${escapeHtml(category.id)}">
        <input class="inline-input" data-recipe-category-field="name" value="${escapeHtml(category.name)}" aria-label="Nome da categoria">
        <button class="icon-button" type="button" data-recipe-category-action="delete" aria-label="Excluir ${escapeHtml(category.name)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    `).join("");

    els.recipeStatusDetail.textContent = plural(statuses.length, "status", "status");
    els.recipeStatusList.innerHTML = statuses.map((status) => `
      <div class="recipe-manager-row recipe-status-manager-row" data-recipe-status-id="${escapeHtml(status.id)}">
        <input class="inline-input" data-recipe-status-field="name" value="${escapeHtml(status.name)}" aria-label="Nome do status">
        <input class="inline-input color-input" type="color" data-recipe-status-field="color" value="${safeColor(status.color)}" aria-label="Cor de ${escapeHtml(status.name)}">
        <button class="icon-button" type="button" data-recipe-status-action="delete" aria-label="Excluir ${escapeHtml(status.name)}" title="Excluir">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    `).join("");
  }

  function renderRecipeCards(recipes) {
    if (!recipes.length) {
      els.recipeGrid.innerHTML = `
        <div class="empty-state recipe-empty-state">
          <strong>Nenhuma receita encontrada.</strong>
          <button class="button primary" type="button" data-recipe-action="new">
            ${svgIcon("icon-plus")}
            <span>Adicionar receita</span>
          </button>
        </div>
      `;
      return;
    }

    els.recipeGrid.innerHTML = recipes.map(renderRecipeCard).join("");
  }

  function renderRecipeCard(recipe) {
    const status = recipeStatusById(recipe.status);
    const statusColor = safeColor(status?.color || RECIPE_DEFAULT_STATUS_COLORS.idea);
    const url = normalizeShoppingUrl(recipe.url);
    const linkHtml = url
      ? `<a class="recipe-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(mediaLinkLabel(url))}</a>`
      : `<span class="recipe-link is-empty">Sem link</span>`;
    const ingredientLines = recipe.ingredients
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4);
    const ingredientsHtml = ingredientLines.length
      ? ingredientLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")
      : "<span>Sem ingredientes cadastrados.</span>";
    const stepsText = recipe.steps.trim() || recipe.notes.trim() || "Sem preparo cadastrado.";
    const prepTimeLabel = recipe.prepTime ? `${recipe.prepTime} min` : "Sem tempo";
    const servingsLabel = recipe.servings ? plural(recipe.servings, "porcao", "porcoes") : "Sem porcao";
    const feedbackHtml = recipe.status === "tested" && (recipe.rating > 0 || recipe.review.trim())
      ? `
        <div class="recipe-feedback">
          ${recipe.rating > 0 ? `<span class="recipe-rating">${recipeRatingStars(recipe.rating)}</span>` : ""}
          ${recipe.review.trim() ? `<p>${escapeHtml(recipe.review.trim())}</p>` : ""}
        </div>
      `
      : "";

    return `
      <article class="recipe-card${recipe.favorite ? " is-favorite" : ""}" data-recipe-card data-recipe-id="${escapeHtml(recipe.id)}" role="button" tabindex="0" aria-label="Abrir leitura da receita ${escapeHtml(recipe.title)}">
        <div class="recipe-card-top">
          <span>${escapeHtml(recipeCategoryLabel(recipe.category))}</span>
          <b style="--recipe-status-color:${statusColor}">${escapeHtml(status?.name || recipeStatusLabel(recipe.status))}</b>
        </div>
        <div class="recipe-card-title">
          ${svgIcon("icon-utensils")}
          <h3>${escapeHtml(recipe.title)}</h3>
          ${recipe.favorite ? svgIcon("icon-star") : ""}
        </div>
        <div class="recipe-card-meta">
          <span>${escapeHtml(prepTimeLabel)}</span>
          <span>${escapeHtml(servingsLabel)}</span>
        </div>
        <div class="recipe-ingredient-list">${ingredientsHtml}</div>
        <p class="recipe-card-steps">${escapeHtml(stepsText)}</p>
        ${feedbackHtml}
        <div class="recipe-card-footer">
          ${linkHtml}
          <div class="row-actions recipe-row-actions">
            <button class="button secondary compact-button${recipe.status === "planned" ? " active" : ""}" type="button" data-recipe-action="plan" data-recipe-id="${escapeHtml(recipe.id)}">
              ${svgIcon("icon-check")}
              <span>${recipe.status === "planned" ? "Planejada" : "Planejar"}</span>
            </button>
            <button class="icon-button${recipe.favorite ? " active" : ""}" type="button" data-recipe-action="favorite" data-recipe-id="${escapeHtml(recipe.id)}" aria-label="${recipe.favorite ? "Remover favorita" : "Marcar favorita"}" title="${recipe.favorite ? "Remover favorita" : "Marcar favorita"}">
              ${svgIcon("icon-star")}
            </button>
            <button class="icon-button" type="button" data-recipe-action="edit" data-recipe-id="${escapeHtml(recipe.id)}" aria-label="Editar ${escapeHtml(recipe.title)}" title="Editar">
              ${svgIcon("icon-edit")}
            </button>
            <button class="icon-button" type="button" data-recipe-action="delete" data-recipe-id="${escapeHtml(recipe.id)}" aria-label="Excluir ${escapeHtml(recipe.title)}" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function handleRecipeCategoryTabsClick(event) {
    const button = event.target.closest("[data-recipe-category]");
    if (!button) {
      return;
    }

    filters.recipeCategory = normalizeRecipeCategoryFilter(button.dataset.recipeCategory);
    saveState();
    renderRecipes();
  }

  function handleRecipeGridClick(event) {
    const button = event.target.closest("[data-recipe-action]");
    if (!button) {
      const card = event.target.closest("[data-recipe-card]");
      if (card && !event.target.closest("a")) {
        openRecipeDetailDialog(card.dataset.recipeId);
      }
      return;
    }

    const action = button.dataset.recipeAction;
    if (action === "new") {
      openRecipeDialog();
      return;
    }

    const recipe = findRecipe(button.dataset.recipeId);
    if (!recipe) {
      return;
    }

    if (action === "edit") {
      openRecipeDialog(recipe.id);
    } else if (action === "delete") {
      deleteRecipe(recipe);
    } else if (action === "favorite") {
      recipe.favorite = !recipe.favorite;
      recipe.updatedAt = new Date().toISOString();
      saveState();
      renderRecipes();
      renderHome();
      showToast(recipe.favorite ? "Receita favoritada." : "Favorito removido.");
    } else if (action === "plan") {
      recipe.status = recipe.status === "planned" ? "idea" : "planned";
      recipe.updatedAt = new Date().toISOString();
      saveState();
      renderRecipes();
      renderHome();
      showToast(recipe.status === "planned" ? "Receita planejada." : "Receita voltou para ideias.");
    }
  }

  function handleRecipeGridKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const card = event.target.closest("[data-recipe-card]");
    if (!card || event.target.closest("button, a, input, select, textarea")) {
      return;
    }

    event.preventDefault();
    openRecipeDetailDialog(card.dataset.recipeId);
  }

  function handleRecipeCategorySubmit(event) {
    event.preventDefault();
    const name = els.recipeCategoryName.value.trim();
    if (!name) {
      showToast("Preencha o nome da categoria.");
      return;
    }

    const categories = ensureRecipeCategories();
    const duplicate = categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast("Categoria ja existe.");
      return;
    }

    const now = new Date().toISOString();
    categories.push({
      id: createRecipeManagedId("recipe-cat", name, categories),
      name: name.slice(0, 60),
      createdAt: now,
      updatedAt: now,
    });
    els.recipeCategoryName.value = "";
    saveState();
    renderRecipes();
    showToast("Categoria adicionada.");
  }

  function handleRecipeCategoryInput(event) {
    const input = event.target.closest("[data-recipe-category-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-recipe-category-id]");
    const category = recipeCategoryById(row?.dataset.recipeCategoryId);
    if (!category) {
      return;
    }

    category.name = input.value.trim().slice(0, 60) || "Categoria";
    category.updatedAt = new Date().toISOString();
    saveState();
    renderRecipes();
  }

  function handleRecipeCategoryClick(event) {
    const button = event.target.closest("[data-recipe-category-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-recipe-category-id]");
    deleteRecipeCategory(row?.dataset.recipeCategoryId);
  }

  function handleRecipeStatusSubmit(event) {
    event.preventDefault();
    const name = els.recipeStatusName.value.trim();
    if (!name) {
      showToast("Preencha o nome do status.");
      return;
    }

    const statuses = ensureRecipeStatuses();
    const duplicate = statuses.some((status) => status.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      showToast("Status ja existe.");
      return;
    }

    const now = new Date().toISOString();
    statuses.push({
      id: createRecipeManagedId("recipe-status", name, statuses),
      name: name.slice(0, 60),
      color: safeColor(els.recipeStatusColor.value || RECIPE_DEFAULT_STATUS_COLORS.planned),
      createdAt: now,
      updatedAt: now,
    });
    els.recipeStatusName.value = "";
    els.recipeStatusColor.value = RECIPE_DEFAULT_STATUS_COLORS.planned;
    saveState();
    renderRecipes();
    showToast("Status adicionado.");
  }

  function handleRecipeStatusInput(event) {
    const input = event.target.closest("[data-recipe-status-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-recipe-status-id]");
    const status = recipeStatusById(row?.dataset.recipeStatusId);
    if (!status) {
      return;
    }

    if (input.dataset.recipeStatusField === "color") {
      status.color = safeColor(input.value);
    } else {
      status.name = input.value.trim().slice(0, 60) || "Status";
    }
    status.updatedAt = new Date().toISOString();
    saveState();
    renderRecipes();
  }

  function handleRecipeStatusClick(event) {
    const button = event.target.closest("[data-recipe-status-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-recipe-status-id]");
    deleteRecipeStatus(row?.dataset.recipeStatusId);
  }

  function handleRecipeSubmit(event) {
    event.preventDefault();

    const title = els.recipeTitle.value.trim();
    if (!title) {
      showToast("Informe o nome da receita.");
      return;
    }

    const recipes = ensureRecipes();
    const now = new Date().toISOString();
    const id = els.recipeId.value;
    const existing = id ? recipes.find((recipe) => recipe.id === id) : null;
    const payload = {
      id: existing?.id || createId("recipe"),
      title,
      category: normalizeRecipeCategory(els.recipeCategory.value),
      status: normalizeRecipeStatus(els.recipeStatus.value),
      prepTime: parseRecipeNumber(els.recipePrepTime.value, 0, 1440),
      servings: parseRecipeNumber(els.recipeServings.value, 0, 99),
      url: normalizeShoppingUrl(els.recipeUrl.value),
      favorite: Boolean(els.recipeFavorite.checked),
      rating: parseRecipeNumber(els.recipeRating.value, 0, 5),
      review: String(els.recipeReview.value || "").trim().slice(0, 220),
      ingredients: String(els.recipeIngredients.value || "").trim().slice(0, 1800),
      steps: String(els.recipeSteps.value || "").trim().slice(0, 2400),
      notes: String(els.recipeNotes.value || "").trim().slice(0, 900),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (existing) {
      Object.assign(existing, payload);
      showToast("Receita atualizada.");
    } else {
      recipes.unshift(payload);
      showToast("Receita adicionada.");
    }

    filters.recipeCategory = "all";
    closeRecipeDialog();
    saveState();
    renderRecipes();
    renderHome();
  }

  function openRecipeDialog(recipeId = "") {
    const recipe = recipeId ? findRecipe(recipeId) : null;
    resetRecipeForm();

    if (recipe) {
      els.recipeId.value = recipe.id;
      els.recipeTitle.value = recipe.title || "";
      els.recipeCategory.value = normalizeRecipeCategory(recipe.category);
      els.recipeStatus.value = normalizeRecipeStatus(recipe.status);
      els.recipePrepTime.value = recipe.prepTime ? String(recipe.prepTime) : "";
      els.recipeServings.value = recipe.servings ? String(recipe.servings) : "";
      els.recipeUrl.value = recipe.url || "";
      els.recipeFavorite.checked = Boolean(recipe.favorite);
      els.recipeRating.value = String(recipe.rating || 0);
      els.recipeReview.value = recipe.review || "";
      els.recipeIngredients.value = recipe.ingredients || "";
      els.recipeSteps.value = recipe.steps || "";
      els.recipeNotes.value = recipe.notes || "";
      els.recipeDialogTitle.textContent = "Editar receita";
      els.recipeFormSubtitle.textContent = recipeCategoryLabel(recipe.category);
      els.recipeSubmitLabel.textContent = "Salvar receita";
    }

    if (typeof els.recipeDialog.showModal === "function") {
      els.recipeDialog.showModal();
    } else {
      els.recipeDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.recipeTitle.focus());
  }

  function closeRecipeDialog() {
    if (!els.recipeDialog) {
      return;
    }

    if (els.recipeDialog.open && typeof els.recipeDialog.close === "function") {
      els.recipeDialog.close();
    } else {
      els.recipeDialog.removeAttribute("open");
    }

    resetRecipeForm();
  }

  function openRecipeDetailDialog(recipeId = "") {
    const recipe = findRecipe(recipeId);
    if (!recipe || !els.recipeDetailDialog) {
      return;
    }

    activeRecipeDetailId = recipe.id;
    renderRecipeDetail(recipe);

    if (typeof els.recipeDetailDialog.showModal === "function") {
      els.recipeDetailDialog.showModal();
    } else {
      els.recipeDetailDialog.setAttribute("open", "");
    }

    requestAnimationFrame(() => els.closeRecipeDetailDialog?.focus());
  }

  function closeRecipeDetailDialog() {
    if (!els.recipeDetailDialog) {
      return;
    }

    if (els.recipeDetailDialog.open && typeof els.recipeDetailDialog.close === "function") {
      els.recipeDetailDialog.close();
    } else {
      els.recipeDetailDialog.removeAttribute("open");
    }

    activeRecipeDetailId = "";
  }

  function handleRecipeDetailEdit() {
    const recipeId = activeRecipeDetailId;
    closeRecipeDetailDialog();
    if (recipeId) {
      openRecipeDialog(recipeId);
    }
  }

  function renderRecipeDetail(recipe) {
    const status = recipeStatusById(recipe.status);
    const statusName = status?.name || recipeStatusLabel(recipe.status);
    const statusColor = safeColor(status?.color || RECIPE_DEFAULT_STATUS_COLORS.idea);
    const prepTimeLabel = recipe.prepTime ? `${recipe.prepTime} min` : "Sem tempo";
    const servingsLabel = recipe.servings ? plural(recipe.servings, "porcao", "porcoes") : "Sem porcao";
    const url = normalizeShoppingUrl(recipe.url);

    els.recipeDetailEyebrow.textContent = recipeCategoryLabel(recipe.category);
    els.recipeDetailTitle.textContent = recipe.title;
    els.recipeDetailMeta.textContent = [statusName, prepTimeLabel, servingsLabel].join(" / ");
    els.recipeDetailContent.innerHTML = `
      <div class="recipe-detail-meta-grid">
        ${recipeDetailMetaItem("Categoria", recipeCategoryLabel(recipe.category))}
        ${recipeDetailMetaItem("Status", statusName, `style="--recipe-status-color:${statusColor}"`)}
        ${recipeDetailMetaItem("Tempo", prepTimeLabel)}
        ${recipeDetailMetaItem("Porcoes", servingsLabel)}
        ${recipe.rating > 0 ? recipeDetailMetaItem("Avaliacao", recipeRatingStars(recipe.rating), "", true) : ""}
      </div>
      ${recipeDetailTextSection("Ingredientes", recipe.ingredients, { asList: true, empty: "Sem ingredientes cadastrados." })}
      ${recipeDetailTextSection("Modo de preparo", recipe.steps, { empty: "Sem preparo cadastrado." })}
      ${recipeDetailTextSection("Notas", recipe.notes, { empty: "Sem notas cadastradas." })}
      ${recipeDetailFeedbackSection(recipe)}
      ${url ? recipeDetailLinkSection(url) : ""}
    `;
  }

  function recipeDetailMetaItem(label, value, attributes = "", allowHtml = false) {
    const content = allowHtml ? value : escapeHtml(value);
    return `
      <div class="recipe-detail-meta-item" ${attributes}>
        <span>${escapeHtml(label)}</span>
        <strong>${content}</strong>
      </div>
    `;
  }

  function recipeDetailTextSection(title, value, options = {}) {
    const lines = String(value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    let body = `<p class="recipe-detail-empty">${escapeHtml(options.empty || "Sem informacao cadastrada.")}</p>`;

    if (lines.length && options.asList) {
      body = `<ul class="recipe-detail-list">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
    } else if (lines.length) {
      body = `<div class="recipe-detail-text">${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
    }

    return `
      <section class="recipe-detail-section">
        <h3>${escapeHtml(title)}</h3>
        ${body}
      </section>
    `;
  }

  function recipeDetailFeedbackSection(recipe) {
    const review = recipe.review.trim();
    if (recipe.status !== "tested" || (recipe.rating <= 0 && !review)) {
      return "";
    }

    return `
      <section class="recipe-detail-section recipe-detail-feedback">
        <h3>Avaliacao</h3>
        ${recipe.rating > 0 ? `<strong class="recipe-rating">${recipeRatingStars(recipe.rating)}</strong>` : ""}
        ${review ? `<p>${escapeHtml(review)}</p>` : ""}
      </section>
    `;
  }

  function recipeDetailLinkSection(url) {
    return `
      <section class="recipe-detail-section">
        <h3>Link</h3>
        <a class="recipe-detail-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(mediaLinkLabel(url))}</a>
      </section>
    `;
  }

  function resetRecipeForm() {
    if (!els.recipeForm) {
      return;
    }

    els.recipeForm.reset();
    els.recipeId.value = "";
    els.recipeDialogTitle.textContent = "Nova receita";
    els.recipeFormSubtitle.textContent = "Cadastre preparo, ingredientes e planejamento.";
    els.recipeSubmitLabel.textContent = "Adicionar receita";
    setSelectOptions(
      els.recipeCategory,
      ensureRecipeCategories().map((category) => ({ value: category.id, label: category.name })),
      recipeCategoryById("meal")?.id || ensureRecipeCategories()[0]?.id || "other",
    );
    setSelectOptions(
      els.recipeStatus,
      ensureRecipeStatuses().map((status) => ({ value: status.id, label: status.name })),
      recipeStatusById("idea")?.id || ensureRecipeStatuses()[0]?.id || "idea",
    );
    els.recipeFavorite.checked = false;
    els.recipeRating.value = "0";
    els.recipeReview.value = "";
  }

  function deleteRecipe(recipe) {
    if (!window.confirm(`Excluir "${recipe.title}" do caderno de receitas?`)) {
      return;
    }

    state.recipes = ensureRecipes().filter((entry) => entry.id !== recipe.id);
    saveState();
    renderRecipes();
    renderHome();
    showToast("Receita removida.");
  }

  function deleteRecipeCategory(categoryId) {
    const categories = ensureRecipeCategories();
    const category = recipeCategoryById(categoryId);
    if (!category) {
      return;
    }
    if (categories.length <= 1) {
      showToast("Mantenha pelo menos uma categoria.");
      return;
    }

    const inUse = ensureRecipes().some((recipe) => recipe.category === category.id);
    if (inUse && !window.confirm("Essa categoria esta em uso. Remover e mover receitas para outra categoria?")) {
      return;
    }

    const fallback = categories.find((item) => item.id !== category.id);
    state.recipeCategories = categories.filter((item) => item.id !== category.id);
    state.recipes.forEach((recipe) => {
      if (recipe.category === category.id) {
        recipe.category = fallback?.id || "other";
        recipe.updatedAt = new Date().toISOString();
      }
    });
    if (filters.recipeCategory === category.id) {
      filters.recipeCategory = "all";
    }
    saveState();
    renderRecipes();
    renderHome();
    showToast("Categoria removida.");
  }

  function deleteRecipeStatus(statusId) {
    const statuses = ensureRecipeStatuses();
    const status = recipeStatusById(statusId);
    if (!status) {
      return;
    }
    if (statuses.length <= 1) {
      showToast("Mantenha pelo menos um status.");
      return;
    }

    const inUse = ensureRecipes().some((recipe) => recipe.status === status.id);
    if (inUse && !window.confirm("Esse status esta em uso. Remover e mover receitas para outro status?")) {
      return;
    }

    const fallback = statuses.find((item) => item.id !== status.id);
    state.recipeStatuses = statuses.filter((item) => item.id !== status.id);
    state.recipes.forEach((recipe) => {
      if (recipe.status === status.id) {
        recipe.status = fallback?.id || "idea";
        recipe.updatedAt = new Date().toISOString();
      }
    });
    if (filters.recipeStatus === status.id) {
      filters.recipeStatus = "all";
    }
    saveState();
    renderRecipes();
    renderHome();
    showToast("Status removido.");
  }

  function ensureRecipeCategories() {
    state.recipeCategories = normalizeRecipeCategories(state.recipeCategories || state.recipe_categories || []);
    return state.recipeCategories;
  }

  function ensureRecipeStatuses() {
    state.recipeStatuses = normalizeRecipeStatuses(state.recipeStatuses || state.recipe_statuses || []);
    return state.recipeStatuses;
  }

  function ensureRecipes() {
    state.recipes = normalizeRecipes(state.recipes || state.recipeLibrary || state.recipe_library || []);
    return state.recipes;
  }

  function normalizeRecipeCategories(categories) {
    const source = Array.isArray(categories) && categories.length ? categories : defaultRecipeCategories();
    const usedIds = new Set();
    const usedNames = new Set();
    const normalized = source.reduce((list, category) => {
      const name = String(category?.name || category?.label || category || "").trim();
      if (!name) {
        return list;
      }
      const nameKey = name.toLowerCase();
      if (usedNames.has(nameKey)) {
        return list;
      }
      const candidateId = String(category?.id || "").trim();
      const defaultId = recipeDefaultCategoryIdByName(name);
      const id = candidateId && !usedIds.has(candidateId)
        ? normalizeRecipeCategory(candidateId)
        : defaultId || createRecipeManagedId("recipe-cat", name, list);
      if (usedIds.has(id)) {
        return list;
      }
      usedIds.add(id);
      usedNames.add(nameKey);
      list.push({
        id,
        name: name.slice(0, 60),
        createdAt: category?.createdAt || category?.created_at || new Date().toISOString(),
        updatedAt: category?.updatedAt || category?.updated_at || category?.createdAt || new Date().toISOString(),
      });
      return list;
    }, []);
    return normalized.length ? normalized : defaultRecipeCategories();
  }

  function normalizeRecipeStatuses(statuses) {
    const source = Array.isArray(statuses) && statuses.length ? statuses : defaultRecipeStatuses();
    const usedIds = new Set();
    const usedNames = new Set();
    const normalized = source.reduce((list, status, index) => {
      const name = String(status?.name || status?.label || status || "").trim();
      if (!name) {
        return list;
      }
      const nameKey = name.toLowerCase();
      if (usedNames.has(nameKey)) {
        return list;
      }
      const candidateId = String(status?.id || "").trim();
      const defaultId = recipeDefaultStatusIdByName(name);
      const id = candidateId && !usedIds.has(candidateId)
        ? normalizeRecipeStatus(candidateId)
        : defaultId || createRecipeManagedId("recipe-status", name, list);
      if (usedIds.has(id)) {
        return list;
      }
      usedIds.add(id);
      usedNames.add(nameKey);
      list.push({
        id,
        name: name.slice(0, 60),
        color: safeColor(status?.color || RECIPE_DEFAULT_STATUS_COLORS[id] || recipeStatusColor(index)),
        createdAt: status?.createdAt || status?.created_at || new Date().toISOString(),
        updatedAt: status?.updatedAt || status?.updated_at || status?.createdAt || new Date().toISOString(),
      });
      return list;
    }, []);
    return normalized.length ? normalized : defaultRecipeStatuses();
  }

  function normalizeRecipes(recipes) {
    if (!Array.isArray(recipes)) {
      return [];
    }

    return recipes
      .filter((recipe) => recipe && (recipe.title || recipe.name))
      .map((recipe) => {
        const createdAt = recipe.createdAt || recipe.created_at || new Date().toISOString();
        const rawStatus = recipe.status || recipe.state || recipe.phase;
        const rawFavorite = recipe.favorite || recipe.starred || rawStatus === "favorite";
        return {
          id: recipe.id || createId("recipe"),
          title: String(recipe.title || recipe.name || "Receita sem nome").slice(0, 120),
          category: normalizeRecipeCategory(recipe.category || recipe.mealType || recipe.meal_type || recipe.type),
          status: normalizeRecipeStatus(rawStatus === "favorite" ? "tested" : rawStatus),
          prepTime: parseRecipeNumber(recipe.prepTime ?? recipe.prep_time ?? recipe.time ?? recipe.minutes, 0, 1440),
          servings: parseRecipeNumber(recipe.servings ?? recipe.portions ?? recipe.porcoes, 0, 99),
          url: normalizeShoppingUrl(recipe.url || recipe.link || recipe.source || ""),
          favorite: Boolean(rawFavorite),
          rating: parseRecipeNumber(recipe.rating ?? recipe.stars ?? recipe.score, 0, 5),
          review: String(recipe.review || recipe.feedback || recipe.opinion || "").slice(0, 220),
          ingredients: String(recipe.ingredients || recipe.items || "").slice(0, 1800),
          steps: String(recipe.steps || recipe.instructions || recipe.preparation || "").slice(0, 2400),
          notes: String(recipe.notes || recipe.note || recipe.description || "").slice(0, 900),
          createdAt,
          updatedAt: recipe.updatedAt || recipe.updated_at || createdAt,
        };
      });
  }

  function getVisibleRecipes(recipes = ensureRecipes()) {
    const search = String(filters.recipeSearch || "").trim().toLowerCase();
    return recipes
      .filter((recipe) => filters.recipeCategory === "all" || recipe.category === filters.recipeCategory)
      .filter((recipe) => {
        if (filters.recipeStatus === "all") {
          return true;
        }
        if (filters.recipeStatus === "favorite") {
          return recipe.favorite;
        }
        return recipe.status === filters.recipeStatus;
      })
      .filter((recipe) => {
        if (!search) {
          return true;
        }
        const haystack = [
          recipe.title,
          recipe.ingredients,
          recipe.steps,
          recipe.notes,
          recipeCategoryLabel(recipe.category),
          recipeStatusLabel(recipe.status),
        ].join(" ").toLowerCase();
        return haystack.includes(search);
      })
      .sort((a, b) => {
        const favoriteDiff = Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
        const statusDiff = recipeStatusIndex(a.status) - recipeStatusIndex(b.status);
        return favoriteDiff || statusDiff || String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
      });
  }

  function getRecipeStats(recipes = ensureRecipes()) {
    const total = recipes.length;
    const plannedCount = recipes.filter((recipe) => recipe.status === "planned").length;
    const doneCount = recipes.filter((recipe) => recipe.status === "tested").length;
    const favoriteCount = recipes.filter((recipe) => recipe.favorite).length;
    const timedRecipes = recipes.filter((recipe) => recipe.prepTime > 0);
    const fastCount = recipes.filter((recipe) => recipe.prepTime > 0 && recipe.prepTime <= 30).length;
    const averagePrepTime = timedRecipes.length
      ? Math.round(timedRecipes.reduce((totalMinutes, recipe) => totalMinutes + recipe.prepTime, 0) / timedRecipes.length)
      : 0;
    return {
      total,
      plannedCount,
      doneCount,
      testedCount: doneCount,
      favoriteCount,
      fastCount,
      averagePrepTime,
      readyRate: total ? Math.round(((plannedCount + doneCount) / total) * 100) : 0,
    };
  }

  function getRecipeCategoryCounts(recipes = ensureRecipes(), categories = ensureRecipeCategories()) {
    return categories.reduce((acc, category) => {
      acc[category.id] = recipes.filter((recipe) => recipe.category === category.id).length;
      return acc;
    }, {});
  }

  function findRecipe(recipeId) {
    return ensureRecipes().find((recipe) => recipe.id === recipeId) || null;
  }

  function recipeCategoryById(categoryId) {
    const normalizedId = normalizeRecipeCategory(categoryId);
    return ensureRecipeCategories().find((category) => category.id === normalizedId) || null;
  }

  function recipeStatusById(statusId) {
    const normalizedId = normalizeRecipeStatus(statusId);
    return ensureRecipeStatuses().find((status) => status.id === normalizedId) || null;
  }

  function defaultRecipeCategories() {
    return RECIPE_CATEGORY_ORDER.map((id) => ({
      id,
      name: RECIPE_CATEGORIES[id]?.label || "Categoria",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  function defaultRecipeStatuses() {
    return RECIPE_STATUS_ORDER.map((id, index) => ({
      id,
      name: RECIPE_STATUSES[id]?.label || "Status",
      color: RECIPE_DEFAULT_STATUS_COLORS[id] || recipeStatusColor(index),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  function normalizeRecipeCategory(category) {
    const key = mediaSlug(category);
    if (key.startsWith("recipe-cat-")) {
      return key;
    }
    if (currentRecipeCategories().some((item) => item.id === key)) {
      return key;
    }
    const aliases = {
      salgado: "savory",
      savory: "savory",
      salgados: "savory",
      doce: "sweet",
      doces: "sweet",
      sobremesa: "sweet",
      sobremesas: "sweet",
      dessert: "sweet",
      sweet: "sweet",
      refeicao: "meal",
      refeicoes: "meal",
      meal: "meal",
      meals: "meal",
      cafe: "meal",
      "cafe-da-manha": "meal",
      breakfast: "meal",
      manha: "meal",
      almoco: "meal",
      lunch: "meal",
      jantar: "meal",
      dinner: "meal",
      lanche: "meal",
      snack: "meal",
      marmita: "meal",
      mealprep: "meal",
      "meal-prep": "meal",
      preparo: "meal",
      bebida: "drink",
      bebidas: "drink",
      drink: "drink",
      drinks: "drink",
      suco: "drink",
      sucos: "drink",
    };
    return aliases[key] || (Object.prototype.hasOwnProperty.call(RECIPE_CATEGORIES, key) ? key : "other");
  }

  function normalizeRecipeCategoryFilter(category) {
    const value = String(category || "").trim();
    return !value || value === "all" ? "all" : normalizeRecipeCategory(value);
  }

  function normalizeRecipeStatus(status) {
    const key = mediaSlug(status);
    if (key.startsWith("recipe-status-")) {
      return key;
    }
    if (currentRecipeStatuses().some((item) => item.id === key)) {
      return key;
    }
    const aliases = {
      ideia: "idea",
      idea: "idea",
      planejar: "planned",
      planejada: "planned",
      planned: "planned",
      testar: "tested",
      testada: "tested",
      tested: "tested",
      done: "tested",
      feita: "tested",
      feito: "tested",
      feitas: "tested",
      feitos: "tested",
      concluida: "tested",
      concluido: "tested",
    };
    return aliases[key] || (Object.prototype.hasOwnProperty.call(RECIPE_STATUSES, key) ? key : "idea");
  }

  function normalizeRecipeStatusFilter(status) {
    const value = String(status || "").trim();
    if (!value || value === "all" || value === "favorite") {
      return value || "all";
    }
    const normalized = normalizeRecipeStatus(value);
    if (ensureRecipeStatuses().some((item) => item.id === normalized)) {
      return normalized;
    }
    return "all";
  }

  function recipeCategoryLabel(category) {
    return recipeCategoryById(category)?.name || RECIPE_CATEGORIES[normalizeRecipeCategory(category)]?.label || RECIPE_CATEGORIES.other.label;
  }

  function recipeStatusLabel(status) {
    return recipeStatusById(status)?.name || RECIPE_STATUSES[normalizeRecipeStatus(status)]?.label || RECIPE_STATUSES.idea.label;
  }

  function recipeStatusIndex(status) {
    const normalized = normalizeRecipeStatus(status);
    const customIndex = ensureRecipeStatuses().findIndex((item) => item.id === normalized);
    if (customIndex >= 0) {
      return customIndex;
    }
    const index = RECIPE_STATUS_ORDER.indexOf(normalized);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
  }

  function recipeRatingStars(value) {
    const rating = parseRecipeNumber(value, 0, 5);
    return Array.from({ length: 5 }, (_, index) => (index < rating ? "&#9733;" : "&#9734;")).join("");
  }

  function normalizeRecipeSection(section) {
    const value = String(section || "").trim();
    return ["items", "categories", "statuses"].includes(value) ? value : "items";
  }

  function recipeDefaultCategoryIdByName(name) {
    const slug = mediaSlug(name);
    return RECIPE_CATEGORY_ORDER.find((id) => mediaSlug(RECIPE_CATEGORIES[id]?.label) === slug) || "";
  }

  function recipeDefaultStatusIdByName(name) {
    const slug = mediaSlug(name);
    return RECIPE_STATUS_ORDER.find((id) => mediaSlug(RECIPE_STATUSES[id]?.label) === slug) || "";
  }

  function recipeStatusColor(index) {
    const colors = ["#64748b", "#b7791f", "#238a65", "#7c3aed", "#0891b2", "#b45a52"];
    return colors[index % colors.length];
  }

  function currentRecipeCategories() {
    try {
      return Array.isArray(state?.recipeCategories) ? state.recipeCategories : [];
    } catch (error) {
      return [];
    }
  }

  function currentRecipeStatuses() {
    try {
      return Array.isArray(state?.recipeStatuses) ? state.recipeStatuses : [];
    } catch (error) {
      return [];
    }
  }

  function createRecipeManagedId(prefix, name, existingItems = []) {
    const base = mediaSlug(name) || createId(prefix).replace(`${prefix}-`, "");
    const usedIds = new Set(existingItems.map((item) => item.id));
    let id = `${prefix}-${base}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${prefix}-${base}-${suffix}`;
      suffix += 1;
    }
    return id;
  }

  function parseRecipeNumber(value, min = 0, max = 999) {
    const number = Number(String(value ?? "").trim().replace(",", "."));
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : min;
  }






















  function renderWorkouts() {
    if (!els.workoutForm) {
      return;
    }

    ensureWorkoutWeeklyReset();
    const stats = getWorkoutStats();
    els.workoutWeekDetail.textContent =
      stats.weekGoal > 0
        ? `${stats.weekCompletions} de ${stats.weekGoal} treinos concluídos · ${stats.weekProgress}% da semana`
        : "Nenhum treino planejado para esta semana";
    els.workoutListSubtitle.textContent = plural(state.workouts.length, "treino cadastrado", "treinos cadastrados");
    renderWorkoutWeek();
    renderWorkoutDayBoard();
  }

  function renderNutrition() {
    if (!els.nutritionWeight) {
      return;
    }

    const profile = getNutritionProfile();
    const targets = calculateNutritionTargets(profile);
    const log = ensureNutritionLog(todayDate());

    els.nutritionWeight.value = formatInputNumber(profile.weightKg, 1);
    els.nutritionHeight.value = String(profile.heightCm);
    els.nutritionAge.value = String(profile.age);
    els.nutritionSex.value = profile.sex;
    els.nutritionActivity.value = String(profile.activityFactor);
    els.nutritionGoal.value = profile.goal;
    els.nutritionProteinFactor.value = formatInputNumber(profile.proteinFactor, 1);
    els.nutritionWaterFactor.value = String(profile.waterMlKg);

    renderNutritionTargets(profile, targets);
    renderPlateFoodControls();
    renderFoodCatalog();
    renderPlateBuilder(log);
    renderMealIdeas();
  }

  function handleNutritionProfileInput() {
    state.nutritionProfile = getNutritionProfileFromForm();
    const profile = getNutritionProfile();
    const targets = calculateNutritionTargets(profile);
    saveState();
    renderNutritionTargets(profile, targets);
    renderPlateBuilder(ensureNutritionLog(todayDate()));
  }

  function handleNutritionProfileChange() {
    state.nutritionProfile = getNutritionProfileFromForm();
    saveState();
    renderNutrition();
  }

  function renderNutritionTargets(profile, targets) {
    els.nutritionCaloriesTarget.textContent = `${formatInteger(targets.calories)} kcal`;
    els.nutritionProteinTarget.textContent = `${formatInteger(targets.protein)} g`;
    els.nutritionWaterTarget.textContent = `${formatDecimal(targets.waterLiters)} L`;
    els.nutritionBmi.textContent = formatDecimal(targets.bmi);
    els.nutritionBmrDetail.textContent = `Basal: ${formatInteger(targets.bmr)} kcal - gasto estimado: ${formatInteger(targets.maintenance)} kcal`;
    els.nutritionMaintenanceDetail.textContent = `Manutenção: ${formatInteger(targets.maintenance)} kcal`;
    els.nutritionProteinDetail.textContent = `${formatDecimal(profile.proteinFactor)} g/kg ajustável`;
    els.nutritionWaterDetail.textContent = `${profile.waterMlKg} ml/kg ajustável`;
    els.nutritionBmiDetail.textContent = bmiCategoryLabel(targets.bmi);
    els.nutritionTargetNote.textContent = nutritionGoalLabel(profile.goal);
  }

  function renderDietTargets(targets) {
    els.dietProduceTarget.textContent = "4-5 + 4-5";
    els.dietGrainsTarget.textContent = "6-8";
    els.dietSodiumTarget.textContent = `Até ${formatInteger(targets.sodiumLimit)} mg`;
    els.dietSugarFatTarget.textContent = `Até ${formatInteger(targets.addedSugarLimit)}g / ${formatInteger(targets.saturatedFatLimit)}g`;
    els.dietFiberTarget.textContent = `${formatInteger(targets.fiberTarget)} g`;
  }

  function renderDietLog(log) {
    els.dietLogDate.textContent = `Hoje - ${formatDate(log.date)}`;
    els.dietBreakfast.value = log.breakfast || "";
    els.dietLunch.value = log.lunch || "";
    els.dietDinner.value = log.dinner || "";
    els.dietSnacks.value = log.snacks || "";
    els.dietVegetables.value = log.vegetables ? formatInputNumber(log.vegetables, 1) : "";
    els.dietFruits.value = log.fruits ? formatInputNumber(log.fruits, 1) : "";
    els.dietWholeGrains.value = log.wholeGrains ? formatInputNumber(log.wholeGrains, 1) : "";
    els.dietDairy.value = log.dairy ? formatInputNumber(log.dairy, 1) : "";
    els.dietLeanProtein.value = log.leanProtein ? formatInputNumber(log.leanProtein, 1) : "";
    els.dietNutsLegumes.value = log.nutsLegumes ? formatInputNumber(log.nutsLegumes, 1) : "";
    els.dietFiber.value = log.fiber ? String(log.fiber) : "";
    els.dietSodium.value = log.sodium ? String(log.sodium) : "";
    els.dietAddedSugar.value = log.addedSugar ? String(log.addedSugar) : "";
    els.dietSaturatedFat.value = log.saturatedFat ? String(log.saturatedFat) : "";
    els.dietNotes.value = log.notes || "";
  }

  function handleDietLogChange() {
    const log = ensureNutritionLog(todayDate());
    Object.assign(log, getDietLogFromForm());
    log.updatedAt = new Date().toISOString();
    saveState();
  }

  function getDietLogFromForm() {
    return {
      breakfast: els.dietBreakfast.value.trim(),
      lunch: els.dietLunch.value.trim(),
      dinner: els.dietDinner.value.trim(),
      snacks: els.dietSnacks.value.trim(),
      vegetables: parseNutritionNumber(els.dietVegetables.value, 0, 0, 20, 1),
      fruits: parseNutritionNumber(els.dietFruits.value, 0, 0, 20, 1),
      wholeGrains: parseNutritionNumber(els.dietWholeGrains.value, 0, 0, 20, 1),
      dairy: parseNutritionNumber(els.dietDairy.value, 0, 0, 12, 1),
      leanProtein: parseNutritionNumber(els.dietLeanProtein.value, 0, 0, 12, 1),
      nutsLegumes: parseNutritionNumber(els.dietNutsLegumes.value, 0, 0, 12, 1),
      fiber: parseNutritionNumber(els.dietFiber.value, 0, 0, 120, 0),
      sodium: parseNutritionNumber(els.dietSodium.value, 0, 0, 12000, 0),
      addedSugar: parseNutritionNumber(els.dietAddedSugar.value, 0, 0, 400, 0),
      saturatedFat: parseNutritionNumber(els.dietSaturatedFat.value, 0, 0, 250, 0),
      notes: els.dietNotes.value.trim(),
    };
  }

  function renderPlateFoodControls() {
    els.plateLogDate.textContent = `Hoje - ${formatDate(todayDate())}`;
    const selectedGroup = els.foodCatalogGroup.value || "all";
    els.foodCatalogGroup.innerHTML = ["all", ...foodCatalogGroups()]
      .map((group) => `<option value="${escapeHtml(group)}" ${group === selectedGroup ? "selected" : ""}>${escapeHtml(group === "all" ? "Todos" : group)}</option>`)
      .join("");
  }

  function openFoodDialog() {
    renderPlateFoodControls();
    renderFoodDialogMealPanel();
    renderFoodCatalog();
    if (typeof els.foodDialog.showModal === "function") {
      els.foodDialog.showModal();
    } else {
      els.foodDialog.setAttribute("open", "open");
    }
    requestAnimationFrame(() => els.foodCatalogSearch.focus());
  }

  function closeFoodDialog() {
    if (typeof els.foodDialog.close === "function") {
      els.foodDialog.close();
    } else {
      els.foodDialog.removeAttribute("open");
    }
    renderPlateBuilder(ensureNutritionLog(todayDate()));
  }

  function renderFoodCatalog() {
    const search = String(els.foodCatalogSearch.value || "").trim().toLowerCase();
    const group = els.foodCatalogGroup.value || "all";
    const activeFoodIds = activeMealFoodIds();
    const foods = FOOD_CATALOG.filter((food) => {
      const matchesGroup = group === "all" || food.group === group;
      const searchableText = `${food.name} ${food.group} ${food.portion}`.toLowerCase();
      return matchesGroup && (!search || searchableText.includes(search));
    });

    els.foodCatalogList.innerHTML = foods.length
      ? foods.map((food) => renderFoodCatalogCard(food, activeFoodIds)).join("")
      : '<div class="empty-state compact-empty">Nenhum alimento encontrado.</div>';
  }

  function renderFoodCatalogCard(food, activeFoodIds = new Set()) {
    const isSelected = activeFoodIds.has(food.id);
    return `
      <article class="food-card ${isSelected ? "is-selected" : ""}">
        <div class="food-card-head">
          <div>
            <h4>${escapeHtml(food.name)}</h4>
            <div class="food-card-meta">
              <span>${escapeHtml(food.group)} - ${escapeHtml(food.portion)}</span>
              ${isSelected ? '<em class="food-selected-pill">No prato</em>' : ""}
            </div>
          </div>
          <button class="button ${isSelected ? "primary" : "secondary"} compact-button" type="button" data-food-add="${escapeHtml(food.id)}">${isSelected ? "Somar" : "Adicionar"}</button>
        </div>
        <div class="food-macro-grid">
          ${foodMacroHtml("Kcal", formatInteger(food.calories))}
          ${foodMacroHtml("Prot.", `${formatDecimal(food.protein)}g`)}
          ${foodMacroHtml("Carb.", `${formatDecimal(food.carbs)}g`)}
          ${foodMacroHtml("Gord.", `${formatDecimal(food.fat)}g`)}
          ${foodMacroHtml("Fibra", `${formatDecimal(food.fiber)}g`)}
        </div>
      </article>
    `;
  }

  function foodMacroHtml(label, value) {
    return `
      <span>
        <small>${escapeHtml(label)}</small>
        <strong>${escapeHtml(value)}</strong>
      </span>
    `;
  }

  function renderFoodDialogMealPanel() {
    if (!els.foodDialogMealSummary || !els.foodDialogSelectedList) {
      return;
    }

    const log = ensureNutritionLog(todayDate());
    const meal = ensureActivePlateMeal(log);
    const normalizedItems = normalizePlateItems(meal.items);
    meal.items = normalizedItems;
    const totals = calculatePlateTotals(normalizedItems);
    const targets = calculateNutritionTargets(getNutritionProfile());
    const mealTargets = calculatePlateMacroTargets(targets, recommendedMealCount(targets));
    const summary = macroStatusSummary(macroStatusList(totals, mealTargets), "Prato dentro da meta da refeicao.");
    const plateNumber = Math.max(1, Number(meal.order) || 1);

    els.foodDialogMealSummary.innerHTML = `
      <div class="food-dialog-meal-kicker">
        <span>Prato ${formatInteger(plateNumber)} em edição</span>
        <span>${normalizedItems.length === 1 ? "1 item" : `${formatInteger(normalizedItems.length)} itens`}</span>
      </div>
      <h3>${escapeHtml(meal.title || mealTitleFromItems(normalizedItems))}</h3>
      <div class="food-dialog-total-grid" aria-label="Totais do prato em edicao">
        ${foodDialogTotalHtml("Kcal", formatInteger(totals.calories))}
        ${foodDialogTotalHtml("Prot.", `${formatDecimal(totals.protein)}g`)}
        ${foodDialogTotalHtml("Carb.", `${formatDecimal(totals.carbs)}g`)}
        ${foodDialogTotalHtml("Gord.", `${formatDecimal(totals.fat)}g`)}
        ${foodDialogTotalHtml("Fibra", `${formatDecimal(totals.fiber)}g`)}
      </div>
      <p class="food-dialog-hint">${escapeHtml(normalizedItems.length ? summary : "Adicione alimentos do catálogo para montar este prato.")}</p>
    `;

    els.foodDialogSelectedList.innerHTML = normalizedItems.length
      ? normalizedItems.map(renderFoodDialogSelectedItem).join("")
      : '<div class="empty-state compact-empty">Nenhum alimento neste prato ainda.</div>';
  }

  function foodDialogTotalHtml(label, value) {
    return `
      <span>
        ${escapeHtml(label)}
        <strong>${escapeHtml(value)}</strong>
      </span>
    `;
  }

  function renderFoodDialogSelectedItem(item) {
    const food = foodById(item.foodId);
    const subtotal = calculateFoodSubtotal(food, item.quantity);
    return `
      <article class="food-dialog-selected-item" data-selected-item-id="${escapeHtml(item.id)}">
        <div class="food-dialog-selected-main">
          <strong>${escapeHtml(food?.name || "Alimento")}</strong>
          <span>${escapeHtml(food ? `${food.group} - ${food.portion}` : "")}</span>
          <small>${formatInteger(subtotal.calories)} kcal - ${formatDecimal(subtotal.protein)}g prot. - ${formatDecimal(subtotal.carbs)}g carb. - ${formatDecimal(subtotal.fat)}g gord. - ${formatDecimal(subtotal.fiber)}g fibra</small>
        </div>
        <label class="field compact">
          <span>Qtd.</span>
          <input type="number" min="0.25" max="20" step="0.25" inputmode="decimal" value="${escapeHtml(String(roundToPrecision(item.quantity, 2)))}" data-selected-item-quantity="${escapeHtml(item.id)}">
        </label>
        <button class="icon-button" type="button" data-selected-item-remove="${escapeHtml(item.id)}" aria-label="Remover alimento" title="Remover">
          ${svgIcon("icon-trash")}
        </button>
      </article>
    `;
  }

  function activeMealFoodIds() {
    const log = ensureNutritionLog(todayDate());
    const meal = ensureActivePlateMeal(log);
    return new Set(normalizePlateItems(meal.items).map((item) => item.foodId));
  }

  function handleFoodCatalogClick(event) {
    const button = event.target.closest("[data-food-add]");
    if (!button) {
      return;
    }
    addFoodToPlate(button.dataset.foodAdd, parseNutritionNumber(els.plateFoodQuantity.value, 1, 0.25, 20, 2));
    els.plateFoodQuantity.value = "1";
  }

  function handleFoodDialogSelectedClick(event) {
    const removeButton = event.target.closest("[data-selected-item-remove]");
    if (!removeButton) {
      return;
    }
    removeActiveMealItem(removeButton.dataset.selectedItemRemove);
  }

  function handleFoodDialogSelectedChange(event) {
    const input = event.target.closest("[data-selected-item-quantity]");
    if (!input) {
      return;
    }
    updateActiveMealItemQuantity(input.dataset.selectedItemQuantity, input.value);
  }

  function addFoodToPlate(foodId, quantity = 1) {
    const food = foodById(foodId);
    if (!food) {
      return;
    }

    const log = ensureNutritionLog(todayDate());
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    const meal = ensureActivePlateMeal(log);
    const existing = meal.items.find((item) => item.foodId === food.id);
    if (existing) {
      existing.quantity = Math.min(20, roundToPrecision(existing.quantity + quantity, 2));
    } else {
      meal.items.push({
        id: createId("plateitem"),
        foodId: food.id,
        quantity,
      });
    }
    updatePlateMealTitle(meal);
    log.updatedAt = new Date().toISOString();
    saveState();
    renderPlateBuilder(log);
    renderFoodDialogMealPanel();
    renderFoodCatalog();
  }

  function updateActiveMealItemQuantity(itemId, quantity) {
    const log = ensureNutritionLog(todayDate());
    const meal = ensureActivePlateMeal(log);
    const item = meal.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.quantity = parseNutritionNumber(quantity, item.quantity || 1, 0.25, 20, 2);
    commitActiveMealEdit(log, meal);
  }

  function removeActiveMealItem(itemId) {
    const log = ensureNutritionLog(todayDate());
    const meal = ensureActivePlateMeal(log);
    meal.items = meal.items.filter((item) => item.id !== itemId);
    commitActiveMealEdit(log, meal);
  }

  function commitActiveMealEdit(log, meal) {
    meal.items = normalizePlateItems(meal.items);
    updatePlateMealTitle(meal);
    meal.updatedAt = new Date().toISOString();
    log.updatedAt = meal.updatedAt;
    saveState();
    renderPlateBuilder(log);
    renderFoodDialogMealPanel();
    renderFoodCatalog();
  }

  function renderPlateBuilder(log) {
    const meals = normalizePlateMeals(log.plateMeals, log.plateItems);
    log.plateMeals = meals;
    log.plateItems = [];
    if (!meals.some((meal) => meal.id === log.activeMealId)) {
      log.activeMealId = meals[0]?.id || "";
    }
    const checkedMeals = meals.filter((meal) => meal.included);
    const totals = calculateMealsTotals(checkedMeals);
    const targets = calculateNutritionTargets(getNutritionProfile());
    els.plateTotalCalories.textContent = `${formatInteger(totals.calories)} kcal`;
    els.plateTotalProtein.textContent = `${formatDecimal(totals.protein)} g`;
    els.plateTotalCarbs.textContent = `${formatDecimal(totals.carbs)} g`;
    els.plateTotalFat.textContent = `${formatDecimal(totals.fat)} g`;
    els.plateTotalFiber.textContent = `${formatDecimal(totals.fiber)} g`;
    renderPlateTargetStatus(totals, targets, checkedMeals.length);
    els.plateItemsList.innerHTML = meals.length
      ? meals.map((meal) => renderPlateMealCard(meal, targets, log.activeMealId)).join("")
      : '<div class="empty-state compact-empty">Crie uma refeição e adicione alimentos do catalogo.</div>';
  }

  function renderPlateTargetStatus(totals, targets, checkedMealCount = 0) {
    const macroTargets = calculatePlateMacroTargets(targets);
    const statuses = macroStatusList(totals, macroTargets);
    const mealCount = recommendedMealCount(targets);
    const summary = macroStatusSummary(statuses, "Dia dentro das metas principais.");

    els.plateTargetStatus.innerHTML = `
      <div class="plate-target-summary">${escapeHtml(`${checkedMealCount}/${mealCount} refeições marcadas. ${summary}`)}</div>
      ${statuses.map(renderPlateTargetRow).join("")}
    `;
  }

  function calculatePlateMacroTargets(targets, divisor = 1) {
    const calories = Math.max(0, targets.calories);
    const protein = Math.max(0, targets.protein);
    const fat = Math.round((calories * 0.3) / 9);
    const carbs = Math.max(0, Math.round((calories - (protein * 4) - (fat * 9)) / 4));
    const safeDivisor = Math.max(1, Number(divisor) || 1);
    return {
      calories: Math.round(calories / safeDivisor),
      protein: roundToPrecision(protein / safeDivisor, 1),
      carbs: roundToPrecision(carbs / safeDivisor, 1),
      fat: roundToPrecision(fat / safeDivisor, 1),
      fiber: roundToPrecision(Math.max(0, targets.fiberTarget) / safeDivisor, 1),
    };
  }

  function macroStatusList(totals, targets) {
    return [
      plateTargetStatus("Calorias", totals.calories, targets.calories, "kcal", formatInteger),
      plateTargetStatus("Proteina", totals.protein, targets.protein, "g", formatDecimal),
      plateTargetStatus("Carboidratos", totals.carbs, targets.carbs, "g", formatDecimal),
      plateTargetStatus("Gorduras", totals.fat, targets.fat, "g", formatDecimal),
      plateTargetStatus("Fibra", totals.fiber, targets.fiber, "g", formatDecimal),
    ];
  }

  function macroStatusSummary(statuses, okText) {
    const missing = statuses.filter((status) => status.state === "missing").map((status) => status.label.toLowerCase());
    const over = statuses.filter((status) => status.state === "over").map((status) => status.label.toLowerCase());
    if (missing.length) {
      return `Falta ${missing.join(", ")}.`;
    }
    if (over.length) {
      return `Passou ${over.join(", ")}.`;
    }
    return okText;
  }

  function plateTargetStatus(label, current, target, unit, formatter) {
    const targetValue = Math.max(0, Number(target) || 0);
    const currentValue = Math.max(0, Number(current) || 0);
    const missingAmount = Math.max(0, targetValue - currentValue);
    const overAmount = Math.max(0, currentValue - targetValue);
    const progress = targetValue > 0 ? Math.min(140, Math.round((currentValue / targetValue) * 100)) : 0;
    let state = "ok";
    let detail = "ok";

    if (targetValue > 0 && currentValue < targetValue * 0.95) {
      state = "missing";
      detail = `Faltam ${formatter(missingAmount)} ${unit}`;
    } else if (targetValue > 0 && currentValue > targetValue * 1.05) {
      state = "over";
      detail = `Passou ${formatter(overAmount)} ${unit}`;
    }

    return {
      label,
      state,
      detail,
      progress,
      current: `${formatter(currentValue)} ${unit}`,
      target: `${formatter(targetValue)} ${unit}`,
    };
  }

  function renderPlateTargetRow(status) {
    return `
      <div class="plate-target-row ${escapeHtml(status.state)}">
        <strong>${escapeHtml(status.label)}</strong>
        <div class="plate-target-bar" aria-hidden="true">
          <span style="width: ${status.progress}%;"></span>
        </div>
        <small>${escapeHtml(status.detail)} / meta ${escapeHtml(status.target)}</small>
      </div>
    `;
  }

  function renderPlateMeal(meal, targets, activeMealId) {
    const totals = calculatePlateTotals(meal.items);
    const mealTargets = calculatePlateMacroTargets(targets, recommendedMealCount(targets));
    const statuses = macroStatusList(totals, mealTargets);
    const summary = macroStatusSummary(statuses, "Refeição bem equilibrada.");
    const isActive = meal.id === activeMealId;
    const checkedClass = meal.included ? "included" : "pending";
    return `
      <article class="meal-card ${escapeHtml(checkedClass)} ${isActive ? "active" : ""}" data-meal-id="${escapeHtml(meal.id)}">
        <button class="meal-check" type="button" data-meal-action="toggle" data-meal-id="${escapeHtml(meal.id)}" aria-label="Marcar refeição no total do dia" title="Conta no total do dia">
          ${meal.included ? svgIcon("icon-check") : ""}
        </button>
        <div class="meal-card-main">
          <div class="meal-card-top">
            <div>
              <strong>${escapeHtml(meal.title || mealTitleFromItems(meal.items))}</strong>
              <span>${escapeHtml(mealItemsText(meal.items))}</span>
            </div>
            <small>${meal.included ? "Conta no total do dia" : "Nao conta no total"}</small>
          </div>
          <div class="meal-total-line">
            <span>${formatInteger(totals.calories)} kcal</span>
            <span>${formatDecimal(totals.protein)}g prot.</span>
            <span>${formatDecimal(totals.carbs)}g carb.</span>
            <span>${formatDecimal(totals.fat)}g gord.</span>
            <span>${formatDecimal(totals.fiber)}g fibra</span>
          </div>
          <div class="meal-missing-line">${escapeHtml(summary)}</div>
        </div>
        <div class="meal-card-actions">
          <button class="button secondary compact-button" type="button" data-meal-action="edit" data-meal-id="${escapeHtml(meal.id)}">Editar</button>
          <button class="icon-button" type="button" data-meal-action="remove" data-meal-id="${escapeHtml(meal.id)}" aria-label="Remover refeição" title="Remover">
            ${svgIcon("icon-trash")}
          </button>
        </div>
      </article>
    `;
  }

  function renderPlateMealCard(meal, targets, activeMealId) {
    const normalizedItems = normalizePlateItems(meal.items);
    const totals = calculatePlateTotals(meal.items);
    const mealTargets = calculatePlateMacroTargets(targets, recommendedMealCount(targets));
    const statuses = macroStatusList(totals, mealTargets);
    const summary = macroStatusSummary(statuses, "Refeição bem equilibrada.");
    const isActive = meal.id === activeMealId;
    const checkedClass = meal.included ? "included" : "pending";
    const plateNumber = Math.max(1, Number(meal.order) || 1);
    const itemCount = normalizedItems.length;
    const itemLabel = itemCount ? `${itemCount} alimento${itemCount > 1 ? "s" : ""}` : "sem alimentos";
    const title = meal.title || mealTitleFromItems(meal.items);
    const actionLabel = itemCount ? "Editar prato" : "Escolher alimentos";

    return `
      <article class="meal-card ${escapeHtml(checkedClass)} ${isActive ? "active" : ""} ${itemCount ? "" : "empty"}" data-meal-id="${escapeHtml(meal.id)}">
        <div class="meal-card-headline">
          <button class="meal-check" type="button" data-meal-action="toggle" data-meal-id="${escapeHtml(meal.id)}" aria-label="Marcar refeicao no total do dia" title="Conta no total do dia">
            ${meal.included ? svgIcon("icon-check") : ""}
          </button>
          <div class="meal-title-wrap">
            <small>
              <span>Prato ${formatInteger(plateNumber)}</span>
              ${isActive ? '<span class="meal-active-pill">Selecionado</span>' : ""}
            </small>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(`${itemLabel} - ${mealItemsText(meal.items)}`)}</span>
          </div>
          <span class="meal-status-pill ${meal.included ? "included" : "pending"}">${meal.included ? "Conta no total" : "Fora do total"}</span>
        </div>
        <div class="meal-card-main">
          ${itemCount
            ? `<div class="meal-total-line" aria-label="Totais do prato">
                <span>${formatInteger(totals.calories)} kcal</span>
                <span>${formatDecimal(totals.protein)}g prot.</span>
                <span>${formatDecimal(totals.carbs)}g carb.</span>
                <span>${formatDecimal(totals.fat)}g gord.</span>
                <span>${formatDecimal(totals.fiber)}g fibra</span>
              </div>`
            : '<div class="meal-empty-callout">Refeição criada. Use este card para montar um prato novo.</div>'}
          <div class="meal-missing-line">${escapeHtml(itemCount ? summary : "Adicione alimentos para montar este prato.")}</div>
        </div>
        <div class="meal-card-actions">
          <button class="button secondary compact-button meal-rename-button" type="button" data-meal-action="rename" data-meal-id="${escapeHtml(meal.id)}">Renomear</button>
          <button class="button ${itemCount ? "secondary" : "primary"} compact-button meal-edit-button" type="button" data-meal-action="edit" data-meal-id="${escapeHtml(meal.id)}">${actionLabel}</button>
          <button class="icon-button" type="button" data-meal-action="remove" data-meal-id="${escapeHtml(meal.id)}" aria-label="Remover refeicao" title="Remover">
            ${svgIcon("icon-trash")}
          </button>
        </div>
      </article>
    `;
  }

  function handlePlateItemsClick(event) {
    const actionButton = event.target.closest("[data-meal-action]");
    if (!actionButton) {
      return;
    }

    const log = ensureNutritionLog(todayDate());
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    const mealId = actionButton.dataset.mealId;
    const action = actionButton.dataset.mealAction;
    const meal = log.plateMeals.find((entry) => entry.id === mealId);
    if (action === "toggle" && meal) {
      meal.included = !meal.included;
      log.activeMealId = meal.id;
    }
    if (action === "edit" && meal) {
      log.activeMealId = meal.id;
      log.updatedAt = new Date().toISOString();
      saveState();
      openFoodDialog();
      return;
    }
    if (action === "rename" && meal) {
      const currentTitle = meal.title || mealTitleFromItems(meal.items);
      const nextTitle = window.prompt("Nome do prato:", currentTitle);
      if (nextTitle === null) {
        return;
      }

      const trimmedTitle = nextTitle.trim().slice(0, 70);
      meal.customTitle = Boolean(trimmedTitle);
      meal.title = trimmedTitle || mealTitleFromItems(meal.items);
      log.activeMealId = meal.id;
      log.updatedAt = new Date().toISOString();
      saveState();
      renderPlateBuilder(log);
      return;
    }
    if (action === "remove") {
      log.plateMeals = log.plateMeals.filter((entry) => entry.id !== mealId);
      if (log.activeMealId === mealId) {
        log.activeMealId = log.plateMeals[0]?.id || "";
      }
    }
    log.updatedAt = new Date().toISOString();
    saveState();
    renderPlateBuilder(log);
  }

  function createNewPlateMeal() {
    const log = ensureNutritionLog(todayDate());
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    const meal = createPlateMeal([], log.plateMeals.length + 1, true);
    log.plateMeals.push(meal);
    log.activeMealId = meal.id;
    log.updatedAt = new Date().toISOString();
    saveState();
    renderPlateBuilder(log);
  }

  function renderMealIdeas() {
    if (!els.mealIdeasList) {
      return;
    }
    state.savedMealIdeas = normalizeSavedMealIdeas(state.savedMealIdeas);
    const ideas = dailyMealIdeas(todayDate());
    els.mealIdeasDate.textContent = `Hoje - ${formatDate(todayDate())}`;
    els.mealIdeasList.innerHTML = ideas.map(renderMealIdeaCard).join("");

    const savedIdeas = state.savedMealIdeas
      .map((ideaId) => mealIdeaById(ideaId))
      .filter(Boolean);
    els.savedMealIdeasList.innerHTML = savedIdeas.length
      ? savedIdeas.map((idea) => renderMealIdeaCard(idea, { compact: true })).join("")
      : '<div class="empty-state compact-empty">Nenhuma ideia salva ainda.</div>';
  }

  function dailyMealIdeas(date) {
    const offset = Number(state.settings?.mealIdeaOffset) || 0;
    const start = hashString(date) % PLATE_IDEAS.length;
    return Array.from({ length: 6 }, (_, index) => {
      return PLATE_IDEAS[(start + offset + index) % PLATE_IDEAS.length];
    });
  }

  function renderMealIdeaCard(idea, options = {}) {
    const totals = calculatePlateTotals(idea.items.map(([foodId, quantity]) => ({ foodId, quantity })));
    const saved = state.savedMealIdeas.includes(idea.id);
    return `
      <article class="meal-idea-card ${options.compact ? "compact" : ""}">
        <div>
          <strong>${escapeHtml(idea.title)}</strong>
          <span>${escapeHtml(idea.tags)}</span>
          <small>${formatInteger(totals.calories)} kcal - ${formatDecimal(totals.protein)}g prot. - ${formatDecimal(totals.carbs)}g carb. - ${formatDecimal(totals.fat)}g gord. - ${formatDecimal(totals.fiber)}g fibra</small>
        </div>
        <div class="meal-idea-actions">
          <button class="button secondary compact-button" type="button" data-idea-action="use" data-idea-id="${escapeHtml(idea.id)}">Usar</button>
          <button class="button ${saved ? "primary" : "secondary"} compact-button" type="button" data-idea-action="${saved ? "unsave" : "save"}" data-idea-id="${escapeHtml(idea.id)}">
            ${saved ? "Salvo" : "Salvar"}
          </button>
        </div>
      </article>
    `;
  }

  function handleMealIdeaClick(event) {
    const button = event.target.closest("[data-idea-action]");
    if (!button) {
      return;
    }
    const idea = mealIdeaById(button.dataset.ideaId);
    if (!idea) {
      return;
    }
    const action = button.dataset.ideaAction;
    state.savedMealIdeas = normalizeSavedMealIdeas(state.savedMealIdeas);

    if (action === "save" && !state.savedMealIdeas.includes(idea.id)) {
      state.savedMealIdeas.push(idea.id);
    }
    if (action === "unsave") {
      state.savedMealIdeas = state.savedMealIdeas.filter((ideaId) => ideaId !== idea.id);
    }
    if (action === "use") {
      addMealIdeaToToday(idea);
    }
    saveState();
    renderNutrition();
  }

  function refreshMealIdeas() {
    state.settings = state.settings || {};
    state.settings.mealIdeaOffset = (Number(state.settings.mealIdeaOffset) || 0) + 6;
    saveState();
    renderMealIdeas();
  }

  function addMealIdeaToToday(idea) {
    const log = ensureNutritionLog(todayDate());
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    const items = idea.items.map(([foodId, quantity]) => ({
      id: createId("plateitem"),
      foodId,
      quantity,
    }));
    const meal = createPlateMeal(items, log.plateMeals.length + 1, true);
    meal.title = idea.title;
    meal.customTitle = true;
    log.plateMeals.push(meal);
    log.activeMealId = meal.id;
    log.updatedAt = new Date().toISOString();
  }

  function mealIdeaById(ideaId) {
    return PLATE_IDEAS.find((idea) => idea.id === ideaId) || null;
  }

  function normalizeSavedMealIdeas(savedIdeas) {
    return Array.from(new Set(Array.isArray(savedIdeas) ? savedIdeas : []))
      .filter((ideaId) => Boolean(mealIdeaById(ideaId)));
  }

  function hashString(value) {
    return String(value).split("").reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
    }, 2166136261);
  }

  function foodCatalogGroups() {
    return Array.from(new Set(FOOD_CATALOG.map((food) => food.group))).sort((a, b) => a.localeCompare(b));
  }

  function foodById(foodId) {
    return FOOD_CATALOG.find((food) => food.id === foodId) || null;
  }

  function normalizePlateItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item && foodById(item.foodId || item.food_id))
      .map((item) => ({
        id: item.id || createId("plateitem"),
        foodId: item.foodId || item.food_id,
        quantity: parseNutritionNumber(item.quantity ?? item.qty, 1, 0.25, 20, 2),
      }));
  }

  function normalizePlateMeals(meals, legacyItems = []) {
    const normalizedMeals = Array.isArray(meals)
      ? meals
          .map((meal, index) => {
            const items = normalizePlateItems(meal.items || meal.plateItems || meal.plate_items || []);
            const generatedTitle = items.length ? mealTitleFromItems(items) : `Refeição ${index + 1}`;
            const rawTitle = String(meal.title || meal.name || "").trim();
            const hasManualTitle = meal.customTitle === true || meal.custom_title === true || Boolean(rawTitle && rawTitle !== generatedTitle);
            return {
              id: meal.id || createId("meal"),
              title: rawTitle || generatedTitle,
              customTitle: hasManualTitle,
              items,
              included: meal.included !== false && meal.checked !== false,
              createdAt: meal.createdAt || meal.created_at || new Date().toISOString(),
              updatedAt: meal.updatedAt || meal.updated_at || meal.createdAt || meal.created_at || new Date().toISOString(),
              order: Number.isFinite(Number(meal.order)) ? Number(meal.order) : index,
            };
          })
      : [];

    if (!normalizedMeals.length) {
      const items = normalizePlateItems(legacyItems);
      if (items.length) {
        normalizedMeals.push(createPlateMeal(items, 1, true));
      }
    }

    return normalizedMeals.sort((a, b) => a.order - b.order);
  }

  function createPlateMeal(items = [], order = 1, included = true) {
    const normalizedItems = normalizePlateItems(items);
    const now = new Date().toISOString();
    return {
      id: createId("meal"),
      title: normalizedItems.length ? mealTitleFromItems(normalizedItems) : `Refeição ${order}`,
      customTitle: false,
      items: normalizedItems,
      included,
      order,
      createdAt: now,
      updatedAt: now,
    };
  }

  function ensureActivePlateMeal(log) {
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    let meal = log.plateMeals.find((entry) => entry.id === log.activeMealId);
    if (!meal) {
      meal = log.plateMeals[0] || createPlateMeal([], log.plateMeals.length + 1, true);
      if (!log.plateMeals.some((entry) => entry.id === meal.id)) {
        log.plateMeals.push(meal);
      }
      log.activeMealId = meal.id;
    }
    return meal;
  }

  function updatePlateMealTitle(meal) {
    if (!meal.customTitle) {
      meal.title = mealTitleFromItems(meal.items);
    }
  }

  function mealTitleFromItems(items) {
    const names = normalizePlateItems(items)
      .slice(0, 4)
      .map((item) => foodById(item.foodId)?.name)
      .filter(Boolean);
    if (!names.length) {
      return "Nova refeição";
    }
    if (names.length === 1) {
      return names[0];
    }
    return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
  }

  function mealItemsText(items) {
    const names = normalizePlateItems(items)
      .map((item) => {
        const food = foodById(item.foodId);
        return food ? `${formatDecimal(item.quantity)}x ${food.name}` : "";
      })
      .filter(Boolean);
    return names.length ? names.join(" | ") : "Sem alimentos ainda";
  }

  function calculateMealsTotals(meals) {
    return (Array.isArray(meals) ? meals : []).reduce(
      (totals, meal) => {
        const subtotal = calculatePlateTotals(meal.items);
        totals.calories += subtotal.calories;
        totals.protein += subtotal.protein;
        totals.carbs += subtotal.carbs;
        totals.fat += subtotal.fat;
        totals.fiber += subtotal.fiber;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }

  function recommendedMealCount(targets) {
    const calories = Number(targets?.calories) || 0;
    if (calories <= 1800) {
      return 3;
    }
    if (calories <= 2600) {
      return 4;
    }
    return 5;
  }

  function calculatePlateTotals(items) {
    return normalizePlateItems(items).reduce(
      (totals, item) => {
        const subtotal = calculateFoodSubtotal(foodById(item.foodId), item.quantity);
        totals.calories += subtotal.calories;
        totals.protein += subtotal.protein;
        totals.carbs += subtotal.carbs;
        totals.fat += subtotal.fat;
        totals.fiber += subtotal.fiber;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }

  function calculateFoodSubtotal(food, quantity = 1) {
    if (!food) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    return {
      calories: food.calories * quantity,
      protein: food.protein * quantity,
      carbs: food.carbs * quantity,
      fat: food.fat * quantity,
      fiber: food.fiber * quantity,
    };
  }

  function getNutritionProfile() {
    const profile = normalizeNutritionProfile(state.nutritionProfile);
    state.nutritionProfile = profile;
    return profile;
  }

  function getNutritionProfileFromForm() {
    return normalizeNutritionProfile({
      weightKg: els.nutritionWeight.value,
      heightCm: els.nutritionHeight.value,
      age: els.nutritionAge.value,
      sex: els.nutritionSex.value,
      activityFactor: els.nutritionActivity.value,
      goal: els.nutritionGoal.value,
      proteinFactor: els.nutritionProteinFactor.value,
      waterMlKg: els.nutritionWaterFactor.value,
    });
  }

  function calculateNutritionTargets(profile) {
    const sexOffset = profile.sex === "female" ? -161 : 5;
    const bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * profile.age) + sexOffset;
    const maintenance = Math.max(0, bmr * profile.activityFactor);
    const adjustment = NUTRITION_GOAL_ADJUSTMENTS[profile.goal] || 0;
    const heightMeters = profile.heightCm / 100;
    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      calories: Math.max(0, Math.round(maintenance + adjustment)),
      protein: Math.max(0, Math.round(profile.weightKg * profile.proteinFactor)),
      waterLiters: roundToPrecision((profile.weightKg * profile.waterMlKg) / 1000, 1),
      bmi: heightMeters > 0 ? roundToPrecision(profile.weightKg / (heightMeters * heightMeters), 1) : 0,
      addedSugarLimit: Math.round((Math.max(0, maintenance + adjustment) * 0.1) / 4),
      saturatedFatLimit: Math.round((Math.max(0, maintenance + adjustment) * 0.1) / 9),
      sodiumLimit: 2300,
      fiberTarget: Math.max(20, Math.round((Math.max(0, maintenance + adjustment) / 1000) * 14)),
    };
  }

  function ensureNutritionLog(date = todayDate()) {
    state.nutritionLogs = Array.isArray(state.nutritionLogs) ? state.nutritionLogs : [];
    let log = state.nutritionLogs.find((entry) => entry.date === date);
    if (!log) {
      const now = new Date().toISOString();
      log = {
        id: createId("nutrition"),
        date,
        calories: 0,
        protein: 0,
        water: 0,
        breakfast: "",
        lunch: "",
        dinner: "",
        snacks: "",
        vegetables: 0,
        fruits: 0,
        wholeGrains: 0,
        dairy: 0,
        leanProtein: 0,
        nutsLegumes: 0,
        fiber: 0,
        sodium: 0,
        addedSugar: 0,
        saturatedFat: 0,
        notes: "",
        plateItems: [],
        plateMeals: [],
        activeMealId: "",
        createdAt: now,
        updatedAt: now,
      };
      state.nutritionLogs.unshift(log);
    }
    log.plateMeals = normalizePlateMeals(log.plateMeals, log.plateItems);
    if (!log.activeMealId || !log.plateMeals.some((meal) => meal.id === log.activeMealId)) {
      log.activeMealId = log.plateMeals[0]?.id || "";
    }
    return log;
  }

  function renderWorkoutWeek() {
    const today = todayDate();
    const start = startOfWeek(today);
    const days = Array.from({ length: 7 }, (_, index) => addDateKeyDays(start, index));

    els.workoutWeekGrid.innerHTML = days
      .map((date) => {
        const completions = getWorkoutCompletionsForDate(date);
        const planned = getScheduledWorkoutsForDate(date).filter((workout) => normalizeWorkoutStatus(workout.status) === "active").length;
        return `
          <div class="quest-calendar-day workout-week-day ${date === today ? "today" : ""}">
            <strong>${escapeHtml(workoutWeekdayLabel(date))} ${Number(date.slice(-2))}</strong>
            <span>${completions.length}/${planned} feitos</span>
          </div>
        `;
      })
      .join("");
  }

  function renderWorkoutDayBoard() {
    const start = startOfWeek(todayDate());
    const days = Array.from({ length: 7 }, (_, index) => addDateKeyDays(start, index));
    els.workoutList.innerHTML = days.map(renderWorkoutDayColumn).join("");
  }

  function renderWorkoutDayColumn(date) {
    const workouts = getScheduledWorkoutsForDate(date);
    const cards = workouts.length
      ? workouts.map((workout) => renderWorkoutCard(workout, date)).join("")
      : '<div class="empty-state compact-empty">Sem treino.</div>';

    return `
      <section class="workout-day-column ${date === todayDate() ? "today" : ""}">
        <header class="workout-day-header">
          <div>
            <h3>${escapeHtml(workoutWeekdayLongLabel(date))}</h3>
            <span>${formatDate(date)}</span>
          </div>
          <strong>${workouts.length}</strong>
        </header>
        <div class="workout-day-list">${cards}</div>
      </section>
    `;
  }

  function renderWorkoutCard(workout, date = todayDate()) {
    const type = normalizeWorkoutType(workout.type);
    const config = workoutTypeConfig(type);
    const displayStatus = getWorkoutDisplayStatus(workout, date);
    const weeklyTarget = getWorkoutWeeklyTarget(workout);
    const weekCompletions = getWorkoutCompletionsForWorkoutWeek(workout.id).length;
    const progress = weeklyTarget > 0 ? Math.min(100, Math.round((weekCompletions / weeklyTarget) * 100)) : 0;
    const exercises = normalizeWorkoutExercises(workout.exercises, workout.notes);
    const restTime = getWorkoutRestForDate(workout, date);
    const details = exercises.length
      ? renderWorkoutExerciseSummary(exercises)
      : workout.notes
        ? `<p class="quest-notes workout-notes">${escapeHtml(workout.notes)}</p>`
        : "";

    return `
      <article class="quest-row workout-row is-${escapeHtml(displayStatus)}">
        <div class="quest-main">
          <div class="quest-title-line">
            <h3 class="quest-title">${escapeHtml(workout.title)}</h3>
            <span class="quest-rank workout-type ${escapeHtml(type)}">${escapeHtml(config.label)}</span>
          </div>
          <div class="quest-meta">
            <span>${weekCompletions}/${weeklyTarget} na semana</span>
            <span>${escapeHtml(workoutStatusLabel(workout, date))}</span>
            ${restTime ? `<span>Descanso: ${escapeHtml(restTime)}</span>` : ""}
          </div>
          <div class="workout-card-progress" aria-hidden="true">
            <span style="width: ${progress}%"></span>
          </div>
          ${details}
        </div>
        <div class="quest-row-actions">
          ${workoutPrimaryActionHtml(workout, displayStatus, date)}
          ${workoutSecondaryActionHtml(workout, displayStatus, date)}
          <button class="icon-button" type="button" data-workout-action="move-up" data-workout-id="${escapeHtml(workout.id)}" data-workout-date="${escapeHtml(date)}" aria-label="Mover treino para cima" title="Mover para cima">
            ${svgIcon("icon-arrow-up")}
          </button>
          <button class="icon-button" type="button" data-workout-action="move-down" data-workout-id="${escapeHtml(workout.id)}" data-workout-date="${escapeHtml(date)}" aria-label="Mover treino para baixo" title="Mover para baixo">
            ${svgIcon("icon-arrow-down")}
          </button>
          <button class="icon-button" type="button" data-workout-action="edit" data-workout-id="${escapeHtml(workout.id)}" aria-label="Editar treino" title="Editar">
            ${svgIcon("icon-edit")}
          </button>
          <button class="icon-button" type="button" data-workout-action="delete" data-workout-id="${escapeHtml(workout.id)}" aria-label="Excluir treino" title="Excluir">
            ${svgIcon("icon-trash")}
          </button>
        </div>
      </article>
    `;
  }

  function workoutPrimaryActionHtml(workout, displayStatus, date = todayDate()) {
    if (displayStatus === "completed") {
      return `
        <button class="icon-button" type="button" data-workout-action="reopen" data-workout-id="${escapeHtml(workout.id)}" data-workout-date="${escapeHtml(date)}" aria-label="Desfazer treino" title="Desfazer">
          ${svgIcon("icon-flag")}
        </button>
      `;
    }

    if (displayStatus === "inactive") {
      return `
        <button class="icon-button" type="button" data-workout-action="activate" data-workout-id="${escapeHtml(workout.id)}" aria-label="Ativar treino" title="Ativar">
          ${svgIcon("icon-flag")}
        </button>
      `;
    }

    return `
      <button class="icon-button" type="button" data-workout-action="complete" data-workout-id="${escapeHtml(workout.id)}" data-workout-date="${escapeHtml(date)}" aria-label="Concluir treino" title="Concluir">
        ${svgIcon("icon-check")}
      </button>
    `;
  }

  function workoutSecondaryActionHtml(workout, displayStatus, date = todayDate()) {
    if (displayStatus === "inactive") {
      return "";
    }

    return `
      <button class="icon-button" type="button" data-workout-action="deactivate" data-workout-id="${escapeHtml(workout.id)}" data-workout-date="${escapeHtml(date)}" aria-label="Inativar treino" title="Inativar">
        ${svgIcon("icon-lock")}
      </button>
    `;
  }

  function openWorkoutDialog(workoutId) {
    const workout = workoutId ? state.workouts.find((entry) => entry.id === workoutId) : null;
    resetWorkoutForm();
    if (workout) {
      fillWorkoutForm(workout);
    }

    if (typeof els.workoutDialog.showModal === "function") {
      els.workoutDialog.showModal();
    } else {
      els.workoutDialog.setAttribute("open", "open");
    }

    requestAnimationFrame(() => els.workoutTitle.focus());
  }

  function closeWorkoutDialog() {
    if (typeof els.workoutDialog.close === "function") {
      els.workoutDialog.close();
    } else {
      els.workoutDialog.removeAttribute("open");
    }
    resetWorkoutForm();
  }

  function handleWorkoutSubmit(event) {
    event.preventDefault();

    const title = els.workoutTitle.value.trim();
    if (!title) {
      showToast("Informe o nome do treino.");
      return;
    }

    const now = new Date().toISOString();
    const id = els.workoutId.value;
    const existing = state.workouts.find((workout) => workout.id === id);
    const exercises = collectWorkoutExercises();
    const workout = {
      id: existing?.id || createId("workout"),
      title,
      type: normalizeWorkoutType(els.workoutType.value),
      weekdays: getSelectedWorkoutWeekdays(),
      restTimes: getSelectedWorkoutRestTimes(),
      reward: Math.max(1, Math.round(Number(els.workoutReward.value) || DEFAULT_WORKOUT_REWARD)),
      status: normalizeWorkoutStatus(els.workoutStatus.value),
      notes: serializeWorkoutExercises(exercises),
      exercises,
      dayOrder: normalizeWorkoutDayOrder(existing?.dayOrder || {}),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    if (!workout.weekdays.length) {
      showToast("Escolha pelo menos um dia da semana.");
      return;
    }

    if (existing) {
      Object.assign(existing, workout);
      showToast("Treino atualizado.");
    } else {
      state.workouts.unshift(workout);
      showToast("Treino criado.");
    }

    saveState();
    closeWorkoutDialog();
    renderWorkouts();
    renderHome();
  }

  function handleWorkoutListClick(event) {
    const button = event.target.closest("[data-workout-action]");
    if (!button) {
      return;
    }

    const workout = state.workouts.find((item) => item.id === button.dataset.workoutId);
    if (!workout) {
      return;
    }

    const action = button.dataset.workoutAction;
    const date = normalizeQuestDueDate(button.dataset.workoutDate) || todayDate();
    if (action === "edit") {
      openWorkoutDialog(workout.id);
    } else if (action === "delete") {
      deleteWorkout(workout);
    } else if (action === "complete") {
      completeWorkout(workout, date);
    } else if (action === "reopen") {
      reopenWorkoutDate(workout, date);
    } else if (action === "activate") {
      setWorkoutStatus(workout, "active");
    } else if (action === "deactivate") {
      setWorkoutStatus(workout, "inactive");
    } else if (action === "move-up") {
      moveWorkoutInDay(workout, date, -1);
    } else if (action === "move-down") {
      moveWorkoutInDay(workout, date, 1);
    }
  }

  function fillWorkoutForm(workout) {
    els.workoutId.value = workout.id;
    els.workoutTitle.value = workout.title;
    els.workoutType.value = normalizeWorkoutType(workout.type);
    els.workoutReward.value = String(getWorkoutReward(workout));
    setSelectedWorkoutWeekdays(normalizeWorkoutWeekdays(workout.weekdays, getWorkoutWeeklyTarget(workout)));
    setWorkoutRestTimes(workout.restTimes);
    els.workoutStatus.value = normalizeWorkoutStatus(workout.status);
    els.workoutNotes.value = workout.notes || "";
    renderWorkoutExerciseRows(normalizeWorkoutExercises(workout.exercises, workout.notes));
    els.workoutDialogTitle.textContent = "Editar treino";
    els.workoutFormSubtitle.textContent = "Editando treino";
    els.workoutSubmitLabel.textContent = "Salvar treino";
  }

  function renderWorkoutExerciseRows(exercises = []) {
    if (!els.workoutExerciseRows) {
      return;
    }
    const rows = normalizeWorkoutExercises(exercises).length ? normalizeWorkoutExercises(exercises) : [{ exercise: "", reps: "", amount: "" }];
    els.workoutExerciseRows.innerHTML = rows.map(renderWorkoutExerciseRow).join("");
  }

  function renderWorkoutExerciseRow(exercise = {}) {
    return `
      <div class="workout-exercise-row">
        <input data-workout-exercise-field="exercise" type="text" maxlength="80" placeholder="Ex.: Supino, corrida, prancha" value="${escapeHtml(exercise.exercise || "")}">
        <input data-workout-exercise-field="reps" type="text" maxlength="40" placeholder="Ex.: 3x12" value="${escapeHtml(exercise.reps || "")}">
        <input data-workout-exercise-field="amount" type="text" maxlength="60" placeholder="Ex.: 40kg, 20min, 2km" value="${escapeHtml(exercise.amount || "")}">
        <button class="icon-button" type="button" data-workout-exercise-action="remove" aria-label="Remover exercício" title="Remover">
          ${svgIcon("icon-trash")}
        </button>
      </div>
    `;
  }

  function addWorkoutExerciseRow(exercise = {}) {
    if (!els.workoutExerciseRows) {
      return;
    }
    els.workoutExerciseRows.insertAdjacentHTML("beforeend", renderWorkoutExerciseRow(exercise));
    const row = els.workoutExerciseRows.lastElementChild;
    row?.querySelector("input")?.focus();
  }

  function handleWorkoutExerciseRowsClick(event) {
    const button = event.target.closest("[data-workout-exercise-action='remove']");
    if (!button) {
      return;
    }
    const row = button.closest(".workout-exercise-row");
    if (!row) {
      return;
    }
    if (els.workoutExerciseRows.querySelectorAll(".workout-exercise-row").length <= 1) {
      row.querySelectorAll("input").forEach((input) => {
        input.value = "";
      });
      row.querySelector("input")?.focus();
      return;
    }
    row.remove();
  }

  function collectWorkoutExercises() {
    if (!els.workoutExerciseRows) {
      return [];
    }
    return normalizeWorkoutExercises(Array.from(els.workoutExerciseRows.querySelectorAll(".workout-exercise-row")).map((row) => ({
      exercise: row.querySelector("[data-workout-exercise-field='exercise']")?.value || "",
      reps: row.querySelector("[data-workout-exercise-field='reps']")?.value || "",
      amount: row.querySelector("[data-workout-exercise-field='amount']")?.value || "",
    })));
  }

  function normalizeWorkoutExercises(exercises, fallbackNotes = "") {
    const rows = Array.isArray(exercises) ? exercises : [];
    const normalized = rows
      .map((entry) => ({
        exercise: String(entry?.exercise || entry?.name || entry?.title || "").trim().slice(0, 80),
        reps: String(entry?.reps || entry?.repetitions || entry?.sets || "").trim().slice(0, 40),
        amount: String(entry?.amount || entry?.quantity || entry?.time || entry?.duration || "").trim().slice(0, 60),
      }))
      .filter((entry) => entry.exercise || entry.reps || entry.amount)
      .slice(0, 40);
    if (normalized.length || !String(fallbackNotes || "").trim()) {
      return normalized;
    }
    return String(fallbackNotes)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((line) => {
        const parts = line.split(/\s+-\s+|\s+\|\s+/).map((part) => part.trim()).filter(Boolean);
        return {
          exercise: parts[0] || line,
          reps: parts[1] || "",
          amount: parts.slice(2).join(" - "),
        };
      });
  }

  function serializeWorkoutExercises(exercises = []) {
    return normalizeWorkoutExercises(exercises)
      .map((entry) => [entry.exercise, entry.reps, entry.amount].filter(Boolean).join(" - "))
      .join("\n")
      .slice(0, 700);
  }

  function renderWorkoutExerciseSummary(exercises = []) {
    const rows = normalizeWorkoutExercises(exercises);
    if (!rows.length) {
      return "";
    }
    return `
      <div class="workout-exercise-summary">
        <div class="workout-exercise-summary-head">
          <span>Exercício</span>
          <span>Reps.</span>
          <span>Tempo/qtd.</span>
        </div>
        ${rows.map((entry) => `
          <div class="workout-exercise-summary-row">
            <span data-label="Exercício">${escapeHtml(entry.exercise || "-")}</span>
            <span data-label="Reps.">${escapeHtml(entry.reps || "-")}</span>
            <span data-label="Tempo/qtd.">${escapeHtml(entry.amount || "-")}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function deleteWorkout(workout) {
    const confirmed = window.confirm(`Excluir o treino "${workout.title}"?`);
    if (!confirmed) {
      return;
    }

    state.workouts = state.workouts.filter((item) => item.id !== workout.id);
    state.workoutCompletions = (state.workoutCompletions || []).filter((item) => item.workoutId !== workout.id);
    saveState();
    renderWorkouts();
    renderHome();
    showToast("Treino excluido.");
  }

  function completeWorkout(workout, date = todayDate()) {
    if (normalizeWorkoutStatus(workout.status) === "inactive") {
      showToast("Ative o treino antes de concluir.");
      return;
    }
    if (isWorkoutDoneOnDate(workout, date)) {
      showToast("Treino ja concluido nesse dia.");
      return;
    }

    const now = new Date().toISOString();
    state.workoutCompletions = Array.isArray(state.workoutCompletions) ? state.workoutCompletions : [];
    state.workoutCompletions.unshift({
      id: createId("workoutdone"),
      workoutId: workout.id,
      workoutName: workout.title,
      type: normalizeWorkoutType(workout.type),
      reward: getWorkoutReward(workout),
      completedAt: now,
      date,
      weekStart: startOfWeek(date),
    });
    workout.updatedAt = now;
    saveState();
    renderWorkouts();
    renderHome();
    showToast("Treino concluido.");
  }

  function reopenWorkoutDate(workout, date = todayDate()) {
    state.workoutCompletions = Array.isArray(state.workoutCompletions) ? state.workoutCompletions : [];
    const index = state.workoutCompletions.findIndex((completion) => completion.workoutId === workout.id && completion.date === date);
    if (index >= 0) {
      state.workoutCompletions.splice(index, 1);
    }
    workout.updatedAt = new Date().toISOString();
    saveState();
    renderWorkouts();
    renderHome();
    showToast("Treino reaberto.");
  }

  function setWorkoutStatus(workout, status) {
    workout.status = normalizeWorkoutStatus(status);
    workout.updatedAt = new Date().toISOString();
    saveState();
    renderWorkouts();
    renderHome();
    showToast(workout.status === "active" ? "Treino ativado." : "Treino inativado.");
  }

  function moveWorkoutInDay(workout, date = todayDate(), direction = 0) {
    const day = workoutWeekdayKey(date);
    const workouts = getScheduledWorkoutsForDate(date);
    const currentIndex = workouts.findIndex((entry) => entry.id === workout.id);
    const nextIndex = currentIndex + Number(direction);
    if (!day || currentIndex < 0 || nextIndex < 0 || nextIndex >= workouts.length) {
      return;
    }

    const reordered = workouts.slice();
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    const now = new Date().toISOString();
    reordered.forEach((entry, index) => {
      entry.dayOrder = {
        ...normalizeWorkoutDayOrder(entry.dayOrder),
        [day]: index + 1,
      };
      entry.updatedAt = now;
    });

    saveState();
    renderWorkouts();
    renderHome();
  }

  function resetWorkoutForm() {
    els.workoutForm.reset();
    els.workoutId.value = "";
    els.workoutType.value = "strength";
    els.workoutReward.value = String(DEFAULT_WORKOUT_REWARD);
    setSelectedWorkoutWeekdays(DEFAULT_WORKOUT_WEEKDAYS);
    setWorkoutRestTimes({});
    els.workoutStatus.value = "active";
    els.workoutNotes.value = "";
    renderWorkoutExerciseRows([]);
    els.workoutDialogTitle.textContent = "Cadastrar treino";
    els.workoutFormSubtitle.textContent = "Cadastro de treino";
    els.workoutSubmitLabel.textContent = "Criar treino";
  }

  function getVisibleWorkouts() {
    return getSortedWorkouts();
  }

  function getSortedWorkouts() {
    return (state.workouts || []).slice().sort(compareWorkoutBaseOrder);
  }

  function compareWorkoutBaseOrder(a, b) {
    const byType = WORKOUT_TYPE_ORDER.indexOf(normalizeWorkoutType(a.type)) - WORKOUT_TYPE_ORDER.indexOf(normalizeWorkoutType(b.type));
    if (byType !== 0) {
      return byType;
    }
    const byStatus = workoutStatusSortValue(a) - workoutStatusSortValue(b);
    return byStatus || String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  }

  function compareWorkoutForDate(date) {
    const day = workoutWeekdayKey(date);
    return (a, b) => {
      const orderA = normalizeWorkoutDayOrder(a.dayOrder)[day];
      const orderB = normalizeWorkoutDayOrder(b.dayOrder)[day];
      const hasA = Number.isFinite(orderA);
      const hasB = Number.isFinite(orderB);
      if (hasA && hasB && orderA !== orderB) {
        return orderA - orderB;
      }
      if (hasA !== hasB) {
        return hasA ? -1 : 1;
      }
      return compareWorkoutBaseOrder(a, b);
    };
  }

  function workoutStatusSortValue(workout) {
    const displayStatus = getWorkoutDisplayStatus(workout);
    if (displayStatus === "active") {
      return 0;
    }
    if (displayStatus === "completed") {
      return 1;
    }
    return 2;
  }

  function getWorkoutStats() {
    const workouts = state.workouts || [];
    const active = workouts.filter((workout) => normalizeWorkoutStatus(workout.status) === "active");
    const today = todayDate();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekCompletions = getWorkoutCompletionsForRange(weekStart, weekEnd);
    const weekGoal = active.reduce((total, workout) => total + getWorkoutWeeklyTarget(workout), 0);
    const weekProgress = weekGoal ? Math.min(100, Math.round((weekCompletions.length / weekGoal) * 100)) : 0;
    const earnedCoins = getWorkoutEarnedCoins();

    return {
      total: workouts.length,
      activeCount: active.length,
      inactiveCount: workouts.length - active.length,
      weekGoal,
      weekCompletions: weekCompletions.length,
      weekProgress,
      earnedCoins,
      streak: getWorkoutCurrentStreak(today),
    };
  }

  function renderWorkoutHistory() {
    if (!els.workoutHistoryList) {
      return;
    }
    const completions = (state.workoutCompletions || []).slice(0, 12);
    if (!completions.length) {
      els.workoutHistoryList.innerHTML = '<div class="empty-state compact-empty">Nenhum treino concluido ainda.</div>';
      return;
    }

    els.workoutHistoryList.innerHTML = completions
      .map((completion) => {
        const type = workoutTypeConfig(completion.type).label;
        return `
          <div class="quest-breakdown-row workout-history-row">
            <strong>${formatDate(completion.date)}</strong>
            <span>${escapeHtml(completion.workoutName || "Treino")} - ${escapeHtml(type)}</span>
            <small>Concluido</small>
          </div>
        `;
      })
      .join("");
  }

  function renderTransactions() {
    const transactions = getVisibleTransactions();
    const visibleTransactions = transactionsExpanded ? transactions : transactions.slice(0, 10);
    const hasHiddenItems = transactions.length > 10;
    const countLabel = hasHiddenItems && !transactionsExpanded
      ? `${visibleTransactions.length} de ${plural(transactions.length, "item", "itens")}`
      : plural(transactions.length, "item", "itens");
    els.transactionSubtitle.textContent = transactionMonthFilter ? countLabel : `${countLabel} - todos os meses`;
    els.transactionListFooter.hidden = !hasHiddenItems;
    els.transactionDetailsToggle.querySelector("span").textContent = transactionsExpanded ? "Mostrar só 10" : "Detalhes";

    if (!transactions.length) {
      els.transactionList.innerHTML = '<div class="empty-state">Nenhum lançamento encontrado.</div>';
      els.transactionListFooter.hidden = true;
      return;
    }

    els.transactionList.innerHTML = visibleTransactions
      .map((transaction) => {
        const category = findCategory(transaction.categoryId);
        const account = findAccount(transaction.accountId);
        const targetAccount = findAccount(transaction.targetAccountId);
        const amountClass = transactionAmountClass(transaction.type);
        const amountPrefix = transactionAmountPrefix(transaction.type);
        const outgoingAccount = transaction.type === "income" ? "-" : account.name;
        const incomingAccount = transaction.type === "income" ? account.name : transaction.targetAccountId ? targetAccount.name : "-";

        return `
          <article class="transaction-row">
            <div class="transaction-main">
              <div class="transaction-title">${escapeHtml(transaction.description)}</div>
            </div>
            <div class="amount ${amountClass}">${amountPrefix}${formatCurrency(transaction.amount)}</div>
            <div><span class="type-pill ${escapeHtml(transaction.type)}">${typeLabel(transaction.type)}</span></div>
            <div class="transaction-account">${escapeHtml(outgoingAccount)}</div>
            <div class="transaction-account">${escapeHtml(incomingAccount)}</div>
            <div class="transaction-date">${formatDate(transaction.date)}</div>
            <div class="transaction-meta">
              <span class="category-emoji">${escapeHtml(category.emoji || "🏷️")}</span>${escapeHtml(category.name)}
            </div>
            <div class="row-actions">
              <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(transaction.id)}" aria-label="Editar" title="Editar">
                ${svgIcon("icon-edit")}
              </button>
              <button class="icon-button" type="button" data-action="delete" data-id="${escapeHtml(transaction.id)}" aria-label="Excluir" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function toggleTransactionDetails() {
    transactionsExpanded = !transactionsExpanded;
    renderTransactions();
  }

  function renderCashflow() {
    const months = Array.from({ length: 6 }, (_, index) => addMonths(selectedMonth, index - 5));
    const monthlyTotals = months.map((month) => {
      const snapshot = getFinancialSnapshot(month);
      return { month, income: snapshot.actualIncome, expense: snapshot.cashOut };
    });
    const maxAmount = Math.max(1, ...monthlyTotals.flatMap((item) => [item.income, item.expense]));

    els.cashflowChart.innerHTML = monthlyTotals
      .map((item) => {
        const incomeHeight = Math.max(5, Math.round((item.income / maxAmount) * 150));
        const expenseHeight = Math.max(5, Math.round((item.expense / maxAmount) * 150));
        const title = `${formatMonthName(item.month)}: entrou ${formatCurrency(item.income)}, saiu ${formatCurrency(item.expense)}`;

        return `
          <div class="month-bar" title="${escapeHtml(title)}">
            <div class="bar-stack">
              <span class="bar income" style="height:${incomeHeight}px"></span>
              <span class="bar expense" style="height:${expenseHeight}px"></span>
            </div>
            <div class="bar-label">${escapeHtml(shortMonth(item.month))}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderBudgets() {
    const expenseCategories = state.categories
      .filter((category) => category.type === "expense")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    els.budgetSubtitle.textContent = plural(expenseCategories.length, "categoria", "categorias");

    if (!expenseCategories.length) {
      els.budgetList.innerHTML = '<div class="empty-state">Nenhuma categoria de saída.</div>';
      return;
    }

    const monthTransactions = getMonthTransactions(selectedMonth);
    els.budgetList.innerHTML = expenseCategories
      .map((category) => {
        const spent = sumAmounts(
          monthTransactions.filter(
            (transaction) => transaction.type === "expense" && transaction.categoryId === category.id,
          ),
        );
        const limit = getBudgetLimit(category.id);
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        const width = Math.min(100, percent);
        const overLimit = limit > 0 ? Math.max(0, roundMoney(spent - limit)) : 0;
        const remaining = limit > 0 ? Math.max(0, roundMoney(limit - spent)) : 0;
        const rowClass = percent >= 100 ? "over" : percent >= 80 ? "near" : "";
        const statusText = limit > 0 ? `${Math.round(percent)}% usado` : "Sem limite";
        const limitHelp =
          limit > 0
            ? overLimit > 0
              ? `${formatCurrency(overLimit)} acima do limite`
              : `Restam ${formatCurrency(remaining)}`
            : "Digite um valor para ativar";

        return `
          <div class="budget-row ${rowClass}">
            <div class="budget-main">
              <div class="budget-section budget-category-section">
                <span class="budget-label">Categoria</span>
                <div class="budget-title">
                  <span class="category-emoji">${escapeHtml(category.emoji || "🏷️")}</span>${escapeHtml(category.name)}
                </div>
              </div>
              <div class="budget-section budget-spent-section">
                <span class="budget-label">Gasto no mês</span>
                <strong>${formatCurrency(spent)}</strong>
                <small>${limit > 0 ? `de ${formatCurrency(limit)}` : "sem limite definido"}</small>
              </div>
              <label class="budget-section budget-limit-section">
                <span class="budget-label">Limite mensal</span>
                <span class="budget-money-input">
                  <span>R$</span>
                  <input type="number" min="0" step="0.01" value="${limit.toFixed(2)}" data-budget-category="${escapeHtml(category.id)}" aria-label="Limite mensal de ${escapeHtml(category.name)}">
                </span>
                <small>${limitHelp}</small>
              </label>
              <div class="budget-section budget-status-section">
                <span class="budget-label">Status</span>
                <strong class="budget-value">${statusText}</strong>
              </div>
            </div>
            <div class="budget-progress" aria-hidden="true"><span style="width:${width}%"></span></div>
          </div>
        `;
      })
      .join("");
  }

  function renderCategoryLimitOverview() {
    const rows = categoryBudgetRows(selectedMonth)
      .filter((row) => row.hasLimit)
      .sort(
        (a, b) =>
          Number(b.overLimit > 0) - Number(a.overLimit > 0) ||
          b.percent - a.percent ||
          b.spent - a.spent ||
          a.category.name.localeCompare(b.category.name, "pt-BR"),
      );

    els.categoryLimitSubtitle.textContent = rows.length
      ? `${formatMonthName(selectedMonth)} - ${plural(rows.length, "categoria", "categorias")}`
      : "Nenhum limite cadastrado";

    if (!rows.length) {
      els.categoryLimitOverview.innerHTML = '<div class="empty-state compact-empty">Nenhum limite cadastrado.</div>';
      return;
    }

    els.categoryLimitOverview.innerHTML = rows
      .map(({ category, spent, limit, percent, width, remaining, overLimit, rowClass, hasLimit }) => {
        const percentLabel = hasLimit ? `${Math.round(percent)}%` : "Sem limite";
        const remainingLabel = hasLimit
          ? overLimit > 0
            ? `${formatCurrency(overLimit)} acima`
            : `${formatCurrency(remaining)} restante`
          : "Defina o limite";

        return `
          <article class="category-limit-row ${rowClass}">
            <div class="category-limit-top">
              <div class="category-limit-title">
                <span class="category-emoji">${escapeHtml(category.emoji || "🏷️")}</span>${escapeHtml(category.name)}
              </div>
              <strong>${percentLabel}</strong>
            </div>
            <div class="category-limit-progress" aria-hidden="true">
              <span style="width:${width}%"></span>
            </div>
            <div class="category-limit-stats">
              <span><b>Limite</b><strong>${hasLimit ? formatCurrency(limit) : "-"}</strong></span>
              <span><b>Gasto</b><strong>${formatCurrency(spent)}</strong></span>
              <span><b>Restante</b><strong>${remainingLabel}</strong></span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function categoryBudgetRows(month) {
    const expenseTransactions = getMonthTransactions(month).filter((transaction) => transaction.type === "expense");
    return state.categories
      .filter((category) => category.type === "expense")
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((category) => {
        const spent = sumAmounts(expenseTransactions.filter((transaction) => transaction.categoryId === category.id));
        const limit = getBudgetLimit(category.id);
        const hasLimit = limit > 0;
        const percent = hasLimit ? (spent / limit) * 100 : 0;
        const width = hasLimit ? Math.min(100, Math.max(3, Math.round(percent))) : 0;
        const remaining = hasLimit ? Math.max(0, roundMoney(limit - spent)) : 0;
        const overLimit = hasLimit ? Math.max(0, roundMoney(spent - limit)) : 0;
        const rowClass = hasLimit && percent >= 100 ? "over" : hasLimit && percent >= 80 ? "near" : "";
        return { category, spent, limit, hasLimit, percent, width, remaining, overLimit, rowClass };
      });
  }

  function financeComparisonMonths(month = selectedMonth) {
    return [month, addMonths(month, -1), addMonths(month, -2)];
  }

  function monthlyFinanceComparisonItem(month, snapshot = getFinancialSnapshot(month)) {
    return {
      month,
      actualIncome: snapshot.actualIncome,
      cashOut: snapshot.cashOut,
      savedInvested: monthlySavedInvestedAmount(month),
      categoriesOverLimit: categoryBudgetRows(month)
        .filter((row) => row.hasLimit && row.overLimit > 0)
        .sort((a, b) => b.overLimit - a.overLimit || b.spent - a.spent),
      topCategories: topExpenseCategoriesForMonth(month),
      fixedBillsOverExpected: fixedBillsOverExpectedForMonth(month, snapshot),
    };
  }

  function monthlySavedInvestedAmount(month) {
    return roundMoney(
      getMonthTransactions(month).reduce((total, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (amount <= 0 || transaction.status !== "cleared") {
          return total;
        }

        if (transaction.type === "income" && isSavedAccount(findAccount(transaction.accountId))) {
          return roundMoney(total + amount);
        }

        if (
          transaction.type === "transfer" &&
          isSavedAccount(findAccount(transaction.targetAccountId)) &&
          transactionBalanceScopeForSide(transaction, transaction.targetAccountId, "target") === "main"
        ) {
          return roundMoney(total + amount);
        }

        return total;
      }, 0),
    );
  }

  function topExpenseCategoriesForMonth(month, limit = 5) {
    const totals = categoryExpenseTotals(month);
    return state.categories
      .filter((category) => category.type === "expense")
      .map((category) => ({ category, amount: totals.get(category.id) || 0 }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount || a.category.name.localeCompare(b.category.name, "pt-BR"))
      .slice(0, limit);
  }

  function fixedBillsOverExpectedForMonth(month, snapshot = getFinancialSnapshot(month)) {
    return (snapshot.fixedBillDetails || [])
      .filter((bill) => Number(bill.overLimit) > 0)
      .sort((a, b) => Number(b.overLimit) - Number(a.overLimit) || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR"));
  }

  function financeDeltaLabel(current, previous) {
    const difference = roundMoney((Number(current) || 0) - (Number(previous) || 0));
    if (difference === 0) {
      return "igual ao mês anterior";
    }
    return `${formatSignedCurrency(difference)} vs mês anterior`;
  }

  function compactFinanceDeltaLabel(current, previous) {
    const difference = roundMoney((Number(current) || 0) - (Number(previous) || 0));
    return difference === 0
      ? `${formatCurrency(current)} · igual`
      : `${formatCurrency(current)} · ${formatSignedCurrency(difference)}`;
  }

  function getNoSpendProgress(month = selectedMonth, snapshot = getFinancialSnapshot(month), dailySpendable = null) {
    const days = noSpendStreakDays(month);
    const [year, monthNumber] = isMonthKey(month) ? month.split("-").map(Number) : [0, 1];
    const daysInMonth = isMonthKey(month) ? new Date(year, monthNumber, 0).getDate() : 1;
    const isCurrentMonth = month === todayDate().slice(0, 7);
    const perDay = isCurrentMonth && Number.isFinite(Number(dailySpendable))
      ? Number(dailySpendable)
      : roundMoney(snapshot.spendable / Math.max(1, daysInMonth));
    return {
      days,
      accumulated: Math.max(0, roundMoney(days * Math.max(0, perDay))),
    };
  }

  function noSpendStreakDays(month = selectedMonth) {
    if (!isMonthKey(month)) {
      return 0;
    }

    const today = todayDate();
    const current = today.slice(0, 7);
    if (month > current) {
      return 0;
    }

    let cursor = month < current ? endOfMonth(month) : today;
    const firstDay = `${month}-01`;
    const spendingDays = new Set(
      getMonthTransactions(month)
        .filter(isNoSpendBreakingTransaction)
        .map((transaction) => transaction.date),
    );

    let streak = 0;
    while (cursor >= firstDay) {
      if (spendingDays.has(cursor)) {
        break;
      }
      streak += 1;
      cursor = addDateKeyDays(cursor, -1);
    }

    return streak;
  }

  function isNoSpendBreakingTransaction(transaction) {
    if (!transaction || transaction.status !== "cleared") {
      return false;
    }
    if (transaction.type === "expense") {
      return true;
    }
    if (transaction.type === "card_payment") {
      return true;
    }
    return false;
  }

  function renderCategoryBreakdown() {
    const expenseTransactions = getMonthTransactions(selectedMonth).filter((transaction) => transaction.type === "expense");
    const total = sumAmounts(expenseTransactions);
    const totalsByCategory = state.categories
      .filter((category) => category.type === "expense")
      .map((category) => {
        const amount = sumAmounts(expenseTransactions.filter((transaction) => transaction.categoryId === category.id));
        return { category, amount };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    els.categorySubtitle.textContent = total > 0 ? formatCurrency(total) : "Sem saídas";

    if (!totalsByCategory.length) {
      els.categoryBreakdown.innerHTML = '<div class="empty-state">Sem saídas no mês.</div>';
      return;
    }

    els.categoryBreakdown.innerHTML = totalsByCategory
      .map(({ category, amount }) => {
        const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
        return `
          <div class="category-row">
            <div class="category-top">
              <div class="category-title">
                <span class="category-emoji">${escapeHtml(category.emoji || "🏷️")}</span>${escapeHtml(category.name)}
              </div>
              <div class="category-value">${formatCurrency(amount)}</div>
            </div>
            <div class="category-progress" aria-hidden="true"><span style="width:${percent}%"></span></div>
            <div class="category-meta">${percent}% das saídas</div>
          </div>
        `;
      })
      .join("");
  }

  function renderCategoryComparison() {
    const previousMonth = addMonths(selectedMonth, -1);
    const currentTotals = categoryExpenseTotals(selectedMonth);
    const previousTotals = categoryExpenseTotals(previousMonth);
    const rows = state.categories
      .filter((category) => category.type === "expense")
      .map((category) => {
        const current = currentTotals.get(category.id) || 0;
        const previous = previousTotals.get(category.id) || 0;
        const difference = roundMoney(current - previous);
        const percent = previous > 0 ? (difference / previous) * 100 : current > 0 ? 100 : 0;
        return { category, current, previous, difference, percent };
      })
      .filter((item) => item.current > 0 || item.previous > 0)
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference) || b.current - a.current);

    const currentTotal = sumAmounts(getMonthTransactions(selectedMonth).filter((transaction) => transaction.type === "expense"));
    const previousTotal = sumAmounts(getMonthTransactions(previousMonth).filter((transaction) => transaction.type === "expense"));
    els.categoryComparisonSubtitle.textContent = `${formatMonthName(selectedMonth)} ${formatCurrency(currentTotal)} x ${formatMonthName(previousMonth)} ${formatCurrency(previousTotal)}`;

    if (!rows.length) {
      els.categoryComparison.innerHTML = '<div class="empty-state">Sem gastos para comparar.</div>';
      return;
    }

    const maxAmount = Math.max(1, ...rows.flatMap((item) => [item.current, item.previous]));
    els.categoryComparison.innerHTML = rows
      .map(({ category, current, previous, difference, percent }) => {
        const currentWidth = Math.max(3, Math.round((current / maxAmount) * 100));
        const previousWidth = Math.max(3, Math.round((previous / maxAmount) * 100));
        const trendClass = difference > 0 ? "increase" : difference < 0 ? "decrease" : "same";
        const trendLabel = difference > 0 ? "mais que mês passado" : difference < 0 ? "menos que mês passado" : "igual ao mês passado";

        return `
          <div class="comparison-row ${trendClass}">
            <div class="comparison-main">
              <div class="comparison-title">
                <span class="category-emoji">${escapeHtml(category.emoji || "🏷️")}</span>${escapeHtml(category.name)}
              </div>
              <div class="comparison-delta">
                <strong>${formatSignedCurrency(difference)}</strong>
                <span>${formatSignedPercent(percent)} · ${trendLabel}</span>
              </div>
            </div>
            <div class="comparison-bars" aria-hidden="true">
              <div class="comparison-bar-line">
                <span>Este mês</span>
                <div class="comparison-track"><b class="current" style="width:${currentWidth}%"></b></div>
                <strong>${formatCurrency(current)}</strong>
              </div>
              <div class="comparison-bar-line">
                <span>Mês passado</span>
                <div class="comparison-track"><b class="previous" style="width:${previousWidth}%"></b></div>
                <strong>${formatCurrency(previous)}</strong>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderMonthlyFinanceComparison() {
    if (!els.financeMonthlyComparison) {
      return;
    }

    const months = financeComparisonMonths(selectedMonth);
    const rows = months.map((month) => monthlyFinanceComparisonItem(month));
    els.financeMonthlyComparisonSubtitle.textContent = rows.map((row) => shortMonth(row.month)).join(" / ");

    els.financeMonthlyComparison.innerHTML = rows
      .map((row, index) => {
        const previous = rows[index + 1] || null;
        const categoryAlerts = row.categoriesOverLimit.slice(0, 3);
        const topCategories = row.topCategories.slice(0, 3);
        const fixedAlerts = row.fixedBillsOverExpected.slice(0, 3);

        return `
          <article class="finance-month-card">
            <div class="finance-month-card-head">
              <div>
                <span>${index === 0 ? "Mês selecionado" : "Comparação"}</span>
                <h3>${escapeHtml(formatMonthName(row.month))}</h3>
              </div>
            </div>
            <div class="finance-month-metrics">
              ${financeMetricHtml("Entradas", row.actualIncome, previous?.actualIncome)}
              ${financeMetricHtml("Saídas", row.cashOut, previous?.cashOut, true)}
              ${financeMetricHtml("Guardado/investido", row.savedInvested, previous?.savedInvested)}
            </div>
            <div class="finance-month-section">
              <strong>Categorias acima do limite</strong>
              ${categoryAlerts.length ? `
                <div class="finance-chip-list">
                  ${categoryAlerts.map((item) => `
                    <span class="finance-chip danger">${escapeHtml(item.category.name)} · ${formatCurrency(item.overLimit)} acima</span>
                  `).join("")}
                </div>
              ` : '<small class="finance-empty-note">Nenhuma categoria acima do limite.</small>'}
            </div>
            <div class="finance-month-section">
              <strong>Mais saídas</strong>
              ${topCategories.length ? `
                <div class="finance-chip-list">
                  ${topCategories.map((item) => `
                    <span class="finance-chip">${escapeHtml(item.category.name)} · ${formatCurrency(item.amount)}</span>
                  `).join("")}
                </div>
              ` : '<small class="finance-empty-note">Sem saídas no mês.</small>'}
            </div>
            <div class="finance-month-section">
              <strong>Fixos acima do previsto</strong>
              ${fixedAlerts.length ? `
                <div class="finance-chip-list">
                  ${fixedAlerts.map((item) => `
                    <span class="finance-chip danger">${escapeHtml(item.name || "Conta fixa")} · ${formatCurrency(item.overLimit)} acima</span>
                  `).join("")}
                </div>
              ` : '<small class="finance-empty-note">Nenhuma conta fixa passou do previsto.</small>'}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function financeMetricHtml(label, value, previousValue, inverted = false) {
    const hasPrevious = Number.isFinite(Number(previousValue));
    const difference = hasPrevious ? roundMoney(value - previousValue) : 0;
    const trendClass =
      !hasPrevious || difference === 0 ? "same" : inverted ? (difference > 0 ? "bad" : "good") : (difference > 0 ? "good" : "bad");
    const trendLabel = hasPrevious ? financeDeltaLabel(value, previousValue) : "Sem mês anterior";

    return `
      <div class="finance-month-metric ${trendClass}">
        <span>${escapeHtml(label)}</span>
        <strong>${formatCurrency(value)}</strong>
        <small>${escapeHtml(trendLabel)}</small>
      </div>
    `;
  }

  function categoryExpenseTotals(month) {
    return getMonthTransactions(month)
      .filter((transaction) => transaction.type === "expense")
      .reduce((totals, transaction) => {
        const current = totals.get(transaction.categoryId) || 0;
        totals.set(transaction.categoryId, roundMoney(current + (Number(transaction.amount) || 0)));
        return totals;
      }, new Map());
  }

  function renderUsageTypes() {
    state.usageTypes = Array.isArray(state.usageTypes) ? state.usageTypes : defaultUsageTypes();
    els.usageSubtitle.textContent = plural(state.usageTypes.length, "grupo", "grupos");
    const expenseTransactions = getMonthTransactions(selectedMonth).filter((transaction) => transaction.type === "expense");

    els.usageList.innerHTML = state.usageTypes
      .map((usage) => {
        const relatedCategoryIds = state.categories
          .filter((category) => category.usageId === usage.id)
          .map((category) => category.id);
        const spent = sumAmounts(expenseTransactions.filter((transaction) => relatedCategoryIds.includes(transaction.categoryId)));
        const planned = Number(usage.monthlyPlan) || 0;
        const percent = planned > 0 ? Math.round((spent / planned) * 100) : 0;
        const width = Math.min(100, percent);
        const overLimit = planned > 0 ? Math.max(0, roundMoney(spent - planned)) : 0;
        const rowClass = percent >= 100 ? "over" : percent >= 80 ? "near" : "";
        const usageMeta =
          overLimit > 0
            ? `${formatCurrency(spent)} gasto · ${formatCurrency(overLimit)} acima do limite`
            : `${formatCurrency(spent)} gasto`;

        return `
          <div class="usage-row ${rowClass}" data-usage-id="${escapeHtml(usage.id)}">
            <div class="usage-top">
              <input class="inline-input" data-usage-field="name" value="${escapeHtml(usage.name)}" aria-label="Nome do grupo">
              <span class="usage-percent">${percent}%</span>
              <button class="icon-button" type="button" data-usage-action="delete" aria-label="Excluir grupo" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </div>
            <div class="usage-progress" aria-hidden="true"><span style="width:${width}%"></span></div>
            <div class="usage-bottom">
              <span>${usageMeta}</span>
              <input class="inline-input money-input" type="number" min="0" step="0.01" data-usage-field="monthlyPlan" value="${planned.toFixed(2)}" aria-label="Planejado para ${escapeHtml(usage.name)}">
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderCategoryManager() {
    els.categoryManagerSubtitle.textContent = plural(state.categories.length, "categoria", "categorias");
    setSelectOptions(
      els.categoryUsage,
      [{ value: "", label: "Sem grupo" }, ...state.usageTypes.map((usage) => ({ value: usage.id, label: usage.name }))],
      els.categoryUsage.value,
    );

    els.categoryManagerList.innerHTML = state.categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map(
        (category) => `
          <div class="category-manager-row" data-category-id="${escapeHtml(category.id)}">
            <input class="inline-input emoji-input" data-category-field="emoji" value="${escapeHtml(category.emoji || "🏷️")}" aria-label="Emoji da categoria">
            <input class="inline-input" data-category-field="name" value="${escapeHtml(category.name)}" aria-label="Nome da categoria">
            <select class="inline-input" data-category-field="type" aria-label="Tipo da categoria">
              ${categoryTypeOptions(category.type)}
            </select>
            <select class="inline-input" data-category-field="usageId" aria-label="Uso da categoria">
              ${usageOptions(category.usageId)}
            </select>
            <input class="inline-input color-input" type="color" data-category-field="color" value="${safeColor(category.color)}" aria-label="Cor da categoria">
            <button class="icon-button" type="button" data-category-action="delete" aria-label="Excluir categoria" title="Excluir">
              ${svgIcon("icon-trash")}
            </button>
          </div>
        `,
      )
      .join("");
  }

  function renderAccountEditor() {
    const isCardRegister = activeRegisterPage === "cards";
    const isSavingsRegister = activeRegisterPage === "savings";
    const scopedAccounts =
      isCardRegister
        ? state.accounts.filter((account) => account.kind === "credit_card")
        : isSavingsRegister
          ? state.accounts.filter((account) => ["savings", "investment"].includes(account.kind))
          : state.accounts.filter((account) => !["credit_card", "savings", "investment"].includes(account.kind));

    if (!scopedAccounts.length) {
      els.accountEditorList.innerHTML =
        isCardRegister
          ? '<div class="empty-state compact-empty">Nenhum cartão cadastrado.</div>'
          : isSavingsRegister
            ? '<div class="empty-state compact-empty">Nenhuma caixinha cadastrada.</div>'
            : '<div class="empty-state compact-empty">Cadastre uma conta ou banco para começar.</div>';
      return;
    }

    els.accountEditorList.innerHTML = scopedAccounts
      .map(
        (account) => {
          const limitInfo = isCardRegister ? getCreditCardLimitInfo(account) : null;
          const scope = isCardRegister ? "cards" : isSavingsRegister ? "savings" : "accounts";
          const balanceLabel = isCardRegister ? "Valor da fatura" : isSavingsRegister ? "Saldo guardado" : "Saldo atual";
          const balanceValue = isCardRegister ? accountBalance(account.id) : accountBalance(account.id);
          const yieldInfo = isSavingsRegister ? savingsYieldEstimate(account) : null;

          return `
            <div class="account-editor-row ${isCardRegister ? "is-card-row" : isSavingsRegister ? "is-savings-row" : "is-bank-row"}" data-account-id="${escapeHtml(account.id)}">
              <input class="inline-input" data-account-field="name" value="${escapeHtml(account.name)}" aria-label="Nome da conta">
              <select class="inline-input" data-account-field="kind" aria-label="Tipo da conta">
                ${accountKindOptions(account.kind, scope)}
              </select>
              ${
                isCardRegister
                  ? `<input class="inline-input money-input" type="number" step="0.01" data-account-field="openingBalance" value="${Number(account.openingBalance || 0).toFixed(2)}" placeholder="Fatura" aria-label="${balanceLabel}">`
                  : `<input class="inline-input money-input" type="number" step="0.01" data-account-field="openingBalance" data-account-balance-mode="current" value="${Number(balanceValue || 0).toFixed(2)}" placeholder="${balanceLabel}" aria-label="${balanceLabel}">`
              }
              ${
                !isCardRegister && !isSavingsRegister
                  ? `<label class="account-inline-money"><span>Saldo separado</span><input class="inline-input money-input" type="number" min="0" step="0.01" data-account-field="separateBalanceAmount" value="${Number(separateBalanceAmount(account) || 0).toFixed(2)}" aria-label="Saldo separado"></label>`
                  : ""
              }
              ${
                isCardRegister
                  ? `<input class="inline-input money-input" type="number" min="0" step="0.01" data-account-field="creditLimit" value="${Number(account.creditLimit || 0).toFixed(2)}" placeholder="Limite" aria-label="Limite total"><span class="account-limit-pill">Restante: ${formatCurrency(limitInfo.remaining)}</span>`
                  : ""
              }
              ${
                isSavingsRegister
                  ? `<input class="inline-input money-input" type="number" min="0" step="0.01" data-account-field="cdiPercent" value="${accountCdiPercent(account).toFixed(2)}" placeholder="% CDI" aria-label="% do CDI"><span class="account-yield-pill">Rende ~ ${formatCurrency(yieldInfo.monthlyYield)}/mês</span>`
                  : ""
              }
              <button class="icon-button" type="button" data-account-action="delete" aria-label="Excluir conta" title="Excluir">
                ${svgIcon("icon-trash")}
              </button>
            </div>
          `;
        },
      )
      .join("");
  }

  function openTransactionDialog(transactionId, defaultType = "expense") {
    const transaction = transactionId ? state.transactions.find((item) => item.id === transactionId) : null;
    els.form.reset();
    els.transactionId.value = transaction?.id || "";
    els.dialogTitle.textContent = transaction ? "Editar lançamento" : "Novo lançamento";
    els.transactionDescription.value = transaction?.description || "";
    els.transactionAmount.value = transaction ? String(transaction.amount) : "";
    els.transactionDate.value = transaction?.date || defaultTransactionDate();
    els.transactionType.value = transaction?.type || defaultType;
    els.transactionStatus.value = transaction?.status || "cleared";
    els.transactionNotes.value = transaction?.notes || "";
    renderFormCategoryOptions(els.transactionType.value, transaction?.categoryId);
    renderFormAccountOptions(transaction?.accountId, els.transactionType.value);
    renderFormTargetAccountOptions(transaction?.targetAccountId, els.transactionType.value);
    updateTransactionFormForType(transaction);

    if (typeof els.dialog.showModal === "function") {
      els.dialog.showModal();
    } else {
      els.dialog.setAttribute("open", "open");
    }

    requestAnimationFrame(() => els.transactionDescription.focus());
  }

  function closeTransactionDialog() {
    if (typeof els.dialog.close === "function") {
      els.dialog.close();
    } else {
      els.dialog.removeAttribute("open");
    }
  }

  function openFixedDetailsDialog() {
    renderFixedDetailsDialog();

    if (typeof els.fixedDetailsDialog.showModal === "function") {
      els.fixedDetailsDialog.showModal();
    } else {
      els.fixedDetailsDialog.setAttribute("open", "open");
    }
  }

  function closeFixedDetailsDialog() {
    if (typeof els.fixedDetailsDialog.close === "function") {
      els.fixedDetailsDialog.close();
    } else {
      els.fixedDetailsDialog.removeAttribute("open");
    }
  }

  function renderFixedDetailsDialog() {
    const snapshot = getFinancialSnapshot(selectedMonth);
    els.fixedDetailsSubtitle.textContent = `${formatCurrency(snapshot.fixedPaid)} pago de ${formatCurrency(snapshot.fixedTotal)}`;

    if (!snapshot.fixedBillDetails.length) {
      els.fixedDetailsList.innerHTML = '<div class="empty-state compact-empty">Nenhuma conta fixa cadastrada.</div>';
      return;
    }

    els.fixedDetailsList.innerHTML = snapshot.fixedBillDetails
      .map((bill) => {
        const category = findCategory(bill.categoryId);
        const paidPercent = Math.round(bill.percent);
        const progressWidth = Math.min(100, paidPercent);
        const statusText = bill.overLimit > 0
          ? `${formatCurrency(bill.paid)} pago de ${formatCurrency(bill.amount)} · ${formatCurrency(bill.overLimit)} acima do limite`
          : `${formatCurrency(bill.paid)} pago de ${formatCurrency(bill.amount)} · faltam ${formatCurrency(bill.remaining)}`;
        return `
          <article class="fixed-detail-row ${bill.overLimit > 0 ? "over" : ""}">
            <div class="fixed-detail-top">
              <div>
                <strong>${escapeHtml(bill.name || "Conta fixa")}</strong>
                <span>${escapeHtml(category.emoji || "")} ${escapeHtml(category.name)}</span>
              </div>
              <b>${paidPercent}% ${bill.overLimit > 0 ? "gasto" : "pago"}</b>
            </div>
            <div class="fixed-detail-progress" aria-hidden="true">
              <span style="width:${progressWidth}%"></span>
            </div>
            <p>${statusText}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderFormCategoryOptions(type, selectedCategoryId) {
    const options = state.categories
      .filter((category) => category.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((category) => ({ value: category.id, label: `${category.emoji || "🏷️"} ${category.name}` }));
    setSelectOptions(els.transactionCategory, options, selectedCategoryId);
  }

  function renderFormAccountOptions(selectedAccountId, type = els.transactionType.value) {
    const accounts = sortAccountsForTransaction(type, "source");
    const options = accounts.map((account) => ({ value: account.id, label: account.name }));
    setSelectOptions(els.transactionAccount, options, preferredTransactionAccountId(accounts, selectedAccountId, type, "source"));
  }

  function renderFormTargetAccountOptions(selectedAccountId, type = els.transactionType.value) {
    const accounts = sortAccountsForTransaction(type, "target", els.transactionAccount.value);
    const options = accounts.map((account) => ({ value: account.id, label: account.name }));
    setSelectOptions(els.transactionTargetAccount, options, preferredTransactionAccountId(accounts, selectedAccountId, type, "target"));
  }

  function sortAccountsForTransaction(type, role, sourceAccountId = "") {
    return state.accounts
      .slice()
      .sort((a, b) => {
        const byPriority =
          transactionAccountPriority(a, type, role, sourceAccountId) -
          transactionAccountPriority(b, type, role, sourceAccountId);
        return byPriority || a.name.localeCompare(b.name, "pt-BR");
      });
  }

  function transactionAccountPriority(account, type, role, sourceAccountId = "") {
    const sourcePenalty = type === "transfer" && role === "target" && account.id === sourceAccountId ? 10 : 0;
    return transactionAccountPreferenceGroups(type, role).findIndex((matcher) => matcher(account)) + sourcePenalty;
  }

  function preferredTransactionAccountId(accounts, selectedAccountId, type, role) {
    const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
    const sourceAccountId = role === "target" && type === "transfer" ? els.transactionAccount.value : "";
    const preferredAccounts = accounts.filter((account) => account.id !== sourceAccountId);
    const groups = transactionAccountPreferenceGroups(type, role);

    for (const matcher of groups) {
      if (selectedAccount && selectedAccount.id !== sourceAccountId && matcher(selectedAccount)) {
        return selectedAccount.id;
      }

      const preferred = preferredAccounts.find((account) => matcher(account));
      if (preferred) {
        return preferred.id;
      }
    }

    return selectedAccount?.id || preferredAccounts[0]?.id || accounts[0]?.id || "";
  }

  function transactionAccountPreferenceGroups(type, role) {
    if (type === "card_payment" && role === "target") {
      return [isCreditCardAccount, isBankAccount, isSavedAccount, () => true];
    }

    if (type === "transfer" && role === "target") {
      return [isSavedAccount, isBankAccount, isCreditCardAccount, () => true];
    }

    if (type === "expense") {
      return [isBankAccount, isCreditCardAccount, isSavedAccount, () => true];
    }

    return [isBankAccount, isSavedAccount, isCreditCardAccount, () => true];
  }

  function isBankAccount(account) {
    return ["checking", "cash"].includes(account.kind);
  }

  function accountSupportsSeparateBalance(account) {
    return Boolean(account && account.id !== "missing-account" && isBankAccount(account));
  }

  function normalizeBalanceScope(scope) {
    return scope === "separate" ? "separate" : "main";
  }

  function selectedBalanceScopeForAccount(accountId, scope) {
    const account = findAccount(accountId);
    return accountSupportsSeparateBalance(account) ? normalizeBalanceScope(scope) : "main";
  }

  function isCreditCardAccount(account) {
    return account.kind === "credit_card";
  }

  function isSavedAccount(account) {
    return ["savings", "investment"].includes(account.kind);
  }

  function updateTransactionFormForType(transaction = null) {
    const type = els.transactionType.value;
    const needsTarget = type === "transfer" || type === "card_payment";
    const labels = {
      income: "Conta de entrada",
      expense: "Conta/cartão de saída",
      transfer: "Conta de origem",
      card_payment: "Conta que paga",
    };

    els.transactionAccountLabel.textContent = labels[type] || "Conta/cartão";
    els.transactionTargetField.classList.toggle("is-hidden", !needsTarget);
    els.transactionTargetAccount.required = needsTarget;
    els.transactionTargetLabel.textContent = type === "card_payment" ? "Cartão pago" : "Conta de destino";
    renderBalanceScopeField({
      field: els.transactionAccountBalanceField,
      label: els.transactionAccountBalanceLabel,
      select: els.transactionAccountBalanceScope,
      accountId: els.transactionAccount.value,
      selectedScope: transaction?.accountBalanceScope ?? els.transactionAccountBalanceScope.value,
      labelText: type === "income" ? "Entrar em" : "Usar saldo",
    });
    renderBalanceScopeField({
      field: els.transactionTargetBalanceField,
      label: els.transactionTargetBalanceLabel,
      select: els.transactionTargetBalanceScope,
      accountId: needsTarget ? els.transactionTargetAccount.value : "",
      selectedScope: transaction?.targetBalanceScope ?? els.transactionTargetBalanceScope.value,
      labelText: "Receber em",
      hidden: !needsTarget,
    });
  }

  function renderBalanceScopeField({ field, label, select, accountId, selectedScope, labelText, hidden = false }) {
    const account = findAccount(accountId);
    const canUseSeparate = accountSupportsSeparateBalance(account);
    field.classList.toggle("is-hidden", hidden || !canUseSeparate);
    select.disabled = hidden || !canUseSeparate;
    select.required = !hidden && canUseSeparate;
    label.textContent = labelText;
    setSelectOptions(
      select,
      [
        { value: "main", label: "Saldo da conta" },
        { value: "separate", label: "Saldo separado" },
      ],
      canUseSeparate ? normalizeBalanceScope(selectedScope) : "main"
    );
  }

  function handleTransactionSubmit(event) {
    event.preventDefault();

    const id = els.transactionId.value;
    const description = els.transactionDescription.value.trim();
    const amount = roundMoney(Number(els.transactionAmount.value));
    const date = els.transactionDate.value;
    const type = els.transactionType.value;
    const categoryId = els.transactionCategory.value;
    const accountId = els.transactionAccount.value;
    const targetAccountId = els.transactionTargetAccount.value;
    const needsTarget = type === "transfer" || type === "card_payment";
    const accountBalanceScope = selectedBalanceScopeForAccount(accountId, els.transactionAccountBalanceScope.value);
    const targetBalanceScope = needsTarget ? selectedBalanceScopeForAccount(targetAccountId, els.transactionTargetBalanceScope.value) : "";
    const status = els.transactionStatus.value;
    const notes = els.transactionNotes.value.trim();

    if (!description || !date || !categoryId || !accountId || !Number.isFinite(amount) || amount <= 0) {
      showToast("Preencha descrição, valor, data, categoria e conta.");
      return;
    }

    if (needsTarget && !targetAccountId) {
      showToast("Escolha a conta de destino.");
      return;
    }

    if (type === "transfer" && accountId === targetAccountId && accountBalanceScope === targetBalanceScope) {
      showToast("A origem e o destino precisam ser diferentes.");
      return;
    }

    if (type === "card_payment" && accountId === targetAccountId) {
      showToast("A origem e o destino precisam ser diferentes.");
      return;
    }

    const now = new Date().toISOString();
    const existingIndex = state.transactions.findIndex((transaction) => transaction.id === id);
    const payload = {
      id: id || createId("tx"),
      description,
      type,
      amount,
      date,
      categoryId,
      accountId,
      targetAccountId: needsTarget ? targetAccountId : "",
      accountBalanceScope,
      targetBalanceScope: needsTarget ? targetBalanceScope : "",
      status,
      notes,
      createdAt: existingIndex >= 0 ? state.transactions[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      state.transactions[existingIndex] = payload;
      showToast("Lançamento atualizado.");
    } else {
      state.transactions.push(payload);
      showToast("Lançamento criado.");
    }

    saveState();
    closeTransactionDialog();
    render();
  }

  function handleTransactionListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const transactionId = button.dataset.id;
    const transaction = state.transactions.find((item) => item.id === transactionId);
    if (!transaction) {
      return;
    }

    if (button.dataset.action === "edit") {
      openTransactionDialog(transactionId);
      return;
    }

    if (button.dataset.action === "delete") {
      const confirmed = window.confirm(`Excluir "${transaction.description}"?`);
      if (!confirmed) {
        return;
      }
      state.transactions = state.transactions.filter((item) => item.id !== transactionId);
      saveState();
      render();
      showToast("Lançamento excluído.");
    }
  }

  function handleBudgetChange(event) {
    const input = event.target.closest("[data-budget-category]");
    if (!input) {
      return;
    }

    const categoryId = input.dataset.budgetCategory;
    const limit = Math.max(0, roundMoney(Number(input.value) || 0));
    const now = new Date().toISOString();
    let budget = state.budgets.find((item) => item.categoryId === categoryId);

    if (!budget) {
      budget = {
        id: createId("budget"),
        categoryId,
        monthlyLimit: limit,
        createdAt: now,
        updatedAt: now,
      };
      state.budgets.push(budget);
    } else {
      budget.monthlyLimit = limit;
      budget.updatedAt = now;
    }

    saveState();
    renderBudgets();
    renderCategoryLimitOverview();
    showToast("Orçamento atualizado.");
  }

  function handleMonthPlanChange() {
    const plan = ensureMonthPlan(selectedMonth);
    const salaryEntry = selectedSalaryEntry(plan, { create: true });
    updatePlanFromSalaryInputs(salaryEntry);
    syncPrimarySalaryFields(plan);
    plan.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function handleMonthPlanLiveChange() {
    const plan = ensureMonthPlan(selectedMonth);
    const salaryEntry = selectedSalaryEntry(plan, { create: true });
    const benefits = updatePlanFromSalaryInputs(salaryEntry);
    syncPrimarySalaryFields(plan);
    plan.updatedAt = new Date().toISOString();
    saveState();
    if (normalizeEmploymentType(salaryEntry.employmentType) === "clt") {
      els.monthBenefits.value = benefits.total ? benefits.total.toFixed(2) : "";
    }
    renderEmploymentTypeControls(salaryEntry, benefits);
    renderBenefitsSummary(benefits);
    renderBenefitEditor(salaryEntry, benefits);
    renderCltSummary(salaryEntry);
    renderSalaryEditor(plan);
    renderFinanceCards();
    renderSummary();
    renderHome();
  }

  function updatePlanFromSalaryInputs(entry) {
    const previousEmploymentType = normalizeEmploymentType(entry.employmentType);
    const nextEmploymentType = normalizeEmploymentType(els.employmentType.value);
    const switchedFromCltToManual = previousEmploymentType === "clt" && nextEmploymentType !== "clt";
    entry.benefitItems = normalizeBenefitItems(entry.benefitItems, entry);
    const hadDefaultCltBenefits = hasDefaultLegacyBenefitItems(entry.benefitItems);
    entry.name = els.salaryEntryName.value.trim() || "Renda";
    entry.employmentType = nextEmploymentType;
    entry.salary = roundMoney(Number(els.monthSalary.value) || 0);
    if (switchedFromCltToManual && hadDefaultCltBenefits) {
      entry.benefitItems = removeDefaultLegacyBenefitItems(entry.benefitItems);
    } else if (previousEmploymentType !== "clt" && nextEmploymentType === "clt" && !entry.benefitItems.length) {
      entry.benefitItems = normalizeBenefitItems(null, { employmentType: "clt" }, { includeDefaults: true });
    }
    entry.salaryDependents = Math.max(0, Math.floor(Number(els.salaryDependents.value) || 0));
    entry.salaryAdvance = Math.max(0, roundMoney(Number(els.salaryAdvance.value) || 0));
    entry.salaryOtherDiscounts = Math.max(0, roundMoney(Number(els.salaryOtherDiscounts.value) || 0));
    entry.hasTransportVoucher = els.salaryTransportEnabled.checked;
    entry.pjTaxRate = clampPercent(Number(els.pjTaxRate.value), 6);
    entry.pjOtherCosts = Math.max(0, roundMoney(Number(els.pjOtherCosts.value) || 0));
    entry.autonomousInssRate = clampPercent(Number(els.autonomousInssRate.value), 20);
    entry.autonomousInssBase = Math.max(0, roundMoney(Number(els.autonomousInssBase.value) || 0));
    entry.autonomousBookCash = Math.max(0, roundMoney(Number(els.autonomousBookCash.value) || 0));
    entry.updatedAt = new Date().toISOString();

    const benefits = calculateMonthlyBenefits(selectedMonth, entry);
    entry.benefits = benefits.total;
    return benefits;
  }

  function addBenefitItem() {
    const plan = ensureMonthPlan(selectedMonth);
    const entry = selectedSalaryEntry(plan, { create: true });
    const name = els.benefitName.value.trim();
    const amount = Math.max(0, roundMoney(Number(els.benefitAmount.value) || 0));
    const frequency = normalizeBenefitFrequency(els.benefitFrequency.value);

    if (!name || amount <= 0) {
      showToast("Preencha o nome e o valor do beneficio.");
      return;
    }

    const now = new Date().toISOString();
    entry.benefitItems = normalizeBenefitItems(entry.benefitItems, entry);
    entry.benefitItems.push(
      normalizeBenefitItem({
        id: createId("benefit"),
        name,
        amount,
        frequency,
        createdAt: now,
        updatedAt: now,
      }),
    );
    const benefits = calculateMonthlyBenefits(selectedMonth, entry);
    entry.benefits = benefits.total;
    entry.updatedAt = now;
    syncPrimarySalaryFields(plan);
    plan.updatedAt = now;
    els.benefitName.value = "";
    els.benefitAmount.value = "";
    els.benefitFrequency.value = "workday";
    saveState();
    render();
    showToast("Beneficio adicionado.");
  }

  function handleBenefitEditorChange(event) {
    const input = event.target.closest("[data-benefit-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-benefit-id]");
    const plan = ensureMonthPlan(selectedMonth);
    const entry = selectedSalaryEntry(plan);
    if (!row || !entry) {
      return;
    }

    const benefitId = row.dataset.benefitId;
    const now = new Date().toISOString();
    entry.benefitItems = normalizeBenefitItems(entry.benefitItems, entry).map((item) => {
      if (item.id !== benefitId) {
        return item;
      }

      const nextItem = { ...item, updatedAt: now };
      if (input.dataset.benefitField === "amount") {
        nextItem.amount = Math.max(0, roundMoney(Number(input.value) || 0));
      } else if (input.dataset.benefitField === "frequency") {
        nextItem.frequency = normalizeBenefitFrequency(input.value);
      } else {
        nextItem.name = input.value.trim() || "Beneficio";
      }
      return normalizeBenefitItem(nextItem);
    });

    const benefits = calculateMonthlyBenefits(selectedMonth, entry);
    entry.benefits = benefits.total;
    entry.updatedAt = now;
    syncPrimarySalaryFields(plan);
    plan.updatedAt = now;
    saveState();
    render();
  }

  function handleBenefitEditorClick(event) {
    const button = event.target.closest("[data-benefit-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-benefit-id]");
    const plan = ensureMonthPlan(selectedMonth);
    const entry = selectedSalaryEntry(plan);
    if (!row || !entry) {
      return;
    }

    const now = new Date().toISOString();
    entry.benefitItems = normalizeBenefitItems(entry.benefitItems, entry).filter((item) => item.id !== row.dataset.benefitId);
    const benefits = calculateMonthlyBenefits(selectedMonth, entry);
    entry.benefits = benefits.total;
    entry.updatedAt = now;
    syncPrimarySalaryFields(plan);
    plan.updatedAt = now;
    saveState();
    render();
    showToast("Beneficio removido.");
  }

  function addSalaryEntry() {
    const plan = ensureMonthPlan(selectedMonth);
    const entry = createSalaryEntry();
    plan.salaryEntries.push(entry);
    plan.salaryEntriesManuallyCleared = false;
    activeSalaryEntryId = entry.id;
    syncPrimarySalaryFields(plan);
    plan.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast("Salário adicionado.");
  }

  function handleSalaryEditorClick(event) {
    const button = event.target.closest("[data-salary-action]");
    if (!button) {
      return;
    }

    const row = button.closest("[data-salary-entry-id]");
    const plan = ensureMonthPlan(selectedMonth);
    const entries = ensureSalaryEntries(plan);
    const salaryId = row?.dataset.salaryEntryId || "";

    if (button.dataset.salaryAction === "edit") {
      activeSalaryEntryId = salaryId;
      renderMonthPlan();
      return;
    }

    if (button.dataset.salaryAction !== "delete") {
      return;
    }

    plan.salaryEntries = entries.filter((entry) => entry.id !== salaryId);
    plan.salaryEntriesManuallyCleared = plan.salaryEntries.length === 0;
    activeSalaryEntryId = plan.salaryEntries[0]?.id || "";
    syncPrimarySalaryFields(plan);
    plan.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast("Salário removido.");
  }

  function handleCdiAnnualRateChange() {
    state.settings = state.settings || {};
    const rawValue = els.cdiAnnualRate.value.trim();
    const value = Number(rawValue);
    state.settings.cdiAnnualRate = rawValue && Number.isFinite(value) ? Math.max(0, roundMoney(value)) : DEFAULT_CDI_ANNUAL_RATE;
    saveState();
    renderFinanceCards();
    renderAccountEditor();
  }

  function addFixedBill() {
    const name = els.fixedBillName.value.trim();
    const amount = roundMoney(Number(els.fixedBillAmount.value) || 0);
    const categoryId = els.fixedBillCategory.value;

    if (!name || amount <= 0) {
      showToast("Preencha o nome e o valor da conta fixa.");
      return;
    }

    const now = new Date().toISOString();
    const plan = ensureMonthPlan(selectedMonth);
    plan.fixedBillsManuallyCleared = false;
    plan.fixedBills.push({
      id: createId("fixed"),
      name,
      categoryId,
      amount,
      createdAt: now,
      updatedAt: now,
    });
    plan.updatedAt = now;
    els.fixedBillName.value = "";
    els.fixedBillAmount.value = "";
    saveState();
    render();
    showToast("Conta fixa adicionada.");
  }

  function handleFixedBillsClick(event) {
    const button = event.target.closest("[data-fixed-bill-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-fixed-bill-id]");
    const plan = ensureMonthPlan(selectedMonth);
    plan.fixedBills = plan.fixedBills.filter((bill) => bill.id !== row.dataset.fixedBillId);
    plan.fixedBillsManuallyCleared = plan.fixedBills.length === 0;
    plan.updatedAt = new Date().toISOString();
    saveState();
    render();
    showToast("Conta fixa removida.");
  }

  function handleFixedBillsChange(event) {
    const input = event.target.closest("[data-fixed-bill-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-fixed-bill-id]");
    const plan = ensureMonthPlan(selectedMonth);
    const bill = plan.fixedBills.find((item) => item.id === row.dataset.fixedBillId);
    if (!bill) {
      return;
    }

    if (input.dataset.fixedBillField === "amount") {
      bill.amount = Math.max(0, roundMoney(Number(input.value) || 0));
    } else if (input.dataset.fixedBillField === "categoryId") {
      bill.categoryId = input.value;
    } else {
      bill.name = input.value.trim() || "Conta fixa";
    }
    bill.updatedAt = new Date().toISOString();
    plan.updatedAt = bill.updatedAt;
    saveState();
    render();
  }

  function addAccount() {
    const name = els.accountName.value.trim();
    const kind =
      activeRegisterPage === "cards"
        ? "credit_card"
        : activeRegisterPage === "savings"
          ? ["savings", "investment"].includes(els.accountKind.value)
            ? els.accountKind.value
            : "savings"
          : ["checking", "cash"].includes(els.accountKind.value)
            ? els.accountKind.value
            : "checking";
    const openingBalance = roundMoney(Number(els.accountBalanceInput.value) || 0);
    const creditLimit = kind === "credit_card" ? Math.max(0, roundMoney(Number(els.accountLimit.value) || 0)) : 0;
    const cdiPercentRaw = els.accountCdiPercent.value.trim();
    const cdiPercent = ["savings", "investment"].includes(kind)
      ? Math.max(0, roundMoney(cdiPercentRaw ? Number(cdiPercentRaw) || 0 : DEFAULT_SAVINGS_CDI_PERCENT))
      : 0;
    const separateBalanceAmount =
      kind !== "credit_card" && !["savings", "investment"].includes(kind)
        ? Math.max(0, roundMoney(Number(els.accountSeparateBalance.value) || 0))
        : 0;

    if (!name) {
      showToast("Preencha o nome da conta.");
      return;
    }

    const now = new Date().toISOString();
    state.accounts.push({
      id: createId("acc"),
      name,
      kind,
      openingBalance,
      creditLimit,
      cdiPercent,
      separateBalanceAmount,
      color: defaultAccountColor(kind),
      createdAt: now,
      updatedAt: now,
    });
    els.accountName.value = "";
    els.accountBalanceInput.value = "";
    els.accountSeparateBalance.value = "";
    els.accountLimit.value = "";
    els.accountCdiPercent.value = activeRegisterPage === "savings" ? String(DEFAULT_SAVINGS_CDI_PERCENT) : "";
    saveState();
    render();
    showToast("Conta adicionada.");
  }

  function handleAccountEditorClick(event) {
    const button = event.target.closest("[data-account-action='delete']");
    if (!button) {
      return;
    }

    if (state.accounts.length <= 1) {
      showToast("Mantenha pelo menos uma conta cadastrada.");
      return;
    }

    const row = button.closest("[data-account-id]");
    const accountId = row.dataset.accountId;
    const inUse = state.transactions.some((transaction) => transaction.accountId === accountId || transaction.targetAccountId === accountId);
    if (inUse && !window.confirm("Essa conta tem movimentações. Remover mesmo assim?")) {
      return;
    }

    state.accounts = state.accounts.filter((account) => account.id !== accountId);
    saveState();
    render();
    showToast("Conta removida.");
  }

  function handleAccountEditorChange(event) {
    const input = event.target.closest("[data-account-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-account-id]");
    const account = state.accounts.find((item) => item.id === row.dataset.accountId);
    if (!account) {
      return;
    }

    const field = input.dataset.accountField;
    if (field === "name") {
      account.name = input.value.trim() || "Conta";
    } else if (field === "kind") {
      if (activeRegisterPage === "cards") {
        account.kind = "credit_card";
      } else if (activeRegisterPage === "savings") {
        account.kind = ["savings", "investment"].includes(input.value) ? input.value : "savings";
      } else {
        account.kind = ["checking", "cash"].includes(input.value) ? input.value : "checking";
      }
      if (account.kind === "credit_card" || ["savings", "investment"].includes(account.kind)) {
        account.separateBalanceAmount = 0;
      }
      if (["savings", "investment"].includes(account.kind) && !Number(account.cdiPercent)) {
        account.cdiPercent = DEFAULT_SAVINGS_CDI_PERCENT;
      }
      account.color = account.color || defaultAccountColor(account.kind);
    } else if (field === "openingBalance") {
      if (input.dataset.accountBalanceMode === "current") {
        const desiredBalance = roundMoney(Number(input.value) || 0);
        const currentBalance = accountBalance(account.id);
        account.openingBalance = roundMoney((Number(account.openingBalance) || 0) + desiredBalance - currentBalance);
      } else {
        account.openingBalance = roundMoney(Number(input.value) || 0);
      }
    } else if (field === "creditLimit") {
      account.creditLimit = Math.max(0, roundMoney(Number(input.value) || 0));
    } else if (field === "cdiPercent") {
      const rawValue = input.value.trim();
      account.cdiPercent = Math.max(0, roundMoney(rawValue ? Number(rawValue) || 0 : DEFAULT_SAVINGS_CDI_PERCENT));
    } else if (field === "separateBalanceAmount") {
      const desiredBalance = Math.max(0, roundMoney(Number(input.value) || 0));
      const currentBalance = separateBalanceAmount(account);
      account.separateBalanceAmount = Math.max(0, roundMoney((Number(account.separateBalanceAmount) || 0) + desiredBalance - currentBalance));
    }

    account.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function addUsageType() {
    const name = els.usageName.value.trim();
    const monthlyPlan = Math.max(0, roundMoney(Number(els.usagePlan.value) || 0));

    if (!name) {
      showToast("Preencha o nome do grupo.");
      return;
    }

    const now = new Date().toISOString();
    state.usageTypes.push({
      id: createId("usage"),
      name,
      monthlyPlan,
      createdAt: now,
      updatedAt: now,
    });
    els.usageName.value = "";
    els.usagePlan.value = "";
    saveState();
    render();
    showToast("Grupo adicionado.");
  }

  function handleUsageClick(event) {
    const button = event.target.closest("[data-usage-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-usage-id]");
    const usageId = row.dataset.usageId;
    state.usageTypes = state.usageTypes.filter((usage) => usage.id !== usageId);
    state.categories.forEach((category) => {
      if (category.usageId === usageId) {
        category.usageId = "";
      }
    });
    saveState();
    render();
    showToast("Grupo removido.");
  }

  function handleUsageChange(event) {
    const input = event.target.closest("[data-usage-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-usage-id]");
    const usage = state.usageTypes.find((item) => item.id === row.dataset.usageId);
    if (!usage) {
      return;
    }

    if (input.dataset.usageField === "monthlyPlan") {
      usage.monthlyPlan = Math.max(0, roundMoney(Number(input.value) || 0));
    } else {
      usage.name = input.value.trim() || "Grupo";
    }
    usage.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function addCategory() {
    const name = els.categoryName.value.trim();
    if (!name) {
      showToast("Preencha o nome da categoria.");
      return;
    }

    const now = new Date().toISOString();
    state.categories.push({
      id: createId("cat"),
      name,
      type: els.categoryType.value,
      usageId: els.categoryUsage.value,
      emoji: els.categoryEmoji.value.trim() || "🏷️",
      color: els.categoryColor.value || "#64748b",
      createdAt: now,
      updatedAt: now,
    });
    els.categoryEmoji.value = "";
    els.categoryName.value = "";
    els.categoryColor.value = "#64748b";
    saveState();
    render();
    showToast("Categoria adicionada.");
  }

  function handleCategoryManagerClick(event) {
    const button = event.target.closest("[data-category-action='delete']");
    if (!button) {
      return;
    }

    const row = button.closest("[data-category-id]");
    const categoryId = row.dataset.categoryId;
    const inUse = state.transactions.some((transaction) => transaction.categoryId === categoryId);
    if (inUse && !window.confirm("Essa categoria tem movimentações. Remover mesmo assim?")) {
      return;
    }

    state.categories = state.categories.filter((category) => category.id !== categoryId);
    state.budgets = state.budgets.filter((budget) => budget.categoryId !== categoryId);
    saveState();
    render();
    showToast("Categoria removida.");
  }

  function handleCategoryManagerChange(event) {
    const input = event.target.closest("[data-category-field]");
    if (!input) {
      return;
    }

    const row = input.closest("[data-category-id]");
    const category = state.categories.find((item) => item.id === row.dataset.categoryId);
    if (!category) {
      return;
    }

    const field = input.dataset.categoryField;
    if (field === "name") {
      category.name = input.value.trim() || "Categoria";
    } else if (field === "emoji") {
      category.emoji = input.value.trim() || "🏷️";
    } else if (field === "type") {
      category.type = input.value;
    } else if (field === "usageId") {
      category.usageId = input.value;
    } else if (field === "color") {
      category.color = input.value || "#64748b";
    }
    category.updatedAt = new Date().toISOString();
    saveState();
    render();
  }

  function exportData() {
    saveState();
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codice-dados-${selectedMonth}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Arquivo exportado.");
  }

  async function importData(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = normalizeImportedState(JSON.parse(text));
      const confirmed = window.confirm("Substituir os dados atuais pelo arquivo importado?");
      if (!confirmed) {
        return;
      }

      state = imported;
      selectedMonth = startupSelectedMonth(state.settings?.selectedMonth);
      transactionMonthFilter = normalizeTransactionMonthFilter(state.settings?.transactionMonthFilter, selectedMonth);
      backupSettings = normalizeBackupSettings(state.settings?.backup);
      mobileNavOrder = normalizeMobileNavOrder(state.settings?.mobileNavOrder);
      activeCreativeItemId = state.settings?.activeCreativeItemId || "";
      saveState();
      render();
      showToast("Dados importados.");
    } catch (error) {
      showToast("Arquivo inválido.");
    } finally {
      event.target.value = "";
    }
  }

  function cleanupNotionImportData() {
    const notionImportId = "notion-transactions-2026-06-14";
    const hasNotionData =
      state.transactions.some(isNotionImportedTransaction) ||
      state.accounts.some(isNotionImportedAccount) ||
      state.categories.some(isNotionImportedCategory) ||
      state.usageTypes.some(isNotionImportedUsage) ||
      state.settings?.appliedImports?.includes(notionImportId);

    if (!hasNotionData) {
      return;
    }

    localStorage.setItem(`${STORAGE_KEY}-backup-before-notion-cleanup-${Date.now()}`, JSON.stringify(state));
    state.transactions = state.transactions.filter((transaction) => !isNotionImportedTransaction(transaction));
    state.accounts = state.accounts.filter((account) => !isNotionImportedAccount(account));
    state.categories = state.categories.filter((category) => !isNotionImportedCategory(category));
    state.usageTypes = state.usageTypes.filter((usage) => !isNotionImportedUsage(usage));

    const categoryIds = new Set(state.categories.map((category) => category.id));
    state.budgets = state.budgets.filter((budget) => categoryIds.has(budget.categoryId));

    if (!state.accounts.length) {
      state.accounts.push({
        id: "acc-principal",
        name: "Conta principal",
        kind: "checking",
        openingBalance: 0,
        creditLimit: 0,
        separateBalanceAmount: 0,
        color: "#2563eb",
      });
    }

    state.settings = {
      ...(state.settings || {}),
      appliedImports: (state.settings?.appliedImports || []).filter((id) => id !== notionImportId),
      notionImportCleanedAt: new Date().toISOString(),
    };
    saveState();
  }

  function isNotionImportedTransaction(transaction) {
    return (
      String(transaction.id || "").startsWith("notion-transaction-") ||
      String(transaction.notes || "").includes("Importado do Notion CSV:")
    );
  }

  function isNotionImportedAccount(account) {
    return String(account.id || "").startsWith("notion-account-");
  }

  function isNotionImportedCategory(category) {
    return String(category.id || "").startsWith("notion-category-");
  }

  function isNotionImportedUsage(usage) {
    return String(usage.id || "").startsWith("notion-usage-");
  }

  async function applyRequestedDataImport() {
    const params = new URLSearchParams(window.location.search);
    const importKey = params.get("import");
    const isRequested = importKey === "notion-transactions";
    const shouldForce = params.get("force") === "1";

    try {
      const response = await fetch("data/notion-transactions-import.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Import file not found");
      }

      const payload = await response.json();
      const importId = payload.importId || "notion-transactions";
      state.settings = state.settings || {};
      state.settings.appliedImports = Array.isArray(state.settings.appliedImports) ? state.settings.appliedImports : [];
      const hasImportedTransactions = state.transactions.some(
        (transaction) =>
          String(transaction.id || "").startsWith("notion-transaction-") ||
          String(transaction.notes || "").includes("Importado do Notion CSV:"),
      );

      if (state.settings.appliedImports.includes(importId) && hasImportedTransactions && !shouldForce) {
        if (isRequested) {
          showToast("Importação do Notion já aplicada.");
          clearImportParams();
        }
        return;
      }

      localStorage.setItem(`${STORAGE_KEY}-backup-${importId}-${Date.now()}`, JSON.stringify(state));
      if (shouldForce) {
        state.transactions = state.transactions.filter((transaction) => !String(transaction.notes || "").includes("Importado do Notion CSV:"));
      }

      const summary = mergeDataImport(payload);
      state.settings.appliedImports = [...new Set([...state.settings.appliedImports.filter((id) => id !== importId), importId])];
      saveState();
      render();
      if (isRequested || summary.transactions > 0) {
        showToast(`Notion importado: ${summary.transactions} movimentações.`);
      }
      if (isRequested) {
        clearImportParams();
      }
    } catch (error) {
      console.error(error);
      if (isRequested) {
        showToast("Não consegui importar o CSV do Notion.");
      }
    }
  }

  function clearImportParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete("import");
    url.searchParams.delete("force");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function mergeDataImport(payload) {
    const idMaps = {
      accounts: new Map(),
      categories: new Map(),
      usageTypes: new Map(),
    };
    const summary = {
      accounts: 0,
      categories: 0,
      usageTypes: 0,
      transactions: 0,
    };
    const now = new Date().toISOString();

    (payload.usageTypes || []).forEach((usage) => {
      const existing = findByImportedName(state.usageTypes, usage.name);
      if (existing) {
        idMaps.usageTypes.set(usage.id, existing.id);
        return;
      }

      state.usageTypes.push({
        ...usage,
        id: usage.id || createId("usage"),
        name: usage.name || "Grupo",
        monthlyPlan: Number(usage.monthlyPlan) || 0,
        createdAt: usage.createdAt || now,
        updatedAt: now,
      });
      idMaps.usageTypes.set(usage.id, state.usageTypes[state.usageTypes.length - 1].id);
      summary.usageTypes += 1;
    });

    (payload.accounts || []).forEach((account) => {
      const existing = findByImportedName(state.accounts, account.name);
      if (existing) {
        idMaps.accounts.set(account.id, existing.id);
        return;
      }

      state.accounts.push({
        ...account,
        id: account.id || createId("account"),
        name: account.name || "Conta",
        kind: account.kind || "checking",
        openingBalance: Number(account.openingBalance) || 0,
        creditLimit: Number(account.creditLimit) || 0,
        cdiPercent: ["savings", "investment"].includes(account.kind)
          ? Math.max(0, roundMoney(Number.isFinite(Number(account.cdiPercent)) ? Number(account.cdiPercent) : DEFAULT_SAVINGS_CDI_PERCENT))
          : 0,
        separateBalanceAmount: 0,
        color: account.color || defaultAccountColor(account.kind || "checking"),
        createdAt: account.createdAt || now,
        updatedAt: now,
      });
      idMaps.accounts.set(account.id, state.accounts[state.accounts.length - 1].id);
      summary.accounts += 1;
    });

    (payload.categories || []).forEach((category) => {
      const existing = findByImportedName(state.categories, category.name);
      const usageId = idMaps.usageTypes.get(category.usageId) || category.usageId || "";
      if (existing) {
        idMaps.categories.set(category.id, existing.id);
        if (!existing.usageId && usageId) {
          existing.usageId = usageId;
        }
        return;
      }

      state.categories.push({
        ...category,
        id: category.id || createId("category"),
        name: category.name || "Categoria",
        type: category.type || "expense",
        usageId,
        emoji: category.emoji || "🏷️",
        color: category.color || "#64748b",
        createdAt: category.createdAt || now,
        updatedAt: now,
      });
      idMaps.categories.set(category.id, state.categories[state.categories.length - 1].id);
      summary.categories += 1;
    });

    (payload.transactions || []).forEach((transaction) => {
      if (state.transactions.some((item) => item.id === transaction.id)) {
        return;
      }

      state.transactions.push({
        ...transaction,
        id: transaction.id || createId("transaction"),
        description: transaction.description || "Movimentação importada",
        amount: Math.max(0, roundMoney(Number(transaction.amount) || 0)),
        type: transaction.type || "expense",
        date: transaction.date || `${selectedMonth}-01`,
        categoryId: idMaps.categories.get(transaction.categoryId) || transaction.categoryId || fallbackImportedCategoryId(transaction.type),
        accountId: idMaps.accounts.get(transaction.accountId) || transaction.accountId || fallbackImportedAccountId(),
        targetAccountId: idMaps.accounts.get(transaction.targetAccountId) || transaction.targetAccountId || "",
        accountBalanceScope: normalizeBalanceScope(transaction.accountBalanceScope),
        targetBalanceScope: normalizeBalanceScope(transaction.targetBalanceScope),
        status: transaction.status || "cleared",
        notes: transaction.notes || "Importado do Notion CSV",
        createdAt: transaction.createdAt || now,
        updatedAt: transaction.updatedAt || now,
      });
      summary.transactions += 1;
    });

    return summary;
  }

  function findByImportedName(items, name) {
    const key = normalizeImportedName(name);
    return items.find((item) => normalizeImportedName(item.name) === key);
  }

  function normalizeImportedName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function fallbackImportedCategoryId(type) {
    const fallbackByType = {
      income: "cat-renda-extra",
      transfer: "cat-movimentacao",
      card_payment: "cat-pagamento-cartao",
      expense: "cat-diversos",
    };
    return fallbackByType[type] || "cat-diversos";
  }

  function fallbackImportedAccountId() {
    return state.accounts[0]?.id || "acc-principal";
  }

  function getVisibleTransactions() {
    const needle = filters.search;
    return getTransactionsForActiveMonthFilter()
      .filter((transaction) => {
        const category = findCategory(transaction.categoryId);
        const account = findAccount(transaction.accountId);
        const targetAccount = findAccount(transaction.targetAccountId);
        const matchesSearch =
          !needle ||
          transaction.description.toLowerCase().includes(needle) ||
          typeLabel(transaction.type).toLowerCase().includes(needle) ||
          category.name.toLowerCase().includes(needle) ||
          account.name.toLowerCase().includes(needle) ||
          targetAccount.name.toLowerCase().includes(needle) ||
          (transaction.notes || "").toLowerCase().includes(needle);
        const matchesType = filters.type === "all" || transaction.type === filters.type;
        const matchesCategory = filters.category === "all" || transaction.categoryId === filters.category;
        const matchesAccount = filters.account === "all" || transaction.accountId === filters.account;
        return matchesSearch && matchesType && matchesCategory && matchesAccount;
      })
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        return byDate || b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  function getTransactionsForActiveMonthFilter() {
    return transactionMonthFilter
      ? getMonthTransactions(transactionMonthFilter)
      : state.transactions.slice();
  }

  function getMonthTransactions(month) {
    return state.transactions.filter((transaction) => transaction.date.slice(0, 7) === month);
  }

  function getFinancialSnapshot(month) {
    const plan = ensureMonthPlan(month);
    const transactions = getMonthTransactions(month);
    const incomeTransactions = transactions.filter((transaction) => transaction.type === "income");
    const expenseTransactions = transactions.filter((transaction) => transaction.type === "expense");
    const cardPaymentTransactions = transactions.filter((transaction) => transaction.type === "card_payment");
    const actualIncome = sumAmounts(incomeTransactions);
    const extraIncome = sumAmounts(incomeTransactions.filter(isExtraIncomeTransaction));
    const spent = sumAmounts(expenseTransactions);
    const fixedCoverage = fixedBillCoverage(expenseTransactions, plan);
    const fixedPaid = fixedCoverage.paidAmount;
    const fixedCoveredSpent = fixedCoverage.coveredAmount;
    const spendableSpent = Math.max(0, roundMoney(spent - fixedCoveredSpent));
    const cardPayments = sumAmounts(cardPaymentTransactions);
    const cashOut = spent;
    const spendableCashOut = spendableSpent;
    const salaryBundle = calculateSalaryBundle(plan, month);
    const benefitInfo = salaryBundle.benefitInfo;
    const payroll = salaryBundle.payroll;
    const grossSalary = salaryBundle.grossSalary;
    const salary = salaryBundle.salary;
    const benefits = salaryBundle.benefits;
    const guaranteed = salaryBundle.guaranteed;
    const fixedTotal = sumFixedBills(plan);
    const fixed = fixedTotal;
    const fixedRemaining = Math.max(0, roundMoney(fixedTotal - fixedPaid));
    const baseSpendable = guaranteed - fixedTotal;
    const spendable = baseSpendable + extraIncome;
    const salaryRemaining = guaranteed - spent;
    const spendableRemaining = spendable - spendableCashOut;
    const creditCards = state.accounts.filter((account) => account.kind === "credit_card");
    const cardLimit = creditCards.reduce((total, account) => total + (Number(account.creditLimit) || 0), 0);
    const cardUsed = creditCards.reduce((total, account) => total + getCreditCardLimitInfo(account, month).used, 0);
    const cardLimitRemaining = creditCards.reduce((total, account) => total + getCreditCardLimitInfo(account, month).remaining, 0);
    const availableInAccounts = state.accounts
      .filter((account) => account.kind === "checking" || account.kind === "cash")
      .reduce((total, account) => total + accountBalance(account.id, month), 0);
    const saved = state.accounts
      .filter((account) => account.kind === "savings" || account.kind === "investment")
      .reduce((total, account) => total + accountBalance(account.id, month), 0) +
      state.accounts
        .filter((account) => account.kind === "checking" || account.kind === "cash")
        .reduce((total, account) => total + separateBalanceAmount(account, month), 0);

    return {
      plan,
      transactions,
      payroll,
      benefitInfo,
      employmentType: salaryBundle.employmentType,
      salaryCount: salaryBundle.salaryCount,
      salaryEntries: salaryBundle.entries,
      grossSalary,
      salary,
      benefits,
      guaranteed,
      fixed,
      fixedTotal,
      fixedRemaining,
      fixedPaid,
      fixedBillCount: plan.fixedBills.length,
      fixedPaidCount: fixedCoverage.paidCount,
      fixedBillDetails: fixedCoverage.items,
      baseSpendable,
      spendable,
      spendableRemaining,
      salaryRemaining,
      actualIncome,
      extraIncome,
      incomeCount: incomeTransactions.length,
      spent,
      fixedCoveredSpent,
      spendableSpent,
      cardPayments,
      cashOut,
      spendableCashOut,
      cashOutCount: expenseTransactions.length,
      cardUsed,
      cardLimit,
      cardLimitRemaining,
      availableInAccounts,
      saved,
    };
  }

  function fixedBillCoverage(expenseTransactions, plan) {
    const fixedBills = (plan.fixedBills || [])
      .filter((bill) => bill.categoryId && Number(bill.amount) > 0)
      .map((bill) => ({
        id: bill.id,
        name: bill.name,
        categoryId: bill.categoryId,
        amount: roundMoney(Number(bill.amount) || 0),
        paid: 0,
      }));

    expenseTransactions.forEach((transaction) => {
      let amountLeft = roundMoney(Number(transaction.amount) || 0);
      const categoryBills = fixedBills.filter((bill) => bill.categoryId === transaction.categoryId);
      let lastMatchedBill = null;
      const exactMatch = fixedBills.find(
        (bill) =>
          bill.categoryId === transaction.categoryId &&
          bill.paid < bill.amount &&
          roundMoney(bill.amount - bill.paid) === amountLeft,
      );

      if (exactMatch) {
        exactMatch.paid = exactMatch.amount;
        lastMatchedBill = exactMatch;
        amountLeft = 0;
      }

      categoryBills
        .filter((bill) => bill.paid < bill.amount)
        .forEach((bill) => {
          if (amountLeft <= 0) {
            return;
          }

          const billRemaining = roundMoney(bill.amount - bill.paid);
          const paidNow = Math.min(amountLeft, billRemaining);
          bill.paid = roundMoney(bill.paid + paidNow);
          amountLeft = roundMoney(amountLeft - paidNow);
          lastMatchedBill = bill;
        });

      if (amountLeft > 0 && categoryBills.length) {
        const overTarget = lastMatchedBill || categoryBills.find((bill) => bill.paid > 0) || categoryBills[categoryBills.length - 1];
        overTarget.paid = roundMoney(overTarget.paid + amountLeft);
      }
    });

    const items = fixedBills.map((bill) => {
      const remaining = Math.max(0, roundMoney(bill.amount - bill.paid));
      const overLimit = Math.max(0, roundMoney(bill.paid - bill.amount));
      const percent = bill.amount > 0 ? (bill.paid / bill.amount) * 100 : 0;
      return {
        ...bill,
        remaining,
        overLimit,
        percent,
      };
    });

    return items.reduce(
      (coverage, bill) => {
        const paidAmount = bill.paid;
        const coveredAmount = Math.min(bill.paid, bill.amount);
        if (paidAmount <= 0) {
          return coverage;
        }

        return {
          paidAmount: roundMoney(coverage.paidAmount + paidAmount),
          coveredAmount: roundMoney(coverage.coveredAmount + coveredAmount),
          paidCount: coverage.paidCount + (bill.remaining <= 0 ? 1 : 0),
          items: coverage.items,
        };
      },
      { paidAmount: 0, coveredAmount: 0, paidCount: 0, items },
    );
  }

  function isExtraIncomeTransaction(transaction) {
    if (transaction.categoryId === "cat-salario" || transaction.categoryId === "cat-beneficios") {
      return false;
    }

    const categoryName = normalizeCategoryName(findCategory(transaction.categoryId).name);
    return categoryName !== "salario" && categoryName !== "beneficio" && categoryName !== "beneficios";
  }

  function normalizeCategoryName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function transactionBalanceScopeForSide(transaction, accountId, side) {
    const account = findAccount(accountId);
    if (!accountSupportsSeparateBalance(account)) {
      return "main";
    }

    if (side === "target") {
      return normalizeBalanceScope(transaction.targetBalanceScope);
    }

    return normalizeBalanceScope(transaction.accountBalanceScope);
  }

  function accountBalance(accountId, month = selectedMonth) {
    const account = findAccount(accountId);
    const closingDate = endOfMonth(month);
    return state.transactions
      .filter((transaction) => transaction.date <= closingDate)
      .reduce((balance, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.status !== "cleared") {
          return balance;
        }
        if (transaction.type === "income" && transaction.accountId === accountId && transactionBalanceScopeForSide(transaction, accountId, "source") === "main") {
          return balance + amount;
        }
        if (transaction.type === "expense" && transaction.accountId === accountId && transactionBalanceScopeForSide(transaction, accountId, "source") === "main") {
          return balance - amount;
        }
        if ((transaction.type === "transfer" || transaction.type === "card_payment") && transaction.accountId === accountId && transactionBalanceScopeForSide(transaction, accountId, "source") === "main") {
          return balance - amount;
        }
        if ((transaction.type === "transfer" || transaction.type === "card_payment") && transaction.targetAccountId === accountId && transactionBalanceScopeForSide(transaction, accountId, "target") === "main") {
          return balance + amount;
        }
        return balance;
      }, Number(account.openingBalance) || 0);
  }

  function getCreditCardLimitInfo(account, month = selectedMonth) {
    const limit = Math.max(0, roundMoney(Number(account.creditLimit) || 0));
    const balance = accountBalance(account.id, month);
    const invoice = creditCardInvoiceAmount(account.id, month);
    const used = Math.max(0, roundMoney(-invoice));
    const remaining = Math.max(0, roundMoney(limit - used));

    return {
      limit,
      invoice,
      balance,
      used,
      remaining,
    };
  }

  function creditCardInvoiceAmount(accountId, month = selectedMonth) {
    const account = findAccount(accountId);
    const closingDate = endOfMonth(month);
    const transactions = state.transactions
      .filter((transaction) => transaction.date <= closingDate)
      .filter((transaction) => transaction.status === "cleared")
      .sort(compareTransactionsChronologically);
    return transactions.reduce((invoice, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === "expense" && transaction.accountId === accountId) {
        return roundMoney(invoice - amount);
      }
      if (transaction.type === "card_payment" && transaction.targetAccountId === accountId) {
        return roundMoney(invoice + amount);
      }
      return invoice;
    }, roundMoney(Number(account.openingBalance) || 0));
  }

  function compareTransactionsChronologically(a, b) {
    return (
      a.date.localeCompare(b.date) ||
      (a.updatedAt || a.createdAt || "").localeCompare(b.updatedAt || b.createdAt || "") ||
      String(a.id || "").localeCompare(String(b.id || ""))
    );
  }

  function separateBalanceAmount(account, month = selectedMonth) {
    if (!account || !["checking", "cash"].includes(account.kind)) {
      return 0;
    }
    const closingDate = endOfMonth(month);
    const balance = state.transactions
      .filter((transaction) => transaction.date <= closingDate)
      .reduce((total, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.status !== "cleared") {
          return total;
        }
        if (transaction.type === "income" && transaction.accountId === account.id && transactionBalanceScopeForSide(transaction, account.id, "source") === "separate") {
          return total + amount;
        }
        if (transaction.type === "expense" && transaction.accountId === account.id && transactionBalanceScopeForSide(transaction, account.id, "source") === "separate") {
          return total - amount;
        }
        if ((transaction.type === "transfer" || transaction.type === "card_payment") && transaction.accountId === account.id && transactionBalanceScopeForSide(transaction, account.id, "source") === "separate") {
          return total - amount;
        }
        if ((transaction.type === "transfer" || transaction.type === "card_payment") && transaction.targetAccountId === account.id && transactionBalanceScopeForSide(transaction, account.id, "target") === "separate") {
          return total + amount;
        }
        return total;
      }, Number(account.separateBalanceAmount) || 0);
    return Math.max(0, roundMoney(balance));
  }

  function accountCdiPercent(account) {
    if (!isSavedAccount(account)) {
      return 0;
    }
    const value = Number(account.cdiPercent);
    return Number.isFinite(value) ? Math.max(0, roundMoney(value)) : DEFAULT_SAVINGS_CDI_PERCENT;
  }

  function getCdiAnnualRate() {
    const value = Number(state.settings?.cdiAnnualRate);
    return Number.isFinite(value) ? Math.max(0, roundMoney(value)) : DEFAULT_CDI_ANNUAL_RATE;
  }

  function savingsYieldEstimate(account, month = selectedMonth) {
    const balance = Math.max(0, accountBalance(account.id, month));
    const annualRate = getCdiAnnualRate() / 100;
    const cdiShare = accountCdiPercent(account) / 100;
    const monthlyRate = Math.pow(1 + annualRate * cdiShare, 1 / 12) - 1;
    return {
      monthlyRate,
      monthlyYield: roundMoney(balance * monthlyRate),
    };
  }

  function getBudgetLimit(categoryId) {
    const budget = state.budgets.find((item) => item.categoryId === categoryId);
    return Number(budget?.monthlyLimit) || 0;
  }

  function blankSalaryEntry(overrides = {}) {
    const now = new Date().toISOString();
    const employmentType = normalizeEmploymentType(overrides.employmentType);
    const hasBenefitItems = Array.isArray(overrides.benefitItems);
    const hasLegacyMealDaily = Number.isFinite(Number(overrides.benefitMealDaily));
    const hasLegacyTransportDaily = Number.isFinite(Number(overrides.benefitTransportDaily));
    const benefitMealDaily = hasLegacyMealDaily ? Math.max(0, roundMoney(Number(overrides.benefitMealDaily))) : DEFAULT_BENEFITS.mealDaily;
    const benefitTransportDaily = hasLegacyTransportDaily ? Math.max(0, roundMoney(Number(overrides.benefitTransportDaily))) : DEFAULT_BENEFITS.transportDaily;
    const includeDefaultBenefits =
      overrides.includeDefaultBenefits === true ||
      (overrides.includeDefaultBenefits !== false &&
        employmentType === "clt" &&
        !hasBenefitItems &&
        !hasLegacyMealDaily &&
        !hasLegacyTransportDaily &&
        !(Number(overrides.benefits) > 0));
    const legacyBenefitSource = {
      ...overrides,
      employmentType,
    };
    if (hasLegacyMealDaily) {
      legacyBenefitSource.benefitMealDaily = benefitMealDaily;
    }
    if (hasLegacyTransportDaily) {
      legacyBenefitSource.benefitTransportDaily = benefitTransportDaily;
    }

    return {
      id: overrides.id || "",
      name: String(overrides.name || "").trim(),
      employmentType,
      salary: Math.max(0, roundMoney(Number(overrides.salary) || 0)),
      benefits: Math.max(0, roundMoney(Number(overrides.benefits) || 0)),
      benefitMealDaily,
      benefitTransportDaily,
      benefitItems: normalizeBenefitItems(overrides.benefitItems, legacyBenefitSource, { includeDefaults: includeDefaultBenefits }),
      salaryDependents: Math.max(0, Math.floor(Number(overrides.salaryDependents) || 0)),
      salaryAdvance: Math.max(0, roundMoney(Number(overrides.salaryAdvance) || 0)),
      salaryOtherDiscounts: Math.max(0, roundMoney(Number(overrides.salaryOtherDiscounts) || 0)),
      hasTransportVoucher: overrides.hasTransportVoucher !== false,
      pjTaxRate: Number.isFinite(Number(overrides.pjTaxRate)) ? clampPercent(Number(overrides.pjTaxRate), 6) : 6,
      pjOtherCosts: Math.max(0, roundMoney(Number(overrides.pjOtherCosts) || 0)),
      autonomousInssRate: Number.isFinite(Number(overrides.autonomousInssRate)) ? clampPercent(Number(overrides.autonomousInssRate), 20) : 20,
      autonomousInssBase: Math.max(0, roundMoney(Number(overrides.autonomousInssBase) || 0)),
      autonomousBookCash: Math.max(0, roundMoney(Number(overrides.autonomousBookCash) || 0)),
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || overrides.createdAt || now,
    };
  }

  function normalizeSalaryEntry(entry = {}, fallbackName = "Renda") {
    const normalized = blankSalaryEntry(entry);
    normalized.id = normalized.id || createId("salary");
    normalized.name = normalized.name || fallbackName;
    return normalized;
  }

  function createSalaryEntry(overrides = {}) {
    return normalizeSalaryEntry({ ...overrides, id: overrides.id || createId("salary") }, overrides.name || "Nova renda");
  }

  function hasLegacySalaryPlan(plan) {
    if (!plan || typeof plan !== "object") {
      return false;
    }

    const numericFields = [
      plan.salary,
      plan.benefits,
      plan.salaryDependents,
      plan.salaryAdvance,
      plan.salaryOtherDiscounts,
      plan.pjOtherCosts,
      plan.autonomousInssBase,
      plan.autonomousBookCash,
    ];

    const hasBenefitItems = Array.isArray(plan.benefitItems) && plan.benefitItems.some((item) => Number(item?.amount) > 0);
    return numericFields.some((value) => Number(value) > 0) || hasBenefitItems || normalizeEmploymentType(plan.employmentType) !== "clt";
  }

  function legacySalaryEntryFromPlan(plan) {
    return normalizeSalaryEntry(
      {
        name: plan.salaryName || "Salário principal",
        employmentType: plan.employmentType,
        salary: plan.salary,
        benefits: plan.benefits,
        benefitItems: plan.benefitItems,
        benefitMealDaily: plan.benefitMealDaily,
        benefitTransportDaily: plan.benefitTransportDaily,
        salaryDependents: plan.salaryDependents,
        salaryAdvance: plan.salaryAdvance,
        salaryOtherDiscounts: plan.salaryOtherDiscounts,
        hasTransportVoucher: plan.hasTransportVoucher,
        pjTaxRate: plan.pjTaxRate,
        pjOtherCosts: plan.pjOtherCosts,
        autonomousInssRate: plan.autonomousInssRate,
        autonomousInssBase: plan.autonomousInssBase,
        autonomousBookCash: plan.autonomousBookCash,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
      "Salário principal",
    );
  }

  function salaryEntriesFromPlanSnapshot(plan, now = new Date().toISOString()) {
    if (!plan || typeof plan !== "object") {
      return [];
    }
    if (plan.salaryEntriesManuallyCleared) {
      return [];
    }

    const rawEntries =
      Array.isArray(plan.salaryEntries) && plan.salaryEntries.length
        ? plan.salaryEntries
        : hasLegacySalaryPlan(plan)
          ? [legacySalaryEntryFromPlan(plan)]
          : [];

    return rawEntries.map((entry, index) =>
      normalizeSalaryEntry(
        {
          ...entry,
          id: createId("salary"),
          createdAt: now,
          updatedAt: now,
        },
        index === 0 ? "Salário principal" : `Renda ${index + 1}`,
      ),
    );
  }

  function ensureSalaryEntries(plan) {
    if (!plan || typeof plan !== "object") {
      return [];
    }

    plan.salaryEntries = Array.isArray(plan.salaryEntries)
      ? plan.salaryEntries.map((entry, index) => normalizeSalaryEntry(entry, index === 0 ? "Salário principal" : `Renda ${index + 1}`))
      : [];

    if (!plan.salaryEntries.length && !plan.salaryEntriesManuallyCleared && hasLegacySalaryPlan(plan)) {
      plan.salaryEntries = [legacySalaryEntryFromPlan(plan)];
    }

    syncPrimarySalaryFields(plan);
    return plan.salaryEntries;
  }

  function selectedSalaryEntry(plan, options = {}) {
    const entries = ensureSalaryEntries(plan);
    if (!entries.length && options.create) {
      const entry = createSalaryEntry({ name: "Salário principal" });
      entries.push(entry);
      plan.salaryEntriesManuallyCleared = false;
      activeSalaryEntryId = entry.id;
      return entry;
    }

    if (!entries.length) {
      activeSalaryEntryId = "";
      return null;
    }

    if (!activeSalaryEntryId || !entries.some((entry) => entry.id === activeSalaryEntryId)) {
      activeSalaryEntryId = entries[0].id;
    }

    return entries.find((entry) => entry.id === activeSalaryEntryId) || entries[0];
  }

  function syncPrimarySalaryFields(plan) {
    const first = Array.isArray(plan.salaryEntries) ? plan.salaryEntries[0] : null;
    if (!first) {
      plan.salary = 0;
      plan.benefits = 0;
      plan.benefitItems = [];
      plan.employmentType = "clt";
      return;
    }

    plan.salary = Number(first.salary) || 0;
    plan.employmentType = normalizeEmploymentType(first.employmentType);
    plan.benefits = Number(first.benefits) || 0;
    plan.benefitItems = normalizeBenefitItems(first.benefitItems, first);
    plan.benefitMealDaily = first.benefitMealDaily;
    plan.benefitTransportDaily = first.benefitTransportDaily;
    plan.salaryDependents = first.salaryDependents;
    plan.salaryAdvance = first.salaryAdvance;
    plan.salaryOtherDiscounts = first.salaryOtherDiscounts;
    plan.hasTransportVoucher = first.hasTransportVoucher !== false;
    plan.pjTaxRate = first.pjTaxRate;
    plan.pjOtherCosts = first.pjOtherCosts;
    plan.autonomousInssRate = first.autonomousInssRate;
    plan.autonomousInssBase = first.autonomousInssBase;
    plan.autonomousBookCash = first.autonomousBookCash;
  }

  function hasSalaryIncome(plan) {
    if (!plan || typeof plan !== "object") {
      return false;
    }

    const entries =
      Array.isArray(plan.salaryEntries) && plan.salaryEntries.length
        ? plan.salaryEntries
        : !plan.salaryEntriesManuallyCleared && hasLegacySalaryPlan(plan)
          ? [plan]
          : [];
    return entries.some(
      (entry) =>
        Number(entry.salary) > 0 ||
        Number(entry.benefits) > 0 ||
        (Array.isArray(entry.benefitItems) && entry.benefitItems.some((item) => Number(item?.amount) > 0)),
    );
  }

  function calculateSalaryBundle(plan, month) {
    const entries = ensureSalaryEntries(plan);
    const rows = entries.map((entry) => {
      const benefits = calculateMonthlyBenefits(month, entry);
      entry.benefits = benefits.total;
      const payroll = calculateSalaryIncome(entry);
      return { entry, benefits, payroll };
    });

    const totals = rows.reduce(
      (sum, row) => ({
        grossSalary: roundMoney(sum.grossSalary + row.payroll.grossSalary),
        salary: roundMoney(sum.salary + row.payroll.netMonth),
        netPaycheck: roundMoney(sum.netPaycheck + row.payroll.netPaycheck),
        benefits: roundMoney(sum.benefits + row.benefits.total),
      }),
      { grossSalary: 0, salary: 0, netPaycheck: 0, benefits: 0 },
    );
    const employmentType = rows.length === 1 ? rows[0].payroll.employmentType : plan.employmentType;

    return {
      entries,
      rows,
      salaryCount: rows.length,
      employmentType,
      grossSalary: totals.grossSalary,
      salary: totals.salary,
      benefits: totals.benefits,
      guaranteed: roundMoney(totals.salary + totals.benefits),
      payroll: {
        grossSalary: totals.grossSalary,
        netMonth: totals.salary,
        netPaycheck: totals.netPaycheck,
        employmentType,
      },
      benefitInfo: {
        total: totals.benefits,
        manual: rows.some((row) => row.benefits.manual),
      },
    };
  }

  function ensureMonthPlan(month) {
    state.monthPlans = Array.isArray(state.monthPlans) ? state.monthPlans : [];
    let plan = state.monthPlans.find((item) => item.month === month);
    const salarySourcePlan = latestPreviousSalaryPlan(month);
    const fixedBillsSourcePlan = latestPreviousFixedBillsPlan(month);
    if (!plan) {
      const now = new Date().toISOString();
      const sourcePlan = latestPreviousMonthPlan(month);
      const incomeSourcePlan = salarySourcePlan || sourcePlan;
      plan = {
        id: createId("month"),
        month,
        salary: Number(salarySourcePlan?.salary ?? sourcePlan?.salary) || 0,
        employmentType: normalizeEmploymentType(incomeSourcePlan?.employmentType),
        salaryEntries: salaryEntriesFromPlanSnapshot(incomeSourcePlan, now),
        benefits: Number(incomeSourcePlan?.benefits ?? sourcePlan?.benefits) || 0,
        benefitItems: normalizeBenefitItems(incomeSourcePlan?.benefitItems, incomeSourcePlan, { includeDefaults: false }),
        benefitMealDaily: Number.isFinite(Number(incomeSourcePlan?.benefitMealDaily))
          ? Math.max(0, roundMoney(Number(incomeSourcePlan.benefitMealDaily)))
          : DEFAULT_BENEFITS.mealDaily,
        benefitTransportDaily: Number.isFinite(Number(incomeSourcePlan?.benefitTransportDaily))
          ? Math.max(0, roundMoney(Number(incomeSourcePlan.benefitTransportDaily)))
          : DEFAULT_BENEFITS.transportDaily,
        salaryDependents: Math.max(0, Math.floor(Number(incomeSourcePlan?.salaryDependents) || 0)),
        salaryAdvance: Math.max(0, roundMoney(Number(incomeSourcePlan?.salaryAdvance) || 0)),
        salaryOtherDiscounts: Math.max(0, roundMoney(Number(incomeSourcePlan?.salaryOtherDiscounts) || 0)),
        hasTransportVoucher: incomeSourcePlan ? incomeSourcePlan.hasTransportVoucher !== false : true,
        pjTaxRate: Number.isFinite(Number(incomeSourcePlan?.pjTaxRate)) ? clampPercent(Number(incomeSourcePlan.pjTaxRate), 6) : 6,
        pjOtherCosts: Math.max(0, roundMoney(Number(incomeSourcePlan?.pjOtherCosts) || 0)),
        autonomousInssRate: Number.isFinite(Number(incomeSourcePlan?.autonomousInssRate)) ? clampPercent(Number(incomeSourcePlan.autonomousInssRate), 20) : 20,
        autonomousInssBase: Math.max(0, roundMoney(Number(incomeSourcePlan?.autonomousInssBase) || 0)),
        autonomousBookCash: Math.max(0, roundMoney(Number(incomeSourcePlan?.autonomousBookCash) || 0)),
        fixedBills: cloneFixedBillsForMonth((fixedBillsSourcePlan || sourcePlan)?.fixedBills, now),
        salaryEntriesManuallyCleared: false,
        fixedBillsManuallyCleared: false,
        createdAt: now,
        updatedAt: now,
      };
      syncPrimarySalaryFields(plan);
      state.monthPlans.push(plan);
    } else {
      applyPersistentSalaryDefaults(plan, salarySourcePlan);
    }
    plan.fixedBills = Array.isArray(plan.fixedBills) ? plan.fixedBills : [];
    applyPersistentFixedBillDefaults(plan, fixedBillsSourcePlan);
    plan.benefitItems = normalizeBenefitItems(plan.benefitItems, plan, { includeDefaults: false });
    plan.benefitMealDaily = Number.isFinite(Number(plan.benefitMealDaily))
      ? Math.max(0, roundMoney(Number(plan.benefitMealDaily)))
      : DEFAULT_BENEFITS.mealDaily;
    plan.benefitTransportDaily = Number.isFinite(Number(plan.benefitTransportDaily))
      ? Math.max(0, roundMoney(Number(plan.benefitTransportDaily)))
      : DEFAULT_BENEFITS.transportDaily;
    plan.salaryDependents = Math.max(0, Math.floor(Number(plan.salaryDependents) || 0));
    plan.salaryAdvance = Math.max(0, roundMoney(Number(plan.salaryAdvance) || 0));
    plan.salaryOtherDiscounts = Math.max(0, roundMoney(Number(plan.salaryOtherDiscounts) || 0));
    plan.hasTransportVoucher = plan.hasTransportVoucher !== false;
    plan.employmentType = normalizeEmploymentType(plan.employmentType);
    plan.pjTaxRate = Number.isFinite(Number(plan.pjTaxRate)) ? clampPercent(Number(plan.pjTaxRate), 6) : 6;
    plan.pjOtherCosts = Math.max(0, roundMoney(Number(plan.pjOtherCosts) || 0));
    plan.autonomousInssRate = Number.isFinite(Number(plan.autonomousInssRate)) ? clampPercent(Number(plan.autonomousInssRate), 20) : 20;
    plan.autonomousInssBase = Math.max(0, roundMoney(Number(plan.autonomousInssBase) || 0));
    plan.autonomousBookCash = Math.max(0, roundMoney(Number(plan.autonomousBookCash) || 0));
    plan.salaryEntriesManuallyCleared = Boolean(plan.salaryEntriesManuallyCleared);
    ensureSalaryEntries(plan);
    return plan;
  }

  function latestPreviousMonthPlan(month) {
    return state.monthPlans
      .filter((plan) => plan?.month && plan.month < month)
      .sort((a, b) => b.month.localeCompare(a.month))[0] || null;
  }

  function latestPreviousSalaryPlan(month) {
    return state.monthPlans
      .filter((plan) => plan?.month && plan.month < month && hasSalaryIncome(plan))
      .sort((a, b) => b.month.localeCompare(a.month))[0] || null;
  }

  function latestPreviousFixedBillsPlan(month) {
    const previousPlans = state.monthPlans
      .filter((plan) => (
        plan?.month &&
        plan.month < month
      ))
      .sort((a, b) => b.month.localeCompare(a.month));

    for (const plan of previousPlans) {
      if (plan.fixedBillsManuallyCleared) {
        return null;
      }

      if (Array.isArray(plan.fixedBills) && plan.fixedBills.length > 0) {
        return plan;
      }
    }

    return null;
  }

  function applyPersistentSalaryDefaults(plan, sourcePlan) {
    if (!sourcePlan || plan.salaryEntriesManuallyCleared) {
      return;
    }

    const currentHasSalary = hasSalaryIncome(plan);
    const sourceHasSalary = hasSalaryIncome(sourcePlan);
    if (!currentHasSalary && sourceHasSalary) {
      copySalaryPlanFields(plan, sourcePlan);
    }
  }

  function copySalaryPlanFields(targetPlan, sourcePlan) {
    targetPlan.salaryEntries = salaryEntriesFromPlanSnapshot(sourcePlan);
    targetPlan.salaryEntriesManuallyCleared = false;
    syncPrimarySalaryFields(targetPlan);
    targetPlan.employmentType = normalizeEmploymentType(sourcePlan.employmentType);
    targetPlan.benefits = Math.max(0, roundMoney(Number(sourcePlan.benefits) || 0));
    if (!targetPlan.benefitItems.length) {
      targetPlan.benefitItems = normalizeBenefitItems(sourcePlan.benefitItems, sourcePlan, { includeDefaults: false });
    }
    targetPlan.benefitMealDaily = Number.isFinite(Number(sourcePlan.benefitMealDaily))
      ? Math.max(0, roundMoney(Number(sourcePlan.benefitMealDaily)))
      : DEFAULT_BENEFITS.mealDaily;
    targetPlan.benefitTransportDaily = Number.isFinite(Number(sourcePlan.benefitTransportDaily))
      ? Math.max(0, roundMoney(Number(sourcePlan.benefitTransportDaily)))
      : DEFAULT_BENEFITS.transportDaily;
    targetPlan.salaryDependents = Math.max(0, Math.floor(Number(sourcePlan.salaryDependents) || 0));
    targetPlan.salaryOtherDiscounts = Math.max(0, roundMoney(Number(sourcePlan.salaryOtherDiscounts) || 0));
    targetPlan.hasTransportVoucher = sourcePlan.hasTransportVoucher !== false;
    targetPlan.pjTaxRate = Number.isFinite(Number(sourcePlan.pjTaxRate)) ? clampPercent(Number(sourcePlan.pjTaxRate), 6) : 6;
    targetPlan.pjOtherCosts = Math.max(0, roundMoney(Number(sourcePlan.pjOtherCosts) || 0));
    targetPlan.autonomousInssRate = Number.isFinite(Number(sourcePlan.autonomousInssRate)) ? clampPercent(Number(sourcePlan.autonomousInssRate), 20) : 20;
    targetPlan.autonomousInssBase = Math.max(0, roundMoney(Number(sourcePlan.autonomousInssBase) || 0));
    targetPlan.autonomousBookCash = Math.max(0, roundMoney(Number(sourcePlan.autonomousBookCash) || 0));
  }

  function applyPersistentFixedBillDefaults(plan, sourcePlan) {
    if (!sourcePlan || plan.fixedBills.length > 0 || plan.fixedBillsManuallyCleared) {
      return;
    }

    const now = new Date().toISOString();
    plan.fixedBills = cloneFixedBillsForMonth(sourcePlan.fixedBills, now);
    plan.fixedBillsManuallyCleared = false;
    plan.updatedAt = now;
  }

  function cloneFixedBillsForMonth(fixedBills, now) {
    if (!Array.isArray(fixedBills)) {
      return [];
    }

    return fixedBills.map((bill) => ({
      id: createId("fixed"),
      name: bill.name || "Conta fixa",
      categoryId: bill.categoryId || "",
      amount: Math.max(0, roundMoney(Number(bill.amount) || 0)),
      createdAt: now,
      updatedAt: now,
    }));
  }

  function sumFixedBills(plan) {
    return (plan.fixedBills || []).reduce((total, bill) => total + (Number(bill.amount) || 0), 0);
  }

  function normalizeEmploymentType(value) {
    return Object.hasOwn(EMPLOYMENT_TYPES, value) ? value : "clt";
  }

  function employmentTypeLabel(value) {
    return EMPLOYMENT_TYPES[normalizeEmploymentType(value)].label;
  }

  function normalizeBenefitFrequency(value) {
    return Object.hasOwn(BENEFIT_CALC_TYPES, value) ? value : "workday";
  }

  function benefitFrequencyLabel(value) {
    return BENEFIT_CALC_TYPES[normalizeBenefitFrequency(value)].label;
  }

  function benefitFrequencyOptionHtml(selected) {
    const current = normalizeBenefitFrequency(selected);
    return Object.entries(BENEFIT_CALC_TYPES)
      .map(([value, config]) => `<option value="${value}" ${value === current ? "selected" : ""}>${escapeHtml(config.label)}</option>`)
      .join("");
  }

  function normalizeBenefitItem(item = {}) {
    const now = new Date().toISOString();
    return {
      id: item.id || createId("benefit"),
      name: String(item.name || "").trim() || "Beneficio",
      amount: Math.max(0, roundMoney(Number(item.amount) || 0)),
      frequency: normalizeBenefitFrequency(item.frequency),
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || item.createdAt || now,
    };
  }

  function normalizeBenefitItems(items, source = {}, options = {}) {
    const sourceData = source && typeof source === "object" ? source : {};
    const rawItems = Array.isArray(items)
      ? items
      : legacyBenefitItemsFromSalary(sourceData, options);

    return rawItems
      .filter((item) => item && typeof item === "object")
      .map((item) => normalizeBenefitItem(item));
  }

  function legacyBenefitItemsFromSalary(source = {}, options = {}) {
    const items = [];
    const employmentType = normalizeEmploymentType(source.employmentType);
    const includeDefaults = Boolean(options.includeDefaults);
    const now = new Date().toISOString();

    if (employmentType === "clt") {
      const rawMeal = Number(source.benefitMealDaily);
      const rawTransport = Number(source.benefitTransportDaily);
      const mealDaily = Number.isFinite(rawMeal) ? Math.max(0, roundMoney(rawMeal)) : includeDefaults ? DEFAULT_BENEFITS.mealDaily : 0;
      const transportDaily = Number.isFinite(rawTransport)
        ? Math.max(0, roundMoney(rawTransport))
        : includeDefaults
          ? DEFAULT_BENEFITS.transportDaily
          : 0;

      if (mealDaily > 0) {
        items.push({
          id: createId("benefit"),
          name: "VR",
          amount: mealDaily,
          frequency: "workday",
          createdAt: now,
          updatedAt: now,
        });
      }

      if (transportDaily > 0) {
        items.push({
          id: createId("benefit"),
          name: "VT",
          amount: transportDaily,
          frequency: "workday",
          createdAt: now,
          updatedAt: now,
        });
      }

      if (items.length) {
        return items;
      }
    }

    const manualBenefits = Math.max(0, roundMoney(Number(source.benefits) || 0));
    return manualBenefits > 0
      ? [
          {
            id: createId("benefit"),
            name: "Beneficios",
            amount: manualBenefits,
            frequency: "month",
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [];
  }

  function isDefaultLegacyBenefitSet(items) {
    if (!Array.isArray(items) || items.length !== 2) {
      return false;
    }

    const normalized = normalizeBenefitItems(items);
    const vr = normalized.find((item) => item.name.trim().toLowerCase() === "vr");
    const vt = normalized.find((item) => item.name.trim().toLowerCase() === "vt");
    return (
      vr &&
      vt &&
      isDefaultLegacyBenefitItem(vr) &&
      isDefaultLegacyBenefitItem(vt)
    );
  }

  function hasDefaultLegacyBenefitItems(items) {
    if (!Array.isArray(items) || !items.length) {
      return false;
    }

    return normalizeBenefitItems(items).some((item) => isDefaultLegacyBenefitItem(item));
  }

  function removeDefaultLegacyBenefitItems(items) {
    return normalizeBenefitItems(items).filter((item) => !isDefaultLegacyBenefitItem(item));
  }

  function isDefaultLegacyBenefitItem(item) {
    const name = String(item?.name || "").trim().toLowerCase();
    const amount = roundMoney(Number(item?.amount) || 0);
    return (
      item?.frequency === "workday" &&
      ((name === "vr" && amount === roundMoney(DEFAULT_BENEFITS.mealDaily)) ||
        (name === "vt" && amount === roundMoney(DEFAULT_BENEFITS.transportDaily)))
    );
  }

  function calculateBenefitCalendar(month) {
    const [year, monthNumber] = String(month || currentMonth()).split("-").map(Number);
    const normalizedYear = Number.isFinite(year) ? year : new Date().getFullYear();
    const monthIndex = Number.isFinite(monthNumber) ? monthNumber - 1 : new Date().getMonth();
    const holidays = getMonthHolidays(normalizedYear, monthIndex);
    const holidayKeys = new Set(holidays.map((holiday) => holiday.key));
    const daysInMonth = new Date(normalizedYear, monthIndex + 1, 0).getDate();
    const weeklyBusinessDays = new Map();
    let workdays = 0;

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(normalizedYear, monthIndex, day);
      const weekDay = date.getDay();
      const key = localDateKey(date);

      if (weekDay >= 1 && weekDay <= 5 && !holidayKeys.has(key)) {
        workdays += 1;
        const weekKey = localDateKey(addDays(date, 1 - weekDay));
        weeklyBusinessDays.set(weekKey, (weeklyBusinessDays.get(weekKey) || 0) + 1);
      }
    }

    return {
      workdays,
      payableWeeks: [...weeklyBusinessDays.values()].filter((days) => days > 0).length,
      weeklyBusinessDays,
      holidays,
    };
  }

  function calculateBenefitItem(item, calendar) {
    const normalized = normalizeBenefitItem(item);
    let units = 1;
    let unitLabel = plural(1, "mes", "meses");

    if (normalized.frequency === "workday") {
      units = calendar.workdays;
      unitLabel = plural(units, "dia util", "dias uteis");
    } else if (normalized.frequency === "week") {
      units = calendar.payableWeeks;
      unitLabel = plural(units, "semana util", "semanas uteis");
    }

    const total = roundMoney(normalized.amount * units);
    return {
      ...normalized,
      units,
      total,
      detail: `${unitLabel} x ${formatCurrency(normalized.amount)}`,
      frequencyLabel: benefitFrequencyLabel(normalized.frequency),
    };
  }

  function calculateMonthlyBenefits(month, plan) {
    const calendar = calculateBenefitCalendar(month);
    const items = normalizeBenefitItems(plan?.benefitItems, plan, { includeDefaults: false }).map((item) => calculateBenefitItem(item, calendar));

    return {
      workdays: calendar.workdays,
      payableWeeks: calendar.payableWeeks,
      weeklyBusinessDays: calendar.weeklyBusinessDays,
      mealDaily: 0,
      transportDaily: 0,
      mealTotal: 0,
      transportTotal: 0,
      items,
      total: roundMoney(items.reduce((sum, item) => sum + item.total, 0)),
      holidays: calendar.holidays,
      manual: false,
    };
  }

  function getMonthHolidays(year, monthIndex) {
    return getBrazilSaoPauloHolidays(year)
      .filter((holiday) => holiday.date.getMonth() === monthIndex)
      .map((holiday) => ({
        ...holiday,
        key: localDateKey(holiday.date),
        displayDate: holidayDateFormatter.format(holiday.date),
      }));
  }

  function getBrazilSaoPauloHolidays(year) {
    const easter = getEasterDate(year);
    const holidays = [
      holiday(year, 0, 1, "Confraternização Universal"),
      holiday(year, 0, 25, "Aniversário de São Paulo"),
      holidayFromDate(addDays(easter, -2), "Sexta-feira Santa"),
      holiday(year, 3, 21, "Tiradentes"),
      holiday(year, 4, 1, "Dia do Trabalhador"),
      holidayFromDate(addDays(easter, 60), "Corpus Christi"),
      holiday(year, 6, 9, "Revolução Constitucionalista"),
      holiday(year, 8, 7, "Independência do Brasil"),
      holiday(year, 9, 12, "Nossa Senhora Aparecida"),
      holiday(year, 10, 2, "Finados"),
      holiday(year, 10, 15, "Proclamação da República"),
      holiday(year, 10, 20, "Consciência Negra"),
      holiday(year, 11, 25, "Natal"),
    ];

    return holidays.filter((item) => {
      const weekDay = item.date.getDay();
      return weekDay >= 1 && weekDay <= 5;
    });
  }

  function getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
  }

  function holiday(year, monthIndex, day, label) {
    return holidayFromDate(new Date(year, monthIndex, day), label);
  }

  function holidayFromDate(date, label) {
    return { date, label };
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function calculateCltSalary(plan) {
    const grossSalary = Math.max(0, roundMoney(Number(plan.salary) || 0));
    const dependents = Math.max(0, Math.floor(Number(plan.salaryDependents) || 0));
    const advance = Math.max(0, roundMoney(Number(plan.salaryAdvance) || 0));
    const otherDiscounts = Math.max(0, roundMoney(Number(plan.salaryOtherDiscounts) || 0));
    const inss = calculateProgressive(grossSalary, CLT_RULES_2026.inssBrackets);
    const dependentDeduction = dependents * CLT_RULES_2026.dependentDeduction;
    const irrfDeduction = Math.max(CLT_RULES_2026.simplifiedDiscount, inss + dependentDeduction);
    const irrfBase = Math.max(0, grossSalary - irrfDeduction);
    const irrfBracket = CLT_RULES_2026.irrfBrackets.find((bracket) => irrfBase <= bracket.limit);
    const irrf = roundMoney(Math.max(0, irrfBase * irrfBracket.rate - irrfBracket.deduction));
    const transportDiscount = plan.hasTransportVoucher ? roundMoney(grossSalary * CLT_RULES_2026.transportRate) : 0;
    const fgts = roundMoney(grossSalary * CLT_RULES_2026.fgtsRate);
    const netMonth = roundMoney(Math.max(0, grossSalary - inss - irrf - transportDiscount - otherDiscounts));
    const netPaycheck = roundMoney(Math.max(0, netMonth - advance));

    return {
      grossSalary,
      dependents,
      advance,
      otherDiscounts,
      inss,
      irrf,
      transportDiscount,
      fgts,
      netMonth,
      netPaycheck,
      irrfBase,
    };
  }

  function calculateSalaryIncome(plan) {
    const employmentType = normalizeEmploymentType(plan.employmentType);

    if (employmentType === "pj") {
      return calculatePjSalary(plan);
    }

    if (employmentType === "autonomous") {
      return calculateAutonomousSalary(plan);
    }

    if (employmentType === "clean") {
      return calculateCleanSalary(plan);
    }

    const clt = calculateCltSalary(plan);
    return {
      ...clt,
      employmentType,
      summaryPrimary: clt.inss,
      summarySecondary: clt.irrf,
      summaryTertiary: clt.transportDiscount,
      summaryQuaternary: clt.fgts,
      summaryQuaternaryText: `${formatCurrency(clt.fgts)} depósito`,
    };
  }

  function calculateCleanSalary(plan) {
    const grossSalary = Math.max(0, roundMoney(Number(plan.salary) || 0));
    return {
      grossSalary,
      dependents: 0,
      advance: 0,
      otherDiscounts: 0,
      inss: 0,
      irrf: 0,
      transportDiscount: 0,
      fgts: 0,
      netMonth: grossSalary,
      netPaycheck: grossSalary,
      employmentType: "clean",
      summaryPrimary: 0,
      summarySecondary: 0,
      summaryTertiary: 0,
      summaryQuaternary: 0,
    };
  }

  function calculatePjSalary(plan) {
    const grossSalary = Math.max(0, roundMoney(Number(plan.salary) || 0));
    const taxRate = clampPercent(Number(plan.pjTaxRate), 6);
    const tax = roundMoney(grossSalary * (taxRate / 100));
    const otherCosts = Math.max(0, roundMoney(Number(plan.pjOtherCosts) || 0));
    const netMonth = roundMoney(Math.max(0, grossSalary - tax - otherCosts));

    return {
      grossSalary,
      dependents: 0,
      advance: 0,
      otherDiscounts: otherCosts,
      inss: 0,
      irrf: 0,
      transportDiscount: 0,
      fgts: 0,
      netMonth,
      netPaycheck: netMonth,
      employmentType: "pj",
      tax,
      taxRate,
      summaryPrimary: tax,
      summarySecondary: taxRate,
      summarySecondaryText: formatPercent(taxRate),
      summaryTertiary: otherCosts,
      summaryQuaternary: 0,
    };
  }

  function calculateAutonomousSalary(plan) {
    const grossSalary = Math.max(0, roundMoney(Number(plan.salary) || 0));
    const dependents = Math.max(0, Math.floor(Number(plan.salaryDependents) || 0));
    const otherDiscounts = Math.max(0, roundMoney(Number(plan.salaryOtherDiscounts) || 0));
    const bookCash = Math.max(0, roundMoney(Number(plan.autonomousBookCash) || 0));
    const inssRate = clampPercent(Number(plan.autonomousInssRate), 20);
    const inssCeiling = CLT_RULES_2026.inssBrackets.at(-1).limit;
    const rawInssBase = Number(plan.autonomousInssBase) > 0 ? Number(plan.autonomousInssBase) : grossSalary;
    const inssBase = Math.max(0, roundMoney(Math.min(rawInssBase, grossSalary, inssCeiling)));
    const inss = roundMoney(inssBase * (inssRate / 100));
    const dependentDeduction = dependents * CLT_RULES_2026.dependentDeduction;
    const irrfBase = Math.max(0, roundMoney(grossSalary - inss - dependentDeduction - bookCash));
    const irrfBracket = CLT_RULES_2026.irrfBrackets.find((bracket) => irrfBase <= bracket.limit);
    const irrf = roundMoney(Math.max(0, irrfBase * irrfBracket.rate - irrfBracket.deduction));
    const deductions = roundMoney(bookCash + otherDiscounts);
    const netMonth = roundMoney(Math.max(0, grossSalary - inss - irrf - deductions));

    return {
      grossSalary,
      dependents,
      advance: 0,
      otherDiscounts,
      inss,
      inssRate,
      inssBase,
      irrf,
      transportDiscount: 0,
      fgts: 0,
      bookCash,
      deductions,
      netMonth,
      netPaycheck: netMonth,
      irrfBase,
      employmentType: "autonomous",
      summaryPrimary: inss,
      summarySecondary: irrf,
      summaryTertiary: deductions,
      summaryQuaternary: 0,
    };
  }

  function clampPercent(value, fallback) {
    const percent = Number.isFinite(value) ? value : fallback;
    return Math.min(100, Math.max(0, roundMoney(percent)));
  }

  function calculateProgressive(value, brackets) {
    let total = 0;
    let previousLimit = 0;

    brackets.forEach((bracket) => {
      const taxable = Math.max(0, Math.min(value, bracket.limit) - previousLimit);
      total += truncateMoney(taxable * bracket.rate);
      previousLimit = bracket.limit;
    });

    return roundMoney(total);
  }

  function findCategory(categoryId) {
    return (
      state.categories.find((category) => category.id === categoryId) || {
        id: "missing-category",
        name: "Sem categoria",
        type: "expense",
        color: "#64748b",
      }
    );
  }

  function findAccount(accountId) {
    return (
      state.accounts.find((account) => account.id === accountId) || {
        id: "missing-account",
        name: "Sem conta",
        kind: "checking",
        openingBalance: 0,
        cdiPercent: 0,
        color: "#64748b",
      }
    );
  }

  function getSupabaseConfig() {
    const config = window.VIDA_LOCAL_CONFIG?.supabase || {};
    const savedConfig = readCloudConfig();
    return {
      url: String(savedConfig.url || config.url || "").trim(),
      anonKey: String(savedConfig.anonKey || config.anonKey || "").trim(),
      stateTable: String(config.stateTable || "user_app_state").trim() || "user_app_state",
      backupTable: String(config.backupTable || "user_app_state_backups").trim() || "user_app_state_backups",
    };
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getCloudConfigAdminEmails() {
    const configuredEmails = window.VIDA_LOCAL_CONFIG?.supabase?.adminEmails;
    if (!Array.isArray(configuredEmails)) {
      return [];
    }

    return configuredEmails.map(normalizeEmail).filter(Boolean);
  }

  function canEditCloudConfig() {
    const email = normalizeEmail(cloudSync.user?.email);
    return Boolean(email && getCloudConfigAdminEmails().includes(email));
  }

  function normalizeCloudAuthRedirectUrl(value) {
    const rawValue = String(value || "").trim();
    if (!rawValue) {
      return "";
    }

    try {
      const url = new URL(rawValue, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }
      url.search = "";
      url.hash = "";
      if (!url.pathname) {
        url.pathname = "/";
      }
      return url.toString();
    } catch (error) {
      return "";
    }
  }

  function getCloudAuthRedirectUrl() {
    const configuredUrl = normalizeCloudAuthRedirectUrl(window.VIDA_LOCAL_CONFIG?.supabase?.authRedirectUrl);
    if (configuredUrl) {
      return configuredUrl;
    }

    if (isWebBrowserRuntime() && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
      return normalizeCloudAuthRedirectUrl(`${window.location.origin}${window.location.pathname || "/"}`);
    }

    return "";
  }

  function ensureCloudClient() {
    const config = getSupabaseConfig();
    const library = window.supabase;
    cloudSync.configured = Boolean(config.url && config.anonKey && library?.createClient);

    if (isWebFileOrigin()) {
      cloudSync.client = null;
      setCloudStatus("error", "Versao web aberta como arquivo local. Abra por http://localhost ou HTTPS para login e nuvem funcionarem.");
      return false;
    }

    if (!cloudSync.configured) {
      cloudSync.client = null;
      setCloudStatus("offline", "Preencha Supabase URL e anonKey no app-config.js.");
      return false;
    }

    if (!cloudSync.client) {
      cloudSync.client = library.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    }

    return true;
  }

  async function setupCloudSync() {
    if (!ensureCloudClient()) {
      renderCloudSyncStatus();
      return;
    }

    setCloudStatus("syncing", "Verificando sessao da nuvem...");

    try {
      const {
        data: { session },
        error,
      } = await cloudSync.client.auth.getSession();

      if (error) {
        throw error;
      }

      cloudSync.client.auth.onAuthStateChange((_event, sessionValue) => {
        if (sessionValue?.user) {
          connectCloudUser(sessionValue.user);
        } else {
          disconnectCloudUser();
        }
      });

      if (session?.user) {
        await connectCloudUser(session.user);
      } else {
        setCloudStatus("offline", "Entre na conta para sincronizar desktop e celular.");
      }
    } catch (error) {
      setCloudStatus("error", `Falha ao iniciar nuvem: ${error.message || error}`);
    }
  }

  async function connectCloudUser(user) {
    if (!user?.id) {
      return;
    }

    cloudSync.user = user;
    setCloudStatus("syncing", `Conectado como ${user.email || "usuario"}. Buscando dados...`);

    try {
      await pullCloudState();
      subscribeCloudState();
      setCloudStatus("online", `Sincronizado como ${user.email || "usuario"}.`);
    } catch (error) {
      setCloudStatus("error", `Erro de sincronizacao: ${error.message || error}`);
    }
  }

  function disconnectCloudUser() {
    if (cloudSync.channel && cloudSync.client) {
      cloudSync.client.removeChannel(cloudSync.channel);
    }
    if (cloudSync.saveTimer) {
      clearTimeout(cloudSync.saveTimer);
      cloudSync.saveTimer = null;
    }
    cloudSync.user = null;
    cloudSync.channel = null;
    setCloudStatus(cloudSync.configured ? "offline" : "offline", "Entre na conta para sincronizar desktop e celular.");
  }

  async function pullCloudState() {
    if (!cloudSync.client || !cloudSync.user) {
      return;
    }

    const table = getSupabaseConfig().stateTable;
    const { data, error } = await cloudSync.client
      .from(table)
      .select("state,state_version,updated_at")
      .eq("user_id", cloudSync.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.state) {
      if (hasMeaningfulLocalData()) {
        await pushCloudState({ reason: "first-sync" });
      } else {
        setCloudStatus("online", "Conta conectada. Entre primeiro no dispositivo com dados ou comece a cadastrar.");
      }
      return;
    }

    const remoteState = normalizeImportedState(data.state);
    if (shouldPreferLocalState(remoteState)) {
      await pushCloudState({ reason: "prefer-local-recovery" });
      setCloudStatus("online", "Dados locais enviados para substituir o estado vazio da nuvem.");
      return;
    }

    const remoteVersion = Number(data.state_version) || 0;
    const localMeta = readSyncMeta();
    const isDifferentUser = localMeta.userId && localMeta.userId !== cloudSync.user.id;
    const shouldApplyRemote = isDifferentUser || remoteVersion > cloudSync.stateVersion;

    if (shouldApplyRemote) {
      applyCloudState(remoteState, remoteVersion, data.updated_at);
    } else if (!cloudSync.stateVersion) {
      cloudSync.stateVersion = remoteVersion;
      writeSyncMeta({
        userId: cloudSync.user.id,
        stateVersion: remoteVersion,
        updatedAt: data.updated_at || new Date().toISOString(),
      });
    }
  }

  function subscribeCloudState() {
    if (!cloudSync.client || !cloudSync.user) {
      return;
    }

    if (cloudSync.channel) {
      cloudSync.client.removeChannel(cloudSync.channel);
      cloudSync.channel = null;
    }

    const table = getSupabaseConfig().stateTable;
    cloudSync.channel = cloudSync.client
      .channel(`jornada-state-${cloudSync.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `user_id=eq.${cloudSync.user.id}`,
        },
        (payload) => {
          const row = payload.new || {};
          const remoteVersion = Number(row.state_version) || 0;
          if (row.state && remoteVersion > cloudSync.stateVersion) {
            const remoteState = normalizeImportedState(row.state);
            if (shouldPreferLocalState(remoteState)) {
              pushCloudState({ reason: "prefer-local-realtime" }).catch((error) => {
                setCloudStatus("error", `Falha ao proteger dados locais: ${error.message || error}`);
              });
              return;
            }
            applyCloudState(remoteState, remoteVersion, row.updated_at);
            setCloudStatus("online", "Dados atualizados pela nuvem.");
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setCloudStatus("online", `Sincronizado como ${cloudSync.user.email || "usuario"}.`);
        }
      });
  }

  function applyCloudState(remoteState, remoteVersion, updatedAt) {
    const normalized = normalizeImportedState(remoteState);
    const preservedLocalMediaCovers = mergeLocalMediaCoversIntoState(normalized, state);
    cloudSync.applyingRemote = true;
    try {
      state = normalized;
      selectedMonth = startupSelectedMonth(state.settings?.selectedMonth);
      transactionMonthFilter = normalizeTransactionMonthFilter(state.settings?.transactionMonthFilter, selectedMonth);
      backupSettings = normalizeBackupSettings(state.settings?.backup);
      mobileNavOrder = normalizeMobileNavOrder(state.settings?.mobileNavOrder);
      theme = state.settings?.theme || preferredTheme();
      activeRegisterPage = normalizeRegisterPage(state.settings?.activeRegisterPage);
      filters.workoutStatus = normalizeWorkoutFilter(state.settings?.workoutStatusFilter);
      filters.shoppingStatus = normalizeShoppingFilter(state.settings?.shoppingStatusFilter);
      filters.pantrySearch = state.settings?.pantrySearch || "";
      filters.pantryCategory = normalizePantryCategoryFilter(state.settings?.pantryCategoryFilter);
      filters.pantryLocation = normalizePantryLocationFilter(state.settings?.pantryLocationFilter);
      filters.pantryStatus = normalizePantryStatusFilter(state.settings?.pantryStatusFilter);
      filters.pantryMode = normalizePantryModeFilter(state.settings?.pantryModeFilter);
      activeCreativeItemId = state.settings?.activeCreativeItemId || "";
      studyCalendarMonth = state.study?.calendarMonth || currentMonth();
      studySelectedDate = state.study?.selectedDate || todayDate();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      cloudSync.stateVersion = remoteVersion;
      writeSyncMeta({
        userId: cloudSync.user?.id || "",
        stateVersion: remoteVersion,
        updatedAt: updatedAt || new Date().toISOString(),
      });
      applyTheme(theme);
      updateThemeToggle();
      render();
      switchView(activeView, { replaceHash: true });
    } finally {
      cloudSync.applyingRemote = false;
    }

    if (preservedLocalMediaCovers) {
      saveState({ sync: false, backup: false });
      pushCloudState().catch((error) => {
        setCloudStatus("error", `Falha ao salvar capas recuperadas: ${error.message || error}`);
      });
    }
  }

  function mergeLocalMediaCoversIntoState(nextState, previousState = state) {
    const localItems = Array.isArray(previousState?.mediaLibrary?.items) ? previousState.mediaLibrary.items : [];
    const nextItems = Array.isArray(nextState?.mediaLibrary?.items) ? nextState.mediaLibrary.items : [];
    if (!localItems.length || !nextItems.length) {
      return false;
    }

    const localCovers = new Map();
    localItems.forEach((item) => {
      const cover = normalizeMediaCover(item.cover || "");
      if (!item?.id || !cover) {
        return;
      }
      localCovers.set(item.id, {
        cover,
        coverKey: mediaItemCoverKey(item),
      });
    });

    let changed = false;
    nextItems.forEach((item) => {
      if (!item?.id || item.cover) {
        return;
      }
      const localCover = localCovers.get(item.id);
      if (!localCover?.cover) {
        return;
      }
      item.cover = localCover.cover;
      item.coverKey = mediaItemCoverKey(item) || localCover.coverKey;
      item.updatedAt = new Date().toISOString();
      changed = true;
    });

    return changed;
  }

  function hasMeaningfulLocalData(candidate = state) {
    const filledCollections = [
      candidate.transactions,
      candidate.workouts,
      candidate.workoutCompletions,
      candidate.nutritionLogs,
      candidate.savedMealIdeas,
      candidate.study?.links,
      candidate.study?.todos,
      candidate.study?.calendarNotes,
      candidate.study?.resources,
      candidate.pantryItems,
      candidate.shoppingItems,
      candidate.creativeItems,
      candidate.mediaLibrary?.items,
      candidate.customHomeWidgets,
      candidate.pageBuilders,
    ];

    if (filledCollections.some((items) => Array.isArray(items) && items.length > 0)) {
      return true;
    }

    if (
      Array.isArray(candidate.accounts) &&
      candidate.accounts.some((account) => Number(account.openingBalance) || Number(account.limit) || Number(account.cdiPercent))
    ) {
      return true;
    }

    return Object.values(candidate.monthPlans || {}).some((plan) => {
      if (!plan || typeof plan !== "object") {
        return false;
      }
      const hasSalaryEntries =
        Array.isArray(plan.salaryEntries) &&
        plan.salaryEntries.some(
          (entry) =>
            Number(entry.salary) ||
            Number(entry.benefits) ||
            (Array.isArray(entry.benefitItems) && entry.benefitItems.some((item) => Number(item?.amount) > 0)),
        );
      const hasBenefitItems = Array.isArray(plan.benefitItems) && plan.benefitItems.some((item) => Number(item?.amount) > 0);
      return (
        hasSalaryEntries ||
        hasBenefitItems ||
        Number(plan.salary) ||
        Number(plan.benefits) ||
        (Number(plan.mealDaily) && Number(plan.mealDaily) !== DEFAULT_BENEFITS.mealDaily) ||
        (Number(plan.transportDaily) && Number(plan.transportDaily) !== DEFAULT_BENEFITS.transportDaily) ||
        Number(plan.dependents) ||
        Number(plan.advance) ||
        Number(plan.otherDiscounts) ||
        (Array.isArray(plan.fixedBills) && plan.fixedBills.length > 0)
      );
    });
  }

  function stateDataScore(candidate = state) {
    const monthPlans = candidate.monthPlans && typeof candidate.monthPlans === "object" ? Object.keys(candidate.monthPlans).length : 0;
    const fixedBills = Object.values(candidate.monthPlans || {}).reduce(
      (total, plan) => total + (Array.isArray(plan?.fixedBills) ? plan.fixedBills.length : 0),
      0,
    );
    return (
      (Array.isArray(candidate.transactions) ? candidate.transactions.length * 100 : 0) +
      (Array.isArray(candidate.accounts) ? candidate.accounts.length * 10 : 0) +
      monthPlans * 10 +
      fixedBills * 20 +
      (Array.isArray(candidate.nutritionLogs) ? candidate.nutritionLogs.length * 5 : 0) +
      (Array.isArray(candidate.study?.links) ? candidate.study.links.length * 12 : 0) +
      (Array.isArray(candidate.study?.todos) ? candidate.study.todos.length * 14 : 0) +
      (Array.isArray(candidate.study?.calendarNotes) ? candidate.study.calendarNotes.length * 14 : 0) +
      (Array.isArray(candidate.study?.resources) ? candidate.study.resources.length * 16 : 0) +
      (Array.isArray(candidate.pantryItems) ? candidate.pantryItems.length * 12 : 0) +
      (Array.isArray(candidate.shoppingItems) ? candidate.shoppingItems.length * 12 : 0) +
      (Array.isArray(candidate.creativeItems) ? candidate.creativeItems.length * 16 : 0) +
      (Array.isArray(candidate.mediaLibrary?.items) ? candidate.mediaLibrary.items.length * 16 : 0) +
      (Array.isArray(candidate.pageBuilders) ? candidate.pageBuilders.length * 10 : 0)
    );
  }

  function shouldPreferLocalState(remoteState) {
    const localScore = stateDataScore(state);
    const remoteScore = stateDataScore(remoteState);
    const localTransactions = Array.isArray(state.transactions) ? state.transactions.length : 0;
    const remoteTransactions = Array.isArray(remoteState.transactions) ? remoteState.transactions.length : 0;
    return (
      hasMeaningfulLocalData(state) &&
      localScore > remoteScore &&
      (localTransactions > remoteTransactions || localScore - remoteScore >= 500)
    );
  }

  function scheduleCloudSync() {
    if (!cloudSync.client || !cloudSync.user || cloudSync.applyingRemote) {
      return;
    }

    if (cloudSync.saveTimer) {
      clearTimeout(cloudSync.saveTimer);
    }

    setCloudStatus("syncing", "Enviando alteracoes...");
    cloudSync.saveTimer = setTimeout(() => {
      cloudSync.saveTimer = null;
      pushCloudState({ reason: "local-save" }).catch((error) => {
        setCloudStatus("error", `Falha ao salvar na nuvem: ${error.message || error}`);
      });
    }, CLOUD_SYNC_DEBOUNCE_MS);
  }

  async function pushCloudState() {
    if (!cloudSync.client || !cloudSync.user) {
      return;
    }

    const result = await writeCloudStateSnapshot();
    cloudSync.stateVersion = result.stateVersion;
    writeSyncMeta({
      userId: cloudSync.user.id,
      stateVersion: result.stateVersion,
      updatedAt: result.updatedAt,
    });
    setCloudStatus("online", `Sincronizado como ${cloudSync.user.email || "usuario"}.`);
  }

  async function writeCloudStateSnapshot(version = Date.now(), updatedAt = new Date().toISOString()) {
    if (!cloudSync.client || !cloudSync.user) {
      throw new Error("Nuvem desconectada.");
    }

    const table = getSupabaseConfig().stateTable;
    const { error } = await cloudSync.client.from(table).upsert(
      {
        user_id: cloudSync.user.id,
        state,
        state_version: version,
        updated_at: updatedAt,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    return { stateVersion: version, updatedAt };
  }

  function openCloudSyncDialog() {
    populateCloudConfigForm();
    renderCloudSyncStatus();
    switchView("system");
    if (isWebFileOrigin()) {
      showToast("Abra a versao web por http://localhost ou HTTPS para usar a nuvem.");
      return;
    }
    if (!cloudSync.configured) {
      showToast(canEditCloudConfig() ? "Configure Supabase URL e anonKey neste painel." : "Nuvem ainda nao configurada.");
    }
  }

  function populateCloudConfigForm() {
    renderCloudConfigAdmin();
    if (!canEditCloudConfig()) {
      return;
    }

    const config = getSupabaseConfig();
    if (els.cloudSyncUrl) {
      els.cloudSyncUrl.value = config.url;
    }
    if (els.cloudSyncAnonKey) {
      els.cloudSyncAnonKey.value = config.anonKey;
    }
  }

  function handleCloudConfigSave() {
    if (!canEditCloudConfig()) {
      showToast("Apenas o administrador pode alterar a configuracao da nuvem.");
      renderCloudConfigAdmin();
      return;
    }

    const url = els.cloudSyncUrl?.value.trim() || "";
    const anonKey = els.cloudSyncAnonKey?.value.trim() || "";
    if (!url || !anonKey) {
      showToast("Informe Project URL e anon public key.");
      return;
    }

    writeCloudConfig({ url, anonKey });
    if (cloudSync.channel && cloudSync.client) {
      cloudSync.client.removeChannel(cloudSync.channel);
    }
    if (cloudSync.saveTimer) {
      clearTimeout(cloudSync.saveTimer);
      cloudSync.saveTimer = null;
    }
    cloudSync.client = null;
    cloudSync.user = null;
    cloudSync.channel = null;
    cloudSync.stateVersion = Number(readSyncMeta().stateVersion) || 0;
    ensureCloudClient();
    setCloudStatus("offline", "Configuracao salva. Entre na conta para sincronizar.");
    showToast("Configuracao da nuvem salva neste dispositivo.");
  }

  async function handleCloudLogin(event) {
    event.preventDefault();
    if (!ensureCloudClient()) {
      renderCloudSyncStatus();
      showToast("Preencha a configuracao do Supabase antes de entrar.");
      return;
    }

    const email = els.cloudSyncEmail?.value.trim();
    const password = els.cloudSyncPassword?.value;
    if (!email || !password) {
      showToast("Informe e-mail e senha.");
      return;
    }

    setCloudStatus("syncing", "Entrando na nuvem...");
    const { data, error } = await cloudSync.client.auth.signInWithPassword({ email, password });

    if (error) {
      setCloudStatus("error", error.message);
      showToast(`Erro ao entrar: ${error.message}`);
      return;
    }

    if (data.user) {
      await connectCloudUser(data.user);
    }
    showToast("Conta conectada.");
  }

  async function handleCloudSignup() {
    if (!ensureCloudClient()) {
      renderCloudSyncStatus();
      showToast("Preencha a configuracao do Supabase antes de criar conta.");
      return;
    }

    const email = els.cloudSyncEmail?.value.trim();
    const password = els.cloudSyncPassword?.value;
    if (!email || !password) {
      showToast("Informe e-mail e senha.");
      return;
    }

    const signupCredentials = { email, password };
    const emailRedirectTo = getCloudAuthRedirectUrl();
    if (emailRedirectTo) {
      signupCredentials.options = { emailRedirectTo };
    }

    setCloudStatus("syncing", "Criando conta...");
    const { data, error } = await cloudSync.client.auth.signUp(signupCredentials);

    if (error) {
      setCloudStatus("error", error.message);
      showToast(`Erro ao criar conta: ${error.message}`);
      return;
    }

    if (data.session?.user) {
      await connectCloudUser(data.session.user);
      showToast("Conta criada e conectada.");
      return;
    }

    setCloudStatus("offline", "Conta criada. Confirme o e-mail e depois entre.");
    showToast("Conta criada. O link de confirmacao deve abrir o Códice Web.");
  }

  async function handleCloudLogout() {
    if (!cloudSync.client) {
      disconnectCloudUser();
      return;
    }

    const { error } = await cloudSync.client.auth.signOut();
    if (error) {
      setCloudStatus("error", error.message);
      showToast(`Erro ao sair: ${error.message}`);
      return;
    }

    disconnectCloudUser();
    showToast("Conta desconectada deste dispositivo.");
  }

  function renderCloudSyncStatus() {
    renderCloudConfigAdmin();

    const labels = {
      online: "Nuvem on",
      syncing: "Sincronizando",
      error: "Erro nuvem",
      offline: cloudSync.configured ? "Entrar" : "Nuvem off",
    };
    const status = cloudSync.status || "offline";
    const label = labels[status] || labels.offline;
    if (els.cloudSyncLabel) {
      els.cloudSyncLabel.textContent = label;
    }
    if (els.cloudSyncStatus) {
      els.cloudSyncStatus.className = `cloud-sync-status ${status}`;
    }
    if (els.cloudSyncButton) {
      const chipClass = status === "online" ? "ok" : status === "syncing" ? "warning" : status === "error" ? "error" : "";
      els.cloudSyncButton.className = `cloud-sync-button hud-status-chip ${status} ${chipClass}`.trim();
      els.cloudSyncButton.title = cloudSync.message || "Sincronizacao em nuvem";
      els.cloudSyncButton.setAttribute("aria-label", els.cloudSyncButton.title);
    }
    if (els.systemCloudState) {
      els.systemCloudState.textContent = label;
      els.systemCloudState.className = `system-pill ${status}`;
    }

    if (els.cloudSyncDetail) {
      els.cloudSyncDetail.textContent = cloudSync.message || "Entre na mesma conta no desktop e no celular para compartilhar os dados.";
    }
    if (els.cloudSyncLogout) {
      els.cloudSyncLogout.hidden = !cloudSync.user;
    }
  }

  function renderHudBackupStatus(meta = readBackupMeta()) {
    if (!els.hudBackupStatus) {
      return;
    }

    let statusClass = "warning";
    let label = "Backup pendente";
    let title = "Backup automatico ainda nao rodou.";

    if (autoBackupRunning) {
      statusClass = "warning";
      label = "Backup...";
      title = "Backup em andamento.";
    } else if (!backupSettings.enabled) {
      statusClass = "warning";
      label = "Backup off";
      title = "Backup automatico desativado.";
    } else if (meta.lastStatus === "error") {
      statusClass = "error";
      label = "Backup erro";
      title = meta.lastMessage || "Falha no ultimo backup.";
    } else if (meta.lastBackupAt) {
      statusClass = "ok";
      label = "Backup ok";
      title = `Ultimo backup: ${formatDateTime(meta.lastBackupAt)}. Proximo: ${backupWeekdayLabel(backupSettings.dayOfWeek)}.`;
    } else {
      title = `Backup ativo. Proximo: ${backupWeekdayLabel(backupSettings.dayOfWeek)}.`;
    }

    els.hudBackupStatus.className = `hud-status-chip hud-status-desktop ${statusClass}`;
    els.hudBackupStatus.title = title;
    els.hudBackupStatus.setAttribute("aria-label", title);
    const labelElement = els.hudBackupStatus.querySelector("span:last-child");
    if (labelElement) {
      labelElement.textContent = label;
    }
  }

  function renderHudVersionStatus(info = systemUpdateInfo) {
    if (!els.hudVersionStatus || !els.hudVersionLabel) {
      return;
    }

    const versionApi = window.VidaLocalVersion;
    const current = versionApi?.current || window.VIDA_LOCAL_CONFIG?.currentVersion || "0.1.0";
    const statusClass = info?.updateAvailable ? "warning" : "ok";
    const title = info?.updateAvailable
      ? `Nova versao disponivel: ${info.latestVersion || "nao informada"}.`
      : `Versao atual: ${current}.`;
    els.hudVersionLabel.textContent = `v${current}`;
    els.hudVersionStatus.className = `hud-status-chip hud-status-desktop ${statusClass}`;
    els.hudVersionStatus.title = title;
    els.hudVersionStatus.setAttribute("aria-label", title);
  }

  function renderSystemUpdateStatus(info = systemUpdateInfo) {
    const versionApi = window.VidaLocalVersion;
    if (els.systemUpdateCurrent) {
      els.systemUpdateCurrent.textContent = versionApi?.current || window.VIDA_LOCAL_CONFIG?.currentVersion || "0.1.0";
    }
    if (els.systemUpdateRuntime) {
      els.systemUpdateRuntime.textContent = versionApi?.runtimeLabel?.() || "Web";
    }
    if (els.systemUpdateLatest) {
      els.systemUpdateLatest.textContent = info?.latestVersion || "Nao verificada";
    }
    if (els.systemUpdateStatus) {
      if (!info) {
        els.systemUpdateStatus.textContent = "A verificacao automatica continua ativa. Use este painel quando quiser consultar manualmente.";
      } else if (!info.checked) {
        els.systemUpdateStatus.textContent = info.notes || "Nao foi possivel verificar atualizacoes.";
      } else if (info.updateAvailable) {
        els.systemUpdateStatus.textContent = info.runtime === "web"
          ? "Existe versao nova na web. O app vai limpar cache e recarregar quando voce atualizar."
          : "Existe versao nova disponivel para esta plataforma.";
      } else {
        els.systemUpdateStatus.textContent = "Esta plataforma esta na versao mais recente.";
      }
    }
    if (els.systemUpdateNotes) {
      els.systemUpdateNotes.textContent = info?.notes || "";
      els.systemUpdateNotes.hidden = !info?.notes;
    }
    if (els.systemUpdateAction) {
      els.systemUpdateAction.disabled = false;
      els.systemUpdateAction.textContent = info?.updateAvailable ? "Atualizar agora" : "Verificar atualizacao";
    }
    renderHudVersionStatus(info);
  }

  async function handleSystemUpdateAction() {
    const versionApi = window.VidaLocalVersion;
    if (!versionApi?.getLatestUpdateInfo) {
      showToast("Atualizador indisponivel nesta versao.");
      return;
    }

    if (systemUpdateInfo?.updateAvailable && versionApi.checkForUpdates) {
      els.systemUpdateAction.disabled = true;
      els.systemUpdateAction.textContent = "Atualizando...";
      try {
        await versionApi.checkForUpdates();
        if (systemUpdateInfo.runtime !== "web") {
          showToast("Atualizacao iniciada. Acompanhe o status no app.");
        }
      } catch (error) {
        showToast(`Falha ao iniciar atualizacao: ${error.message || error}`);
      } finally {
        renderSystemUpdateStatus(systemUpdateInfo);
      }
      return;
    }

    els.systemUpdateAction.disabled = true;
    els.systemUpdateAction.textContent = "Verificando...";
    if (els.systemUpdateStatus) {
      els.systemUpdateStatus.textContent = "Consultando a ultima versao publicada...";
    }

    try {
      systemUpdateInfo = await versionApi.getLatestUpdateInfo();
      renderSystemUpdateStatus(systemUpdateInfo);
      showToast(systemUpdateInfo.updateAvailable ? "Nova versao encontrada." : "Nenhuma atualizacao pendente.");
    } catch (error) {
      systemUpdateInfo = {
        checked: false,
        latestVersion: "",
        updateAvailable: false,
        runtime: versionApi.runtime?.() || "web",
        runtimeLabel: versionApi.runtimeLabel?.() || "Web",
        notes: error.message || String(error),
      };
      renderSystemUpdateStatus(systemUpdateInfo);
      showToast("Falha ao verificar atualizacao.");
    }
  }

  function renderCloudConfigAdmin() {
    if (!els.cloudSyncConfigAdmin) {
      return;
    }

    const isAdmin = canEditCloudConfig();
    els.cloudSyncConfigAdmin.hidden = !isAdmin;
    if (els.cloudSyncUrl) {
      els.cloudSyncUrl.disabled = !isAdmin;
    }
    if (els.cloudSyncAnonKey) {
      els.cloudSyncAnonKey.disabled = !isAdmin;
    }
    if (els.saveCloudSyncConfig) {
      els.saveCloudSyncConfig.disabled = !isAdmin;
    }
  }

  function renderBackupSettings() {
    if (!els.backupEnabled || !els.backupDay || !els.backupStatus) {
      return;
    }

    const meta = readBackupMeta();
    els.backupEnabled.value = String(backupSettings.enabled);
    els.backupDay.value = String(backupSettings.dayOfWeek);
    if (els.backupRunNow) {
      els.backupRunNow.disabled = autoBackupRunning;
    }

    const modeLabel = supportsCloudBackup()
      ? "Base protegida no Supabase"
      : supportsDesktopBackup()
        ? `Fallback em ${meta.backupDir || "User Data/backups"}`
        : "Fallback local neste dispositivo";
    const lastLabel = meta.lastBackupAt
      ? `Ultimo: ${formatDateTime(meta.lastBackupAt)}`
      : "Ultimo: nenhum";
    const scheduleLabel = backupSettings.enabled
      ? `Dia: ${backupWeekdayLabel(backupSettings.dayOfWeek)}`
      : "Backup desativado";
    els.backupStatus.textContent = `${scheduleLabel}. ${lastLabel}. Mantem 2 backups da base. ${modeLabel}.`;
    renderHudBackupStatus(meta);
  }

  function handleBackupSettingsChange() {
    backupSettings = normalizeBackupSettings({
      enabled: els.backupEnabled?.value !== "false",
      dayOfWeek: Number(els.backupDay?.value),
    });
    saveState({ backup: false });
    renderBackupSettings();
    maybeRunAutoBackup();
    showToast("Backup automatico atualizado.");
  }

  async function handleManualBackup() {
    saveState({ backup: false });
    await runAutoBackup({ manual: true, scheduledDate: todayDate() });
  }

  function setCloudStatus(status, message) {
    cloudSync.status = status;
    cloudSync.message = message;
    renderCloudSyncStatus();
  }

  function readBackupMeta() {
    try {
      return JSON.parse(localStorage.getItem(BACKUP_META_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeBackupMeta(meta) {
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));
  }

  function maybeRunAutoBackup() {
    if (!backupSettings.enabled || autoBackupRunning) {
      return;
    }

    const scheduledDate = lastScheduledBackupDate(new Date(), backupSettings.dayOfWeek);
    const meta = readBackupMeta();
    if (meta.lastScheduledDate === scheduledDate) {
      return;
    }

    runAutoBackup({ scheduledDate }).catch((error) => {
      updateBackupStatus("error", error.message || String(error));
    });
  }

  async function runAutoBackup({ manual = false, scheduledDate = todayDate() } = {}) {
    if (autoBackupRunning) {
      return;
    }

    autoBackupRunning = true;
    renderBackupSettings();
    updateBackupStatus("running", "Criando backup...");

    try {
      const createdAt = new Date().toISOString();
      const fileName = `jornada-backup-${createdAt.replace(/[:.]/g, "-")}.json`;
      const contents = JSON.stringify(state, null, 2);
      let result = null;
      let mode = "local";

      if (supportsCloudBackup()) {
        result = await createCloudBackup({
          createdAt,
          scheduledDate,
          source: manual ? "manual" : "scheduled",
        });
        mode = "cloud";
      } else if (supportsDesktopBackup()) {
        result = await window.JornadaDesktop.createBackup({
          fileName,
          contents,
          keepCount: AUTO_BACKUP_KEEP_COUNT,
        });
        mode = "desktop";
      } else {
        result = writeLocalRollingBackup({ fileName, contents, createdAt });
      }

      writeBackupMeta({
        lastBackupAt: createdAt,
        lastScheduledDate: manual ? readBackupMeta().lastScheduledDate || "" : scheduledDate,
        lastFileName: fileName,
        mode,
        backupDir: result?.backupDir || "",
        path: result?.path || "",
      });
      updateBackupStatus("ok", manual ? "Backup criado agora." : "Backup automatico criado.");
      showToast(manual ? "Backup criado." : "Backup automatico criado.");
    } catch (error) {
      updateBackupStatus("error", error.message || String(error));
      showToast("Falha ao criar backup.");
    } finally {
      autoBackupRunning = false;
      renderBackupSettings();
    }
  }

  async function createCloudBackup({ createdAt, scheduledDate, source }) {
    const syncResult = await writeCloudStateSnapshot(Date.now(), createdAt);
    cloudSync.stateVersion = syncResult.stateVersion;
    writeSyncMeta({
      userId: cloudSync.user.id,
      stateVersion: syncResult.stateVersion,
      updatedAt: syncResult.updatedAt,
    });

    const backupTable = getSupabaseConfig().backupTable;
    const { error } = await cloudSync.client.from(backupTable).upsert(
      {
        user_id: cloudSync.user.id,
        backup_date: scheduledDate,
        state,
        state_version: syncResult.stateVersion,
        source,
        created_at: createdAt,
      },
      { onConflict: "user_id,backup_date" },
    );

    if (error) {
      throw error;
    }

    const { error: pruneError } = await cloudSync.client.rpc("prune_user_app_state_backups", {
      p_keep_count: AUTO_BACKUP_KEEP_COUNT,
    });

    if (pruneError) {
      throw pruneError;
    }

    return {
      ok: true,
      backupDir: backupTable,
      path: `${backupTable}:${scheduledDate}`,
    };
  }

  function writeLocalRollingBackup(entry) {
    const backups = BACKUP_SLOT_KEYS
      .map((key) => {
        try {
          return JSON.parse(localStorage.getItem(key) || "null");
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    backups.push(entry);
    backups
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, AUTO_BACKUP_KEEP_COUNT)
      .forEach((backup, index) => {
        localStorage.setItem(BACKUP_SLOT_KEYS[index], JSON.stringify(backup));
      });

    BACKUP_SLOT_KEYS.slice(AUTO_BACKUP_KEEP_COUNT).forEach((key) => localStorage.removeItem(key));
    return { ok: true, backupDir: "localStorage", path: entry.fileName };
  }

  function updateBackupStatus(status, message) {
    const meta = readBackupMeta();
    writeBackupMeta({
      ...meta,
      lastStatus: status,
      lastMessage: message,
      lastStatusAt: new Date().toISOString(),
    });
    renderBackupSettings();
  }

  function supportsDesktopBackup() {
    return Boolean(window.JornadaDesktop?.createBackup);
  }

  function supportsCloudBackup() {
    return Boolean(cloudSync.client && cloudSync.user);
  }

  function readSyncMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeSyncMeta(meta) {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  }

  function readCloudConfig() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeCloudConfig(config) {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  }

  function saveState(options = {}) {
    state.settings = {
      ...(state.settings || {}),
      selectedMonth,
      transactionMonthFilter,
      activeRegisterPage,
      mobileNavOrder,
      backup: backupSettings,
      theme,
      activeCreativeItemId,
      activeCreativeType,
      cdiAnnualRate: getCdiAnnualRate(),
      workoutStatusFilter: filters.workoutStatus,
      shoppingStatusFilter: filters.shoppingStatus,
      pantrySearch: filters.pantrySearch,
      pantryCategoryFilter: filters.pantryCategory,
      pantryLocationFilter: filters.pantryLocation,
      pantryStatusFilter: filters.pantryStatus,
      pantryModeFilter: filters.pantryMode,
      recipeCategoryFilter: filters.recipeCategory,
      recipeStatusFilter: filters.recipeStatus,
      recipeSection: filters.recipeSection,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (options.sync !== false) {
      scheduleCloudSync();
    }
    if (options.backup !== false) {
      maybeRunAutoBackup();
    }
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return normalizeImportedState(JSON.parse(saved));
      } catch (error) {
        return makeInitialState();
      }
    }
    const initialState = makeInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  function normalizeImportedState(candidate) {
    if (
      !candidate ||
      !Array.isArray(candidate.categories) ||
      !Array.isArray(candidate.accounts) ||
      !Array.isArray(candidate.transactions) ||
      !Array.isArray(candidate.budgets)
    ) {
      throw new Error("Invalid finance state");
    }
    const normalizedWorkouts = normalizeWorkouts(candidate.workouts || candidate.trainings || []);
    const normalizedCustomHomeWidgets = normalizeCustomHomeWidgets(candidate.customHomeWidgets || candidate.custom_home_widgets || []);
    const normalizedMediaLibrary = normalizeMediaLibrary(candidate.mediaLibrary || candidate.media_library || {});
    const normalized = {
      version: 1,
      categories: normalizeCategories(candidate.categories),
      accounts: normalizeAccounts(candidate.accounts),
      transactions: normalizeTransactions(candidate.transactions),
      budgets: candidate.budgets,
      workouts: normalizedWorkouts,
      workoutCompletions: normalizeWorkoutCompletions(candidate.workoutCompletions || candidate.workout_completions || [], normalizedWorkouts),
      nutritionProfile: normalizeNutritionProfile(candidate.nutritionProfile || candidate.nutrition_profile),
      nutritionLogs: normalizeNutritionLogs(candidate.nutritionLogs || candidate.nutrition_logs || []),
      savedMealIdeas: normalizeSavedMealIdeas(candidate.savedMealIdeas || candidate.saved_meal_ideas || []),
      study: normalizeStudyState(candidate.study || candidate.studies || candidate.studyBoard || candidate.study_board || {}),
      pantryItems: normalizePantryItems(candidate.pantryItems || candidate.pantry_items || candidate.stockItems || candidate.stock_items || []),
      shoppingItems: normalizeShoppingItems(candidate.shoppingItems || candidate.shopping_items || []),
      creativeItems: normalizeCreativeItems(candidate.creativeItems || candidate.creative_items || candidate.creativeBoard || candidate.creative_board || []),
      recipeCategories: normalizeRecipeCategories(candidate.recipeCategories || candidate.recipe_categories || []),
      recipeStatuses: normalizeRecipeStatuses(candidate.recipeStatuses || candidate.recipe_statuses || []),
      recipes: normalizeRecipes(candidate.recipes || candidate.recipeLibrary || candidate.recipe_library || []),
      mediaLibrary: normalizedMediaLibrary,
      homeInboxItems: normalizeHomeInboxItems(candidate.homeInboxItems || candidate.home_inbox_items || candidate.quickInbox || candidate.quick_inbox || []),
      customHomeWidgets: normalizedCustomHomeWidgets,
      homeLayout: normalizeHomeLayout(candidate.homeLayout || candidate.home_layout, normalizedCustomHomeWidgets),
      pageBuilders: normalizePageBuilders(candidate.pageBuilders || candidate.page_builders || []),
      monthPlans: normalizeMonthPlans(candidate.monthPlans),
      usageTypes: normalizeUsageTypes(candidate.usageTypes),
      settings: candidate.settings || {},
    };
    ensureDefaultCategories(normalized);
    return normalized;
  }

  function normalizeCategories(categories) {
    return categories.map((category) => ({
      ...category,
      type: category.type || "expense",
      usageId: category.usageId || "",
      emoji: category.emoji || "🏷️",
      color: category.color || "#64748b",
    }));
  }

  function normalizeAccounts(accounts) {
    return accounts.map((account) => {
      const kind = account.kind || "checking";
      return {
        ...account,
        kind,
        openingBalance: Number(account.openingBalance) || 0,
        creditLimit: Number(account.creditLimit) || 0,
        cdiPercent: ["savings", "investment"].includes(kind)
          ? Math.max(0, roundMoney(Number.isFinite(Number(account.cdiPercent)) ? Number(account.cdiPercent) : DEFAULT_SAVINGS_CDI_PERCENT))
          : 0,
        separateBalanceAmount: ["checking", "cash"].includes(kind)
          ? Math.max(0, roundMoney(Number(account.separateBalanceAmount) || 0))
          : 0,
        color: account.color || defaultAccountColor(kind),
      };
    });
  }

  function normalizeTransactions(transactions) {
    return transactions.map((transaction) => ({
      ...transaction,
      type: transaction.type || "expense",
      targetAccountId: transaction.targetAccountId || "",
      accountBalanceScope: normalizeBalanceScope(transaction.accountBalanceScope),
      targetBalanceScope: normalizeBalanceScope(transaction.targetBalanceScope),
      status: transaction.status || "cleared",
      notes: transaction.notes || "",
    }));
  }

  function normalizeMonthPlans(monthPlans) {
    if (!Array.isArray(monthPlans)) {
      return [];
    }

    return monthPlans.map((plan) => {
      const normalized = {
        ...plan,
        salary: Number(plan.salary) || 0,
        employmentType: normalizeEmploymentType(plan.employmentType),
        salaryEntries: Array.isArray(plan.salaryEntries)
          ? plan.salaryEntries.map((entry, index) => normalizeSalaryEntry(entry, index === 0 ? "Salário principal" : `Renda ${index + 1}`))
          : [],
        salaryEntriesManuallyCleared: Boolean(plan.salaryEntriesManuallyCleared),
        benefits: Number(plan.benefits) || 0,
        benefitItems: normalizeBenefitItems(plan.benefitItems, plan, { includeDefaults: false }),
        benefitMealDaily: Number.isFinite(Number(plan.benefitMealDaily))
          ? Math.max(0, roundMoney(Number(plan.benefitMealDaily)))
          : DEFAULT_BENEFITS.mealDaily,
        benefitTransportDaily: Number.isFinite(Number(plan.benefitTransportDaily))
          ? Math.max(0, roundMoney(Number(plan.benefitTransportDaily)))
          : DEFAULT_BENEFITS.transportDaily,
        salaryDependents: Math.max(0, Math.floor(Number(plan.salaryDependents) || 0)),
        salaryAdvance: Math.max(0, roundMoney(Number(plan.salaryAdvance) || 0)),
        salaryOtherDiscounts: Math.max(0, roundMoney(Number(plan.salaryOtherDiscounts) || 0)),
        hasTransportVoucher: plan.hasTransportVoucher !== false,
        pjTaxRate: Number.isFinite(Number(plan.pjTaxRate)) ? clampPercent(Number(plan.pjTaxRate), 6) : 6,
        pjOtherCosts: Math.max(0, roundMoney(Number(plan.pjOtherCosts) || 0)),
        autonomousInssRate: Number.isFinite(Number(plan.autonomousInssRate)) ? clampPercent(Number(plan.autonomousInssRate), 20) : 20,
        autonomousInssBase: Math.max(0, roundMoney(Number(plan.autonomousInssBase) || 0)),
        autonomousBookCash: Math.max(0, roundMoney(Number(plan.autonomousBookCash) || 0)),
        fixedBills: Array.isArray(plan.fixedBills)
          ? plan.fixedBills.map((bill) => ({
              ...bill,
              name: bill.name || "Conta fixa",
              categoryId: bill.categoryId || "",
              amount: Number(bill.amount) || 0,
            }))
          : [],
        fixedBillsManuallyCleared: Boolean(plan.fixedBillsManuallyCleared),
      };

      if (!normalized.salaryEntries.length && !normalized.salaryEntriesManuallyCleared && hasLegacySalaryPlan(plan)) {
        normalized.salaryEntries = [legacySalaryEntryFromPlan(plan)];
      }
      syncPrimarySalaryFields(normalized);
      return normalized;
    });
  }

  function normalizeUsageTypes(usageTypes) {
    if (!Array.isArray(usageTypes) || !usageTypes.length) {
      return defaultUsageTypes();
    }

    return usageTypes.map((usage) => ({
      ...usage,
      name: usage.name || "Grupo",
      monthlyPlan: Number(usage.monthlyPlan) || 0,
    }));
  }



  function normalizeWorkouts(workouts) {
    if (!Array.isArray(workouts)) {
      return [];
    }

    return workouts
      .filter((workout) => workout && (workout.title || workout.name))
      .map((workout) => {
        const legacyTarget = Math.min(7, Math.max(1, Math.round(Number(workout.weeklyTarget ?? workout.weekly_target ?? workout.target) || DEFAULT_WORKOUT_WEEKDAYS.length)));
        return {
          id: workout.id || createId("workout"),
          title: workout.title || workout.name || "Treino",
          type: normalizeWorkoutType(workout.type || workout.category),
          weekdays: normalizeWorkoutWeekdays(workout.weekdays || workout.days || workout.week_days, legacyTarget),
          restTimes: normalizeWorkoutRestTimes(workout.restTimes || workout.rest_times || workout.rest || {}),
          reward: Math.max(1, Math.round(Number(workout.reward ?? workout.coins ?? workout.xp) || DEFAULT_WORKOUT_REWARD)),
          status: normalizeWorkoutStatus(workout.status),
          notes: workout.notes || workout.details || "",
          exercises: normalizeWorkoutExercises(workout.exercises || workout.exerciseRows || workout.exercise_rows, workout.notes || workout.details || ""),
          dayOrder: normalizeWorkoutDayOrder(workout.dayOrder || workout.day_order || workout.order || {}),
          createdAt: workout.createdAt || workout.created_at || new Date().toISOString(),
          updatedAt: workout.updatedAt || workout.updated_at || new Date().toISOString(),
        };
      });
  }

  function normalizeWorkoutCompletions(completions, workouts) {
    if (!Array.isArray(completions)) {
      return [];
    }

    const workoutById = new Map(workouts.map((workout) => [workout.id, workout]));
    return completions
      .filter((completion) => completion && workoutById.has(completion.workoutId || completion.workout_id))
      .map((completion) => {
        const workout = workoutById.get(completion.workoutId || completion.workout_id);
        const date = normalizeQuestDueDate(completion.date || String(completion.completedAt || completion.completed_at || "").slice(0, 10)) || todayDate();
        return {
          id: completion.id || createId("workoutdone"),
          workoutId: workout.id,
          workoutName: completion.workoutName || completion.workout_name || workout.title,
          type: normalizeWorkoutType(completion.type || workout.type),
          reward: Math.max(1, Math.round(Number(completion.reward ?? completion.coins) || getWorkoutReward(workout))),
          completedAt: completion.completedAt || completion.completed_at || `${date}T12:00:00.000Z`,
          date,
          weekStart: completion.weekStart || completion.week_start || startOfWeek(date),
        };
      });
  }

  function normalizeNutritionProfile(profile = {}) {
    const nextProfile = profile && typeof profile === "object" ? profile : {};
    return {
      weightKg: parseNutritionNumber(nextProfile.weightKg ?? nextProfile.weight_kg, DEFAULT_NUTRITION_PROFILE.weightKg, 30, 250, 1),
      heightCm: parseNutritionNumber(nextProfile.heightCm ?? nextProfile.height_cm, DEFAULT_NUTRITION_PROFILE.heightCm, 120, 230, 0),
      age: parseNutritionNumber(nextProfile.age, DEFAULT_NUTRITION_PROFILE.age, 14, 100, 0),
      sex: nextProfile.sex === "female" ? "female" : "male",
      activityFactor: parseNutritionNumber(nextProfile.activityFactor ?? nextProfile.activity_factor, DEFAULT_NUTRITION_PROFILE.activityFactor, 1, 2.2, 3),
      goal: ["cut", "maintain", "gain"].includes(nextProfile.goal) ? nextProfile.goal : DEFAULT_NUTRITION_PROFILE.goal,
      proteinFactor: parseNutritionNumber(nextProfile.proteinFactor ?? nextProfile.protein_factor, DEFAULT_NUTRITION_PROFILE.proteinFactor, 0.8, 2.4, 1),
      waterMlKg: parseNutritionNumber(nextProfile.waterMlKg ?? nextProfile.water_ml_kg, DEFAULT_NUTRITION_PROFILE.waterMlKg, 20, 55, 0),
    };
  }

  function normalizeNutritionLogs(logs) {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .map((log) => {
        const date = normalizeQuestDueDate(log?.date || String(log?.createdAt || log?.created_at || "").slice(0, 10));
        if (!date) {
          return null;
        }
        const plateItems = normalizePlateItems(log.plateItems || log.plate_items || []);
        const plateMeals = normalizePlateMeals(log.plateMeals || log.plate_meals || [], plateItems);
        const activeMealId = plateMeals.some((meal) => meal.id === (log.activeMealId || log.active_meal_id))
          ? log.activeMealId || log.active_meal_id
          : plateMeals[0]?.id || "";
        return {
          id: log.id || createId("nutrition"),
          date,
          calories: parseNutritionNumber(log.calories, 0, 0, 20000, 0),
          protein: parseNutritionNumber(log.protein, 0, 0, 700, 0),
          water: parseNutritionNumber(log.water ?? log.waterLiters ?? log.water_liters, 0, 0, 20, 1),
          breakfast: log.breakfast || "",
          lunch: log.lunch || "",
          dinner: log.dinner || "",
          snacks: log.snacks || "",
          vegetables: parseNutritionNumber(log.vegetables, 0, 0, 20, 1),
          fruits: parseNutritionNumber(log.fruits, 0, 0, 20, 1),
          wholeGrains: parseNutritionNumber(log.wholeGrains ?? log.whole_grains, 0, 0, 20, 1),
          dairy: parseNutritionNumber(log.dairy, 0, 0, 12, 1),
          leanProtein: parseNutritionNumber(log.leanProtein ?? log.lean_protein, 0, 0, 12, 1),
          nutsLegumes: parseNutritionNumber(log.nutsLegumes ?? log.nuts_legumes, 0, 0, 12, 1),
          fiber: parseNutritionNumber(log.fiber, 0, 0, 120, 0),
          sodium: parseNutritionNumber(log.sodium, 0, 0, 12000, 0),
          addedSugar: parseNutritionNumber(log.addedSugar ?? log.added_sugar, 0, 0, 400, 0),
          saturatedFat: parseNutritionNumber(log.saturatedFat ?? log.saturated_fat, 0, 0, 250, 0),
          notes: log.notes || "",
          plateItems: [],
          plateMeals,
          activeMealId,
          createdAt: log.createdAt || log.created_at || `${date}T12:00:00.000Z`,
          updatedAt: log.updatedAt || log.updated_at || log.createdAt || log.created_at || `${date}T12:00:00.000Z`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }


  function defaultStudyState() {
    const schedule = {};
    WORKOUT_WEEKDAYS.forEach((day) => {
      schedule[day.key] = [];
    });
    return {
      schedule,
      linkCategories: normalizeStudyCategories([], DEFAULT_STUDY_LINK_CATEGORIES),
      todoCategories: normalizeStudyCategories([], DEFAULT_STUDY_TODO_CATEGORIES),
      resourceCategories: normalizeStudyCategories([], DEFAULT_STUDY_RESOURCE_CATEGORIES),
      links: [],
      todos: [],
      calendarNotes: [],
      resources: [],
      calendarMonth: currentMonth(),
      selectedDate: todayDate(),
      pomodoro: {
        mode: "pomodoro",
        pomodoroMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 20,
        completedPomodoros: 0,
        remainingSeconds: 25 * 60,
        running: false,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  function normalizeStudyState(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const defaults = defaultStudyState();
    const scheduleSource = source.schedule || source.week || {};
    const schedule = {};
    WORKOUT_WEEKDAYS.forEach((day) => {
      schedule[day.key] = normalizeStudyScheduleItems(scheduleSource[day.key] || scheduleSource[day.longLabel] || []);
    });
    const selectedDate = isDateKey(source.selectedDate || source.selected_date) ? source.selectedDate || source.selected_date : todayDate();
    const calendarMonth = isMonthKey(source.calendarMonth || source.calendar_month) ? source.calendarMonth || source.calendar_month : selectedDate.slice(0, 7);
    const legacyCategories = source.categories && typeof source.categories === "object" ? source.categories : {};
    const linkCategories = normalizeStudyCategories(source.linkCategories || source.link_categories || legacyCategories.links || legacyCategories.link, DEFAULT_STUDY_LINK_CATEGORIES);
    const todoCategories = normalizeStudyCategories(source.todoCategories || source.todo_categories || legacyCategories.todos || legacyCategories.todo, DEFAULT_STUDY_TODO_CATEGORIES);
    const resourceCategories = normalizeStudyCategories(source.resourceCategories || source.resource_categories || legacyCategories.resources || legacyCategories.resource, DEFAULT_STUDY_RESOURCE_CATEGORIES);

    return {
      schedule,
      linkCategories,
      todoCategories,
      resourceCategories,
      links: normalizeStudyLinks(source.links || source.linkItems || source.link_items || [], linkCategories),
      todos: normalizeStudyTodos(source.todos || source.tasks || [], todoCategories),
      calendarNotes: normalizeStudyCalendarNotes(source.calendarNotes || source.calendar_notes || source.notes || []),
      resources: normalizeStudyResources(source.resources || source.materials || source.modules || [], resourceCategories),
      calendarMonth,
      selectedDate,
      pomodoro: normalizeStudyPomodoro(source.pomodoro || defaults.pomodoro),
    };
  }

  function normalizeStudyCategories(items, defaults) {
    const source = Array.isArray(items) && items.length ? items : defaults;
    const usedIds = new Set();
    const normalized = source
      .filter((item) => item && (item.label || item.name || item.title || item.id))
      .map((item, index) => {
        const defaultItem = defaults[index] || defaults[0] || {};
        const candidateId = String(item.id || defaultItem.id || createId("studycat")).trim();
        const id = candidateId && !usedIds.has(candidateId) ? candidateId : createId("studycat");
        usedIds.add(id);
        return {
          id,
          label: String(item.label || item.name || item.title || defaultItem.label || "Categoria").slice(0, 60),
          accent: safeColor(item.accent || item.color || defaultItem.accent || "#64748b"),
        };
      });
    return normalized.length ? normalized : defaults.map((item) => ({ ...item }));
  }

  function normalizeStudyScheduleItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item) => item && (item.title || item.text || item.name))
      .map((item) => ({
        id: item.id || createId("studyday"),
        title: String(item.title || item.text || item.name || "Bloco de estudo").slice(0, 120),
        done: Boolean(item.done || item.completed || item.checked),
        details: String(item.details || item.note || item.notes || item.description || "").slice(0, 700),
        expanded: Boolean(item.expanded || item.open),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }));
  }

  function normalizeStudyLinks(items, categories = DEFAULT_STUDY_LINK_CATEGORIES) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item) => item && (item.title || item.name || item.url || item.link))
      .map((item) => ({
        id: item.id || createId("studylink"),
        title: String(item.title || item.name || item.url || item.link || "Link").slice(0, 90),
        url: normalizeShoppingUrl(item.url || item.link || item.href || ""),
        group: normalizeStudyLinkGroup(item.group || item.category || item.type, categories),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }))
      .filter((item) => item.url);
  }

  function normalizeStudyTodos(items, categories = DEFAULT_STUDY_TODO_CATEGORIES) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item) => item && (item.title || item.text || item.name))
      .map((item) => ({
        id: item.id || createId("studytodo"),
        title: String(item.title || item.text || item.name || "Tarefa").slice(0, 120),
        area: normalizeStudyTodoArea(item.area || item.category || item.type, categories),
        dueDate: isDateKey(item.dueDate || item.due_date || item.date) ? item.dueDate || item.due_date || item.date : "",
        done: Boolean(item.done || item.completed || item.checked),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }));
  }

  function normalizeStudyCalendarNotes(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item) => item && isDateKey(item.date || item.day) && (item.title || item.body || item.note))
      .map((item) => ({
        id: item.id || createId("studynote"),
        date: item.date || item.day,
        title: String(item.title || "Anotacao").slice(0, 100),
        body: String(item.body || item.note || item.text || "").slice(0, 700),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }));
  }

  function normalizeStudyResources(items, categories = DEFAULT_STUDY_RESOURCE_CATEGORIES) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items
      .filter((item) => item && (item.title || item.name))
      .map((item) => ({
        id: item.id || createId("studyres"),
        title: String(item.title || item.name || "Material").slice(0, 120),
        type: normalizeStudyResourceType(item.type || item.category || item.kind, categories),
        url: normalizeShoppingUrl(item.url || item.link || item.href || ""),
        notes: String(item.notes || item.note || item.description || "").slice(0, 500),
        status: normalizeStudyResourceStatus(item.status),
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(),
      }));
  }

  function normalizeStudyPomodoro(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const mode = normalizeStudyPomodoroMode(source.mode);
    const pomodoro = {
      mode,
      pomodoroMinutes: normalizeStudyDuration(source.pomodoroMinutes || source.pomodoro_minutes, 25, 1, 120),
      shortBreakMinutes: normalizeStudyDuration(source.shortBreakMinutes || source.short_break_minutes, 5, 1, 60),
      longBreakMinutes: normalizeStudyDuration(source.longBreakMinutes || source.long_break_minutes, 20, 1, 90),
      completedPomodoros: normalizeStudyPomodoroCount(source.completedPomodoros || source.completed_pomodoros || source.cycleCount || source.cycle_count),
      running: Boolean(source.running),
      updatedAt: source.updatedAt || source.updated_at || new Date().toISOString(),
    };
    const remainingSource = source.remainingSeconds ?? source.remaining_seconds;
    const remainingSeconds = Number.isFinite(Number(remainingSource)) ? Number(remainingSource) : studyPomodoroDurationSeconds(pomodoro, mode);
    pomodoro.remainingSeconds = clampNumber(Math.round(remainingSeconds), 0, 120 * 60);
    return pomodoro;
  }

  function normalizeShoppingItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .filter((item) => item)
      .map((item) => {
        const purchased = Boolean(item.purchased || item.done || item.checked);
        const createdAt = item.createdAt || item.created_at || new Date().toISOString();
        const updatedAt = item.updatedAt || item.updated_at || createdAt;
        return {
          id: item.id || createId("shopping"),
          name: String(item.name || item.title || item.description || "Item sem nome").slice(0, 100),
          quantity: String(item.quantity ?? item.qty ?? item.amountText ?? "1").slice(0, 40),
          category: normalizeShoppingCategory(item.category || item.group || item.type),
          url: normalizeShoppingUrl(item.url || item.storeUrl || item.store_url || item.link || item.linkUrl || ""),
          price: parseShoppingPrice(item.price ?? item.estimatedPrice ?? item.estimated_price ?? item.value),
          priority: Boolean(item.priority || item.important || item.favorite),
          purchased,
          purchasedAt: purchased ? item.purchasedAt || item.purchased_at || item.completedAt || item.completed_at || updatedAt : "",
          pantryItemId: item.pantryItemId || item.pantry_item_id || "",
          createdAt,
          updatedAt,
        };
      });
  }



  function normalizeCustomHomeWidgets(widgets) {
    if (!Array.isArray(widgets)) {
      return [];
    }

    const usedIds = new Set();
    return widgets.reduce((list, widget) => {
      if (!widget || !(widget.title || widget.name)) {
        return list;
      }

      const candidateId = String(widget.id || "");
      const id = candidateId && !HOME_WIDGET_DEFINITIONS[candidateId] && !usedIds.has(candidateId)
        ? candidateId
        : createId("homewidget");
      usedIds.add(id);

      list.push({
        id,
        title: String(widget.title || widget.name || "Quadro").slice(0, 80),
        note: String(widget.note || widget.text || widget.description || "").slice(0, 420),
        pageContent: String(widget.pageContent || widget.page_content || widget.content || widget.note || "").slice(0, 4000),
        color: sanitizeWidgetColor(widget.color),
        createdAt: widget.createdAt || widget.created_at || new Date().toISOString(),
        updatedAt: widget.updatedAt || widget.updated_at || new Date().toISOString(),
      });
      return list;
    }, []);
  }

  function normalizePageBuilders(builders) {
    if (!Array.isArray(builders)) {
      return [];
    }

    const usedPageIds = new Set();
    return builders.reduce((list, builder) => {
      const pageId = String(builder?.pageId || builder?.page_id || "").trim();
      if (!pageId || usedPageIds.has(pageId)) {
        return list;
      }

      usedPageIds.add(pageId);
      list.push({
        pageId,
        editMode: Boolean(builder.editMode || builder.edit_mode),
        blocks: normalizePageBlocks(builder.blocks || builder.items || []),
        layoutVersion: Math.round(Number(builder.layoutVersion || builder.layout_version) || 0),
        layoutItems: normalizePageLayoutItems(builder.layoutItems || builder.layout_items || []),
      });
      return list;
    }, []);
  }

  function normalizePageBlocks(blocks) {
    if (!Array.isArray(blocks)) {
      return [];
    }

    const usedIds = new Set();
    return blocks.reduce((list, block) => {
      if (!block || !(block.title || block.body || block.content)) {
        return list;
      }

      const candidateId = String(block.id || "");
      const id = candidateId && !usedIds.has(candidateId) ? candidateId : createId("pageblock");
      usedIds.add(id);
      const type = normalizePageBlockType(block.type);
      list.push({
        id,
        type,
        title: String(block.title || defaultPageBlockTitle(type)).slice(0, 90),
        body: String(block.body || block.content || block.text || "").slice(0, 3000),
        cols: clampNumber(block.cols || block.columns || 1, 1, PAGE_BLOCK_MAX_COLUMNS),
        rows: normalizePageBlockRows(block.rows),
        x: Number(block.x || block.gridX || block.column) >= 1 ? Math.round(Number(block.x || block.gridX || block.column)) : undefined,
        y: Number(block.y || block.gridY || block.row) >= 1 ? Math.round(Number(block.y || block.gridY || block.row)) : undefined,
        compactCols: Number(block.compactCols || block.compact_columns) >= 1 ? clampNumber(block.compactCols || block.compact_columns, 1, PAGE_BLOCK_MAX_COLUMNS) : undefined,
        compactRows: Number(block.compactRows || block.compact_rows) >= 1 ? normalizePageBlockRows(block.compactRows || block.compact_rows) : undefined,
        compactX: Number(block.compactX || block.compactGridX || block.compact_column) >= 1 ? Math.round(Number(block.compactX || block.compactGridX || block.compact_column)) : undefined,
        compactY: Number(block.compactY || block.compactGridY || block.compact_row) >= 1 ? Math.round(Number(block.compactY || block.compactGridY || block.compact_row)) : undefined,
        createdAt: block.createdAt || block.created_at || new Date().toISOString(),
        updatedAt: block.updatedAt || block.updated_at || new Date().toISOString(),
      });
      return list;
    }, []);
  }

  function normalizeHomeLayout(layout, customWidgets = []) {
    const customIds = new Set(customWidgets.map((widget) => widget.id));
    const availableIds = new Set([...HOME_DEFAULT_WIDGET_ORDER, ...customIds]);
    const widgets = [];
    const usedIds = new Set();
    const sourceWidgets = Array.isArray(layout?.widgets) ? layout.widgets : [];

    sourceWidgets.forEach((entry) => {
      const widgetId = typeof entry === "string" ? entry : entry?.id;
      if (!widgetId || !availableIds.has(widgetId) || usedIds.has(widgetId)) {
        return;
      }
      const size = normalizeHomeWidgetSize(entry?.size, defaultHomeWidgetSize(widgetId));
      const grid = homeWidgetGridFromLayout(entry, size);

      widgets.push({
        id: widgetId,
        size,
        cols: grid.cols,
        rows: grid.rows,
        x: Number(entry?.x || entry?.gridX || entry?.column) >= 1 ? Math.round(Number(entry?.x || entry?.gridX || entry?.column)) : undefined,
        y: Number(entry?.y || entry?.gridY || entry?.row) >= 1 ? Math.round(Number(entry?.y || entry?.gridY || entry?.row)) : undefined,
        hidden: Boolean(entry?.hidden),
      });
      usedIds.add(widgetId);
    });

    HOME_DEFAULT_WIDGET_ORDER.forEach((widgetId) => {
      if (!usedIds.has(widgetId)) {
        const size = defaultHomeWidgetSize(widgetId);
        const grid = homeWidgetGridFromSize(size);
        widgets.push({
          id: widgetId,
          size,
          cols: grid.cols,
          rows: grid.rows,
          x: undefined,
          y: undefined,
          hidden: false,
        });
        usedIds.add(widgetId);
      }
    });

    customWidgets.forEach((widget) => {
      if (!usedIds.has(widget.id)) {
        const grid = homeWidgetGridFromSize("medium");
        widgets.push({
          id: widget.id,
          size: "medium",
          cols: grid.cols,
          rows: grid.rows,
          x: undefined,
          y: undefined,
          hidden: false,
        });
        usedIds.add(widget.id);
      }
    });

    const normalizedLayout = {
      editMode: Boolean(layout?.editMode),
      widgets,
    };
    commitHomeWidgetPlacements(normalizedLayout, HOME_WIDGET_MAX_COLUMNS);
    return normalizedLayout;
  }

  function defaultHomeLayout(customWidgets = []) {
    return normalizeHomeLayout(
      {
        editMode: false,
        widgets: HOME_DEFAULT_WIDGET_ORDER.map((widgetId) => ({
          id: widgetId,
          size: defaultHomeWidgetSize(widgetId),
          ...homeWidgetGridFromSize(defaultHomeWidgetSize(widgetId)),
          hidden: false,
        })),
      },
      customWidgets,
    );
  }

  function defaultHomeWidgetSize(widgetId) {
    return HOME_WIDGET_DEFINITIONS[widgetId]?.defaultSize || "medium";
  }

  function normalizeHomeWidgetSize(size, fallback = "medium") {
    return Object.prototype.hasOwnProperty.call(HOME_WIDGET_SIZES, size) ? size : fallback;
  }

  function homeWidgetGridFromSize(size) {
    const normalizedSize = normalizeHomeWidgetSize(size, "medium");
    return { ...HOME_WIDGET_SIZE_CONFIG[normalizedSize] };
  }

  function homeWidgetGridFromLayout(widget, fallbackSize = "medium") {
    const fallback = homeWidgetGridFromSize(widget?.size || fallbackSize);
    return {
      cols: clampNumber(Math.round(Number(widget?.cols) || fallback.cols), HOME_WIDGET_MIN_COLUMNS, HOME_WIDGET_MAX_COLUMNS),
      rows: clampNumber(Math.round(Number(widget?.rows) || fallback.rows), HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS),
    };
  }

  function homeWidgetGridPlacement(widget, columns = HOME_WIDGET_MAX_COLUMNS) {
    const grid = homeWidgetGridFromLayout(widget, defaultHomeWidgetSize(widget?.id));
    const cols = clampNumber(grid.cols, HOME_WIDGET_MIN_COLUMNS, Math.max(HOME_WIDGET_MIN_COLUMNS, columns));
    const rows = clampNumber(grid.rows, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
    const rowSpan = homeWidgetGridRowSpan(rows);
    const maxX = Math.max(1, columns - cols + 1);
    return {
      cols,
      rows,
      rowSpan,
      height: freeGridItemHeight(rowSpan, HOME_WIDGET_GRID_ROW_HEIGHT, HOME_WIDGET_GRID_GAP),
      x: clampNumber(widget?.x || widget?.gridX || 1, 1, maxX),
      y: Math.max(1, Math.round(Number(widget?.y || widget?.gridY || 1) || 1)),
    };
  }

  function resolveHomeWidgetPlacements(layout, columns = HOME_WIDGET_MAX_COLUMNS, options = {}) {
    const visibleWidgets = (layout.widgets || []).filter((widget) => !widget.hidden);
    return resolveFreeGridPlacements(visibleWidgets, {
      columns,
      priorityId: options.priorityId,
      commit: Boolean(options.commit),
      commitMissing: Boolean(options.commitMissing),
      getId: (widget) => widget.id,
      getOrder: (widget) => (layout.widgets || []).indexOf(widget),
      getPlacement: (widget) => homeWidgetGridPlacement(widget, columns),
      getPosition: (widget) => ({ x: widget.x || widget.gridX, y: widget.y || widget.gridY }),
      setPosition: (widget, x, y) => {
        widget.x = x;
        widget.y = y;
      },
    });
  }

  function commitHomeWidgetPlacements(layout, columns = HOME_WIDGET_MAX_COLUMNS, priorityId = "") {
    return resolveHomeWidgetPlacements(layout, columns, { commit: true, commitMissing: true, priorityId });
  }

  function scheduleHomeWidgetContentFit() {
    window.cancelAnimationFrame(homeWidgetContentFitFrame);
    homeWidgetContentFitFrame = window.requestAnimationFrame(fitHomeWidgetContentRows);
  }

  function fitHomeWidgetContentRows() {
    if (homeResizeState || homePointerDragState || !els.homeWidgetGrid) {
      return;
    }

    const layout = ensureHomeLayout();
    if (layout.editMode) {
      return;
    }

    const columns = currentHomeWidgetMaxColumns();
    let changed = false;

    layout.widgets.forEach((widget) => {
      if (widget.hidden) {
        return;
      }

      const card = findHomeWidgetCard(widget.id);
      if (!card) {
        return;
      }

      const currentRows = clampNumber(widget.rows, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
      const neededRows = homeWidgetRowsForHeight(card.scrollHeight);
      if (neededRows > currentRows) {
        widget.rows = neededRows;
        widget.size = homeWidgetSizeFromGrid(widget.cols, widget.rows);
        changed = true;
      }
    });

    if (changed) {
      commitHomeWidgetPlacements(layout, columns);
      saveState();
      renderHomeWidgets();
    }
  }

  function homeWidgetSizeFromGrid(cols, rows) {
    const normalizedCols = clampNumber(cols, HOME_WIDGET_MIN_COLUMNS, HOME_WIDGET_MAX_COLUMNS);
    const normalizedRows = clampNumber(rows, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
    const matchingEntry = Object.entries(HOME_WIDGET_SIZE_CONFIG).find(([, config]) => config.cols === normalizedCols && config.rows === normalizedRows);
    if (matchingEntry) {
      return matchingEntry[0];
    }
    if (normalizedRows > 1 && normalizedCols > 1) {
      return "large";
    }
    if (normalizedRows > 1) {
      return "tall";
    }
    if (normalizedCols > 2) {
      return "wide";
    }
    return normalizedCols > 1 ? "medium" : "small";
  }

  function homeWidgetMinHeight(rows) {
    const normalizedRows = clampNumber(rows, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
    return freeGridItemHeight(homeWidgetGridRowSpan(normalizedRows), HOME_WIDGET_GRID_ROW_HEIGHT, HOME_WIDGET_GRID_GAP);
  }

  function homeWidgetGridRowSpan(rows) {
    const normalizedRows = clampNumber(rows, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
    return normalizedRows + 2;
  }

  function homeWidgetRowsForHeight(height) {
    const rowSpan = Math.ceil((Math.max(1, Number(height) || 1) + HOME_WIDGET_GRID_GAP) / (HOME_WIDGET_GRID_ROW_HEIGHT + HOME_WIDGET_GRID_GAP));
    return clampNumber(rowSpan - 2, HOME_WIDGET_MIN_ROWS, HOME_WIDGET_MAX_ROWS);
  }

  function currentHomeWidgetMaxColumns() {
    if (window.innerWidth <= 640) {
      return 1;
    }
    if (window.innerWidth <= 900) {
      return 2;
    }
    return HOME_WIDGET_MAX_COLUMNS;
  }

  function currentPageBlockMaxColumns() {
    if (window.innerWidth <= 640) {
      return 1;
    }
    if (window.innerWidth <= 900) {
      return 2;
    }
    return PAGE_BLOCK_MAX_COLUMNS;
  }

  function shouldPersistPageLayoutGrid(columns = currentPageBlockMaxColumns()) {
    return Math.max(1, Math.round(Number(columns) || 1)) >= 1;
  }

  function usesCompactPageGrid(columns = currentPageBlockMaxColumns()) {
    return Math.max(1, Math.round(Number(columns) || 1)) < PAGE_BLOCK_MAX_COLUMNS;
  }

  function assignResponsiveGridPosition(item, x, y, columns = currentPageBlockMaxColumns()) {
    if (usesCompactPageGrid(columns)) {
      item.compactX = x;
      item.compactY = y;
      return;
    }
    item.x = x;
    item.y = y;
  }

  function assignResponsiveGridSize(item, cols, rows, columns = currentPageBlockMaxColumns(), normalizeRows = normalizePageBlockRows) {
    if (usesCompactPageGrid(columns)) {
      item.compactCols = cols;
      item.compactRows = normalizeRows(rows);
      return;
    }
    item.cols = cols;
    item.rows = normalizeRows(rows);
  }

  function normalizePageBlockRows(rows) {
    return clampNumber(rows || PAGE_BLOCK_MIN_ROWS, PAGE_BLOCK_MIN_ROWS, PAGE_BLOCK_MAX_ROWS);
  }

  function pageBlockGridPlacement(block, columns = PAGE_BLOCK_MAX_COLUMNS) {
    const compact = usesCompactPageGrid(columns);
    const cols = clampNumber((compact ? block?.compactCols : block?.cols) || block?.cols || 1, 1, Math.max(1, columns));
    const rows = normalizePageBlockRows((compact ? block?.compactRows : block?.rows) || block?.rows);
    const rowSpan = pageBlockGridRowSpan(rows);
    const maxX = Math.max(1, columns - cols + 1);
    const x = compact ? block?.compactX || block?.compactGridX || block?.x || block?.gridX : block?.x || block?.gridX;
    const y = compact ? block?.compactY || block?.compactGridY || block?.y || block?.gridY : block?.y || block?.gridY;
    return {
      cols,
      rows,
      rowSpan,
      height: freeGridItemHeight(rowSpan, PAGE_BLOCK_GRID_ROW_HEIGHT, PAGE_BLOCK_GRID_GAP),
      x: clampNumber(x || 1, 1, maxX),
      y: Math.max(1, Math.round(Number(y || 1) || 1)),
    };
  }

  function resolvePageBlockPlacements(builder, columns = PAGE_BLOCK_MAX_COLUMNS, options = {}) {
    const compact = usesCompactPageGrid(columns);
    return resolveFreeGridPlacements(builder.blocks || [], {
      columns,
      priorityId: options.priorityId,
      commit: Boolean(options.commit),
      commitMissing: Boolean(options.commitMissing),
      occupiedCells: options.occupiedCells,
      getId: (block) => block.id,
      getOrder: (block) => (builder.blocks || []).indexOf(block),
      getPlacement: (block) => pageBlockGridPlacement(block, columns),
      getPosition: (block) => compact
        ? { x: block.compactX || block.compactGridX, y: block.compactY || block.compactGridY }
        : { x: block.x || block.gridX, y: block.y || block.gridY },
      setPosition: (block, x, y) => {
        assignResponsiveGridPosition(block, x, y, columns);
      },
    });
  }

  function commitPageBlockPlacements(builder, columns = PAGE_BLOCK_MAX_COLUMNS, priorityId = "", occupiedCells = null) {
    return resolvePageBlockPlacements(builder, columns, { commit: true, commitMissing: true, priorityId, occupiedCells });
  }

  function normalizePageLayoutRows(rows) {
    return clampNumber(rows || PAGE_LAYOUT_MIN_ROWS, PAGE_LAYOUT_MIN_ROWS, PAGE_LAYOUT_MAX_ROWS);
  }

  function pageLayoutGridPlacement(item, columns = PAGE_BLOCK_MAX_COLUMNS) {
    const compact = usesCompactPageGrid(columns);
    const cols = clampNumber((compact ? item?.compactCols : item?.cols) || item?.cols || 1, 1, Math.max(1, columns));
    const rows = normalizePageLayoutRows((compact ? item?.compactRows : item?.rows) || item?.rows);
    const rowSpan = rows;
    const maxX = Math.max(1, columns - cols + 1);
    const x = compact ? item?.compactX || item?.compactGridX || item?.x || item?.gridX : item?.x || item?.gridX;
    const y = compact ? item?.compactY || item?.compactGridY || item?.y || item?.gridY : item?.y || item?.gridY;
    return {
      cols,
      rows,
      rowSpan,
      height: freeGridItemHeight(rowSpan, PAGE_LAYOUT_GRID_ROW_HEIGHT, PAGE_LAYOUT_GRID_GAP),
      x: clampNumber(x || 1, 1, maxX),
      y: Math.max(1, Math.round(Number(y || 1) || 1)),
    };
  }

  function resolvePageLayoutPlacements(items, columns = PAGE_BLOCK_MAX_COLUMNS, options = {}) {
    const compact = usesCompactPageGrid(columns);
    return resolveFreeGridPlacements(items || [], {
      columns,
      priorityId: options.priorityId,
      commit: Boolean(options.commit),
      commitMissing: true,
      getId: (item) => item.id,
      getOrder: (item) => (items || []).indexOf(item),
      getPlacement: (item) => pageLayoutGridPlacement(item, columns),
      getPosition: (item) => compact
        ? { x: item.compactX || item.compactGridX, y: item.compactY || item.compactGridY }
        : { x: item.x || item.gridX, y: item.y || item.gridY },
      setPosition: (item, x, y) => {
        assignResponsiveGridPosition(item, x, y, columns);
      },
    });
  }

  function schedulePageBlockContentFit() {
    window.cancelAnimationFrame(pageBlockContentFitFrame);
    pageBlockContentFitFrame = window.requestAnimationFrame(fitPageBlockContentRows);
  }

  function fitPageBlockContentRows() {
    if (pageBlockResizeState || pageBlockDragState || !els.main) {
      return;
    }

    let changed = false;
    pageBuilderIds().forEach((pageId) => {
      const builder = ensurePageBuilder(pageId);
      const columns = PAGE_BLOCK_MAX_COLUMNS;
      builder.blocks.forEach((block) => {
        const blockElement = findPageBlockElement(pageId, block.id);
        if (!blockElement) {
          return;
        }

        const currentRows = normalizePageBlockRows(block.rows);
        const neededRows = pageBlockRowsForHeight(blockElement.scrollHeight);
        if (neededRows > currentRows) {
          block.rows = neededRows;
          block.updatedAt = new Date().toISOString();
          changed = true;
        }
      });
      if (changed) {
        commitPageBlockPlacements(builder, columns);
      }
    });

    if (changed) {
      saveState();
      renderPageBuilders();
    }
  }

  function pageBlockGridRowSpan(rows) {
    return normalizePageBlockRows(rows);
  }

  function pageBlockRowsForHeight(height) {
    return clampNumber(
      Math.ceil((Math.max(1, Number(height) || 1) + PAGE_BLOCK_GRID_GAP) / (PAGE_BLOCK_GRID_ROW_HEIGHT + PAGE_BLOCK_GRID_GAP)),
      PAGE_BLOCK_MIN_ROWS,
      PAGE_BLOCK_MAX_ROWS,
    );
  }

  function resolveFreeGridPlacements(items, options) {
    const columns = Math.max(1, Math.round(Number(options.columns) || 1));
    const occupied = new Set(options.occupiedCells || options.occupied || []);
    const placements = new Map();
    const orderedItems = orderFreeGridItems(items, options);

    orderedItems.forEach((item) => {
      const placement = options.getPlacement(item);
      const cols = clampNumber(placement.cols, 1, columns);
      const rowSpan = Math.max(1, Math.round(Number(placement.rowSpan) || 1));
      const position = options.getPosition(item) || {};
      const hasPosition = hasGridPosition(position);
      const maxX = Math.max(1, columns - cols + 1);
      let x = clampNumber(hasPosition ? position.x : placement.x, 1, maxX);
      let y = Math.max(1, Math.round(Number(hasPosition ? position.y : placement.y) || 1));

      if (!hasPosition && !options.commitMissing) {
        const freeCell = findFreeGridCell(occupied, columns, cols, rowSpan);
        x = freeCell.x;
        y = freeCell.y;
      } else if (!hasPosition) {
        const freeCell = findFreeGridCell(occupied, columns, cols, rowSpan);
        x = freeCell.x;
        y = freeCell.y;
      } else {
        while (freeGridCollides(occupied, x, y, cols, rowSpan)) {
          y += 1;
        }
      }

      markFreeGridCells(occupied, x, y, cols, rowSpan);
      if (options.commit || (options.commitMissing && !hasPosition)) {
        options.setPosition?.(item, x, y);
      }
      placements.set(options.getId(item), {
        ...placement,
        cols,
        rowSpan,
        x,
        y,
      });
    });

    return placements;
  }

  function orderFreeGridItems(items, options) {
    const priorityId = options.priorityId || "";
    const priorityItem = priorityId ? items.find((item) => options.getId(item) === priorityId) : null;
    const rest = items.filter((item) => item !== priorityItem);
    rest.sort((a, b) => {
      const positionA = options.getPosition(a) || {};
      const positionB = options.getPosition(b) || {};
      const hasPositionA = hasGridPosition(positionA);
      const hasPositionB = hasGridPosition(positionB);
      if (hasPositionA !== hasPositionB) {
        return hasPositionA ? -1 : 1;
      }
      const yA = Math.max(1, Math.round(Number(positionA.y) || 1));
      const yB = Math.max(1, Math.round(Number(positionB.y) || 1));
      const xA = Math.max(1, Math.round(Number(positionA.x) || 1));
      const xB = Math.max(1, Math.round(Number(positionB.x) || 1));
      return yA - yB || xA - xB || options.getOrder(a) - options.getOrder(b);
    });
    return priorityItem ? [priorityItem, ...rest] : rest;
  }

  function hasGridPosition(position) {
    return Number(position?.x) >= 1 && Number(position?.y) >= 1;
  }

  function findFreeGridCell(occupied, columns, cols, rowSpan) {
    for (let y = 1; y < 400; y += 1) {
      for (let x = 1; x <= Math.max(1, columns - cols + 1); x += 1) {
        if (!freeGridCollides(occupied, x, y, cols, rowSpan)) {
          return { x, y };
        }
      }
    }
    return { x: 1, y: 1 };
  }

  function freeGridCollides(occupied, x, y, cols, rowSpan) {
    for (let row = y; row < y + rowSpan; row += 1) {
      for (let col = x; col < x + cols; col += 1) {
        if (occupied.has(`${col}:${row}`)) {
          return true;
        }
      }
    }
    return false;
  }

  function markFreeGridCells(occupied, x, y, cols, rowSpan) {
    for (let row = y; row < y + rowSpan; row += 1) {
      for (let col = x; col < x + cols; col += 1) {
        occupied.add(`${col}:${row}`);
      }
    }
  }

  function rectIntersectionArea(rectA, rectB) {
    const width = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
    const height = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
    return width * height;
  }

  function freeGridItemHeight(rowSpan, rowHeight, gap) {
    const span = Math.max(1, Math.round(Number(rowSpan) || 1));
    return `${span * rowHeight + (span - 1) * gap}px`;
  }

  function freeGridCellFromPointer(event, gridElement, columns, rowHeight, gap) {
    const rect = gridElement.getBoundingClientRect();
    const width = Math.max(1, rect.width - gap * Math.max(0, columns - 1));
    const columnWidth = width / columns;
    const rawX = Math.floor((event.clientX - rect.left) / (columnWidth + gap)) + 1;
    const rawY = Math.floor((event.clientY - rect.top + gap / 2) / (rowHeight + gap)) + 1;
    return {
      x: clampNumber(rawX, 1, columns),
      y: Math.max(1, Math.round(Number(rawY) || 1)),
    };
  }

  function freeGridCellFromDragDelta(startX, startY, deltaX, deltaY, gridElement, columns, rowHeight, gap) {
    const rect = gridElement.getBoundingClientRect();
    const width = Math.max(1, rect.width - gap * Math.max(0, columns - 1));
    const columnWidth = width / columns;
    const columnStep = Math.max(1, columnWidth + gap);
    const rowStep = Math.max(1, rowHeight + gap);
    return {
      x: clampNumber((Number(startX) || 1) + Math.round(deltaX / columnStep), 1, columns),
      y: Math.max(1, Math.round((Number(startY) || 1) + Math.round(deltaY / rowStep))),
    };
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(Number(value) || min)));
  }

  function sanitizeWidgetColor(color) {
    const value = String(color || "").trim();
    return /^#[0-9a-f]{6}$/i.test(value) ? value : "#615bd0";
  }

  function ensureDefaultCategories(nextState) {
    const defaults = defaultCategories();

    defaults.forEach((category) => {
      const hasName = nextState.categories.some((item) => item.name.toLowerCase() === category.name.toLowerCase());
      if (!hasName) {
        nextState.categories.push(category);
      }
    });
  }

  function makeInitialState() {
    const now = new Date().toISOString();
    const categories = defaultCategories();
    const accounts = [
      { id: "acc-principal", name: "Conta principal", kind: "checking", openingBalance: 0, creditLimit: 0, separateBalanceAmount: 0, color: "#2563eb" },
    ];

    return {
      version: 1,
      categories,
      accounts,
      transactions: [],
      budgets: [],
      workouts: [],
      workoutCompletions: [],
      nutritionProfile: { ...DEFAULT_NUTRITION_PROFILE },
      nutritionLogs: [],
      savedMealIdeas: [],
      study: defaultStudyState(),
      pantryItems: [],
      shoppingItems: [],
      creativeItems: [],
      recipeCategories: defaultRecipeCategories(),
      recipeStatuses: defaultRecipeStatuses(),
      recipes: [],
      mediaLibrary: defaultMediaLibrary(),
      homeInboxItems: [],
      customHomeWidgets: [],
      homeLayout: defaultHomeLayout([]),
      pageBuilders: [],
      usageTypes: defaultUsageTypes(),
      monthPlans: [
        {
          id: createId("month"),
          month: currentMonth(),
          salary: 0,
          employmentType: "clt",
          salaryEntries: [],
          salaryEntriesManuallyCleared: false,
          benefits: 0,
          benefitItems: [],
          benefitMealDaily: DEFAULT_BENEFITS.mealDaily,
          benefitTransportDaily: DEFAULT_BENEFITS.transportDaily,
          salaryDependents: 0,
          salaryAdvance: 0,
          salaryOtherDiscounts: 0,
          hasTransportVoucher: true,
          pjTaxRate: 6,
          pjOtherCosts: 0,
          autonomousInssRate: 20,
          autonomousInssBase: 0,
          autonomousBookCash: 0,
          fixedBills: [],
          createdAt: now,
          updatedAt: now,
        },
      ],
      settings: {
        selectedMonth: currentMonth(),
        activeRegisterPage: "salary",
        mobileNavOrder: MOBILE_NAV_DEFAULT_ORDER,
        cdiAnnualRate: DEFAULT_CDI_ANNUAL_RATE,
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  function defaultUsageTypes() {
    const now = new Date().toISOString();
    return [
      { id: "usage-essencial", name: "Essencial", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-casa", name: "Casa", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-alimentacao", name: "Alimentação", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-transporte", name: "Transporte", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-saude", name: "Saúde", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-educacao", name: "Educação", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-assinaturas", name: "Assinaturas", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-lazer", name: "Lazer e vida", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-guardar", name: "Guardar dinheiro", monthlyPlan: 0, createdAt: now, updatedAt: now },
      { id: "usage-diversos", name: "Diversos", monthlyPlan: 0, createdAt: now, updatedAt: now },
    ];
  }


  function defaultCategories() {
    return [
      { id: "cat-salario", name: "Salário", type: "income", usageId: "", emoji: "💵", color: "#138a5b" },
      { id: "cat-beneficios", name: "Benefícios", type: "income", usageId: "", emoji: "🎁", color: "#2f80ed" },
      { id: "cat-renda-extra", name: "Renda extra", type: "income", usageId: "", emoji: "➕", color: "#0f766e" },
      { id: "cat-academia", name: "Academia", type: "expense", usageId: "usage-saude", emoji: "💪", color: "#7657c8" },
      { id: "cat-agua", name: "Água", type: "expense", usageId: "usage-casa", emoji: "💧", color: "#2f80ed" },
      { id: "cat-alimentacao", name: "Alimentação", type: "expense", usageId: "usage-alimentacao", emoji: "🥦", color: "#138a5b" },
      { id: "cat-aluguel", name: "Aluguel", type: "expense", usageId: "usage-casa", emoji: "🏠", color: "#b7791f" },
      { id: "cat-assinaturas", name: "Assinaturas", type: "expense", usageId: "usage-assinaturas", emoji: "🖊️", color: "#64748b" },
      { id: "cat-casa", name: "Casa", type: "expense", usageId: "usage-casa", emoji: "🪴", color: "#0f766e" },
      { id: "cat-celular", name: "Celular", type: "expense", usageId: "usage-essencial", emoji: "📱", color: "#2563eb" },
      { id: "cat-condominio", name: "Condomínio", type: "expense", usageId: "usage-casa", emoji: "🏢", color: "#7657c8" },
      { id: "cat-diversos", name: "Diversos", type: "expense", usageId: "usage-diversos", emoji: "🔀", color: "#64748b" },
      { id: "cat-faculdade", name: "Faculdade", type: "expense", usageId: "usage-educacao", emoji: "🏫", color: "#2563eb" },
      { id: "cat-guardar", name: "Guardar dinheiro", type: "expense", usageId: "usage-guardar", emoji: "🔐", color: "#138a5b" },
      { id: "cat-internet", name: "Internet", type: "expense", usageId: "usage-essencial", emoji: "📶", color: "#2563eb" },
      { id: "cat-investimento", name: "Investimento", type: "expense", usageId: "usage-guardar", emoji: "💰", color: "#0f766e" },
      { id: "cat-lavanderia", name: "Lavanderia", type: "expense", usageId: "usage-casa", emoji: "🧺", color: "#b7791f" },
      { id: "cat-luz", name: "Luz", type: "expense", usageId: "usage-casa", emoji: "⚡", color: "#f59e0b" },
      { id: "cat-pet", name: "Pet", type: "expense", usageId: "usage-lazer", emoji: "🐱", color: "#d9468f" },
      { id: "cat-plano-saude", name: "Plano de saúde", type: "expense", usageId: "usage-saude", emoji: "🆘", color: "#c24137" },
      { id: "cat-saude", name: "Saúde", type: "expense", usageId: "usage-saude", emoji: "💊", color: "#c24137" },
      { id: "cat-transporte", name: "Transporte", type: "expense", usageId: "usage-transporte", emoji: "🚙", color: "#2563eb" },
      { id: "cat-viagem", name: "Viagem", type: "expense", usageId: "usage-lazer", emoji: "✈️", color: "#7657c8" },
      { id: "cat-movimentacao", name: "Movimentação", type: "transfer", usageId: "", emoji: "🔁", color: "#7657c8" },
      { id: "cat-pagamento-cartao", name: "Pagamento cartão", type: "card_payment", usageId: "", emoji: "💳", color: "#b7791f" },
    ];
  }

  function fixedBillCategoryOptions() {
    return [
      { value: "", label: "Sem categoria" },
      ...state.categories
        .filter((category) => category.type === "expense")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((category) => ({
          value: category.id,
          label: `${category.emoji || ""} ${category.name}`.trim(),
        })),
    ];
  }

  function fixedBillCategoryOptionHtml(selectedValue = "") {
    return fixedBillCategoryOptions()
      .map((option) => {
        const selected = option.value === selectedValue ? " selected" : "";
        return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
      })
      .join("");
  }

  function setSelectOptions(select, options, selectedValue) {
    select.innerHTML = "";
    options.forEach((option) => {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    });

    if (options.some((option) => option.value === selectedValue)) {
      select.value = selectedValue;
    } else if (options.length) {
      select.value = options[0].value;
    }
  }

  function sumAmounts(transactions) {
    return transactions.reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
  }

  function formatCurrency(value) {
    return currencyFormatter.format(Number(value) || 0);
  }

  function formatPercent(value) {
    return `${percentFormatter.format(Number(value) || 0)}%`;
  }

  function formatSignedCurrency(value) {
    const amount = Number(value) || 0;
    if (amount > 0) {
      return `+${formatCurrency(amount)}`;
    }
    if (amount < 0) {
      return `-${formatCurrency(Math.abs(amount))}`;
    }
    return formatCurrency(0);
  }

  function formatSignedPercent(value) {
    const amount = Number(value) || 0;
    if (amount > 0) {
      return `+${formatPercent(amount)}`;
    }
    if (amount < 0) {
      return `-${formatPercent(Math.abs(amount))}`;
    }
    return formatPercent(0);
  }

  function formatDate(value) {
    return dateFormatter.format(new Date(`${value}T00:00:00`)).replace(".", "");
  }

  function formatMonthName(month) {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${month}-01T00:00:00`));
  }

  function shortMonth(month) {
    return monthFormatter.format(new Date(`${month}-01T00:00:00`)).replace(".", "");
  }

  function currentMonth() {
    return localDateKey(new Date()).slice(0, 7);
  }

  function todayDate() {
    return localDateKey(new Date());
  }

  function startupSelectedMonth(savedMonth) {
    const month = isMonthKey(savedMonth) ? savedMonth : "";
    const current = currentMonth();
    return month && month >= current ? month : current;
  }

  function normalizeTransactionMonthFilter(value, fallbackMonth = currentMonth()) {
    if (value === "" || value === "all") {
      return "";
    }
    return isMonthKey(value) ? value : fallbackMonth;
  }

  function normalizeBackupSettings(value = {}) {
    const dayOfWeek = Math.floor(Number(value.dayOfWeek));
    return {
      enabled: value.enabled !== false,
      dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : DEFAULT_BACKUP_SETTINGS.dayOfWeek,
    };
  }

  function lastScheduledBackupDate(date, dayOfWeek) {
    const targetDay = normalizeBackupSettings({ dayOfWeek }).dayOfWeek;
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const offset = (localDate.getDay() - targetDay + 7) % 7;
    localDate.setDate(localDate.getDate() - offset);
    return localDateKey(localDate);
  }

  function backupWeekdayLabel(dayOfWeek) {
    return BACKUP_WEEKDAYS[normalizeBackupSettings({ dayOfWeek }).dayOfWeek] || BACKUP_WEEKDAYS[0];
  }

  function isMonthKey(value) {
    return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
  }

  function isDateKey(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function defaultTransactionDate() {
    const today = todayDate();
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`;
  }





  function normalizeQuestDueDate(value) {
    const date = String(value || "");
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  }


















  function normalizeWorkoutType(value) {
    return Object.prototype.hasOwnProperty.call(WORKOUT_TYPES, value) ? value : "strength";
  }

  function workoutTypeConfig(type) {
    return WORKOUT_TYPES[normalizeWorkoutType(type)];
  }

  function normalizeWorkoutFilter(value) {
    return ["active", "inactive", "completed", "all"].includes(value) ? value : "all";
  }

  function normalizeWorkoutStatus(value) {
    return value === "inactive" ? "inactive" : "active";
  }

  function workoutStatusLabel(workout, date = todayDate()) {
    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      completed: "Feito",
    };
    return labels[getWorkoutDisplayStatus(workout, date)] || "Ativo";
  }

  function normalizeWorkoutWeekdays(value, fallbackTarget = DEFAULT_WORKOUT_WEEKDAYS.length) {
    const allowed = new Set(WORKOUT_WEEKDAYS.map((day) => day.key));
    const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    const days = [...new Set(source.map((day) => String(day).trim()).filter((day) => allowed.has(day)))];
    if (days.length) {
      return days;
    }
    return defaultWorkoutWeekdays(fallbackTarget);
  }

  function defaultWorkoutWeekdays(target = DEFAULT_WORKOUT_WEEKDAYS.length) {
    const count = Math.min(7, Math.max(1, Math.round(Number(target) || DEFAULT_WORKOUT_WEEKDAYS.length)));
    if (count === DEFAULT_WORKOUT_WEEKDAYS.length) {
      return [...DEFAULT_WORKOUT_WEEKDAYS];
    }
    return WORKOUT_WEEKDAYS.slice(0, count).map((day) => day.key);
  }

  function getSelectedWorkoutWeekdays() {
    return Array.from(els.workoutWeekdays)
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function getSelectedWorkoutRestTimes() {
    const selectedDays = new Set(getSelectedWorkoutWeekdays());
    return Array.from(els.workoutRestInputs || []).reduce((restTimes, input) => {
      const day = normalizeWorkoutWeekdayKey(input.dataset.workoutRestDay);
      const value = String(input.value || "").trim().slice(0, 24);
      if (day && selectedDays.has(day) && value) {
        restTimes[day] = value;
      }
      return restTimes;
    }, {});
  }

  function setSelectedWorkoutWeekdays(days) {
    const selected = new Set(normalizeWorkoutWeekdays(days));
    els.workoutWeekdays.forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function setWorkoutRestTimes(restTimes = {}) {
    const normalized = normalizeWorkoutRestTimes(restTimes);
    Array.from(els.workoutRestInputs || []).forEach((input) => {
      const day = normalizeWorkoutWeekdayKey(input.dataset.workoutRestDay);
      input.value = day ? normalized[day] || "" : "";
    });
  }

  function normalizeWorkoutRestTimes(restTimes = {}) {
    const source = restTimes && typeof restTimes === "object" ? restTimes : {};
    return WORKOUT_WEEKDAYS.reduce((result, day) => {
      const value = String(source[day.key] ?? source[day.label] ?? source[day.longLabel] ?? "").trim().slice(0, 24);
      if (value) {
        result[day.key] = value;
      }
      return result;
    }, {});
  }

  function normalizeWorkoutDayOrder(dayOrder = {}) {
    const source = dayOrder && typeof dayOrder === "object" ? dayOrder : {};
    return WORKOUT_WEEKDAYS.reduce((result, day) => {
      const value = Number(source[day.key] ?? source[day.label] ?? source[day.longLabel]);
      if (Number.isFinite(value) && value > 0) {
        result[day.key] = value;
      }
      return result;
    }, {});
  }

  function ensureWorkoutWeeklyReset() {
    const weekStart = startOfWeek(todayDate());
    state.settings = state.settings || {};
    if (state.settings.workoutWeekResetStart === weekStart) {
      return false;
    }
    state.settings.workoutWeekResetStart = weekStart;
    saveState({ backup: false });
    return true;
  }

  function normalizeWorkoutWeekdayKey(value) {
    const key = String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .slice(0, 3);
    const aliases = {
      seg: "mon",
      mon: "mon",
      ter: "tue",
      tue: "tue",
      qua: "wed",
      wed: "wed",
      qui: "thu",
      thu: "thu",
      sex: "fri",
      fri: "fri",
      sab: "sat",
      sat: "sat",
      dom: "sun",
      sun: "sun",
    };
    return aliases[key] || "";
  }

  function getWorkoutRestForDate(workout, date = todayDate()) {
    const day = workoutWeekdayKey(date);
    return normalizeWorkoutRestTimes(workout.restTimes)[day] || "";
  }

  function workoutWeekdayKey(dateKey) {
    const day = new Date(`${dateKey}T00:00:00`).getDay();
    const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return map[day];
  }

  function workoutWeekdayLabel(dateKey) {
    const key = workoutWeekdayKey(dateKey);
    return WORKOUT_WEEKDAYS.find((day) => day.key === key)?.label || "";
  }

  function workoutWeekdayLongLabel(dateKey) {
    const key = workoutWeekdayKey(dateKey);
    return WORKOUT_WEEKDAYS.find((day) => day.key === key)?.longLabel || "";
  }

  function isWorkoutScheduledForDate(workout, date = todayDate()) {
    return normalizeWorkoutWeekdays(workout.weekdays, workout.weeklyTarget).includes(workoutWeekdayKey(date));
  }

  function getWorkoutWeeklyTarget(workout) {
    return normalizeWorkoutWeekdays(workout.weekdays, workout.weeklyTarget).length;
  }

  function getWorkoutReward(workout) {
    return Math.max(1, Math.round(Number(workout.reward ?? workout.coins ?? workout.xp) || DEFAULT_WORKOUT_REWARD));
  }

  function getWorkoutDisplayStatus(workout, date = todayDate()) {
    if (normalizeWorkoutStatus(workout.status) === "inactive") {
      return "inactive";
    }
    if (isWorkoutDoneOnDate(workout, date)) {
      return "completed";
    }
    return "active";
  }

  function isWorkoutDoneOnDate(workout, date = todayDate()) {
    const weekStart = startOfWeek(date);
    return getWorkoutCompletionsForDate(date).some((completion) =>
      completion.workoutId === workout.id && (!completion.weekStart || completion.weekStart === weekStart),
    );
  }

  function getScheduledWorkoutsForDate(date) {
    return getSortedWorkouts()
      .filter((workout) => isWorkoutScheduledForDate(workout, date))
      .sort(compareWorkoutForDate(date));
  }

  function getWorkoutCompletionsForDate(date) {
    const weekStart = startOfWeek(date);
    return (state.workoutCompletions || []).filter((completion) =>
      completion.date === date && (!completion.weekStart || completion.weekStart === weekStart),
    );
  }

  function getWorkoutCompletionsForRange(startDate, endDate) {
    return (state.workoutCompletions || []).filter((completion) =>
      completion.date >= startDate &&
      completion.date <= endDate &&
      (!completion.weekStart || completion.weekStart === startDate),
    );
  }

  function getWorkoutCompletionsForMonth(month = currentMonth()) {
    return (state.workoutCompletions || []).filter((completion) => String(completion.date || completion.completedAt || "").slice(0, 7) === month);
  }

  function getWorkoutCompletionsForWorkoutWeek(workoutId, date = todayDate()) {
    return getWorkoutCompletionsForRange(startOfWeek(date), endOfWeek(date)).filter((completion) => completion.workoutId === workoutId);
  }

  function sumWorkoutCompletionRewards(completions) {
    return completions.reduce((total, completion) => total + (Number(completion.reward) || 0), 0);
  }

  function getWorkoutEarnedCoins() {
    return sumWorkoutCompletionRewards(state.workoutCompletions || []);
  }

  function getWorkoutCurrentStreak(date = todayDate()) {
    let cursor = date;
    let streak = 0;
    while (getWorkoutCompletionsForDate(cursor).length) {
      streak += 1;
      cursor = addDateKeyDays(cursor, -1);
    }
    return streak;
  }




  function daysInMonth(month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return Array.from({ length: lastDay }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  }

  function addDateKeyDays(dateKey, offset) {
    const date = new Date(`${dateKey}T00:00:00`);
    date.setDate(date.getDate() + offset);
    return localDateKey(date);
  }

  function startOfWeek(dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + mondayOffset);
    return localDateKey(date);
  }

  function endOfWeek(dateKey) {
    return addDateKeyDays(startOfWeek(dateKey), 6);
  }

  function addMonths(month, offset) {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function endOfMonth(month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return `${month}-${String(lastDay).padStart(2, "0")}`;
  }

  function typeLabel(type) {
    const labels = {
      income: "Entrada",
      expense: "Saída",
      transfer: "Movimentação",
      card_payment: "Pagamento cartão",
    };
    return labels[type] || "Movimentação";
  }

  function categoryTypeOptions(selectedType) {
    return ["income", "expense", "transfer", "card_payment"]
      .map((value) => `<option value="${value}" ${value === selectedType ? "selected" : ""}>${escapeHtml(typeLabel(value))}</option>`)
      .join("");
  }

  function usageOptions(selectedUsageId) {
    const options = [{ id: "", name: "Sem grupo" }, ...state.usageTypes];
    return options
      .map((usage) => `<option value="${escapeHtml(usage.id)}" ${usage.id === selectedUsageId ? "selected" : ""}>${escapeHtml(usage.name)}</option>`)
      .join("");
  }

  function transactionAmountClass(type) {
    if (type === "income") {
      return "positive";
    }
    if (type === "expense") {
      return "negative";
    }
    return "neutral";
  }

  function transactionAmountPrefix(type) {
    if (type === "income") {
      return "+";
    }
    if (type === "expense") {
      return "-";
    }
    return "";
  }

  function statusLabel(status) {
    return status === "pending" ? "Pendente" : "Confirmado";
  }

  function accountKindLabel(kind) {
    const labels = {
      checking: "Conta corrente",
      savings: "Reserva",
      cash: "Dinheiro",
      credit_card: "Cartão de crédito",
      investment: "Investimento",
    };
    return labels[kind] || "Conta";
  }

  function accountKindOptions(selectedKind, scope = "all") {
    let options = [
      ["checking", "Conta"],
      ["credit_card", "Cartão"],
      ["savings", "Guardado"],
      ["cash", "Dinheiro"],
      ["investment", "Investimento"],
    ];

    if (scope === "cards") {
      options = options.filter(([value]) => value === "credit_card");
    } else if (scope === "savings") {
      options = options.filter(([value]) => ["savings", "investment"].includes(value));
    } else if (scope === "accounts") {
      options = options.filter(([value]) => ["checking", "cash"].includes(value));
    }

    return options
      .map(([value, label]) => `<option value="${value}" ${value === selectedKind ? "selected" : ""}>${label}</option>`)
      .join("");
  }

  function defaultAccountColor(kind) {
    const colors = {
      checking: "#2563eb",
      credit_card: "#b7791f",
      savings: "#138a5b",
      cash: "#7657c8",
      investment: "#0f766e",
    };
    return colors[kind] || "#64748b";
  }

  function preferredTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function resetScrollPosition() {
    window.scrollTo({ top: 0, left: 0 });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0 }), 80);
  }

  function hashToView(hash) {
    const rawValue = String(hash || "").replace(/^#/, "");
    const value = rawValue.toLowerCase();
    if (value.startsWith("quadro-")) {
      const widgetId = decodeURIComponent(rawValue.slice("quadro-".length));
      if (state?.customHomeWidgets?.some((widget) => widget.id === widgetId)) {
        return `custom:${widgetId}`;
      }
    }
    if (value === "financas" || value === "finance") {
      return "finance";
    }
    if (["quests", "quest", "missoes", "missões", "tarefas"].includes(value)) {
      return "home";
    }
    if (["treinos", "treino", "workouts", "workout"].includes(value)) {
      return "workouts";
    }
    if (["estudos", "estudo", "study", "studies"].includes(value)) {
      return "study";
    }
    if (["area-criativa", "area_criativa", "criativa", "criativo", "creative", "criacoes", "criacao"].includes(value)) {
      return "creative";
    }
    if (["biblioteca", "midia", "media", "leituras", "leitura", "filmes", "series"].includes(value)) {
      return "media";
    }
    if (["receitas", "receita", "recipes", "recipe", "cozinha", "cardapio"].includes(value)) {
      return "recipes";
    }
    if (["despensa", "estoque", "pantry", "stock", "casa"].includes(value)) {
      return "pantry";
    }
    if (["compras", "compra", "shopping", "lista-compras", "lista_de_compras"].includes(value)) {
      return "shopping";
    }
    if (["sistema", "system", "configuracoes", "configuracao", "settings", "backup", "nuvem", "updates", "atualizacoes"].includes(value)) {
      return "system";
    }
    return "home";
  }

  function viewTitle(view) {
    if (view.startsWith("custom:")) {
      const widget = state.customHomeWidgets.find((item) => item.id === view.slice("custom:".length));
      return widget ? `Códice | ${widget.title}` : "Códice | Quadro";
    }

    const titles = {
      finance: "Códice | Finanças",
      workouts: "Códice | Treinos",
      study: "Códice | Estudos",
      creative: "Códice | Area Criativa",
      media: "Códice | Biblioteca",
      recipes: "Códice | Receitas",
      pantry: "Códice | Despensa",
      shopping: "Códice | Compras",
      system: "Códice | Sistema",
      home: "Códice | Home",
    };
    return titles[view] || titles.home;
  }

  function applyTheme(nextTheme) {
    document.body.dataset.theme = nextTheme;
  }

  function updateThemeToggle() {
    if (!els.themeToggle) {
      return;
    }
    const use = els.themeToggle.querySelector("use");
    const nextLabel = theme === "dark" ? "Usar tema claro" : "Usar tema escuro";
    use?.setAttribute("href", theme === "dark" ? "#icon-sun" : "#icon-moon");
    els.themeToggle.setAttribute("aria-label", nextLabel);
    els.themeToggle.setAttribute("title", nextLabel);
  }

  function plural(count, singular, pluralText) {
    return `${count} ${count === 1 ? singular : pluralText}`;
  }

  function parseNutritionNumber(value, fallback, min, max, precision = 1) {
    const rawValue = String(value ?? "").trim().replace(",", ".");
    const parsed = rawValue ? Number(rawValue) : NaN;
    const safeValue = Number.isFinite(parsed) ? parsed : fallback;
    const bounded = Math.min(max, Math.max(min, safeValue));
    return roundToPrecision(bounded, precision);
  }

  function roundToPrecision(value, precision = 1) {
    const multiplier = 10 ** precision;
    return Math.round((Number(value) || 0) * multiplier) / multiplier;
  }

  function formatInputNumber(value, precision = 1) {
    return String(roundToPrecision(value, precision));
  }

  function formatInteger(value) {
    return integerFormatter.format(Math.round(Number(value) || 0));
  }

  function formatDecimal(value) {
    return decimalFormatter.format(roundToPrecision(value, 1));
  }

  function nutritionGoalLabel(goal) {
    const labels = {
      cut: "Deficit leve",
      maintain: "Manutencao",
      gain: "Superavit leve",
    };
    return labels[goal] || labels.maintain;
  }

  function bmiCategoryLabel(bmi) {
    if (!bmi) {
      return "Sem dados";
    }
    if (bmi < 18.5) {
      return "Abaixo do peso";
    }
    if (bmi < 25) {
      return "Faixa comum";
    }
    if (bmi < 30) {
      return "Acima da faixa";
    }
    return "Faixa elevada";
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function truncateMoney(value) {
    return Math.trunc((Number(value) || 0) * 100) / 100;
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function svgIcon(id) {
    return `<svg class="icon"><use href="#${id}"></use></svg>`;
  }

  function safeColor(color) {
    return /^#[0-9a-fA-F]{3,8}$/.test(color || "") ? color : "#64748b";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return map[char];
    });
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }
})();
