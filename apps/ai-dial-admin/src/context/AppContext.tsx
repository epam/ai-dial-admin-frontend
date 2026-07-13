'use client';
import { createContext, useContext, useEffect, useState, ReactNode, MouseEvent, SetStateAction, Dispatch } from 'react';

import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { LOCAL_STORAGE_SIDEBAR_OPEN_KEY } from '@/src/constants/main-layout';
import { ResourcesDefaults } from '@/src/models/deployments/containers';
import { UserInfo, UserRole } from '@/src/models/user-info';
import { FeatureFlags } from '@/src/models/feature-flags';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';

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
  position?: SidebarPosition;
  /** Whether the bottom-positioned sidebar is collapsed to its header. Only meaningful when position is Bottom. */
  collapsed?: boolean;
  showSidebar: (content: ReactNode, className?: string, position?: SidebarPosition) => void;
  closeSidebar: () => void;
  /** Switch the open sidebar between Right and Bottom at runtime; resets the collapsed state. */
  setPosition: (position: SidebarPosition) => void;
  /** Collapse/expand the bottom-positioned sidebar. */
  toggleCollapsed: () => void;
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
  const [sidebarPosition, setSidebarPosition] = useState(SidebarPosition.Right);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const showSidebar = (c: ReactNode, className?: string, position: SidebarPosition = SidebarPosition.Right) => {
    setContent(c);
    setSideBarClassName(className);
    setSidebarPosition(position);
    setSidebarCollapsed(false);
    setShow(true);
  };

  const closeSidebar = () => {
    setContent(null);
    setShow(false);
    setSidebarPosition(SidebarPosition.Right);
    setSidebarCollapsed(false);
  };

  const setPosition = (position: SidebarPosition) => {
    setSidebarPosition(position);
    setSidebarCollapsed(false);
  };

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => !prev);
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
      position: sidebarPosition,
      collapsed: sidebarCollapsed,
      closeSidebar,
      setPosition,
      toggleCollapsed,
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
