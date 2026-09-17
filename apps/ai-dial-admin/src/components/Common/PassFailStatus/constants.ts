import { IconCheck, IconCircleDashed, IconCircleMinus, IconX } from '@tabler/icons-react';

/** Tailwind text-color tokens for pass / fail / error / not-scored status breakdown. */
export const STATUS_DOT_CLASSES = {
  pass: 'text-accent-secondary',
  fail: 'text-error',
  error: 'text-secondary',
  notScored: 'text-warning',
} as const;

/** Icons for pass / fail / error / not-scored status breakdown. */
export const STATUS_DOT_ICONS = {
  pass: IconCheck,
  fail: IconX,
  error: IconCircleMinus,
  notScored: IconCircleDashed,
} as const;
