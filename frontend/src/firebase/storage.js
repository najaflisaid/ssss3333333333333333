// Cloudinary - Pulsuz və birbaşa frontend-dən işləyir

const CLOUD_NAME = "du5oxqn2x";
const UPLOAD_PRESET = "epages_unsigned";

export const uploadFile = async (file, folder = "uploads") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error("Fayl yüklənə bilmədi");
    }
    
    const data = await response.json();
    
    return { success: true, url: data.secure_url };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
};

export const uploadMultipleFiles = async (files, folder = "uploads") => {
  const results = [];
  for (const file of files) {
    const result = await uploadFile(file, folder);
    results.push(result);
  }
  return results;
};

// Delete file from Cloudinary (URL-dən public_id çıxarır və silir)
export const deleteFile = async (fileUrl) => {
  try {
    // Cloudinary URL-dən public_id çıxar
    // Format: https://res.cloudinary.com/du5oxqn2x/image/upload/v1234567890/folder/filename.jpg
    const urlParts = fileUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    // Get everything after 'upload/v1234567890/'
    const pathParts = urlParts.slice(uploadIndex + 2);
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Note: Cloudinary deletion requires authentication which cannot be done from frontend
    // For now, we'll just log it. In production, this should be done via backend API
    console.log('File deletion requested for:', publicId);
    console.log('Note: Cloudinary file deletion requires backend API with API secret');
    
    return { success: true, message: 'Delete request logged' };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
};
