import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import TestCaseOverallScore from '../TestCaseOverallScore';

vi.mock('../WeightedMean', () => ({ default: () => <div>weighted-mean-panel</div> }));

describe('TestCaseOverallScore', () => {
  test('renders title and mean/weighted mean radios', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      testCaseOverallScore: { type: OverallScoreType.Mean },
    };

    render(<TestCaseOverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.TestCaseOverallScore)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TestCaseOverallScoreDescription)).not.toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMean)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightedMean)).toBeInTheDocument();
  });

  test('selecting weighted mean seeds the first metric output with weight 1', async () => {
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      testCaseOverallScore: { type: OverallScoreType.Mean },
    };
    const metrics = [{ name: 'A' }, { name: 'B' }];

    render(<TestCaseOverallScore selectedTestSuite={selectedTestSuite} metrics={metrics} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightedMean));

    expect(onChange).toHaveBeenCalledWith({
      ...selectedTestSuite,
      testCaseOverallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'A', outputField: 'score', weight: 1 }],
      },
    });
  });

  test('renders weighted mean panel when selected', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      testCaseOverallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'A', outputField: 'score', weight: 1 }],
      },
    };

    render(<TestCaseOverallScore selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('weighted-mean-panel')).toBeInTheDocument();
  });
});
