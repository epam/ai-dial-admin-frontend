import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Step, StepStatus } from '@epam/ai-dial-ui-kit';

export enum TestSuitTab {
  Properties = 'Properties',
  Application = 'Application',
  Methods = 'Methods',
}

export const TEST_SUIT_STEPS = (t: (key: string) => string, hideProperties: boolean) => {
  const steps = [
    {
      id: TestSuitTab.Application,
      name: t(TestSuitesI18nKey.Application),
    },

    {
      id: TestSuitTab.Methods,
      name: t(TestSuitesI18nKey.Methods),
      status: StepStatus.VALID,
    },
  ];
  return hideProperties
    ? steps
    : ([
        {
          id: TestSuitTab.Properties,
          name: t(TabsI18nKey.Properties),
        },
        ...steps,
      ] as Step[]);
};
