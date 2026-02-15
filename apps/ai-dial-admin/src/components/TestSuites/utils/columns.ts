import { TestCase } from '@/src/models/evaluation/test-suite';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';

export const getTestCaseColumns = (testCases: TestCase[]) => {
  const data = testCases.reduce((acc: string[], testCase) => {
    const testCaseFacts = Object.keys(testCase.data || {});
    testCaseFacts.forEach((fact) => {
      if (!acc.includes(fact)) {
        acc.push(fact);
      }
    });
    return acc;
  }, [] as string[]);

  return [
    ...TEST_CASES_COLUMN,
    ...data.map((fact) => ({
      field: fact,
      headerName: fact,
    })),
  ];
};
