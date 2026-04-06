import { readLocalStorageString } from './storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const getRoleHeaders = () => {
  const role = readLocalStorageString('role', '').trim().toLowerCase();
  return role ? { 'x-role': role } : {};
};

export const inventoryProductsApi = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/inventory-products`);
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load inventory products.');
    }
    return data;
  },
  create: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/inventory-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getRoleHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to create inventory product.');
    }
    return data;
  },
  update: async (id, payload) => {
    const response = await fetch(`${API_BASE_URL}/api/inventory-products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getRoleHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to update inventory product.');
    }
    return data;
  },
  remove: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/inventory-products/${id}`, {
      method: 'DELETE',
      headers: { ...getRoleHeaders() },
    });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to delete inventory product.');
    }
    return data;
  },
};
