import { PermissionsAndroid, Platform } from 'react-native';

export const requestMicrophonePermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permissão do Microfone',
        message: 'O Falou precisa acessar seu microfone para as salas de voz',
        buttonPositive: 'Permitir',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const ensureMicrophonePermission = requestMicrophonePermission;
export const ensureGalleryPermission = async () => true;
export const ensureCameraPermission = async () => true;
export const checkAllPermissionsStatus = async () => ({ microphone: true, gallery: true, camera: true });
export const resetPermissionsCache = async () => {};
