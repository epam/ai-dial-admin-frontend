import { TestCase } from '@/src/models/evaluation/test-suite';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';

// TODO: add Parameters column after approve design for it

export const getTestCaseColumns = (testCases: TestCase[]) => {
  const facts = testCases.reduce((acc: string[], testCase) => {
    const testCaseFacts = Object.keys(testCase.facts || {});
    testCaseFacts.forEach((fact) => {
      if (!acc.includes(fact)) {
        acc.push(fact);
      }
    });
    return acc;
  }, [] as string[]);

  return [
    ...TEST_CASES_COLUMN,
    ...facts.map((fact) => ({
      field: fact,
      headerName: fact,
    })),
  ];
};
