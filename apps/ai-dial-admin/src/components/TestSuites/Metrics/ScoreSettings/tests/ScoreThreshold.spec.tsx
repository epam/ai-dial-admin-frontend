import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import ScoreThreshold from '../ScoreThreshold';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSwitch: ({ switchId, label, isOn, onChange }: any) => (
      <button
        type="button"
        role="switch"
        aria-checked={!!isOn}
        aria-label={typeof label === 'string' ? label : switchId}
        onClick={() => onChange?.(!isOn)}
      />
    ),
  };
});

describe('ScoreThreshold', () => {
  const selectedTestSuite: TestSuite = { id: 'suite-1' };

  test('renders title, description and enable switch; hides input until enabled', () => {
    render(<ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreThresholdLabel)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdDescription)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: TestSuitesI18nKey.EnableScoreThreshold })).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  test('enabling the switch sets a default threshold', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ScoreThreshold selectedTestSuite={selectedTestSuite} onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: TestSuitesI18nKey.EnableScoreThreshold }));

    expect(onChange).toHaveBeenCalledWith({ ...selectedTestSuite, overallScoreThreshold: 0.5 });
  });

  test('shows pass threshold controls when threshold is already set', () => {
    render(
      <ScoreThreshold selectedTestSuite={{ ...selectedTestSuite, overallScoreThreshold: 0.5 }} onChange={vi.fn()} />,
    );

    expect(screen.getByText(TestSuitesI18nKey.ScoreThresholdPass)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TestSuitesI18nKey.ScoreThresholdConditionGe))).toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ScoreThresholdFail)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.ScoreThresholdOtherwise)).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  test('calls onChange with the numeric value for an in-range input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ScoreThreshold selectedTestSuite={{ ...selectedTestSuite, overallScoreThreshold: 0 }} onChange={onChange} />,
    );

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '0.5');

    expect(onChange).toHaveBeenLastCalledWith({ ...selectedTestSuite, overallScoreThreshold: 0.5 });
  });

  test('shows an error for an out-of-range input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ScoreThreshold selectedTestSuite={{ ...selectedTestSuite, overallScoreThreshold: 0 }} onChange={onChange} />,
    );

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '2');

    expect(onChange).toHaveBeenLastCalledWith({ ...selectedTestSuite, overallScoreThreshold: 2 });
    expect(screen.getByText(ErrorI18nKey.AllowedRange)).toBeInTheDocument();
  });

  test('disabling the switch clears the threshold', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ScoreThreshold selectedTestSuite={{ ...selectedTestSuite, overallScoreThreshold: 0.5 }} onChange={onChange} />,
    );

    await user.click(screen.getByRole('switch', { name: TestSuitesI18nKey.EnableScoreThreshold }));

    expect(onChange).toHaveBeenCalledWith({ id: 'suite-1' });
  });
});
