/**
 * ============================================
 * FALOU - SISTEMA DE CORES
 * ============================================
 * ✅ VERSÃO CORRIGIDA:
 * 1. Paleta de cores completa e organizada
 * 2. Cores para temas claro/escuro
 * 3. Gradientes pré-definidos
 * 4. Cores semânticas para estados
 * 5. Variáveis de tema unificadas
 * ============================================
 */

// ============================================
// CORES BASE
// ============================================
const baseColors = {
  // Cores primárias
  primary: '#6c63ff',
  primaryLight: '#8b84ff',
  primaryDark: '#4a42cc',
  
  // Cores secundárias
  secondary: '#4ecdc4',
  secondaryLight: '#6ee0d8',
  secondaryDark: '#36a89f',
  
  // Cores de destaque
  accent: '#f093fb',
  accentLight: '#f5a1f8',
  accentDark: '#d45ce3',
  
  // Cores de neutro
  white: '#ffffff',
  black: '#000000',
  
  // Cores de fundo - Modo Escuro
  background: '#1a1a2e',
  backgroundLight: '#22223b',
  backgroundDark: '#0f0f1a',
  
  // Cores de cards
  card: '#16213e',
  cardLight: '#1e2a4a',
  cardDark: '#0f1428',
  
  // Cores de texto
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textTertiary: '#6c6c8a',
  textLight: '#dddddd',
  
  // Cores de borda
  border: '#2a2a4a',
  borderLight: '#3a3a5a',
  borderDark: '#1a1a3a',
};

// ============================================
// CORES DE ESTADO
// ============================================
const stateColors = {
  success: '#4ecdc4',
  successLight: '#6ee0d8',
  successDark: '#36a89f',
  successBg: 'rgba(78, 205, 196, 0.1)',
  
  error: '#ff6b6b',
  errorLight: '#ff8a8a',
  errorDark: '#e04e4e',
  errorBg: 'rgba(255, 107, 107, 0.1)',
  
  warning: '#ffe66d',
  warningLight: '#ffea8a',
  warningDark: '#e0c74e',
  warningBg: 'rgba(255, 230, 109, 0.1)',
  
  info: '#4facfe',
  infoLight: '#6bbefe',
  infoDark: '#3a8ad4',
  infoBg: 'rgba(79, 172, 254, 0.1)',
};

// ============================================
// CORES DE GRADIENTE (PRÉ-DEFINIDOS)
// ============================================
const gradients = {
  primary: ['#6c63ff', '#4ecdc4'],
  secondary: ['#4ecdc4', '#36a89f'],
  accent: ['#f093fb', '#f5576c'],
  success: ['#4ecdc4', '#43e97b'],
  warning: ['#ffe66d', '#f5576c'],
  danger: ['#ff6b6b', '#f093fb'],
  info: ['#4facfe', '#00f2fe'],
  dark: ['#16213e', '#0f0f1a'],
  light: ['#ffffff', '#f5f5f5'],
  gold: ['#FFD700', '#FFA500'],
  silver: ['#C0C0C0', '#A9A9A9'],
  bronze: ['#CD7F32', '#B8860B'],
};

// ============================================
// CORES DE STATUS (ONLINE, OFFLINE, ETC)
// ============================================
const statusColors = {
  online: '#4ecdc4',
  offline: '#6c6c8a',
  away: '#ffe66d',
  busy: '#ff6b6b',
};

// ============================================
// CORES DE GÊNERO
// ============================================
const genderColors = {
  male: '#6c63ff',
  female: '#ff6b6b',
  other: '#4ecdc4',
};

// ============================================
// CORES DE NÍVEIS
// ============================================
const levelColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#4ecdc4',
  diamond: '#6c63ff',
};

// ============================================
// SISTEMA DE TEMAS
// ============================================
const themes = {
  dark: {
    background: baseColors.background,
    backgroundLight: baseColors.backgroundLight,
    card: baseColors.card,
    cardLight: baseColors.cardLight,
    text: baseColors.text,
    textSecondary: baseColors.textSecondary,
    border: baseColors.border,
    headerGradient: ['rgba(22, 33, 62, 0.95)', 'rgba(22, 33, 62, 0)'],
  },
};

// ============================================
// EXPORTAÇÃO PRINCIPAL (MANTENDO COMPATIBILIDADE)
// ============================================
export const colors = {
  // Cores base
  background: baseColors.background,
  card: baseColors.card,
  primary: baseColors.primary,
  text: baseColors.text,
  textSecondary: baseColors.textSecondary,
  danger: stateColors.error,
  success: stateColors.success,
  warning: stateColors.warning,
  border: baseColors.border,
  
  // Cores estendidas (para uso avançado)
  baseColors,
  stateColors,
  gradients,
  statusColors,
  genderColors,
  levelColors,
  themes,
};

// Exportação individual para facilitar imports
export {
  baseColors,
  stateColors,
  gradients,
  statusColors,
  genderColors,
  levelColors,
  themes,
};