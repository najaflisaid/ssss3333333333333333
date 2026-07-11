import AWS from 'aws-sdk';

// R2 Configuration - Hardcoded for direct frontend access
const R2_CONFIG = {
  endpoint: 'https://44da9856774117c8014f20e6abd86864.r2.cloudflarestorage.com',
  accessKeyId: 'f55c4ecf1386625a0bc98e0b69d72e2d',
  secretAccessKey: '18c6bbb26199589cefc8146c0c137c6b71a2b1e28dcdc62b2664ef69d6d649ec',
  region: 'auto',
  bucket: 'epages',
  publicUrl: 'https://pub-9e8ce1f67b0143da86abd4bd7dc5449d.r2.dev'
};

// Initialize S3 client for R2
const s3 = new AWS.S3({
  endpoint: R2_CONFIG.endpoint,
  accessKeyId: R2_CONFIG.accessKeyId,
  secretAccessKey: R2_CONFIG.secretAccessKey,
  region: R2_CONFIG.region,
  signatureVersion: 'v4',
  s3ForcePathStyle: true
});

/**
 * Upload file directly to R2 from frontend
 * @param {File} file - File object from input
 * @param {string} folder - Folder name (default: 'uploads')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadToR2 = async (file, folder = 'uploads') => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Upload parameters
    const uploadParams = {
      Bucket: R2_CONFIG.bucket,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read' // Make file publicly accessible
    };

    // Upload to R2
    await s3.upload(uploadParams).promise();

    // Generate public URL
    const publicUrl = `${R2_CONFIG.publicUrl}/${fileName}`;

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
};

/**
 * Delete file from R2
 * @param {string} fileUrl - Full URL of the file
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFromR2 = async (fileUrl) => {
  try {
    // Extract key from URL
    const key = fileUrl.replace(R2_CONFIG.publicUrl + '/', '');

    await s3.deleteObject({
      Bucket: R2_CONFIG.bucket,
      Key: key
    }).promise();

    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return { success: false, error: error.message || 'Delete failed' };
  }
};

export default { uploadToR2, deleteFromR2 };
