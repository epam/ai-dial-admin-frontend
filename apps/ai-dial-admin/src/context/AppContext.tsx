'use client';
import { createContext, useContext, useEffect, useState, ReactNode, MouseEvent, SetStateAction, Dispatch } from 'react';

import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { LOCAL_STORAGE_SIDEBAR_OPEN_KEY } from '@/src/constants/main-layout';
import { DockPosition, ShowSidebarOptions } from '@/src/components/Common/Sidebar/models';
import { ResourcesDefaults } from '@/src/models/deployments/containers';
import { UserInfo, UserRole } from '@/src/models/user-info';
import { FeatureFlags } from '@/src/models/feature-flags';

export interface AppContextType {
  themeUrl?: string;
  sidebarOpen: boolean;
  toggleSidebar: (e?: MouseEvent<HTMLButtonElement>) => void;
  userMenuOpen: boolean;
  toggleUserMenu: () => void;
  visualizerConnector?: VisualizerConnector | null;
  setVisualizerConnector?: Dispatch<SetStateAction<VisualizerConnector | null>>;
  featureFlags: FeatureFlags;
  sidebar: AppContextSidebar;
  disableDeploymentsJSONEditor?: boolean;
  resourcesDefaults?: ResourcesDefaults;
  telemetryMaxRangeMs?: number;
  codeAppEditorUrl?: string;

  // user info
  userInfo?: UserInfo;
  /** True when user has READ_ONLY_ADMIN and does not have FULL_ADMIN */
  isReadOnlyAdmin: boolean;
}

interface AppContextSidebar {
  show: boolean;
  content: ReactNode | null;
  isMenuClosed?: boolean;
  className?: string;
  /** True when the current content opted into the right/bottom dock toggle. */
  dockable: boolean;
  /** Current dock position for the active content (defaults to Right). */
  dockPosition: DockPosition;
  /** Whether the bottom-docked overlay is collapsed to its header. Only meaningful in Bottom position. */
  dockCollapsed: boolean;
  showSidebar: (content: ReactNode, className?: string, options?: ShowSidebarOptions) => void;
  closeSidebar: () => void;
  /** Toggles the dock position between Right and Bottom, persisting when a persistKey was supplied. */
  toggleDock: () => void;
  /** Collapses/expands the bottom-docked overlay. */
  toggleDockCollapsed: () => void;
  toggleIsMenuClosed?: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({
  children,
  themeUrl,
  featureFlags,
  disableDeploymentsJSONEditor,
  resourcesDefaults,
  userInfo,
  telemetryMaxRangeMs,
  codeAppEditorUrl,
}: {
  children: ReactNode;
  themeUrl?: string;
  featureFlags: FeatureFlags;
  disableDeploymentsJSONEditor?: boolean;
  userInfo?: UserInfo;
  resourcesDefaults?: ResourcesDefaults;
  telemetryMaxRangeMs?: number;
  codeAppEditorUrl?: string;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = getFromLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY);
    if (stored === 'false') {
      setSidebarOpen(false);
    }
  }, []);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visualizerConnector, setVisualizerConnector] = useState<VisualizerConnector | null>(null);
  const [show, setShow] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [sideBarClassName, setSideBarClassName] = useState<string | undefined>(undefined);
  const [dockable, setDockable] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition>(DockPosition.Right);
  const [dockPersistKey, setDockPersistKey] = useState<string | undefined>(undefined);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const [isMenuClosed, setIsMenuClosed] = useState(false);

  const toggleSidebar = (e?: MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    setToLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY, String(!sidebarOpen));
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const toggleIsMenuClosed = () => {
    setIsMenuClosed(!isMenuClosed);
  };

  const showSidebar = (c: ReactNode, className?: string, options?: ShowSidebarOptions) => {
    setContent(c);
    setSideBarClassName(className);
    setShow(true);

    const nextDockable = options?.dockable ?? false;
    setDockable(nextDockable);
    setDockPersistKey(options?.persistKey);
    setDockCollapsed(false);

    // Initialize dock position: Right by default, or the persisted choice when a key is supplied.
    // showSidebar only runs on the client (event/effect), so reading localStorage here is SSR-safe.
    const stored = nextDockable && options?.persistKey ? getFromLocalStorage(options.persistKey) : null;
    setDockPosition(stored === DockPosition.Bottom ? DockPosition.Bottom : DockPosition.Right);
  };

  const closeSidebar = () => {
    setContent(null);
    setShow(false);
    setDockable(false);
    setDockPersistKey(undefined);
    setDockPosition(DockPosition.Right);
    setDockCollapsed(false);
  };

  const toggleDock = () => {
    const next = dockPosition === DockPosition.Right ? DockPosition.Bottom : DockPosition.Right;
    setDockPosition(next);
    setDockCollapsed(false);
    if (dockPersistKey) {
      setToLocalStorage(dockPersistKey, next);
    }
  };

  const toggleDockCollapsed = () => {
    setDockCollapsed((prev) => !prev);
  };

  const isReadOnlyAdmin =
    !!userInfo?.roles?.includes(UserRole.READ_ONLY_ADMIN) && !userInfo?.roles?.includes(UserRole.FULL_ADMIN);

  const value = {
    sidebarOpen,
    toggleSidebar,
    themeUrl,
    userMenuOpen,
    toggleUserMenu,
    visualizerConnector,
    setVisualizerConnector,
    featureFlags,
    sidebar: {
      show,
      content,
      showSidebar,
      className: sideBarClassName,
      dockable,
      dockPosition,
      dockCollapsed,
      toggleDock,
      toggleDockCollapsed,
      closeSidebar,
      isMenuClosed,
      toggleIsMenuClosed,
    },
    disableDeploymentsJSONEditor,
    resourcesDefaults,
    telemetryMaxRangeMs,
    codeAppEditorUrl,
    userInfo,
    isReadOnlyAdmin,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('AppContext must be used within a <AppContextProvider />');
  }

  return context;
};
