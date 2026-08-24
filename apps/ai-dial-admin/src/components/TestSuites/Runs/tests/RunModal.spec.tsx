import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as actions from '@/src/app/[lang]/datasets/actions';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ComparisonOp, ExprType, FilterNode, ValueType } from '@/src/models/evaluation/structured-query';
import { TestSuite } from '@/src/models/evaluation/test-suite';

import RunModal from '../RunModal';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getTestCases: vi.fn(),
  getDataset: vi.fn(),
}));

const schema = [{ name: 'expected', type: TestCaseItemType.STRING, required: false, description: '', perTurn: true }];

const notContainsLondon: FilterNode = {
  op: ComparisonOp.Nc,
  args: [
    { type: ExprType.Field, name: 'data::expected' },
    { type: ExprType.Value, value_type: ValueType.String, value: 'London' },
  ],
};

const testCases = [
  {
    id: 'round-1',
    testCaseName: 'Round 1',
    valid: true,
    data: { expected: 'Berlin' },
  },
  {
    id: 'round-2',
    testCaseName: 'Round 2',
    valid: true,
    data: {},
    multiTurnData: [{}, { expected: 'London' }],
  },
  {
    id: 'round-3',
    testCaseName: 'Round 3',
    valid: true,
    data: {},
    multiTurnData: [{}, {}, { expected: 'John' }],
  },
];

const pageData = {
  page: 0,
  size: 1000,
  totalElements: testCases.length,
  totalPages: 1,
  content: testCases,
};

const suite: TestSuite = {
  id: 'suite-1',
  datasetId: 'ds-1',
  testCaseFilter: notContainsLondon,
};

const renderModal = (selectedTestSuite: TestSuite = suite) => {
  return render(
    <RunModal isModalOpen={true} selectedTestSuite={selectedTestSuite} onClose={vi.fn()} onRun={vi.fn()} />,
  );
};

describe('RunModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(actions.getTestCases).mockResolvedValue(pageData as never);
    vi.mocked(actions.getDataset).mockResolvedValue({ response: { testCaseSchema: schema } } as never);
  });

  test('counts included multi-turn cases after expanding per-turn rows', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
  });

  test('counts all valid cases when no run condition is set', async () => {
    renderModal({ id: 'suite-1', datasetId: 'ds-1', testCaseFilter: null });

    await waitFor(() => {
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
    });
  });
});
