/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/alt-text */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

// ------------------ Fetch Mock ------------------
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// ------------------ Mocks for Locales ------------------
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
  useCurrentLocale: () => 'en',
}));

// ------------------ NextAuth ------------------
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ session: { providerId: 'provider' } })),
}));

// ------------------ Next.js hooks ------------------
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: vi.fn(), usePathname: vi.fn() }));

// ------------------ Contexts ------------------
const createFnContext = () => vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/src/context/ThemeContext', () => ({ useTheme: createFnContext }));
vi.mock('@/src/context/RuleFolderProvider', () => ({ useRuleFolder: createFnContext }));
vi.mock('@/src/context/assets/PromptFolderContext', () => ({ usePromptFolder: createFnContext }));
vi.mock('@/src/context/RuleFolderContext', () => ({ useRuleFolder: createFnContext }));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: { show: false, content: null, showSidebar: vi.fn() },
    featureFlags: { deploymentsEnabled: true },
  }),
}));

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: { children: ReactNode }) => children,
  useSaveValidationContext: () => ({
    isValid: true,
    dispatch: vi.fn(),
  }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', Reset: 'RESET' },
}));

// ------------------ Next Image ------------------
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// ------------------ Global ResizeObserver ------------------
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
})) as any;

// ------------------ Global console ------------------
const originalConsole = console;
global.console = {
  ...originalConsole,
  error: vi.fn(),
  warn: vi.fn(),
};

// ------------------ Mock scrollIntoView ------------------
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  writable: true,
  value: () => {},
});

// ------------------ Cleanup after each test ------------------
afterEach(() => cleanup());
