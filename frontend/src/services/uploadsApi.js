const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getFileExtension = (file) => {
  const fromName = String(file?.name || '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase();

  if (fromName) {
    return fromName;
  }

  return String(file?.type || '')
    .split('/')
    .pop()
    ?.trim()
    .toLowerCase();
};

const canUseLocalFallback = (response, data) => {
  if (!response) {
    return true;
  }

  if (response.ok) {
    return !data?.asset;
  }

  return response.status === 404 || response.status === 405 || response.status >= 500 || !data?.message;
};

const buildLocalAsset = (file, folder = '') => ({
  url: '',
  secureUrl: '',
  publicId: `local-${folder || 'uploads'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  resourceType: String(file?.type || '').split('/')[0] || 'raw',
  format: getFileExtension(file) || '',
  originalName: file?.name || '',
  bytes: Number(file?.size || 0),
  source: 'local-fallback',
});

export const uploadsApi = {
  uploadFile: async (file, { folder = '' } = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: 'POST',
        body: formData,
      });

      const data = await parseJsonSafely(response);

      if (response.ok && data?.asset) {
        return data;
      }

      if (canUseLocalFallback(response, data)) {
        return {
          success: true,
          message: 'File attached locally.',
          asset: buildLocalAsset(file, folder),
        };
      }

      throw new Error(data?.message || 'Unable to upload file.');
    } catch (error) {
      if (error instanceof Error && error.message && error.message !== 'Failed to fetch') {
        throw error;
      }

      return {
        success: true,
        message: 'File attached locally.',
        asset: buildLocalAsset(file, folder),
      };
    }
  },
};
