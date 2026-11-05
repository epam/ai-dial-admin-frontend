'use client';
import { createContext, Dispatch, MouseEvent, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';

import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { LOCAL_STORAGE_SIDEBAR_OPEN_KEY } from '@/src/constants/main-layout';
import { ResourcesDefaults } from '@/src/models/deployments/containers';
import { FeatureFlags } from '@/src/models/feature-flags';
import { AccessMode, AdminAccess, UnitNamespace, UserAccess } from '@/src/models/user-access';
import { UserInfo } from '@/src/models/user-info';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import {
  canReadNamespace as canReadNamespaceIn,
  canWriteAt as canWriteAtIn,
  canWriteNamespace as canWriteNamespaceIn,
} from '@/src/utils/org-units/access';

export interface AppContextType {
  themeUrl?: string;
  sidebarOpen: boolean;
  toggleSidebar: (e?: MouseEvent<HTMLButtonElement>) => void;
  visualizerConnector?: VisualizerConnector | null;
  setVisualizerConnector?: Dispatch<SetStateAction<VisualizerConnector | null>>;
  featureFlags: FeatureFlags;
  sidebar: AppContextSidebar;
  disableDeploymentsJSONEditor?: boolean;
  resourcesDefaults?: ResourcesDefaults;
  telemetryMaxRangeMs?: number;
  codeAppEditorUrl?: string;

  // user info
  /** Who the caller is (`id`, `email`); informational — access decisions come from `userAccess`. */
  userInfo?: UserInfo;
  /** What the caller may do, resolved from Core's `GET /v1/user/role-assignments`. */
  userAccess: UserAccess;
  /** True when Core reports a read-only admin level, which it does not yet — so false for now. */
  isReadOnlyAdmin: boolean;
  /**
   * True when Core reports `adminAccess` FULL, or when nothing is enforced: authentication is disabled or
   * org units are off (Core answers 404).
   */
  isFullAdmin: boolean;
  /** True when the caller is no admin but works in at least one unit. */
  isUnitMode: boolean;
  /** Whether any unit grants `read` on the namespace; always true for an admin. */
  canReadNamespace: (namespace: UnitNamespace) => boolean;
  /** Whether any unit grants `write` on the namespace; an admin follows `isFullAdmin`. */
  canWriteNamespace: (namespace: UnitNamespace) => boolean;
  /** Whether the unit owning `path` grants `write` on the namespace; an admin follows `isFullAdmin`. */
  canWriteAt: (namespace: UnitNamespace, path: string) => boolean;
  /** Whether authentication is enabled (NEXTAUTH_URL set). Needed to tell "auth off" from "no role". */
  isEnableAuth: boolean;
  /**
   * Set by a `configFile=true` detail view on mount (cleared on unmount) to make `isReadOnlyAdmin`
   * true for the duration of viewing a config-file-sourced entity — see `config-file-entity-views`.
   */
  setEntityReadOnly: (isReadOnly: boolean) => void;
}

interface AppContextSidebar {
  show: boolean;
  content: ReactNode | null;
  isMenuClosed?: boolean;
  className?: string;
  position?: SidebarPosition;
  showSidebar: (content: ReactNode, className?: string, position?: SidebarPosition) => void;
  closeSidebar: () => void;
  toggleIsMenuClosed?: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FULL_USER_ACCESS: UserAccess = { mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] };

export const AppContextProvider = ({
  children,
  themeUrl,
  featureFlags,
  disableDeploymentsJSONEditor,
  resourcesDefaults,
  userInfo,
  userAccess = FULL_USER_ACCESS,
  telemetryMaxRangeMs,
  codeAppEditorUrl,
  isEnableAuth = false,
}: {
  children: ReactNode;
  themeUrl?: string;
  featureFlags: FeatureFlags;
  disableDeploymentsJSONEditor?: boolean;
  userInfo?: UserInfo;
  userAccess?: UserAccess;
  resourcesDefaults?: ResourcesDefaults;
  telemetryMaxRangeMs?: number;
  codeAppEditorUrl?: string;
  isEnableAuth?: boolean;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEntityReadOnly, setEntityReadOnly] = useState(false);

  useEffect(() => {
    const stored = getFromLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY);
    if (stored === 'false') {
      setSidebarOpen(false);
    }
  }, []);

  const [visualizerConnector, setVisualizerConnector] = useState<VisualizerConnector | null>(null);
  const [show, setShow] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [sideBarClassName, setSideBarClassName] = useState<string | undefined>(undefined);
  const [sidebarPosition, setSidebarPosition] = useState(SidebarPosition.Right);

  const [isMenuClosed, setIsMenuClosed] = useState(false);

  const toggleSidebar = (e?: MouseEvent<HTMLButtonElement>) => {
    e?.currentTarget.blur();
    setToLocalStorage(LOCAL_STORAGE_SIDEBAR_OPEN_KEY, String(!sidebarOpen));
    setSidebarOpen(!sidebarOpen);
  };

  const toggleIsMenuClosed = () => {
    setIsMenuClosed(!isMenuClosed);
  };

  const showSidebar = (c: ReactNode, className?: string, position: SidebarPosition = SidebarPosition.Right) => {
    setContent(c);
    setSideBarClassName(className);
    setSidebarPosition(position);
    setShow(true);
  };

  const closeSidebar = () => {
    setContent(null);
    setShow(false);
    setSidebarPosition(SidebarPosition.Right);
  };

  // `isEntityReadOnly` folds in on top: a `configFile=true` detail view sets it for the entity it's
  // viewing, regardless of access.
  const isReadOnlyAdmin = isEntityReadOnly || userAccess.adminAccess === AdminAccess.READ_ONLY;
  const isFullAdmin = userAccess.adminAccess === AdminAccess.FULL;
  const isUnitMode = userAccess.mode === AccessMode.UNIT;

  const canReadNamespace = (namespace: UnitNamespace) => !isUnitMode || canReadNamespaceIn(userAccess.units, namespace);
  const canWriteNamespace = (namespace: UnitNamespace) =>
    isUnitMode ? canWriteNamespaceIn(userAccess.units, namespace) : isFullAdmin;
  const canWriteAt = (namespace: UnitNamespace, path: string) =>
    isUnitMode ? canWriteAtIn(userAccess.units, namespace, path) : isFullAdmin;

  const value = {
    sidebarOpen,
    toggleSidebar,
    themeUrl,
    visualizerConnector,
    setVisualizerConnector,
    featureFlags,
    sidebar: {
      show,
      content,
      showSidebar,
      className: sideBarClassName,
      position: sidebarPosition,
      closeSidebar,
      isMenuClosed,
      toggleIsMenuClosed,
    },
    disableDeploymentsJSONEditor,
    resourcesDefaults,
    telemetryMaxRangeMs,
    codeAppEditorUrl,
    userInfo,
    userAccess,
    isReadOnlyAdmin,
    isFullAdmin,
    isUnitMode,
    canReadNamespace,
    canWriteNamespace,
    canWriteAt,
    isEnableAuth,
    setEntityReadOnly,
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
