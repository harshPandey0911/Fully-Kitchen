const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildError = (data, fallbackMessage) => {
  const error = new Error(data?.message || fallbackMessage);
  if (data?.code) {
    error.code = data.code;
  }
  return error;
};

export const customerAuthApi = {
  register: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw buildError(data, 'Unable to create account.');
    }

    return data;
  },
  login: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw buildError(data, 'Unable to log in.');
    }

    return data;
  },
};
