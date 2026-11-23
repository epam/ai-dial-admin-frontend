import { AnalyticsExportPreviewTab } from '@/src/types/analytics/export';

export interface AnalyticsExportAccessRow {
  table: string;
  role: string;
  outcome: string;
  detail?: string;
  isWarning: boolean;
}

export type AnalyticsExportPreviewRows = Partial<Record<AnalyticsExportPreviewTab, object[]>>;
