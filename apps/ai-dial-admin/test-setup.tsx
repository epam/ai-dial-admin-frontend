/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

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

vi.mock('@/src/context/assets/FileFolderContext', () => ({
  useFileFolder: createFnContext,
  FileFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/PromptFolderContext', () => ({
  usePromptFolder: createFnContext,
  PromptFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: createFnContext,
  AppsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/ToolsetsFolderContext', () => ({
  useToolsetFolder: createFnContext,
  ToolsetFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/ThemeContext', () => ({ useTheme: createFnContext }));
vi.mock('@/src/context/RuleFolderProvider', () => ({ useRuleFolder: createFnContext }));
vi.mock('@/src/context/RuleFolderContext', () => ({ useRuleFolder: createFnContext }));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: { show: false, content: null, showSidebar: vi.fn() },
    featureFlags: { deploymentsEnabled: true },
    isReadOnlyAdmin: false,
  }),
}));

vi.mock('@/src/context/SaveValidationContext', () => {
  const dispatch = vi.fn();
  return {
    SaveValidationContextProvider: ({ children }: { children: ReactNode }) => children,
    useSaveValidationContext: () => ({
      isValid: true,
      dispatch,
    }),
    ValidationActionType: {
      SetField: 'SET_FIELD_VALIDATION',
      RemoveField: 'REMOVE_FIELD_VALIDATION',
      Reset: 'RESET',
    },
  };
});

// ------------------ Next Image ------------------
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

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

// ------------------ Monaco Editor (jsdom) ------------------
// Monaco 0.55+ evaluates clipboard support at import time via queryCommandSupported;
// jsdom does not implement this deprecated DOM API.
if (typeof Document.prototype.queryCommandSupported !== 'function') {
  Object.defineProperty(Document.prototype, 'queryCommandSupported', {
    configurable: true,
    writable: true,
    value: () => false,
  });
}

// ------------------ Mock ResizeObserver ------------------
class ResizeObserverMock {
  constructor(public callback: ResizeObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  trigger(entries: ResizeObserverEntry[]) {
    this.callback(entries, this as unknown as ResizeObserver);
    console.warn('ResizeObserverMock triggered with entries:', entries);
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// ---------------- IntersectionObserver ----------------
let lastIntersectionObserverInstance: IntersectionObserverMock | null = null;

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    lastIntersectionObserverInstance = this;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  trigger(entries: IntersectionObserverEntry[]) {
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock createPortal to render modal content inline for test simplicity
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: any) => node,
}));

// ------------------ Cleanup after each test ------------------
afterEach(() => cleanup());
