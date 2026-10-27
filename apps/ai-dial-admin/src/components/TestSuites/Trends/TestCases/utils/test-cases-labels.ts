import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface TestCasesSegmentLabels {
  title: string;
  testCasesLabel: string;
  completedLabel: string;
  aboveLabel: string;
  successLabel: string;
  belowLabel: string | null;
  errorLabel: string;
  totalLabel: string;
}

export const getTestCasesSegmentLabels = (t: Translate, hasThreshold: boolean): TestCasesSegmentLabels => {
  const completedLabel = t(TestSuitesI18nKey.TrendsTestCasesCompleted);
  const aboveLabel = t(TestSuitesI18nKey.TrendsScoreAboveThreshold);

  return {
    title: t(TabsI18nKey.TestCases),
    testCasesLabel: t(TabsI18nKey.TestCases),
    completedLabel,
    aboveLabel,
    successLabel: hasThreshold ? aboveLabel : completedLabel,
    belowLabel: hasThreshold ? t(TestSuitesI18nKey.TrendsScoreBelowThreshold) : null,
    errorLabel: t(TestSuitesI18nKey.TrendsTestCasesErrorOrNa),
    totalLabel: t(TestSuitesI18nKey.TrendsTotalTestCases),
  };
};
