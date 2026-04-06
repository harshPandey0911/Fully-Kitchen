import { v2 as cloudinary } from 'cloudinary';

const readCloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
  apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  baseFolder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'kitchen-appliance',
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = readCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

const ensureCloudinaryConfig = () => {
  const config = readCloudinaryConfig();

  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.',
    );
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return config;
};

const toDataUri = (buffer, mimetype) =>
  `data:${mimetype || 'application/octet-stream'};base64,${buffer.toString('base64')}`;

export const uploadBufferToCloudinary = async ({
  buffer,
  mimetype,
  folder = '',
  originalName = '',
}) => {
  const { baseFolder } = ensureCloudinaryConfig();

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('File buffer is missing for upload.');
  }

  const normalizedFolder = String(folder || '')
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');
  const destinationFolder = normalizedFolder ? `${baseFolder}/${normalizedFolder}` : baseFolder;

  const uploadedAsset = await cloudinary.uploader.upload(toDataUri(buffer, mimetype), {
    folder: destinationFolder,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    filename_override: originalName || undefined,
  });

  return {
    url: uploadedAsset.url || '',
    secureUrl: uploadedAsset.secure_url || uploadedAsset.url || '',
    publicId: uploadedAsset.public_id || '',
    resourceType: uploadedAsset.resource_type || '',
    format: uploadedAsset.format || '',
    originalName,
    bytes: Number(uploadedAsset.bytes || 0),
  };
};
