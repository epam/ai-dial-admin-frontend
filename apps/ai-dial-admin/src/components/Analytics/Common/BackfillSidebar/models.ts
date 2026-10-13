import { ReactNode } from 'react';

import { BackfillTone } from '@/src/models/analytics/backfill-ui';

export interface BackfillRange {
  from: string;
  to: string;
}

/** One measure of a run: a label, its value, and an optional line that explains the label behind an info icon. */
export interface BackfillMetric {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: BackfillTone;
}
