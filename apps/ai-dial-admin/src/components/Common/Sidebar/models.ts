export enum DockPosition {
  Right = 'right',
  Bottom = 'bottom',
}

export interface ShowSidebarOptions {
  /** Enables the right/bottom dock toggle for this sidebar content. Default: false. */
  dockable?: boolean;
  /** When set, the chosen dock position is persisted to localStorage under this key. */
  persistKey?: string;
}
