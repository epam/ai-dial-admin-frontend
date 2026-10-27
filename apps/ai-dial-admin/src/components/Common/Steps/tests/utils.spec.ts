import { StepStatus } from '@epam/ai-dial-ui-kit';
import { describe, expect, it } from 'vitest';

import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('getStepStatusLabels', () => {
  it('translates a label for each step status', () => {
    const t = (key: string) => `t:${key}`;

    expect(getStepStatusLabels(t)).toEqual({
      [StepStatus.VALID]: `t:${BasicI18nKey.StepCompleted}`,
      [StepStatus.ERROR]: `t:${BasicI18nKey.StepError}`,
    });
  });
});
