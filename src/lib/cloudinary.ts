const CLOUD_NAME = 'djup7klv2';
const UPLOAD_PRESET = 'lena cutz';

export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Please choose an image under 10 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Image upload failed. Please try again.');
  }

  return data.secure_url as string;
}
