import { StepStatus } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';

export const getStepStatusLabels = (t: (key: string) => string): Record<StepStatus, string> => ({
  [StepStatus.VALID]: t(BasicI18nKey.StepCompleted),
  [StepStatus.ERROR]: t(BasicI18nKey.StepError),
});
