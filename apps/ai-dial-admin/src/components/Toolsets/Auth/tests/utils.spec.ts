import { getIsUser, setIsUser } from '../utils';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';

describe('setIsUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('sets localStorage to true when type is USER', () => {
    setIsUser(ToolsetAuthCredentialLevel.USER);
    expect(localStorage.getItem('toolset-auth-is-user')).toBe('true');
  });

  test('sets localStorage to false when type is not USER', () => {
    setIsUser(ToolsetAuthCredentialLevel.GLOBAL);
    expect(localStorage.getItem('toolset-auth-is-user')).toBe('false');
  });

  test('does not throw when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    expect(() => setIsUser(ToolsetAuthCredentialLevel.USER)).not.toThrow();

    global.window = originalWindow;
  });
});

describe('getIsUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns true when localStorage contains "true"', () => {
    localStorage.setItem('toolset-auth-is-user', 'true');
    expect(getIsUser()).toBe(true);
  });

  test('returns false when localStorage contains "false"', () => {
    localStorage.setItem('toolset-auth-is-user', 'false');
    expect(getIsUser()).toBe(false);
  });

  test('removes the key from localStorage after reading', () => {
    localStorage.setItem('toolset-auth-is-user', 'true');
    getIsUser();
    expect(localStorage.getItem('toolset-auth-is-user')).toBeNull();
  });

  test('returns false when key does not exist in localStorage', () => {
    expect(getIsUser()).toBe(false);
  });

  test('returns false for any value other than "true"', () => {
    localStorage.setItem('toolset-auth-is-user', 'random-value');
    expect(getIsUser()).toBe(false);
  });
});
