import { readLocalStorageObject, readLocalStorageString } from './storage';

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
  const email = String(readLocalStorageObject('loginData', {})?.email || '').trim().toLowerCase();
  return {
    ...(role ? { 'x-role': role } : {}),
    ...(email ? { 'x-user-email': email } : {}),
  };
};

export const retailerProductsApi = {
  list: async () => {
    const response = await fetch(`${API_BASE_URL}/api/retailer-products`);
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load retailer products.');
    }
    return data;
  },
  create: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/retailer-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getRoleHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await parseJsonSafely(response);
    if (!response.ok) {
      throw new Error(data?.message || 'Unable to add retailer product.');
    }
    return data;
  },
};
