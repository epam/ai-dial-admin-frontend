/** Raster image types an inline `picture` may carry; SVG is excluded because it can run script. */
export enum InlinePictureType {
  Jpeg = 'image/jpeg',
  Png = 'image/png',
  Gif = 'image/gif',
  Webp = 'image/webp',
}

/** Largest decoded inline picture the picture route serves (256 KiB). */
export const MAX_INLINE_PICTURE_BYTES = 256 * 1024;

// Azure AD's profile mapper emits `data:image/jpeg;base64, <data>` with a space after the comma.
const INLINE_PICTURE_PATTERN = /^data:(image\/(?:jpeg|png|gif|webp));base64,\s*([A-Za-z0-9+/]+={0,2})$/;

export interface InlinePicture {
  contentType: InlinePictureType;
  data: Buffer;
}

/** Returns the value only when it is an absolute `http(s)` URL; anything else is unusable as an image source. */
export const getHttpPicture = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const { protocol } = new URL(value.trim());
    return protocol === 'https:' || protocol === 'http:' ? value.trim() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Decodes a picture that carries the image itself as a base64 `data:` URL. Only raster types up to
 * `MAX_INLINE_PICTURE_BYTES` are accepted. Such a picture must never be stored in the session cookie.
 */
export const parseInlinePicture = (value: unknown): InlinePicture | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const match = INLINE_PICTURE_PATTERN.exec(value.trim());
  if (!match) {
    return undefined;
  }

  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > MAX_INLINE_PICTURE_BYTES) {
    return undefined;
  }

  return { contentType: match[1] as InlinePictureType, data };
};
