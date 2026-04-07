import { TryOutResponse } from '@/src/models/evaluation/test-suite';

export const TEST_SUITES_TRYOUT_STORAGE_KEY = 'testSuitesTryout';

export interface TryOutResponseStorage {
  statusCode: number;
  [key: string]: unknown;
}

export function saveTryoutResponseToStorage(testSuiteId: string, response: TryOutResponse | undefined): void {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponse | undefined> = raw ? JSON.parse(raw) : {};
    map[testSuiteId] = response;
    localStorage.setItem(TEST_SUITES_TRYOUT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    console.error('Failed to save tryout response to storage');
  }
}

export function getTryoutResponseFromStorage(testSuiteId: string): TryOutResponse | undefined {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponse | undefined> = raw ? JSON.parse(raw) : {};
    return map[testSuiteId] || undefined;
  } catch {
    console.error('Failed to get tryout response from storage');
    return undefined;
  }
}

export function removeTryoutResponseFromStorage(testSuiteId: string): void {
  try {
    const raw = localStorage.getItem(TEST_SUITES_TRYOUT_STORAGE_KEY);
    const map: Record<string, TryOutResponse | undefined> = raw ? JSON.parse(raw) : {};
    delete map[testSuiteId];
    localStorage.setItem(TEST_SUITES_TRYOUT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    console.error('Failed to remove tryout response from storage');
  }
}
