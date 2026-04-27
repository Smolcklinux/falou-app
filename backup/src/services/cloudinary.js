// ============================================
// FALOU - SERVIÇO DE UPLOAD CLOUDINARY
// ============================================
// ✅ CORREÇÕES REALIZADAS:
// 1. Usa ensureGalleryPermission com cache
// 2. Não pede permissão novamente se já concedida
// ============================================

import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { ensureGalleryPermission } from './permissions'; // ✅ Import correto

const CLOUDINARY_CLOUD_NAME = 'dz6aer3tp';
const CLOUDINARY_UPLOAD_PRESET = 'falou_uploads';

export async function uploadToCloudinary(imageUri) {
  try {
    console.log('📤 [Cloudinary] Iniciando upload...');

    const formData = new FormData();
    
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('file', {
      uri: imageUri,
      name: filename || 'photo.jpg',
      type: type,
    });
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (data.secure_url) {
      console.log('✅ [Cloudinary] Upload OK:', data.secure_url);
      return { success: true, url: data.secure_url };
    } else {
      console.error('❌ [Cloudinary] Erro:', data.error);
      return { success: false, error: data.error?.message || 'Upload falhou' };
    }
  } catch (error) {
    console.error('❌ [Cloudinary] Erro na requisição:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Tempo limite excedido (30s)' };
    }
    return { success: false, error: error.message };
  }
}

// ✅ Função melhorada COM CACHE de permissão
export async function pickAndUploadImage() {
  try {
    // ✅ Agora usa ensureGalleryPermission com cache
    // Só vai pedir a permissão uma vez na vida do app
    const hasPermission = await ensureGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos para enviar imagens.');
      return { success: false, error: 'Permissão negada' };
    }

    // Abrir galeria
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return await uploadToCloudinary(result.assets[0].uri);
    }
    
    return { success: false, error: 'Nenhuma imagem selecionada' };
  } catch (error) {
    console.error('❌ [Cloudinary] pickAndUploadImage:', error);
    return { success: false, error: error.message };
  }
}

// ✅ Mantido para compatibilidade
export const uploadAvatar = pickAndUploadImage;