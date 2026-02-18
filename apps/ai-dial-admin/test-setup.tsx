/* eslint-disable jsx-a11y/alt-text */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
  useCurrentLocale: () => 'en',
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => {
    return { session: { providerId: 'provider' } };
  }),
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

vi.mock('@/src/context/assets/PromptFolderContext', () => ({
  usePromptFolder: () => vi.fn(),
}));

vi.mock('@/src/context/RuleFolderContext', () => ({
  useRuleFolder: () => vi.fn(),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => {
    return {
      sidebar: { show: false, content: null, showSidebar: vi.fn() },
      featureFlags: { deploymentsEnabled: true },
    };
  },
}));

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: { children: ReactNode }) => children,
  useSaveValidationContext: () => ({
    isValid: true,
    dispatch: vi.fn(),
  }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    Reset: 'RESET',
  },
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
  thresholds: any = [];
  root: any = null;
  rootMargin: string = '';
}

global.IntersectionObserver = MockIntersectionObserver as any;

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver as any;

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: () => {}, // empty placeholder
});

afterEach(() => {
  cleanup();
});
