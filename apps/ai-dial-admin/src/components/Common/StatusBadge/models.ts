import { ReactNode } from 'react';

export enum StatusBadgeTone {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Neutral = 'neutral',
}

export enum StatusBadgeLeading {
  Dot = 'dot',
  Spinner = 'spinner',
  None = 'none',
}

export interface StatusBadgeProps {
  tone: StatusBadgeTone;
  label: string;
  leading?: StatusBadgeLeading;
  hint?: string;
  /** Rendered beside the pill, outside its background; the badge never interprets it. */
  trailing?: ReactNode;
  className?: string;
}

export interface StatusBadgeToneStyle {
  backgroundClassName: string;
  textClassName: string;
}
