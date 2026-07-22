// ============================================================
// COMUNIDAD FEELING — CONFIGURACIÓN CENTRAL
// Única fuente de verdad para URLs, parámetros y diseño.
// Solo modificar este archivo para adaptar a producción.
// ============================================================

// ------------------------------------------------------------
// 1. VERSIÓN DE LA APP
// ------------------------------------------------------------
export const V_NAME = '1.0';   // Texto de versión
export const V_CODE = 10;      // Código de versión (entero 2 dígitos)

// ------------------------------------------------------------
// 2. WEBHOOKS (completar URLs al pasar a producción)
// ------------------------------------------------------------
export const URL_SIGNUP = 'https://n8n.workcapital.com.ar/webhook/cfeel/singup';
export const URL_REGISTRO = 'https://n8n.workcapital.com.ar/webhook/cfeel/registro';
export const URL_CONFIRMAR_REGISTRO = 'https://n8n.workcapital.com.ar/webhook/cfeel/confirmar_registro';
export const URL_HEADER_FEED = 'https://n8n.workcapital.com.ar/webhook/cfeel/feed';
export const URL_CRONOMETRO = 'https://n8n.workcapital.com.ar/webhook/cfeel/cronometro';
export const URL_CONTACTO = 'https://n8n.workcapital.com.ar/webhook/cfeel/contacto';
export const URL_NOTIFICACION_MASIVA = 'https://n8n.workcapital.com.ar/webhook/notificacion-masiva';
export const URL_MENU_EMPRESAS = 'https://n8n.workcapital.com.ar/webhook/cfeel/menu_empresas';
export const URL_MENU_NOVEDADES = 'https://n8n.workcapital.com.ar/webhook/cfeel/novedades';
export const URL_MENU_GALERIA = 'https://n8n.workcapital.com.ar/webhook/cfeel/menu_galeria';
export const URL_REGISTRO_AVANCE_VIDEO = 'https://n8n.workcapital.com.ar/webhook/cfeel/avance_video';
export const URL_MENU_AGENDA = 'https://n8n.workcapital.com.ar/webhook/cfeel/menu_eventos';
export const URL_REGISTRAR_USUARIO_ACTIVIDAD = 'https://n8n.workcapital.com.ar/webhook/cfeel/registro_actividades';
export const URL_BIOGRAFIA = 'https://n8n.workcapital.com.ar/webhook/cfeel/menu_biografia';
export const URL_FAQ = 'https://n8n.workcapital.com.ar/webhook/cfeel/faq';
export const URL_BIBLIOTECA_AUDIO = 'https://n8n.workcapital.com.ar/webhook/cfeel/musica_podcast';
export const URL_TOGGLE_FAVORITO = 'https://n8n.workcapital.com.ar/webhook/cfeel/toogle_favorito';
export const URL_REGISTRAR_PLAY = 'https://n8n.workcapital.com.ar/webhook/cfeel/registrar_play';
export const URL_LISTAS_ESPECIALES = 'https://n8n.workcapital.com.ar/webhook/cfeel/listas_especiales';
export const URL_EJERCICIOS = 'https://n8n.workcapital.com.ar/webhook/ejercicios';

// ------------------------------------------------------------
// 3. PARÁMETROS DEL SISTEMA
// ------------------------------------------------------------
export const MINUTOS_PARA_ACTIVACION = 120;   // Minutos de uso para pasar a u_activo=true
export const CAROUSEL_INTERVAL_MS = 3000;  // Intervalo del auto-carrusel (ms)
export const MAX_INTENTOS_CODIGO = 3;     // Intentos del código WhatsApp
export const DEVICE_ID_SUFFIX = 'VGPDA';
export const DEVICE_ID_LENGTH = 17;    // Chars aleatorios antes del sufijo
export const USE_MOCKS = false;  // ← cambiar a false cuando se conecte n8n

export const MSG_BIENVENIDA = "¡Bienvenido a Comunidad Feeling! Gracias por vuestro interés en conocernos. Podrás con esta 'App' adentrarte en el corazón de la comunidad y explorar todos nuestros rincones. Te anhelamos una profunda experiencia y a descubrirnos...";

// ------------------------------------------------------------
// 4. TEMAS DE COLOR (7 temas — misma paleta, distintas intensidades)
// Paleta base: oro y azul en variaciones claras y oscuras, más frío profundo original.
// ------------------------------------------------------------
export type ColorThemeId =
  | 'frio_profundo'
  | 'azul_cards_claro_1'
  | 'azul_cards_claro_2'
  | 'oro_oscuro_2'
  | 'oro_cards_oscuro_1'
  | 'oro_cards_oscuro_2';

export interface ColorTheme {
  id: ColorThemeId;
  nombre: string;
  descripcion: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  card: string;
  cardBgFrase: string;
  cardBgEmpresa: string;
  cardBgLugar: string;
  cardBgTestimonio: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  navBackground: string;
  navGradientStart: string;
  navGradientEnd: string;
  border: string;
  borderRadius: number;
  success: string;
  error: string;
  warning: string;
  textOnCardLeftLight: string;
  textOnCardLeftDark: string;
  textOnCardRight: string;
  statusBarStyle: 'light' | 'dark';
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  frio_profundo: {
    id: 'frio_profundo',
    nombre: 'Frío Profundo (Original)',
    descripcion: 'Azul marino clásico, fidelidad absoluta al diseño base',
    primary: '#0a192f',
    primaryLight: '#1a3a5c',
    accent: '#ec5b13',
    accentDark: '#c44d0f',
    background: '#060f1e',
    surface: '#0d1f35',
    card: '#112240',
    cardBgFrase: '#4a0404',        // Bordo
    cardBgEmpresa: '#ec5b13',      // Naranja
    cardBgLugar: '#0a192f',        // Azul
    cardBgTestimonio: '#facc15',   // Amarillo
    textPrimary: '#e8f0f9',
    textSecondary: '#8baac5',
    textAccent: '#ec5b13',
    navBackground: '#060f1e',
    navGradientStart: '#0a192f',
    navGradientEnd: '#060f1e',
    border: '#1e3a5c',
    borderRadius: 12,
    success: '#2dd4bf',
    error: '#f87171',
    warning: '#facc15',
    textOnCardLeftLight: '#facc15',
    textOnCardLeftDark: '#4a0404',
    textOnCardRight: '#facc15',
    statusBarStyle: 'light',
  },

  azul_cards_claro_1: {
    id: 'azul_cards_claro_1',
    nombre: 'Azul Marino Degradado (Claro)',
    descripcion: 'Fondo claro con tarjetas en diferentes gamas de azul marino',
    primary: '#0f172a',
    primaryLight: '#1e3a8a',
    accent: '#3b82f6',
    accentDark: '#1e3a8a',
    background: '#f8fafc',
    surface: '#f1f5f9',
    card: '#ffffff',
    cardBgFrase: '#0f172a',
    cardBgEmpresa: '#1e3a8a',
    cardBgLugar: '#3b82f6',
    cardBgTestimonio: '#60a5fa',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textAccent: '#1e3a8a',
    navBackground: '#f8fafc',
    navGradientStart: '#ffffff',
    navGradientEnd: '#e2e8f0',
    border: '#cbd5e1',
    borderRadius: 12,
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    textOnCardLeftLight: '#ffffff',
    textOnCardLeftDark: '#0f172a',
    textOnCardRight: '#002060',
    statusBarStyle: 'dark',
  },

  azul_cards_claro_2: {
    id: 'azul_cards_claro_2',
    nombre: 'Cobalto e Hielo (Claro)',
    descripcion: 'Fondo blanco frío con tarjetas en gamas de cobalto y cian',
    primary: '#1e40af',
    primaryLight: '#3b82f6',
    accent: '#0284c7',
    accentDark: '#0369a1',
    background: '#f0f9ff',
    surface: '#e0f2fe',
    card: '#ffffff',
    cardBgFrase: '#1d4ed8',
    cardBgEmpresa: '#2563eb',
    cardBgLugar: '#0284c7',
    cardBgTestimonio: '#06b6d4',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textAccent: '#0369a1',
    navBackground: '#f0f9ff',
    navGradientStart: '#ffffff',
    navGradientEnd: '#bae6fd',
    border: '#bae6fd',
    borderRadius: 16,
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706',
    textOnCardLeftLight: '#ffffff',
    textOnCardLeftDark: '#0f172a',
    textOnCardRight: '#1e40af',
    statusBarStyle: 'dark',
  },

  oro_oscuro_2: {
    id: 'oro_oscuro_2',
    nombre: 'Azul Cósmico y Oro (Oscuro)',
    descripcion: 'Fondo azul noche profundo con acentos de oro brillante 24k',
    primary: '#002060',
    primaryLight: '#003399',
    accent: '#FFD700',
    accentDark: '#CCAC00',
    background: '#030712',
    surface: '#0F172A',
    card: '#1E293B',
    cardBgFrase: '#FFD700',
    cardBgEmpresa: '#002060',
    cardBgLugar: '#1E293B',
    cardBgTestimonio: '#003399',
    textPrimary: '#F9FBFD',
    textSecondary: '#94A3B8',
    textAccent: '#FFD700',
    navBackground: '#030712',
    navGradientStart: '#0F172A',
    navGradientEnd: '#030712',
    border: '#334155',
    borderRadius: 16,
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    textOnCardLeftLight: '#030712',
    textOnCardLeftDark: '#FFFFFF',
    textOnCardRight: '#FFD700',
    statusBarStyle: 'light',
  },

  oro_cards_oscuro_1: {
    id: 'oro_cards_oscuro_1',
    nombre: 'Oro Imperial (Oscuro)',
    descripcion: 'Fondo oscuro elegante con tarjetas en gamas de oro refinado',
    primary: '#0f172a',
    primaryLight: '#1e293b',
    accent: '#C5A059',
    accentDark: '#85581A',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#0f172a',
    cardBgFrase: '#85581A',
    cardBgEmpresa: '#C5A059',
    cardBgLugar: '#D4AF37',
    cardBgTestimonio: '#F3E5AB',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textAccent: '#D4AF37',
    navBackground: '#0f172a',
    navGradientStart: '#1e293b',
    navGradientEnd: '#0f172a',
    border: '#334155',
    borderRadius: 12,
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    textOnCardLeftLight: '#ffffff',
    textOnCardLeftDark: '#0f172a',
    textOnCardRight: '#FFD700',
    statusBarStyle: 'light',
  },

  oro_cards_oscuro_2: {
    id: 'oro_cards_oscuro_2',
    nombre: 'Amanecer Áureo (Oscuro)',
    descripcion: 'Fondo chocolate profundo con tarjetas en tonos oro cálido y ámbar',
    primary: '#180b02',
    primaryLight: '#271203',
    accent: '#d97706',
    accentDark: '#b45309',
    background: '#180b02',
    surface: '#271203',
    card: '#1e0a00',
    cardBgFrase: '#78350f',
    cardBgEmpresa: '#b45309',
    cardBgLugar: '#d97706',
    cardBgTestimonio: '#f59e0b',
    textPrimary: '#fef3c7',
    textSecondary: '#d97706',
    textAccent: '#f59e0b',
    navBackground: '#180b02',
    navGradientStart: '#271203',
    navGradientEnd: '#180b02',
    border: '#451a03',
    borderRadius: 8,
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    textOnCardLeftLight: '#ffffff',
    textOnCardLeftDark: '#1c0d02',
    textOnCardRight: '#fcd34d',
    statusBarStyle: 'light',
  },
};

export const DEFAULT_COLOR_THEME: ColorThemeId = 'frio_profundo';

// Orden para el desplegable dev
export const COLOR_THEME_ORDER: ColorThemeId[] = [
  'frio_profundo',
  'azul_cards_claro_1',
  'azul_cards_claro_2',
  'oro_oscuro_2',
  'oro_cards_oscuro_1',
  'oro_cards_oscuro_2',
];

// ------------------------------------------------------------
// 5. COMBOS TIPOGRÁFICOS (4 combos — independientes del color)
// Cada combo define la fuente para cada rol en la app.
// ------------------------------------------------------------
export type FontComboId = 'combo_a' | 'combo_b' | 'combo_c' | 'combo_d';

export interface FontCombo {
  id: FontComboId;
  nombre: string;
  descripcion: string;
  // Fuentes (nombres de Google Fonts / expo-google-fonts)
  fraseDia: string;     // Frase del Día — serif
  titulos: string;      // Títulos de tarjetas y secciones
  cuerpo: string;       // Texto de cuerpo y descripciones
  labelsNav: string;    // Labels del tab bar
  // Tamaños base
  sizeFraseDia: number;
  sizeTitulo: number;
  sizeCuerpo: number;
  sizeLabel: number;
}

export const FONT_COMBOS: Record<FontComboId, FontCombo> = {
  combo_a: {
    id: 'combo_a',
    nombre: 'Elegante Serif',
    descripcion: 'PlayfairDisplay + PublicSans — Clásico y moderno',
    fraseDia: 'PlayfairDisplay_400Regular_Italic',
    titulos: 'PlayfairDisplay_700Bold',
    cuerpo: 'PublicSans_400Regular',
    labelsNav: 'PublicSans_600SemiBold',
    sizeFraseDia: 18,
    sizeTitulo: 20,
    sizeCuerpo: 15,
    sizeLabel: 11,
  },
  combo_b: {
    id: 'combo_b',
    nombre: 'Impacto Urbano',
    descripcion: 'Montserrat + Archivo Black — Fuerza y visibilidad máxima',
    fraseDia: 'Fraunces_400Regular_Italic', // Un toque de estilo para la frase
    titulos: 'Montserrat_700Bold',         // Títulos de tarjetas muy potentes
    cuerpo: 'Archivo_400Regular',
    labelsNav: 'Montserrat_600SemiBold',
    sizeFraseDia: 18,
    sizeTitulo: 19,
    sizeCuerpo: 14,
    sizeLabel: 11,
  },
  combo_c: {
    id: 'combo_c',
    nombre: 'Tech Futurista',
    descripcion: 'Space Grotesk + Syne — Diseño vanguardista y geométrico',
    fraseDia: 'SpaceGrotesk_300Light',
    titulos: 'Syne_700Bold',               // Títulos con muchísima personalidad
    cuerpo: 'SpaceGrotesk_400Regular',
    labelsNav: 'Syne_600SemiBold',
    sizeFraseDia: 20,
    sizeTitulo: 21,
    sizeCuerpo: 15,
    sizeLabel: 10,
  },
  combo_d: {
    id: 'combo_d',
    nombre: 'Elegancia Brutalista',
    descripcion: 'Fraunces + DM Sans — Contraste entre lo clásico y lo industrial',
    fraseDia: 'Fraunces_600SemiBold_Italic',
    titulos: 'Fraunces_700Bold',            // Títulos serif con mucho "peso"
    cuerpo: 'DMSans_400Regular',
    labelsNav: 'DMSans_700Bold',
    sizeFraseDia: 19,
    sizeTitulo: 22,
    sizeCuerpo: 15,
    sizeLabel: 11,
  },
};

export const DEFAULT_FONT_COMBO: FontComboId = 'combo_d';

export const FONT_COMBO_ORDER: FontComboId[] = [
  'combo_a',
  'combo_b',
  'combo_c',
  'combo_d',
];
