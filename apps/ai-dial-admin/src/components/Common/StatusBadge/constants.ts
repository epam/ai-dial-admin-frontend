import { StatusBadgeTone, StatusBadgeToneStyle } from './models';

export const STATUS_BADGE_TONES: Record<StatusBadgeTone, StatusBadgeToneStyle> = {
  [StatusBadgeTone.Success]: { backgroundClassName: 'bg-success', textClassName: 'text-success' },
  [StatusBadgeTone.Error]: { backgroundClassName: 'bg-error', textClassName: 'text-error' },
  [StatusBadgeTone.Info]: { backgroundClassName: 'bg-info', textClassName: 'text-info' },
  [StatusBadgeTone.Neutral]: { backgroundClassName: 'bg-control-neutral-hover-muted', textClassName: 'text-secondary' },
};
