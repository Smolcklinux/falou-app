const CLOUDINARY_CLOUD_NAME = 'dz6aer3tp';
const CLOUDINARY_UPLOAD_PRESET = 'falou_uploads';

export async function uploadToCloudinary(imageUri) {
  try {
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
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {method: 'POST', body: formData}
    );
    
    const data = await response.json();
    if (data.secure_url) {
      return {success: true, url: data.secure_url};
    }
    return {success: false, error: data.error?.message || 'Upload falhou'};
  } catch (error) {
    return {success: false, error: error.message};
  }
}
