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

export const serviceRequestsApi = {
  list: async (customerEmail = '') => {
    const url = new URL(`${API_BASE_URL}/api/service-requests`, window.location.origin);
    if (customerEmail) {
      url.searchParams.set('customerEmail', customerEmail);
    }

    try {
      const response = await fetch(url.toString(), { method: 'GET' });
      const data = await parseJsonSafely(response);

      if (response.ok && Array.isArray(data?.serviceRequests)) {
        return data;
      }

      if (canUseLocalFallback(response, data, 'serviceRequests')) {
        return frontendDataStore.listServiceRequests(customerEmail);
      }

      throw new Error(data?.message || 'Unable to load service requests.');
    } catch (error) {
      if (error instanceof Error && error.message && error.message !== 'Failed to fetch') {
        throw error;
      }

      return frontendDataStore.listServiceRequests(customerEmail);
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
