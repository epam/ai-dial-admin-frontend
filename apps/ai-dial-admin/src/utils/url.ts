export const addTrailingSlash = (path: string) => {
  return path.endsWith('/') ? path : `${path}/`;
};

export const removeSlash = (path: string) => {
  return path?.startsWith('/') ? path.slice(1) : path;
};
