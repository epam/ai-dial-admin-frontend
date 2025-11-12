export const addTrailingSlash = (path: string) => {
  return path.endsWith('/') ? path : `${path}/`;
};
