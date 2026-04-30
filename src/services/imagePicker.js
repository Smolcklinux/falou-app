import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

const options = {
  mediaType: 'photo',
  includeBase64: false,
  maxHeight: 800,
  maxWidth: 800,
  quality: 0.7,
};

export const pickImageFromGallery = async () => {
  return new Promise((resolve) => {
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        resolve({success: false, error: 'Usuário cancelou'});
      } else if (response.errorCode) {
        resolve({success: false, error: response.errorMessage});
      } else if (response.assets && response.assets[0]) {
        resolve({success: true, uri: response.assets[0].uri});
      } else {
        resolve({success: false, error: 'Nenhuma imagem selecionada'});
      }
    });
  });
};

export const takePhoto = async () => {
  return new Promise((resolve) => {
    launchCamera(options, (response) => {
      if (response.didCancel) {
        resolve({success: false, error: 'Usuário cancelou'});
      } else if (response.errorCode) {
        resolve({success: false, error: response.errorMessage});
      } else if (response.assets && response.assets[0]) {
        resolve({success: true, uri: response.assets[0].uri});
      } else {
        resolve({success: false, error: 'Nenhuma foto tirada'});
      }
    });
  });
};
