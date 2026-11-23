import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as datasetActions from '@/src/app/[lang]/datasets/actions';
import * as testSuiteActions from '@/src/app/[lang]/test-suites/actions';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseItemType } from '@/src/types/evaluation';
import { ComparisonOp, ExprType, FilterNode, ValueType } from '@/src/models/evaluation/structured-query';
import { TestSuite } from '@/src/models/evaluation/test-suite';

import RunModal from '../RunModal';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getTestCases: vi.fn(),
  getDataset: vi.fn(),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteRunConfig: vi.fn(),
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

const renderModal = (selectedTestSuite: TestSuite = suite, onRun = vi.fn()) => {
  return render(<RunModal isModalOpen={true} selectedTestSuite={selectedTestSuite} onClose={vi.fn()} onRun={onRun} />);
};

const getRunsInput = () => document.getElementById('numberOfRuns') as HTMLInputElement;
const getConcurrencyInput = () => document.getElementById('concurrencyLevel') as HTMLInputElement;
const getButton = (key: TestSuitesI18nKey) => screen.getByRole('button', { name: key });

describe('RunModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(datasetActions.getTestCases).mockResolvedValue(pageData as never);
    vi.mocked(datasetActions.getDataset).mockResolvedValue({ response: { testCaseSchema: schema } } as never);
    vi.mocked(testSuiteActions.getTestSuiteRunConfig).mockResolvedValue({
      success: true,
      response: { maxConcurrencyLevel: 5 },
    } as never);
  });

  test('counts included multi-turn cases after expanding per-turn rows', async () => {
    renderModal();

    expect(await screen.findByText(TestSuitesI18nKey.SelectedTestCasesCount)).toBeInTheDocument();
  });

  test('counts all valid cases when no run condition is set', async () => {
    renderModal({ id: 'suite-1', datasetId: 'ds-1', testCaseFilter: null });

    expect(await screen.findByText(TestSuitesI18nKey.AllTestCasesCount)).toBeInTheDocument();
  });

  describe('number of runs stepper', () => {
    const renderLoaded = async () => {
      renderModal();
      await screen.findByText(TestSuitesI18nKey.SelectedTestCasesCount);
    };

    test('increments the value', async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await user.click(getButton(TestSuitesI18nKey.IncreaseRuns));

      expect(getRunsInput().value).toBe('2');
    });

    test('decrement stops at 1', async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await user.click(getButton(TestSuitesI18nKey.DecreaseRuns));

      expect(getRunsInput().value).toBe('1');
    });

    test.each([TestSuitesI18nKey.IncreaseRuns, TestSuitesI18nKey.DecreaseRuns])(
      'sets 1 on %s when the input is empty',
      async (key) => {
        const user = userEvent.setup();
        await renderLoaded();

        await user.clear(getRunsInput());
        expect(getRunsInput().value).toBe('');

        await user.click(getButton(key));

        expect(getRunsInput().value).toBe('1');
      },
    );
  });

  describe('concurrency stepper', () => {
    const renderLoaded = async () => {
      renderModal();
      await screen.findByText(TestSuitesI18nKey.SelectedTestCasesCount);
    };

    test('increments up to the loaded max', async () => {
      const user = userEvent.setup();
      await renderLoaded();

      for (let i = 0; i < 6; i++) {
        await user.click(getButton(TestSuitesI18nKey.IncreaseParallelTestCases));
      }

      expect(getConcurrencyInput().value).toBe('5');
    });

    test('decrement stops at 1', async () => {
      const user = userEvent.setup();
      await renderLoaded();

      await user.click(getButton(TestSuitesI18nKey.DecreaseParallelTestCases));

      expect(getConcurrencyInput().value).toBe('1');
    });

    test('shows the maximum and an error when a typed value exceeds it', async () => {
      const user = userEvent.setup();
      await renderLoaded();

      expect(screen.getByText(TestSuitesI18nKey.ParallelTestCasesMaximum)).toBeInTheDocument();

      await user.clear(getConcurrencyInput());
      await user.type(getConcurrencyInput(), '99');

      expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.ParallelTestCasesAboveMaximum);
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Run })).toBeDisabled();
    });
  });

  test('ignores a second Run click while the first request is in flight', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn(() => new Promise(() => undefined));

    renderModal(suite, onRun);

    expect(await screen.findByText(TestSuitesI18nKey.SelectedTestCasesCount)).toBeInTheDocument();

    const runButton = screen.getByRole('button', { name: ButtonsI18nKey.Run });
    await user.click(runButton);
    await user.click(runButton);

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun).toHaveBeenCalledWith({ numberOfRuns: 1, concurrencyLevel: 1 });
    expect(runButton).toBeDisabled();
  });
});
