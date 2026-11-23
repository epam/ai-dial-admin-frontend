/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { appContextMock } from '@/test-mocks/app-context';
import { navigationMock } from '@/test-mocks/navigation';
import { notificationMock } from '@/test-mocks/notification';
import { saveValidationMock } from '@/test-mocks/save-validation';
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

vi.mock('@/src/locales/server', () => {
  const t = (key: string) => key;
  return { getI18n: vi.fn(async () => t) };
});

// ------------------ NextAuth ------------------
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ session: { providerId: 'provider' } })),
  SessionProvider: vi.fn(({ children }: { children: ReactNode }) => children),
}));

// ------------------ Next.js hooks ------------------
vi.mock('next/headers', () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock('next/navigation', async () => (await import('@/test-mocks/navigation')).navigationModule);

// ------------------ Contexts ------------------
const createFnContext = () => vi.fn();

vi.mock(
  '@/src/context/NotificationContext',
  async () => (await import('@/test-mocks/notification')).notificationModule,
);

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

vi.mock('@/src/context/assets/PluginsFolderContext', () => ({
  usePluginsFolder: () => ({ fetchFiles: vi.fn() }),
  PluginsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/RoutersFolderContext', () => ({
  useRoutersFolder: () => ({ fetchFiles: vi.fn() }),
  RoutersFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/RoutesFolderContext', () => ({
  useRoutesFolder: () => ({ fetchFiles: vi.fn() }),
  RoutesFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/PoliciesFolderContext', () => ({
  usePoliciesFolder: () => ({ fetchFiles: vi.fn() }),
  PoliciesFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/src/context/assets/PolicyAssignmentsFolderContext', () => ({
  usePolicyAssignmentsFolder: () => ({ fetchFiles: vi.fn() }),
  PolicyAssignmentsFolderProvider: ({ children }: any) => <div>{children}</div>,
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

vi.mock('@/src/context/assets/ProjectFolderContext', () => {
  const projectFolder = { fetchFiles: vi.fn(), fetchedFoldersData: {}, filePath: '' };
  return {
    useProjectFolder: () => projectFolder,
    ProjectFolderProvider: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock('@/src/context/ThemeContext', () => ({ useTheme: vi.fn(() => ({ currentTheme: 'dark' })) }));
// Units start out empty and idle, so every page behaves as it does with org units switched off. A spec that needs
// units overrides `useOrgUnits` with `vi.mocked(useOrgUnits).mockReturnValue(...)`.
vi.mock('@/src/context/OrgUnitsContext', () => {
  const noUnits = {
    units: {},
    unitsStatus: 'idle',
    ensureUnits: vi.fn(),
    refreshUnits: vi.fn(async () => ({})),
    loadUnits: vi.fn(async () => ({})),
    getOwningUnit: vi.fn(() => undefined),
  };
  return {
    useOrgUnits: vi.fn(() => noUnits),
    OrgUnitsProvider: ({ children }: any) => <div>{children}</div>,
  };
});

vi.mock('@/src/context/RuleFolderProvider', () => ({ useRuleFolder: createFnContext }));
vi.mock('@/src/context/RuleFolderContext', () => ({ useRuleFolder: createFnContext }));

vi.mock('@/src/context/AppContext', async () => (await import('@/test-mocks/app-context')).appContextModule);

vi.mock('@/src/context/SaveValidationContext', async (importOriginal) => {
  const { createSaveValidationModule } = await import('@/test-mocks/save-validation');
  return createSaveValidationModule(await importOriginal());
});

// ------------------ Next Image ------------------
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img alt="" {...props} />,
}));

// ECharts is heavy and not meaningful in jsdom — render a lightweight stub.
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-mock="echarts" />),
}));

// Editable Monaco views expose a labeled textarea; read-only viewers keep the readable text stub.
vi.mock('@monaco-editor/react', () => {
  const Editor = ({ value, language, onChange, options }: EditorMockProps) =>
    onChange && !options?.readOnly ? (
      <textarea
        aria-label={options?.ariaLabel ?? 'JSON editor'}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
      />
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

// The app's wrappers load the bundled Monaco before mounting the library editor, which jsdom cannot run; they get
// the library stubs above, so a spec sees the same editor through either import. Their own specs unmock them.
vi.mock('@/src/components/Common/MonacoEditor/Editor', async () => ({
  __esModule: true,
  default: (await import('@monaco-editor/react')).Editor,
}));
vi.mock('@/src/components/Common/MonacoEditor/DiffEditor', async () => ({
  __esModule: true,
  default: (await import('@monaco-editor/react')).DiffEditor,
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

// ------------------ Blob URLs (absent in jsdom), so specs can vi.spyOn them ------------------
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => '';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
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

// ------------------ Reset mock controllers before each test ------------------
beforeEach(() => {
  appContextMock.reset();
  navigationMock.reset();
  notificationMock.reset();
  saveValidationMock.reset();
});

// ------------------ Cleanup after each test ------------------
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
