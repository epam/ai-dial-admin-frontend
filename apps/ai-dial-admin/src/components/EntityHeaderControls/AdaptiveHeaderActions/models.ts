import { ReactNode } from 'react';

export type AdaptiveHeaderActionAppearance = 'link' | 'neutral' | 'danger' | 'ghost';

export interface AdaptiveHeaderAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  appearance?: AdaptiveHeaderActionAppearance;
  /** When expanded, render a vertical divider after this action. */
  dividerAfter?: boolean;
}

export interface AdaptiveHeaderActionsConfig {
  /** Rendered first when expanded; first in the overflow menu. */
  leading?: AdaptiveHeaderAction[];
  /** Rendered after leading (and Delete, when present) when expanded; before Delete in the overflow menu. */
  trailing?: AdaptiveHeaderAction[];
}
