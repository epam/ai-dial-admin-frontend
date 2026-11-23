import { vi } from 'vitest';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import type { AppContextType } from '@/src/context/AppContext';
import type { FeatureFlags } from '@/src/models/feature-flags';
import { AccessMode, AdminAccess } from '@/src/models/user-access';

const sidebar = {
  show: false,
  content: null,
  position: SidebarPosition.Right,
  showSidebar: vi.fn<AppContextType['sidebar']['showSidebar']>(),
  closeSidebar: vi.fn<AppContextType['sidebar']['closeSidebar']>(),
};

const spies = {
  toggleSidebar: vi.fn<AppContextType['toggleSidebar']>(),
  setEntityReadOnly: vi.fn<AppContextType['setEntityReadOnly']>(),
};

const createDefaultValue = (): AppContextType => ({
  sidebarOpen: false,
  sidebar,
  featureFlags: { deploymentsEnabled: true, adminApiEnabled: true } as FeatureFlags,
  userAccess: { mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] },
  isReadOnlyAdmin: false,
  isFullAdmin: true,
  isUnitMode: false,
  canReadNamespace: () => true,
  canWriteAt: () => true,
  isEnableAuth: false,
  ...spies,
});

type AppContextOverrides = {
  [Key in keyof AppContextType]?: AppContextType[Key] extends object
    ? Partial<AppContextType[Key]> | AppContextType[Key]
    : AppContextType[Key];
};

let value = createDefaultValue();
let resolveOverrides: (() => AppContextOverrides) | undefined;

export const appContextModule = {
  useAppContext: vi.fn(
    (): AppContextType => (resolveOverrides ? ({ ...value, ...resolveOverrides() } as AppContextType) : value),
  ),
};

export const appContextMock = {
  sidebar,
  ...spies,
  set(overrides: AppContextOverrides) {
    value = { ...value, ...overrides } as AppContextType;
  },
  use(overrides: () => AppContextOverrides) {
    resolveOverrides = overrides;
  },
  reset() {
    [sidebar.showSidebar, sidebar.closeSidebar, ...Object.values(spies)].forEach((fn) => fn.mockReset());
    appContextModule.useAppContext.mockReset();
    value = createDefaultValue();
    resolveOverrides = undefined;
  },
};
