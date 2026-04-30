import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinary as uploadToCloudinaryAPI } from './upload';

export const pickAndUploadImage = async () => {
  return new Promise((resolve) => {
    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        const result = await uploadToCloudinaryAPI(response.assets[0].uri);
        resolve(result);
      } else {
        resolve({ success: false, error: 'Nenhuma imagem selecionada' });
      }
    });
  });
};

export const uploadAvatar = pickAndUploadImage;
