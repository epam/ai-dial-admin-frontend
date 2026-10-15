import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScoreCard from '../OverallScoreCard';

vi.mock('../EditOverallScoreModal', () => ({
  default: ({ isOpen, onApply, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label="edit-overall-score">
        <button type="button" onClick={() => onApply({ id: 'suite-1', overallScore: { type: OverallScoreType.Mean } })}>
          Apply draft
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

describe('OverallScoreCard', () => {
  test('renders calculated-by method, formula badge, and defined threshold', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
      overallScoreThreshold: 0.9,
    };

    render(<OverallScoreCard selectedTestSuite={selectedTestSuite} onChange={onChange} />);

    expect(screen.getByRole('region', { name: TestSuitesI18nKey.OverallScore })).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanCard)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanFormula)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreThresholdLabel)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdPass)).toBeInTheDocument();
    expect(screen.getByText('0.9')).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdFail)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Edit }));
    expect(screen.getByRole('dialog', { name: 'edit-overall-score' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply draft' }));
    expect(onChange).toHaveBeenCalledWith({ id: 'suite-1', overallScore: { type: OverallScoreType.Mean } });
  });

  test('renders calculation method and Not defined when threshold is unset', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: { type: OverallScoreType.Mean },
    };

    render(<OverallScoreCard selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreCalculationMethod)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdNotDefined)).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ScoreThresholdPass)).not.toBeInTheDocument();
  });

  test('renders specific-function card with suite badge and test-case score summary', () => {
    const selectedTestSuite: TestSuite = {
      id: 'suite-1',
      overallScore: {
        type: OverallScoreType.Function,
        expression: { entity: 'eval_summaries', mode: 'aggregate', select: [] } as any,
      },
      testCaseOverallScore: { type: OverallScoreType.Mean },
      overallScoreThreshold: 0.5,
    };

    render(<OverallScoreCard selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreFunction)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreSuiteLevelOnly)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreTestCasesCalculatedBy)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanCard)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreMeanFormula)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdOtherwise)).toBeInTheDocument();
  });
});
