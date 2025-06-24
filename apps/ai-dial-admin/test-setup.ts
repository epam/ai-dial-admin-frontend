import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
  useCurrentLocale: () => 'en',
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

vi.mock('@/src/context/ThemeContext', () => ({
  useTheme: () => vi.fn(),
}));

vi.mock('@/src/context/RuleFolderProvider', () => ({
  useRuleFolder: () => vi.fn(),
}));

vi.mock('@/src/context/PromptFolderProvider', () => ({
  usePromptFolder: () => vi.fn(),
}));

global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

afterEach(() => {
  cleanup();
});
