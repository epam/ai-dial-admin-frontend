import { TabModel } from '@epam/ai-dial-ui-kit';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

export enum MetricStep {
  AddMetric = 'add-metric',
  Configuration = 'configuration',
}

export const CONDITION_MAX_LENGTH = 2000;

// A bare `name()` (no `$`, paths, or operators) is a reserved "system function" call. None ship yet,
// so the backend rejects it with a 400 — we surface that client-side before the request is sent.
export const SYSTEM_FUNCTION_CONDITION_REGEX = /^[A-Za-z_][A-Za-z0-9_]*\(\)$/;

export enum SectionView {
  Controls = 'Controls',
  Schema = 'Schema',
}

export const getSectionTabs = (t: (key: string) => string): TabModel[] => [
  {
    id: SectionView.Controls,
    label: t(TestSuitesI18nKey.Controls),
  },
  {
    id: SectionView.Schema,
    label: t(TestSuitesI18nKey.Schema),
  },
];
