/**
 * ============================================
 * FALOU - VERIFICADOR DE PERMISSÕES INICIAL
 * ============================================
 * ✅ VERSÃO MODERNIZADA:
 * 1. Interface mais amigável para o usuário
 * 2. Modais explicativos com design moderno
 * 3. Suporte a múltiplos idiomas (pt-BR)
 * 4. Verificação em etapas
 * 5. Callbacks para ações pós-permissão
 * ============================================
 * Verifica e solicita permissões necessárias ao iniciar o app
 * ============================================
 */

import { Alert, Platform, Linking } from 'react-native';
import { 
  checkAllPermissionsStatus, 
  ensureGalleryPermission, 
  ensureMicrophonePermission,
  ensureCameraPermission,
  resetPermissionsCache
} from '../services/permissions';

// ============================================
// CONFIGURAÇÃO DAS PERMISSÕES
// ============================================
const PERMISSIONS_CONFIG = {
  gallery: {
    title: '📸 Acesso à Galeria',
    message: 'O Falou precisa acessar suas fotos para que você possa:\n\n• Adicionar uma foto de perfil\n• Compartilhar imagens nos momentos\n• Enviar fotos no chat',
    icon: 'image',
    required: true,
  },
  microphone: {
    title: '🎤 Acesso ao Microfone',
    message: 'O Falou precisa acessar seu microfone para que você possa:\n\n• Falar nas salas de voz\n• Se comunicar com outros usuários\n• Participar de eventos ao vivo',
    icon: 'microphone',
    required: true,
  },
  camera: {
    title: '📷 Acesso à Câmera',
    message: 'O Falou precisa acessar sua câmera para que você possa:\n\n• Tirar fotos de perfil\n• Criar conteúdo para os momentos',
    icon: 'camera',
    required: false,
  },
};

// ============================================
// FUNÇÃO PRINCIPAL - VERIFICA PERMISSÕES
// ============================================

/**
 * ✅ Verifica e solicita permissões ao iniciar o app
 * Chamar esta função no SplashScreen ou CompleteProfileScreen
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.showSkipButton - Mostrar botão "Pular" (padrão: false)
 * @param {Function} options.onComplete - Callback quando todas as permissões são resolvidas
 * @param {Function} options.onSkip - Callback quando usuário pula
 */
export const checkInitialPermissions = async (options = {}) => {
  const { showSkipButton = false, onComplete, onSkip } = options;
  
  const status = await checkAllPermissionsStatus();
  
  console.log('📱 [Permissions] Verificando permissões iniciais:', status);
  
  // Verificar permissões necessárias
  const missingPermissions = [];
  
  if (!status.gallery) missingPermissions.push('gallery');
  if (!status.microphone) missingPermissions.push('microphone');
  if (!status.camera && PERMISSIONS_CONFIG.camera.required) missingPermissions.push('camera');
  
  // Se todas as permissões já foram concedidas
  if (missingPermissions.length === 0) {
    console.log('✅ [Permissions] Todas as permissões já foram concedidas');
    onComplete?.();
    return true;
  }
  
  // Mostrar modal explicativo
  await showPermissionsModal(missingPermissions, { showSkipButton, onComplete, onSkip });
  
  return missingPermissions.length === 0;
};

// ============================================
// MODAL DE PERMISSÕES (MODERNO)
// ============================================

/**
 * Mostra modal explicativo sobre as permissões
 * @param {Array} permissions - Lista de permissões a serem solicitadas
 * @param {Object} options - Opções
 */
const showPermissionsModal = async (permissions, options) => {
  const { showSkipButton = false, onComplete, onSkip } = options;
  
  // Configurar mensagem baseada nas permissões faltantes
  const permissionNames = permissions.map(p => {
    switch(p) {
      case 'gallery': return 'Galeria';
      case 'microphone': return 'Microfone';
      case 'camera': return 'Câmera';
      default: return '';
    }
  }).filter(Boolean);
  
  const permissionText = permissionNames.join(' e ');
  const isPlural = permissionNames.length > 1;
  
  const modalConfig = {
    title: `📱 ${permissionNames[0] || 'Permissões'}`,
    message: `Para uma experiência completa no Falou, precisamos acessar ${isPlural ? 'as permissões de ' + permissionText : 'a permissão de ' + permissionText}.\n\nSuas informações estão seguras e serão usadas apenas dentro do app.`,
    buttons: [
      ...(showSkipButton ? [{
        text: 'Pular por agora',
        style: 'cancel',
        onPress: () => {
          console.log('⏭️ [Permissions] Usuário pulou a solicitação de permissões');
          onSkip?.();
        }
      }] : []),
      {
        text: 'Permitir',
        onPress: async () => {
          await requestPermissionsSequentially(permissions, onComplete);
        }
      }
    ]
  };
  
  // Se não tiver skip button, usar alerta mais simples
  if (!showSkipButton && permissions.length === 1) {
    await requestSinglePermission(permissions[0], onComplete);
  } else {
    Alert.alert(modalConfig.title, modalConfig.message, modalConfig.buttons);
  }
};

// ============================================
// SOLICITAR PERMISSÕES SEQUENCIALMENTE
// ============================================

/**
 * Solicita permissões uma por uma
 * @param {Array} permissions - Lista de permissões
 * @param {Function} onComplete - Callback ao finalizar
 */
const requestPermissionsSequentially = async (permissions, onComplete) => {
  let allGranted = true;
  
  for (const permission of permissions) {
    const granted = await requestSinglePermission(permission, onComplete);
    if (!granted && isPermissionRequired(permission)) {
      allGranted = false;
      break;
    }
  }
  
  if (allGranted) {
    console.log('✅ [Permissions] Todas as permissões foram concedidas');
    onComplete?.();
  }
};

// ============================================
// SOLICITAR PERMISSÃO INDIVIDUAL
// ============================================

/**
 * Solicita uma permissão específica
 * @param {string} permission - Tipo da permissão ('gallery', 'microphone', 'camera')
 * @param {Function} onComplete - Callback
 * @returns {Promise<boolean>} - Se a permissão foi concedida
 */
const requestSinglePermission = async (permission, onComplete) => {
  const config = PERMISSIONS_CONFIG[permission];
  if (!config) return false;
  
  let granted = false;
  
  switch(permission) {
    case 'gallery':
      granted = await ensureGalleryPermission();
      break;
    case 'microphone':
      granted = await ensureMicrophonePermission();
      break;
    case 'camera':
      granted = await ensureCameraPermission();
      break;
  }
  
  if (!granted && config.required) {
    // Mostrar alerta com link para configurações
    Alert.alert(
      config.title,
      `${config.message}\n\nPara usar todos os recursos do app, você precisa permitir o acesso nas configurações.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
      ]
    );
  }
  
  return granted;
};

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Verifica se a permissão é obrigatória
 * @param {string} permission - Tipo da permissão
 * @returns {boolean}
 */
const isPermissionRequired = (permission) => {
  return PERMISSIONS_CONFIG[permission]?.required || false;
};

/**
 * 🔧 Função para usar no desenvolvimento - mostra status atual
 */
export const showPermissionsStatus = async () => {
  const status = await checkAllPermissionsStatus();
  
  const getStatusIcon = (granted) => granted ? '✅' : '❌';
  const getStatusText = (granted) => granted ? 'Concedida' : 'Negada';
  
  const statusMessages = [
    `📸 Galeria: ${getStatusIcon(status.gallery)} ${getStatusText(status.gallery)}`,
    `🎤 Microfone: ${getStatusIcon(status.microphone)} ${getStatusText(status.microphone)}`,
    `📷 Câmera: ${getStatusIcon(status.camera)} ${getStatusText(status.camera)}`,
  ];
  
  Alert.alert(
    '📱 Status das Permissões',
    statusMessages.join('\n'),
    [
      { text: 'OK' },
      { 
        text: 'Resetar Cache', 
        onPress: async () => {
          await resetPermissionsCache();
          Alert.alert('Cache Resetado', 'As permissões serão solicitadas novamente na próxima vez.');
        },
        style: 'destructive'
      }
    ]
  );
};

/**
 * 🔧 Verifica permissões e retorna objeto com status detalhado
 * @returns {Promise<Object>}
 */
export const getDetailedPermissionsStatus = async () => {
  const status = await checkAllPermissionsStatus();
  
  return {
    allGranted: status.gallery && status.microphone,
    gallery: {
      granted: status.gallery,
      required: PERMISSIONS_CONFIG.gallery.required,
      title: PERMISSIONS_CONFIG.gallery.title,
    },
    microphone: {
      granted: status.microphone,
      required: PERMISSIONS_CONFIG.microphone.required,
      title: PERMISSIONS_CONFIG.microphone.title,
    },
    camera: {
      granted: status.camera,
      required: PERMISSIONS_CONFIG.camera.required,
      title: PERMISSIONS_CONFIG.camera.title,
    },
  };
};

/**
 * 🔧 Verifica permissões na tela de perfil (quando necessário)
 * @param {string} permissionType - Tipo da permissão ('gallery', 'microphone', 'camera')
 * @param {Function} onGranted - Callback quando permissão é concedida
 * @returns {Promise<boolean>}
 */
export const checkPermissionOnDemand = async (permissionType, onGranted) => {
  const config = PERMISSIONS_CONFIG[permissionType];
  if (!config) return false;
  
  let granted = false;
  
  switch(permissionType) {
    case 'gallery':
      granted = await ensureGalleryPermission();
      break;
    case 'microphone':
      granted = await ensureMicrophonePermission();
      break;
    case 'camera':
      granted = await ensureCameraPermission();
      break;
  }
  
  if (granted && onGranted) {
    onGranted();
  } else if (!granted) {
    Alert.alert(
      config.title,
      config.message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
      ]
    );
  }
  
  return granted;
};