const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const adminRetailersApi = {
  listLoggedIn: async () => {
    const response = await fetch(`${API_BASE_URL}/api/retailers?loggedInOnly=true`);
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load retailers.');
    }
    return data;
  },
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/retailers`);
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load retailers.');
    }
    return data;
  },
};
