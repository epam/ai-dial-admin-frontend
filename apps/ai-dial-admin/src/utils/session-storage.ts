export const getFromSessionStorage = (key?: string) => {
  if (!key || typeof window === 'undefined') {
    return '';
  }
  return sessionStorage.getItem(key);
};

export const setToSessionStorage = (key: string, value: string) => {
  sessionStorage.setItem(key, value);
};
