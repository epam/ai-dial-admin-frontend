import { TestCase } from '@/src/models/evaluation/test-suite';

export const getTestCaseGridData = (testCases?: TestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: TestCase) => {
      const factsData = Object.keys(testCase.data || {}).reduce((factsAcc: Record<string, string>, factKey: string) => {
        factsAcc[factKey] = testCase.data?.[factKey] as string;
        return factsAcc;
      }, {});

      acc.push({
        ...testCase,
        ...factsData,
      });
      return acc;
    }, []) || []
  );
};
