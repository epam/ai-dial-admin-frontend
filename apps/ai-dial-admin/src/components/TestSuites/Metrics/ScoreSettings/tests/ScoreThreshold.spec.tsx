import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import ScoreThreshold from '../ScoreThreshold';

describe('ScoreThreshold', () => {
  const selectedTestSuite: TestSuite = { id: 'suite-1' };

  test('renders title, description and pass/fail labels', () => {
    render(<ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ScoreThreshold)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdDescription)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdPass)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdFail)).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  test('calls onChange with the numeric value for an in-range input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={onChange} />);

    await user.type(screen.getByRole('spinbutton'), '0.5');

    expect(onChange).toHaveBeenLastCalledWith({ ...selectedTestSuite, overallScoreThreshold: 0.5 });
  });

  test('shows an error and does not disable typing for an out-of-range input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={onChange} />);

    await user.type(screen.getByRole('spinbutton'), '2');

    expect(onChange).toHaveBeenLastCalledWith({ ...selectedTestSuite, overallScoreThreshold: 2 });
    expect(screen.getByText(ErrorI18nKey.AllowedRange)).toBeInTheDocument();
  });
});
