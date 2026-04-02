import { TabModel } from '@epam/ai-dial-ui-kit';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

export enum MetricStep {
  AddMetric = 'add-metric',
  Configuration = 'configuration',
}

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
