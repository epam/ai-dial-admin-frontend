export const addTrailingSlash = (path?: string) => {
  if (!path || path === '') {
    return '';
  }

  return path.endsWith('/') ? path : `${path}/`;
};

export const removeSlash = (path: string) => {
  return path?.startsWith('/') ? path.slice(1) : path;
};
