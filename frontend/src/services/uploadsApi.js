const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const uploadsApi = {
  uploadFile: async (file, { folder = '' } = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`${API_BASE_URL}/api/uploads`, {
      method: 'POST',
      body: formData,
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to upload file.');
    }

    return data;
  },
};
