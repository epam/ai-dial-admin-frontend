import { Step } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';

export enum EditRequestStep {
  Methods = 'Methods',
  Configuration = 'Configuration',
}

export const EDIT_REQUEST_STEPS = (t: (key: string) => string): Step[] => [
  { id: EditRequestStep.Methods, name: t(TestSuitesI18nKey.Methods) },
  { id: EditRequestStep.Configuration, name: t(TestSuitesI18nKey.Configuration) },
];
