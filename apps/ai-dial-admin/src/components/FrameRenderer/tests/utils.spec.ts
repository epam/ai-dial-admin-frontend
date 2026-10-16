import { describe, expect, test } from 'vitest';

import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import { getFrameOrigin, getSaveErrorMessage, isFrameMessageType } from '@/src/components/FrameRenderer/utils';

describe('isFrameMessageType', () => {
  test.each(Object.values(FrameMessageType))('recognizes %s', (type) => {
    expect(isFrameMessageType(type)).toBe(true);
  });

  test.each(['app/readyToInteract', 'HEIGHT_CHANGE', '', undefined, null, 42])('rejects %s', (type) => {
    expect(isFrameMessageType(type)).toBe(false);
  });
});

describe('getFrameOrigin', () => {
  test('returns the origin of an absolute url', () => {
    expect(getFrameOrigin('https://quickapps.example.com:8443/editor?id=1')).toBe('https://quickapps.example.com:8443');
  });

  test.each(['', '/relative/path', 'not a url'])('returns null for unparsable "%s"', (url) => {
    expect(getFrameOrigin(url)).toBeNull();
  });
});

describe('getSaveErrorMessage', () => {
  test('prefers the nested payload error', () => {
    expect(getSaveErrorMessage({ type: FrameMessageType.SaveError, payload: { error: 'nested' }, error: 'flat' })).toBe(
      'nested',
    );
  });

  test('falls back to the flat error', () => {
    expect(getSaveErrorMessage({ type: FrameMessageType.SaveError, error: 'flat' })).toBe('flat');
  });

  test('returns undefined when no text is carried', () => {
    expect(getSaveErrorMessage({ type: FrameMessageType.SaveError })).toBeUndefined();
  });
});
