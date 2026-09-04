import { ReactNode } from 'react';

export type AdaptiveHeaderActionAppearance = 'link' | 'neutral' | 'danger';

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
  /** Rendered before Delete when expanded; first in the overflow menu. */
  leading?: AdaptiveHeaderAction[];
  /** Rendered after Delete when expanded; before Delete in the overflow menu. */
  trailing?: AdaptiveHeaderAction[];
}
