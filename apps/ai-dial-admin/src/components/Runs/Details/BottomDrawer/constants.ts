import { RunsI18nKey } from '@/src/constants/i18n';

export const SECTION_I18N: Record<string, RunsI18nKey> = {
  execution: RunsI18nKey.Execution,
  testCaseData: RunsI18nKey.TestCaseData,
  extractedColumns: RunsI18nKey.ExtractedColumns,
  requestResponse: RunsI18nKey.RequestResponse,
};

export const TRUNCATE_THRESHOLD = 500;

export const EXECUTION_STATUS_FIELD_KEY = 'executionStatus';

export const DEFAULT_DRAWER_HEIGHT = 380;
export const MIN_DRAWER_HEIGHT = 200;
export const MAX_DRAWER_OFFSET = 100;
export const COLLAPSED_HEIGHT = 34;
