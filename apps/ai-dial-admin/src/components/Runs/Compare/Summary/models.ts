import { ComponentProps, ReactNode } from 'react';

import { DialAnalyticsCard } from '@epam/ai-dial-ui-kit';

/** Dual-run statistic card for the Distribution section. */
export interface CompareMetricStatCard {
  name: string;
  primaryValue: number | null;
  comparedValue: number | null;
}

/** One metric group aligned for DialAnalyticsBarGroup compare mode. */
export interface CompareBarGroup {
  name: string;
  data: Record<string, number | null>;
  compareData: Record<string, number | null>;
  description?: string;
  barDescriptions?: Record<string, string>;
}

/** One run's line in a DualRunField; the list is already in display order. */
export interface DualRunFieldEntry {
  key: string;
  runName: string;
  value: string;
  postfix?: ReactNode;
}

/** The two-slot `compareValues` shape DialAnalyticsCard takes. */
export type CompareCardItems = NonNullable<ComponentProps<typeof DialAnalyticsCard>['compareValues']>;
