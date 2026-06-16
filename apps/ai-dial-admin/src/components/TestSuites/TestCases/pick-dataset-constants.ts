import { Step, StepStatus } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';

export enum AttachDatasetTab {
  SelectDataset = 'SelectDataset',
  PreviewTestCases = 'PreviewTestCases',
}

export const ATTACH_DATASET_STEPS = (t: (key: string) => string): Step[] => [
  {
    id: AttachDatasetTab.SelectDataset,
    name: t(TestSuitesI18nKey.SelectDataset),
  },
  {
    id: AttachDatasetTab.PreviewTestCases,
    name: t(TestSuitesI18nKey.PreviewTestCases),
    status: StepStatus.VALID,
  },
];
