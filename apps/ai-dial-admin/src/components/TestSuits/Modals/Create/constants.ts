import { TabsI18nKey, TestSuitsI18nKey } from '@/src/constants/i18n';
import { Step } from '@epam/ai-dial-ui-kit';

export enum TestSuitTab {
  Properties = 'Properties',
  Application = 'Application',
  Methods = 'Methods',
}

export const TEST_SUIT_STEPS = (t: (key: string) => string) => {
  return [
    {
      id: TestSuitTab.Properties,
      name: t(TabsI18nKey.Properties),
    },
    {
      id: TestSuitTab.Application,
      name: t(TestSuitsI18nKey.Application),
    },

    {
      id: TestSuitTab.Methods,
      name: t(TestSuitsI18nKey.Methods),
    },
  ] as Step[];
};
