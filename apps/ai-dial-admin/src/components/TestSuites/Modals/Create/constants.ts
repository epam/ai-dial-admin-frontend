import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { SuiteType } from '@/src/models/evaluation/test-suite';

export enum TestSuitTab {
  Properties = 'Properties',
  Target = 'Target',
  Methods = 'Methods',
}

export const TEST_SUIT_STEPS = (t: (key: string) => string, hideProperties: boolean, suiteType?: SuiteType) => {
  const step3Label = suiteType === 'MCP_TOOL' ? t(TestSuitesI18nKey.Tool) : t(TestSuitesI18nKey.Methods);

  const steps = [
    {
      id: TestSuitTab.Target,
      name: t(TestSuitesI18nKey.Target),
    },

    {
      id: TestSuitTab.Methods,
      name: step3Label,
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
