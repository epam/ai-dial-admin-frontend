import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScore from '../OverallScore';
import { FunctionParameterSourceType, OverallScoreFunctionName } from '../models';
import { buildOverallScoreFunctionExpression } from '../utils';

vi.mock('../WeightedMean', () => ({ default: () => <div>weighted-mean-panel</div> }));
vi.mock('../TestCaseOverallScore', () => ({ default: () => <div>test-case-overall-score</div> }));
vi.mock('../SpecificFunction', () => ({
  default: ({ responseColumns, testCaseScoreContent }: any) => (
    <div>
      specific-function-panel
      {responseColumns?.map((column: any) => (
        <span key={column.name}>{column.name}</span>
      ))}
      {testCaseScoreContent}
    </div>
  ),
}));

describe('OverallScore', () => {
  test('renders title, description and all radios', () => {
    const selectedTestSuite: TestSuite = { id: 'suite-1' };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreCalculationMethod)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreDescription)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMean)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightedMean)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreFunction)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanFormula)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreWeightedMeanFormula)).toBeInTheDocument();
  });

  test('selecting mean calls onChange with the mean overallScore', async () => {
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = { id: 'suite-1' };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMean));

    expect(onChange).toHaveBeenCalledWith({ ...selectedTestSuite, overallScore: { type: OverallScoreType.Mean } });
  });

  test('selecting weighted mean seeds the first metric output with weight 1 and reveals the panel', async () => {
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = { id: 'suite-1' };
    const metrics = [{ name: 'A' }, { name: 'B' }];

    render(<OverallScore selectedTestSuite={selectedTestSuite} metrics={metrics} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightedMean));

    expect(onChange).toHaveBeenCalledWith({
      ...selectedTestSuite,
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'A', outputField: 'score', weight: 1 }],
      },
    });
  });

  test('renders the weighted mean panel when already selected', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'A', outputField: 'score', weight: 1 }],
      },
    };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('weighted-mean-panel')).toBeInTheDocument();
  });

  test('selecting function calls onChange with the function overallScore', async () => {
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = { id: 'suite-1' };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(TestSuitesI18nKey.OverallScoreFunction));

    expect(onChange).toHaveBeenCalledWith({
      ...selectedTestSuite,
      overallScore: {
        type: OverallScoreType.Function,
        expression: buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, [
          { $type: FunctionParameterSourceType.TestCase },
          { $type: FunctionParameterSourceType.Response },
        ]),
      },
      testCaseOverallScore: { type: OverallScoreType.Mean },
    });
  });

  test('renders the specific function panel and nested test case score when already selected', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.Function,
        expression: buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, [
          { $type: FunctionParameterSourceType.TestCase },
          { $type: FunctionParameterSourceType.Response },
        ]),
      },
    };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('specific-function-panel')).toBeInTheDocument();
    expect(screen.getByText('test-case-overall-score')).toBeInTheDocument();
  });

  test('selecting mean clears testCaseOverallScore', async () => {
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.Function,
        expression: buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, [
          { $type: FunctionParameterSourceType.TestCase },
          { $type: FunctionParameterSourceType.Response },
        ]),
      },
      testCaseOverallScore: { type: OverallScoreType.Mean },
    };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMean));

    expect(onChange).toHaveBeenCalledWith({
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
    });
  });

  test('passes response columns from the whole request chain to the specific function panel', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: '', type: 'string' }],
      additionalRequests: [
        { responseColumns: [{ name: 'follow_up', displayName: 'Follow up', expression: '', type: 'string' }] },
      ],
      overallScore: {
        type: OverallScoreType.Function,
        expression: buildOverallScoreFunctionExpression(OverallScoreFunctionName.RocAuc, [
          { $type: FunctionParameterSourceType.TestCase },
          { $type: FunctionParameterSourceType.Response },
        ]),
      },
    };

    render(<OverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('answer')).toBeInTheDocument();
    expect(screen.getByText('follow_up')).toBeInTheDocument();
  });
});
