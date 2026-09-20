export type Language = 'fr' | 'en' | 'es';

export interface Translations {
  // Global Header
  appTitle: string;
  author: string;
  ollamaGeminiReady: string;
  viewHistoryBtn: string;
  dolphinBtn: string;
  cli: string;
  gui: string;
  replay: string;
  macFiles: string;
  languageLabel: string;
  ollamaOnline: string;
  ollamaOffline: string;
  autoLaunchOllama: string;

  // History Prompt
  historyPromptTitle: string;
  historyPromptSub: string;
  historyPromptYes: string;
  historyPromptNo: string;
  historyCount: string;
  hideHistory: string;
  showHistory: string;

  // Dual Choice Menu (Assistance générale vs Apprentissage technique avancé)
  dualTitle: string;
  dualSubtitle: string;
  generalTitle: string;
  generalQuestion: string;
  generalDesc: string;
  generalBtn: string;
  advancedTitle: string;
  advancedQuestion: string;
  advancedDesc: string;
  advancedBtn: string;

  // Agentic Tools & Automated Selection
  agentLoopTitle: string;
  autoToolsEnabled: string;
  toolWebSearch: string;
  toolFileIO: string;
  toolCodeExec: string;
  stepObjective: string;
  stepPlanning: string;
  stepExecution: string;
  stepVerification: string;
  stepResult: string;
  riskyActionTitle: string;
  riskyActionConfirm: string;
  riskyActionCancel: string;

  // Chat
  you: string;
  writingInProgress: string;
  send: string;
  inputPlaceholder: string;
  clearMemory: string;
  exportTxt: string;
  activeModel: string;
  connected: string;
  offline: string;
  speed: string;
  speedSlow: string;
  speedNormal: string;
  speedInstant: string;

  // Explanations for CLI, GUI & Replay
  glossaryTitle: string;
  cliDesc: string;
  guiDesc: string;
  replayDesc: string;

  // Menu Options
  menuTitle: string;
  optChat: string;
  optCreate: string;
  optProjects: string;
  optSettings: string;
  optUpdates: string;
  optSessions: string;
  optDolphin: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    appTitle: "DARK-GPT",
    author: "PAR M4TH4CK3R",
    ollamaGeminiReady: "OLLAMA & GEMINI PRÊTS",
    viewHistoryBtn: "Consulter l'historique",
    dolphinBtn: "DOLPHIN 3",
    cli: "CLI",
    gui: "GUI",
    replay: "REPLAY",
    macFiles: "DOSSIER PARTAGÉ",
    languageLabel: "Langue de l'interface :",
    ollamaOnline: "OLLAMA CONNECTÉ (127.0.0.1:11434)",
    ollamaOffline: "OLLAMA DÉCONNECTÉ",
    autoLaunchOllama: "Lancer Ollama en arrière-plan",

    historyPromptTitle: "CONSULTATION DE L'HISTORIQUE",
    historyPromptSub: "Une conversation précédente est enregistrée dans cette session.",
    historyPromptYes: "Consulter l'historique",
    historyPromptNo: "Démarrer une session propre",
    historyCount: "messages archivés",
    hideHistory: "Masquer l'historique",
    showHistory: "Afficher l'historique",

    dualTitle: "SÉLECTION DU MODE DE TRAVAIL",
    dualSubtitle: "Choisissez votre environnement d'assistance et d'apprentissage :",
    generalTitle: "Assistance générale",
    generalQuestion: "Productivité, analyse de code et durcissement défensif",
    generalDesc: "Assistance quotidienne, rédaction, explication technique claire, revue de code, sécurisation et administration système.",
    generalBtn: "Activer l'Assistance générale",
    advancedTitle: "Mode Terminal (développeur)",
    advancedQuestion: "Développement, automatisation et Cowork sur tes fichiers",
    advancedDesc: "Environnement développeur : code, scripts, automatisation, gestion de fichiers via le Cowork et exécution en bac à sable.",
    advancedBtn: "Activer l'Apprentissage technique",

    agentLoopTitle: "BOUCLE AGENTIQUE AUTONOME",
    autoToolsEnabled: "Sélection automatique des outils active (Web, Fichiers partagés, Exécution)",
    toolWebSearch: "Recherche Web",
    toolFileIO: "Accès Fichiers Partagés",
    toolCodeExec: "Exécution de Code",
    stepObjective: "Objectif",
    stepPlanning: "Planification",
    stepExecution: "Exécution outil",
    stepVerification: "Vérification",
    stepResult: "Résultat final",
    riskyActionTitle: "CONFIRMATION REQUISE // ACTION RISQUÉE DÉTECTÉE",
    riskyActionConfirm: "Confirmer l'action",
    riskyActionCancel: "Annuler l'action",

    you: "VOUS",
    writingInProgress: "(rédaction en cours... [Entrée pour passer])",
    send: "ENVOYER",
    inputPlaceholder: "Tapez votre message ou votre consigne...",
    clearMemory: "Effacer la mémoire",
    exportTxt: "Exporter l'historique (.txt)",
    activeModel: "MOTEUR :",
    connected: "CONNECTÉ",
    offline: "HORS LIGNE",
    speed: "Vitesse :",
    speedSlow: "Lente",
    speedNormal: "Normale",
    speedInstant: "Directe",

    glossaryTitle: "LEXIQUE DU TERMINAL",
    cliDesc: "CLI (Command-Line Interface) : Interface en ligne de commande textuelle (Terminal) rapide et légère.",
    guiDesc: "GUI (Graphical User Interface) : Interface graphique visuelle avec boutons, formulaires et panneaux.",
    replayDesc: "REPLAY : Rejoue l'animation de démarrage et d'initialisation du terminal.",

    menuTitle: "MENU PRINCIPAL DARK-GPT",
    optChat: "Ouvrir le Chat Terminal",
    optCreate: "Créer un projet",
    optProjects: "Lister les projets",
    optSettings: "Paramètres & Clés API",
    optUpdates: "Vérifier les mises à jour",
    optSessions: "Gérer les sessions",
    optDolphin: "Assistant Dolphin 3 / Ollama",
  },
  en: {
    appTitle: "DARK-GPT",
    author: "BY M4TH4CK3R",
    ollamaGeminiReady: "OLLAMA & GEMINI READY",
    viewHistoryBtn: "View Chat History",
    dolphinBtn: "DOLPHIN 3",
    cli: "CLI",
    gui: "GUI",
    replay: "REPLAY",
    macFiles: "SHARED FOLDER",
    languageLabel: "Interface Language:",
    ollamaOnline: "OLLAMA CONNECTED (127.0.0.1:11434)",
    ollamaOffline: "OLLAMA DISCONNECTED",
    autoLaunchOllama: "Launch Ollama in background",

    historyPromptTitle: "CHAT HISTORY CONSULTATION",
    historyPromptSub: "A previous conversation is stored in this session.",
    historyPromptYes: "View Chat History",
    historyPromptNo: "Start Clean Session",
    historyCount: "archived messages",
    hideHistory: "Hide History",
    showHistory: "Show History",

    dualTitle: "WORKFLOW MODE SELECTION",
    dualSubtitle: "Select your learning and assistance environment:",
    generalTitle: "General Assistance",
    generalQuestion: "Productivity, code review, and defensive hardening",
    generalDesc: "Daily assistance, clear technical explanations, code review, defensive security, and system administration.",
    generalBtn: "Activate General Assistance",
    advancedTitle: "Terminal Mode (developer)",
    advancedQuestion: "Development, automation and Cowork on your files",
    advancedDesc: "Developer environment: code, scripts, automation, file management via Cowork, and sandbox execution.",
    advancedBtn: "Activate Technical Learning",

    agentLoopTitle: "AUTONOMOUS AGENT LOOP",
    autoToolsEnabled: "Automated tool selection active (Web, Shared Files, Execution)",
    toolWebSearch: "Web Search",
    toolFileIO: "Shared File Access",
    toolCodeExec: "Code Execution",
    stepObjective: "Objective",
    stepPlanning: "Planning",
    stepExecution: "Tool Execution",
    stepVerification: "Verification",
    stepResult: "Final Result",
    riskyActionTitle: "CONFIRMATION REQUIRED // RISKY ACTION DETECTED",
    riskyActionConfirm: "Confirm Action",
    riskyActionCancel: "Cancel Action",

    you: "YOU",
    writingInProgress: "(typing... [Press Enter to skip])",
    send: "SEND",
    inputPlaceholder: "Type your message or instruction...",
    clearMemory: "Clear Memory",
    exportTxt: "Export History (.txt)",
    activeModel: "ENGINE:",
    connected: "CONNECTED",
    offline: "OFFLINE",
    speed: "Speed:",
    speedSlow: "Slow",
    speedNormal: "Normal",
    speedInstant: "Instant",

    glossaryTitle: "TERMINAL GLOSSARY",
    cliDesc: "CLI (Command-Line Interface): Text-based console interface (Terminal) for rapid command execution.",
    guiDesc: "GUI (Graphical User Interface): Visual interface featuring interactive buttons, forms, and dialogs.",
    replayDesc: "REPLAY: Replays the initial terminal boot sequence animation.",

    menuTitle: "DARK-GPT MAIN MENU",
    optChat: "Open Terminal Chat",
    optCreate: "Create Project",
    optProjects: "List Projects",
    optSettings: "Settings & API Keys",
    optUpdates: "Check Updates",
    optSessions: "Manage Sessions",
    optDolphin: "Dolphin 3 / Ollama Assistant",
  },
  es: {
    appTitle: "DARK-GPT",
    author: "POR M4TH4CK3R",
    ollamaGeminiReady: "OLLAMA & GEMINI LISTOS",
    viewHistoryBtn: "Consultar el historial",
    dolphinBtn: "DOLPHIN 3",
    cli: "CLI",
    gui: "GUI",
    replay: "REPLAY",
    macFiles: "CARPETA COMPARTIDA",
    languageLabel: "Idioma de la interfaz:",
    ollamaOnline: "OLLAMA CONECTADO (127.0.0.1:11434)",
    ollamaOffline: "OLLAMA DESCONECTADO",
    autoLaunchOllama: "Iniciar Ollama en segundo plano",

    historyPromptTitle: "CONSULTA DEL HISTORIAL",
    historyPromptSub: "Se ha encontrado una conversación previa guardada en esta sesión.",
    historyPromptYes: "Consultar el historial",
    historyPromptNo: "Iniciar sesión limpia",
    historyCount: "mensajes archivados",
    hideHistory: "Ocultar Historial",
    showHistory: "Mostrar Historial",

    dualTitle: "SELECCIÓN DE MODO DE TRABAJO",
    dualSubtitle: "Elige tu entorno de asistencia y aprendizaje:",
    generalTitle: "Asistencia general",
    generalQuestion: "Productividad, revisión de código y blindaje defensivo",
    generalDesc: "Asistencia diaria, explicaciones técnicas claras, revisión de código, seguridad defensiva y administración de sistemas.",
    generalBtn: "Activar Asistencia general",
    advancedTitle: "Modo Terminal (desarrollador)",
    advancedQuestion: "Desarrollo, automatización y Cowork en tus archivos",
    advancedDesc: "Entorno de desarrollo: código, scripts, automatización, gestión de archivos con Cowork y ejecución en sandbox.",
    advancedBtn: "Activar Aprendizaje técnico",

    agentLoopTitle: "BUCLE AGÉNTICO AUTÓNOMO",
    autoToolsEnabled: "Selección automática de herramientas activa (Web, Archivos compartidos, Ejecución)",
    toolWebSearch: "Búsqueda Web",
    toolFileIO: "Acceso a Archivos Compartidos",
    toolCodeExec: "Ejecución de Código",
    stepObjective: "Objetivo",
    stepPlanning: "Planificación",
    stepExecution: "Ejecución de herramienta",
    stepVerification: "Verificación",
    stepResult: "Resultado final",
    riskyActionTitle: "CONFIRMACIÓN REQUERIDA // ACCIÓN RIESGOSA DETECTADA",
    riskyActionConfirm: "Confirmar Acción",
    riskyActionCancel: "Cancelar Acción",

    you: "TÚ",
    writingInProgress: "(escribiendo... [Pulsa Enter para saltar])",
    send: "ENVIAR",
    inputPlaceholder: "Escribe tu mensaje o instrucción...",
    clearMemory: "Borrar memoria",
    exportTxt: "Exportar historial (.txt)",
    activeModel: "MOTOR:",
    connected: "CONECTADO",
    offline: "DESCONECTADO",
    speed: "Velocidad:",
    speedSlow: "Lenta",
    speedNormal: "Normal",
    speedInstant: "Directa",

    glossaryTitle: "GLOSARIO DEL TERMINAL",
    cliDesc: "CLI (Command-Line Interface): Interfaz en línea de comandos basada en texto (Terminal).",
    guiDesc: "GUI (Graphical User Interface): Interfaz gráfica de usuario con ventanas, botones y controles visuales.",
    replayDesc: "REPLAY: Reproduce la animación de inicio y arranque del terminal.",

    menuTitle: "MENÚ PRINCIPAL DARK-GPT",
    optChat: "Abrir Chat Terminal",
    optCreate: "Crear Proyecto",
    optProjects: "Listar Proyectos",
    optSettings: "Ajustes y Claves API",
    optUpdates: "Comprobar Actualizaciones",
    optSessions: "Gestionar Sesiones",
    optDolphin: "Asistente Dolphin 3 / Ollama",
  }
};
