import { frontendDataStore } from './frontendDataStore';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const canUseLocalFallback = (response, data, expectedKey) => {
  if (!response) {
    return true;
  }

  if (response.ok) {
    return !data?.[expectedKey];
  }

  return response.status === 404 || response.status === 405 || response.status >= 500 || !data?.message;
};

const mergeServiceRequests = (primary = [], secondary = []) => {
  const merged = new Map();

  [...secondary, ...primary].forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const key =
      item.id ||
      [
        item.customerEmail || '',
        item.productId || '',
        item.productName || '',
        item.issueType || '',
        item.createdAt || '',
      ].join('::');

    if (!key) {
      return;
    }

    const current = merged.get(key) || {};
    merged.set(key, { ...current, ...item });
  });

  return Array.from(merged.values()).sort(
    (left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime(),
  );
};

export const serviceRequestsApi = {
  list: async (customerEmail = '') => {
    const url = new URL(`${API_BASE_URL}/api/service-requests`, window.location.origin);
    if (customerEmail) {
      url.searchParams.set('customerEmail', customerEmail);
    }

    const localResponse = frontendDataStore.listServiceRequests(customerEmail);
    const localRequests = Array.isArray(localResponse?.serviceRequests) ? localResponse.serviceRequests : [];

    try {
      const response = await fetch(url.toString(), { method: 'GET' });
      const data = await parseJsonSafely(response);

      if (response.ok && Array.isArray(data?.serviceRequests)) {
        return {
          ...data,
          serviceRequests: mergeServiceRequests(data.serviceRequests, localRequests),
        };
      }

      if (canUseLocalFallback(response, data, 'serviceRequests')) {
        return localResponse;
      }

      throw new Error(data?.message || 'Unable to load service requests.');
    } catch (error) {
      if (error instanceof Error && error.message && error.message !== 'Failed to fetch') {
        throw error;
      }

      return localResponse;
    }
  },
  create: async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonSafely(response);

      if (response.ok && data?.serviceRequest) {
        return data;
      }

      if (canUseLocalFallback(response, data, 'serviceRequest')) {
        return frontendDataStore.createServiceRequest(payload);
      }

      throw new Error(data?.message || 'Unable to create service request.');
    } catch (error) {
      if (error instanceof Error && error.message && error.message !== 'Failed to fetch') {
        throw error;
      }

      return frontendDataStore.createServiceRequest(payload);
    }
  },
};
