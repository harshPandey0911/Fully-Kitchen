export const readLocalStorageValue = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);

  if (rawValue === null) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
};

export const readLocalStorageObject = (key, fallback = {}) => {
  const value = readLocalStorageValue(key, fallback);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
};

export const readLocalStorageString = (key, fallback = '') => {
  const value = readLocalStorageValue(key, fallback);
  return typeof value === 'string' ? value : fallback;
};
