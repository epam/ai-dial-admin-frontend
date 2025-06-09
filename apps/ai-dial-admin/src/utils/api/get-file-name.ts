export const CONTENT_DISPOSITION_HEADER = 'content-disposition';

/**
 * Get file name from response header
 *
 * @param {Response} response - server response '/'
 * @returns {string} - file name
 */
export const getFileName = (res: Response) => {
  const content = res.headers.get(CONTENT_DISPOSITION_HEADER);
  let name = content?.split('filename=')[1];
  if (name?.startsWith('"')) {
    name = name.substring(1, name.length);
  }

  if (name?.endsWith('"')) {
    name = name.substring(0, name.length - 1);
  }
  return name;
};
