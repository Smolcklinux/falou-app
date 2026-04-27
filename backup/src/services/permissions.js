/**
 * ============================================
 * FALOU - SERVIÇO DE PERMISSÕES
 * ============================================
 * ✅ CORREÇÕES REALIZADAS (ERRO DE PERMISSÃO):
 * 1. Adicionado suporte para READ_MEDIA_IMAGES (Android 13+)
 * 2. Melhorada detecção de versão do Android
 * 3. Adicionado cache persistente
 * 4. Fluxo de permissão mais amigável
 * ============================================
 */

import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔑 Chaves para armazenar status das permissões
const STORAGE_KEYS = {
  MICROPHONE: '@falou_permission_microphone',
  GALLERY: '@falou_permission_gallery',
  CAMERA: '@falou_permission_camera',
};

/**
 * ✅ Verifica a versão do Android para usar a permissão correta
 * Android 13+ (API 33+) usa READ_MEDIA_IMAGES
 * Android 12- (API 32-) usa READ_EXTERNAL_STORAGE
 */
const getGalleryPermission = () => {
  if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;
    if (apiLevel >= 33) { // Android 13+
      return PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
    } else {
      return PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    }
  } else if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }
  return null;
};

/**
 * ✅ Verifica se a permissão já foi concedida anteriormente (cache)
 */
const hasCachedPermission = async (storageKey) => {
  try {
    const cached = await AsyncStorage.getItem(storageKey);
    return cached === 'granted';
  } catch (error) {
    console.error('Erro ao ler cache de permissão:', error);
    return false;
  }
};

/**
 * ✅ Salva o status da permissão no cache
 */
const cachePermission = async (storageKey, granted) => {
  try {
    await AsyncStorage.setItem(storageKey, granted ? 'granted' : 'denied');
  } catch (error) {
    console.error('Erro ao salvar cache de permissão:', error);
  }
};

/**
 * ✅ Verifica permissão da galeria (compatível com Android 13+)
 */
export const checkGalleryPermission = async () => {
  try {
    const permission = getGalleryPermission();
    if (!permission) return false;
    
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Erro ao verificar permissão da galeria:', error);
    return false;
  }
};

/**
 * ✅ Solicita permissão da galeria (apenas uma vez)
 */
export const requestGalleryPermission = async () => {
  // 🔍 Verificar cache primeiro
  const hasCached = await hasCachedPermission(STORAGE_KEYS.GALLERY);
  if (hasCached) {
    console.log('✅ Permissão da galeria já concedida (cache)');
    return true;
  }

  // 🔍 Verificar permissão atual do sistema
  const currentPermission = await checkGalleryPermission();
  if (currentPermission) {
    await cachePermission(STORAGE_KEYS.GALLERY, true);
    return true;
  }

  // ❌ Não tem permissão, pedir ao usuário
  const permission = getGalleryPermission();
  if (!permission) return false;

  try {
    let result;
    
    if (Platform.OS === 'android') {
      result = await PermissionsAndroid.request(permission, {
        title: '📸 Permissão de Galeria',
        message: 'O Falou precisa acessar suas fotos para que você possa:\n\n• Adicionar foto de perfil\n• Compartilhar imagens nos momentos\n• Enviar fotos no chat',
        buttonNeutral: 'Perguntar depois',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Permitir',
      });
    } else {
      const iosResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      result = iosResult === RESULTS.GRANTED ? PermissionsAndroid.RESULTS.GRANTED : PermissionsAndroid.RESULTS.DENIED;
    }
    
    const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
    await cachePermission(STORAGE_KEYS.GALLERY, isGranted);
    
    if (!isGranted) {
      // Se negado, mostrar alerta com opção de abrir configurações
      Alert.alert(
        'Permissão Necessária 📸',
        'Para adicionar fotos de perfil e momentos, você precisa permitir o acesso à galeria nas configurações.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    }
    
    return isGranted;
  } catch (error) {
    console.error('Erro ao solicitar permissão da galeria:', error);
    return false;
  }
};

/**
 * ✅ Solicita permissão do microfone (apenas uma vez)
 */
export const requestMicrophonePermission = async () => {
  const hasCached = await hasCachedPermission(STORAGE_KEYS.MICROPHONE);
  if (hasCached) {
    console.log('✅ Permissão do microfone já concedida (cache)');
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: '🎤 Permissão do Microfone',
          message: 'O Falou precisa acessar seu microfone para que você possa falar nas salas de voz e se comunicar com outros usuários.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      await cachePermission(STORAGE_KEYS.MICROPHONE, isGranted);
      return isGranted;
    } catch (error) {
      console.error('Erro ao solicitar permissão do microfone:', error);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    const result = await request(PERMISSIONS.IOS.MICROPHONE);
    const isGranted = result === RESULTS.GRANTED;
    await cachePermission(STORAGE_KEYS.MICROPHONE, isGranted);
    return isGranted;
  }
  return false;
};

/**
 * ✅ Solicita permissão da câmera (apenas uma vez)
 */
export const requestCameraPermission = async () => {
  const hasCached = await hasCachedPermission(STORAGE_KEYS.CAMERA);
  if (hasCached) {
    console.log('✅ Permissão da câmera já concedida (cache)');
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: '📷 Permissão da Câmera',
          message: 'O Falou precisa acessar sua câmera para que você possa tirar fotos de perfil.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      await cachePermission(STORAGE_KEYS.CAMERA, isGranted);
      return isGranted;
    } catch (error) {
      console.error('Erro ao solicitar permissão da câmera:', error);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    const result = await request(PERMISSIONS.IOS.CAMERA);
    const isGranted = result === RESULTS.GRANTED;
    await cachePermission(STORAGE_KEYS.CAMERA, isGranted);
    return isGranted;
  }
  return false;
};

/**
 * ✅ Função principal para garantir permissão da galeria
 */
export const ensureGalleryPermission = async () => {
  return await requestGalleryPermission();
};

/**
 * ✅ Função principal para garantir permissão do microfone
 */
export const ensureMicrophonePermission = async () => {
  return await requestMicrophonePermission();
};

/**
 * ✅ Função principal para garantir permissão da câmera
 */
export const ensureCameraPermission = async () => {
  return await requestCameraPermission();
};

/**
 * 🔧 Resetar cache de permissões (para teste)
 */
export const resetPermissionsCache = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MICROPHONE);
    await AsyncStorage.removeItem(STORAGE_KEYS.GALLERY);
    await AsyncStorage.removeItem(STORAGE_KEYS.CAMERA);
    console.log('🔄 Cache de permissões resetado');
  } catch (error) {
    console.error('Erro ao resetar cache:', error);
  }
};