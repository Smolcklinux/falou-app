import {pickImageFromGallery} from './imagePicker';
import {uploadToCloudinary as uploadToCloudinaryAPI} from './upload';

export const pickAndUploadImage = async () => {
  const result = await pickImageFromGallery();
  if (!result.success) {
    return result;
  }
  return await uploadToCloudinaryAPI(result.uri);
};

export const uploadAvatar = pickAndUploadImage;
