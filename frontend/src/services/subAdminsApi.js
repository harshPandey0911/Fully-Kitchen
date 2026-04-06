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

export const subAdminsApi = {
  list: async () => handle(fetch(`${API_BASE_URL}/api/subadmins`), 'Unable to load sub admins.'),
  create: async (payload) =>
    handle(
      fetch(`${API_BASE_URL}/api/subadmins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      'Unable to create sub admin.',
    ),
  remove: async (id) =>
    handle(
      fetch(`${API_BASE_URL}/api/subadmins/${id}`, {
        method: 'DELETE',
      }),
      'Unable to delete sub admin.',
    ),
};
