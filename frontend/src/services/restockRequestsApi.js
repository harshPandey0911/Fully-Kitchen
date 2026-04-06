const resolveApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (port === '5173') {
      return `${protocol}//${hostname}:5000`;
    }
  }

  return '';
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const restockRequestsApi = {
  list: async (retailerEmail = '') => {
    const baseUrl = resolveApiBaseUrl();
    const url = new URL(`${baseUrl}/api/restock-requests`, window.location.origin);
    if (retailerEmail) {
      url.searchParams.set('retailerEmail', retailerEmail);
    }

    const response = await fetch(url.toString(), { method: 'GET' });
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load restock requests.');
    }

    return data;
  },
  create: async (payload) => {
    const response = await fetch(`${resolveApiBaseUrl()}/api/restock-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to create restock request.');
    }

    return data;
  },
  updateStatus: async (id, status) => {
    const response = await fetch(`${resolveApiBaseUrl()}/api/restock-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to update restock request.');
    }

    return data;
  },
};
