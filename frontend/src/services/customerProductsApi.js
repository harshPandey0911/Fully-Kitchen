const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const customerProductsApi = {
  list: async (customerEmail = '') => {
    const url = new URL(`${API_BASE_URL}/api/customer-products`, window.location.origin);
    if (customerEmail) {
      url.searchParams.set('customerEmail', customerEmail);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load registered products.');
    }

    return data;
  },
  register: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/customer-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to register product.');
    }

    return data;
  },
};
