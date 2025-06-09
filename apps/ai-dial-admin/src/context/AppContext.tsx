'use client';
import { createContext, useContext, useState, ReactNode, MouseEvent, SetStateAction, Dispatch } from 'react';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { LOCAL_STORAGE_SIDEBAR_OPEN_KEY } from '@/src/constants/main-layout';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

interface AppContextType {
  themeUrl?: string;
  sidebarOpen: boolean;
  toggleSidebar: (e: MouseEvent<HTMLButtonElement>) => void;
  userMenuOpen: boolean;
  toggleUserMenu: () => void;
  visualizerConnector?: VisualizerConnector | null;
  setVisualizerConnector?: Dispatch<SetStateAction<VisualizerConnector | null>>;
  featureFlags: Record<string, boolean>;
  embeddedApps: EmbeddedApp[];
}

export interface EmbeddedApp {
  slug: string;
  url: string;
  name: string;
  key: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider = ({
  children,
  themeUrl,
  featureFlags,
  embeddedApps,
}: {
  children: ReactNode;
  themeUrl?: string;
  featureFlags: Record<string, boolean>;
  embeddedApps: EmbeddedApp[];
}) => {
  const isSidebarOpenState = getFromLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY) !== 'false';

  const [sidebarOpen, setSidebarOpen] = useState(isSidebarOpenState);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [visualizerConnector, setVisualizerConnector] = useState<VisualizerConnector | null>(null);

  const toggleSidebar = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setToLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY, String(!sidebarOpen));
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
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
    embeddedApps,
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
