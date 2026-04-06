const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const handle = async (response, fallback) => {
  const data = await parseJsonSafely(response);
  if (!response.ok) {
    throw new Error(data?.message || fallback);
  }
  return data;
};

export const distributorsApi = {
  list: async () => handle(fetch(`${API_BASE_URL}/api/distributors`), 'Unable to load distributors.'),
  create: async (payload) =>
    handle(
      fetch(`${API_BASE_URL}/api/distributors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      'Unable to create distributor.',
    ),
  update: async (id, payload) =>
    handle(
      fetch(`${API_BASE_URL}/api/distributors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      'Unable to update distributor.',
    ),
  remove: async (id) =>
    handle(
      fetch(`${API_BASE_URL}/api/distributors/${id}`, {
        method: 'DELETE',
      }),
      'Unable to delete distributor.',
    ),
};
