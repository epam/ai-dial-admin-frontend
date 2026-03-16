export const addTrailingSlash = (path?: string) => {
  if (!path || path === '') {
    return '';
  }

  return path.endsWith('/') ? path : `${path}/`;
};

export const removeSlash = (path: string) => {
  return path?.startsWith('/') ? path.slice(1) : path;
};

export const normalizeUrl = (url?: string, withTrailingSlash = true) => {
  if (!url) {
    return '';
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return '';
  }

  const urlWithoutTrailingSlash = trimmedUrl.replace(/\/+$/, '');
  return withTrailingSlash ? `${urlWithoutTrailingSlash}/` : urlWithoutTrailingSlash;
};
