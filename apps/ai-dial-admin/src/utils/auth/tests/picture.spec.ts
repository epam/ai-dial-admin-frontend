import { describe, expect, test } from 'vitest';

import { getHttpPicture, InlinePictureType, MAX_INLINE_PICTURE_BYTES, parseInlinePicture } from '../picture';

const toDataUrl = (type: string, bytes: Buffer, separator = '') =>
  `data:${type};base64,${separator}${bytes.toString('base64')}`;

describe('getHttpPicture', () => {
  test('keeps an http(s) URL', () => {
    expect(getHttpPicture(' https://example.com/a.png ')).toBe('https://example.com/a.png');
    expect(getHttpPicture('http://example.com/a.png')).toBe('http://example.com/a.png');
  });

  test.each([undefined, null, 42, '', 'not a url', 'javascript:alert(1)', 'data:image/png;base64,AAAA'])(
    'rejects %s',
    (value) => {
      expect(getHttpPicture(value)).toBeUndefined();
    },
  );
});

describe('parseInlinePicture', () => {
  test('decodes an inline raster image', () => {
    const bytes = Buffer.from('image-bytes');

    expect(parseInlinePicture(toDataUrl('image/jpeg', bytes))).toEqual({
      contentType: InlinePictureType.Jpeg,
      data: bytes,
    });
  });

  test('accepts the space Azure AD puts after the comma', () => {
    expect(parseInlinePicture(toDataUrl('image/jpeg', Buffer.from('x'), ' '))?.contentType).toBe(
      InlinePictureType.Jpeg,
    );
  });

  test('rejects SVG, non-data values and non-strings', () => {
    expect(parseInlinePicture(toDataUrl('image/svg+xml', Buffer.from('<svg/>')))).toBeUndefined();
    expect(parseInlinePicture('https://example.com/a.png')).toBeUndefined();
    expect(parseInlinePicture(undefined)).toBeUndefined();
  });

  test('rejects an empty or oversized image', () => {
    expect(parseInlinePicture('data:image/png;base64,')).toBeUndefined();
    expect(parseInlinePicture(toDataUrl('image/png', Buffer.alloc(MAX_INLINE_PICTURE_BYTES + 1, 1)))).toBeUndefined();
  });
});
