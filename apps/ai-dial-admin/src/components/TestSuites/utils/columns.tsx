import ValidityStatus from '@/src/components/Common/ValidityStatus/ValidityStatus';
import { BASE_STATUS_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestCase } from '@/src/models/evaluation/test-suite';

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
    {
      ...BASE_STATUS_COLUMN,
      cellRenderer: (params: { data?: { valid: boolean } }) => {
        return <ValidityStatus valid={params.data?.valid} isHideHint={true} />;
      },
    },
  ];
};
