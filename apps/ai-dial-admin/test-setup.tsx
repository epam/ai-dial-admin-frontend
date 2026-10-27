/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { ReactNode, useId } from 'react';
import { afterEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { EditorMockProps } from './test-models';

// `findBy*` / `waitFor` default to 1 s, which a loaded runner misses on tests that mount a grid.
configure({ asyncUtilTimeout: 4_000 });

// ------------------ Fetch Mock ------------------
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

// ------------------ Mocks for Locales ------------------
vi.mock('@/src/locales/client', () => {
  const t = (key: string) => key;
  return {
    useI18n: () => t,
    useCurrentLocale: () => 'en',
  };
});

// ------------------ NextAuth ------------------
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ session: { providerId: 'provider' } })),
  SessionProvider: vi.fn(({ children }: { children: ReactNode }) => children),
}));

// ------------------ Next.js hooks ------------------
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// ------------------ Contexts ------------------
const createFnContext = () => vi.fn();

// One instance for the whole file: the real context hands out stable functions, and many components list
// `showNotification` in an effect's dependencies. A fresh `vi.fn()` per render re-ran those effects on every
// render, so a component could refetch in a loop under test and its outcome depended on how fast it ran.
vi.mock('@/src/context/NotificationContext', () => {
  const notification = { showNotification: vi.fn(), removeNotification: vi.fn() };
  return { useNotification: () => notification };
});

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

vi.mock('@/src/context/assets/AppRunnersFolderContext', () => ({
  useAppRunnersFolder: () => ({ fetchFiles: vi.fn() }),
  AppRunnersFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/CatalogSchemasFolderContext', () => ({
  useCatalogSchemasFolder: () => ({ fetchFiles: vi.fn() }),
  CatalogSchemasFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/InterceptorsFolderContext', () => ({
  useInterceptorsFolder: () => ({ fetchFiles: vi.fn() }),
  InterceptorsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/TranslatorsFolderContext', () => ({
  useTranslatorsFolder: () => ({ fetchFiles: vi.fn() }),
  TranslatorsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/RoutesFolderContext', () => ({
  useRoutesFolder: () => ({ fetchFiles: vi.fn() }),
  RoutesFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/RolesFolderContext', () => ({
  useRolesFolder: () => ({ fetchFiles: vi.fn() }),
  RolesFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/KeysFolderContext', () => ({
  useKeysFolder: () => ({ fetchFiles: vi.fn() }),
  KeysFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

// One instance for the whole file: `BaseAssetList` has an effect that depends on `fetchedFoldersData` by
// reference, so a fresh `{}` per call would re-run it on every render.
vi.mock('@/src/context/assets/SkillFolderContext', () => {
  const skillFolder = { fetchFiles: vi.fn(), fetchedFoldersData: {}, filePath: '' };
  return {
    useSkillFolder: () => skillFolder,
    SkillFolderProvider: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock('@/src/context/ThemeContext', () => ({ useTheme: vi.fn(() => ({ currentTheme: 'dark' })) }));
vi.mock('@/src/context/RuleFolderProvider', () => ({ useRuleFolder: createFnContext }));
vi.mock('@/src/context/RuleFolderContext', () => ({ useRuleFolder: createFnContext }));

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';

// Hoisted, not returned as a literal from the mock: a fresh object per call gives `featureFlags`
// (and the context value itself) a new identity every render, so any component listing one of them
// in a hook dependency array re-runs its effect forever and the worker dies on heap exhaustion.
const appContextValue = {
  sidebar: {
    show: false,
    content: null,
    showSidebar: vi.fn(),
    closeSidebar: vi.fn(),
    position: SidebarPosition.Right,
  },
  featureFlags: { deploymentsEnabled: true, adminApiEnabled: true, catalogEnabled: true },
  isReadOnlyAdmin: false,
  isFullAdmin: true,
  isEnableAuth: false,
  showConfigFiles: false,
  toggleShowConfigFiles: vi.fn(),
  setEntityReadOnly: vi.fn(),
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => appContextValue,
}));

vi.mock('@/src/context/SaveValidationContext', () => {
  const dispatch = vi.fn();
  return {
    SaveValidationContextProvider: ({ children }: { children: ReactNode }) => children,
    useSaveValidationContext: () => ({
      isValid: true,
      dispatch,
      jsonErrors: [],
      jsonErrorNotifications: [],
    }),
    useJsonEditorValidation: () => {
      const editorId = useId();
      return {
        editorId,
        setJsonErrors: (errors: unknown[]) => dispatch({ type: 'SET_JSON_EDITOR_VALIDATION', editorId, errors }),
        removeEditor: () => dispatch({ type: 'REMOVE_JSON_EDITOR_VALIDATION', editorId }),
      };
    },
    ValidationActionType: {
      SetField: 'SET_FIELD_VALIDATION',
      RemoveField: 'REMOVE_FIELD_VALIDATION',
      SetJsonEditor: 'SET_JSON_EDITOR_VALIDATION',
      RemoveJsonEditor: 'REMOVE_JSON_EDITOR_VALIDATION',
      SetJsonEditorNotifications: 'SET_JSON_EDITOR_NOTIFICATIONS',
      Reset: 'RESET',
    },
  };
});

// ------------------ Next Image ------------------
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

// ECharts is heavy and not meaningful in jsdom — render a lightweight stub.
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: () => <div data-mock="echarts" />,
}));

// Editable Monaco views expose a labeled textarea; read-only viewers keep the readable text stub.
vi.mock('@monaco-editor/react', () => {
  const Editor = ({ value, language, onChange, options }: EditorMockProps) =>
    onChange && !options?.readOnly ? (
      <textarea aria-label="JSON editor" value={value || ''} onChange={(event) => onChange(event.target.value)} />
    ) : (
      <pre data-language={language}>{value}</pre>
    );
  return {
    __esModule: true,
    Editor,
    DiffEditor: ({ modified, language }: { modified?: string; language?: string }) => (
      <pre data-language={language}>{modified}</pre>
    ),
    default: Editor,
  };
});

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

// ------------------ Stub document.elementFromPoint (absent in jsdom, used by ui-kit Dropdown) ------------------
if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
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

// ------------------ Visualizer connector ------------------
// The real connector builds its own loader markup around the iframe, and jsdom has no `iframe.sandbox`. The stub
// mounts only a titled iframe, so a spec reaches the frame's window with `getByTitle('visualizer-frame')`.
vi.mock('@epam/ai-dial-visualizer-connector', () => ({
  VisualizerConnector: class {
    constructor(root: HTMLElement) {
      const iframe = document.createElement('iframe');
      iframe.title = 'visualizer-frame';
      Object.defineProperty(iframe, 'sandbox', { value: { add: vi.fn() } });
      root.appendChild(iframe);
    }
    ready = vi.fn().mockResolvedValue(undefined);
    send = vi.fn();
    destroy = vi.fn();
  },
}));

// ------------------ Cleanup after each test ------------------
afterEach(() => cleanup());
