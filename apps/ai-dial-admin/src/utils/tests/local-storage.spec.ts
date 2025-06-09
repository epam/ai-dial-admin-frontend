import { getFromLocalStorage, setToLocalStorage } from '../local-storage';

describe('Utils :: Local Storage settings and getters', () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  global.localStorage = localStorageMock as any;

  it('Should check empty key', () => {
    const res = getFromLocalStorage();

    expect(res).toBe('');
  });

  it('Should check set and get to local storage', () => {
    setToLocalStorage('ls-key', 'ls-value');

    expect(getFromLocalStorage('ls-key')).toBe('ls-value');
  });
});
