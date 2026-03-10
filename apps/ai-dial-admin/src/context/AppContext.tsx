'use client';
import { createContext, useContext, useState, ReactNode, MouseEvent, SetStateAction, Dispatch } from 'react';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { LOCAL_STORAGE_SIDEBAR_OPEN_KEY } from '@/src/constants/main-layout';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import { ResourcesDefaults } from '@/src/models/deployments/containers';

export interface AppContextType {
  themeUrl?: string;
  sidebarOpen: boolean;
  toggleSidebar: (e?: MouseEvent<HTMLButtonElement>) => void;
  userMenuOpen: boolean;
  toggleUserMenu: () => void;
  visualizerConnector?: VisualizerConnector | null;
  setVisualizerConnector?: Dispatch<SetStateAction<VisualizerConnector | null>>;
  featureFlags: Record<string, boolean>;
  sidebar: AppContextSidebar;
  disableDeploymentsJSONEditor?: boolean;
  resourcesDefaults?: ResourcesDefaults;
}

interface AppContextSidebar {
  show: boolean;
  content: ReactNode | null;
  isMenuClosed?: boolean;
  className?: string;
  showSidebar: (content: ReactNode, className?: string) => void;
  closeSidebar: () => void;
  toggleIsMenuClosed?: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({
  children,
  themeUrl,
  featureFlags,
  disableDeploymentsJSONEditor,
  resourcesDefaults,
}: {
  children: ReactNode;
  themeUrl?: string;
  featureFlags: Record<string, boolean>;
  disableDeploymentsJSONEditor?: boolean;
  resourcesDefaults?: ResourcesDefaults;
}) => {
  const isSidebarOpenState = getFromLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY) !== 'false';

  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpenState);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visualizerConnector, setVisualizerConnector] = useState<VisualizerConnector | null>(null);
  const [show, setShow] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [sideBarClassName, setSideBarClassName] = useState<string | undefined>(undefined);

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

  const showSidebar = (c: ReactNode, className?: string) => {
    setContent(c);
    setSideBarClassName(className);
    setShow(true);
  };

  const closeSidebar = () => {
    setContent(null);
    setShow(false);
  };

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
      closeSidebar,
      isMenuClosed,
      toggleIsMenuClosed,
    },
    disableDeploymentsJSONEditor,
    resourcesDefaults,
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
