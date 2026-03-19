export const TEST_SUITES_TRYOUT_STORAGE_KEY = 'testSuitesTryout';

export interface TryOutResponseStorage {
  statusCode: number;
  [key: string]: unknown;
}

export function saveTryoutResponseToStorage(testSuiteId: string, response: TryOutResponseStorage | null): void {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponseStorage | null> = raw ? JSON.parse(raw) : {};
    map[testSuiteId] = response;
    localStorage.setItem(TEST_SUITES_TRYOUT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    console.error('Failed to save tryout response to storage');
  }
}

export function getTryoutResponseFromStorage(testSuiteId: string): TryOutResponseStorage | null {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponseStorage | null> = raw ? JSON.parse(raw) : {};
    return map[testSuiteId] || null;
  } catch {
    console.error('Failed to get tryout response from storage');
    return null;
  }
}

export function removeTryoutResponseFromStorage(testSuiteId: string): void {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponseStorage | null> = raw ? JSON.parse(raw) : {};
    delete map[testSuiteId];
    localStorage.setItem(TEST_SUITES_TRYOUT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    console.error('Failed to remove tryout response from storage');
  }
}
