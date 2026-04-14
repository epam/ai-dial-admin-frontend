import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TimeFilter from './TimeFilter';

const getDate = (year: number, month: number, day: number, h = 12) => new Date(year, month - 1, day, h, 0, 0, 0);

const baseProps = () => ({
  timePeriod: '2d',
  onTimePeriodChange: vi.fn(),
  timeRange: { startDate: getDate(2026, 3, 1), endDate: getDate(2026, 3, 3) },
  onTimeRangeChange: vi.fn(),
  maxRangeDays: 3,
});

describe('TimeFilter', () => {
  test('renders the current preset label in the trigger', () => {
    render(<TimeFilter {...baseProps()} />);
    expect(screen.getByText(/Last 2d/i)).toBeInTheDocument();
  });

  test('clicking a preset commits immediately and dismisses', async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<TimeFilter {...props} />);

    await user.click(screen.getByText(/Last 2d/i));
    await user.click(screen.getByText(/Last 1h/i));

    expect(props.onTimePeriodChange).toHaveBeenCalledWith('1h');
  });

  test('calendar panel is hidden until Custom is clicked', async () => {
    const user = userEvent.setup();
    render(<TimeFilter {...baseProps()} />);

    await user.click(screen.getByText(/Last 2d/i));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const customButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.trim().startsWith('Telemetry.Custom'));
    expect(customButtons.length).toBeGreaterThan(0);
    await user.click(customButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  test('Apply is disabled when no date selected in custom mode', async () => {
    const user = userEvent.setup();
    render(<TimeFilter {...baseProps()} />);

    await user.click(screen.getByText(/Last 2d/i));
    const customButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.trim().startsWith('Telemetry.Custom'));
    await user.click(customButtons[0]);

    const applyButton = screen.getByRole('button', { name: /Buttons\.Apply/i });
    expect(applyButton).toBeDisabled();
  });

  test('Apply commits the selected range with isCustom=true', async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<TimeFilter {...props} />);

    await user.click(screen.getByText(/Last 2d/i));
    const customButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.trim().startsWith('Telemetry.Custom'));
    await user.click(customButtons[0]);

    const dayCells = document.querySelectorAll<HTMLElement>(
      '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
    );
    expect(dayCells.length).toBeGreaterThan(0);
    fireEvent.click(dayCells[0]);

    const applyButton = screen.getByRole('button', { name: /Buttons\.Apply/i });
    await waitFor(() => expect(applyButton).not.toBeDisabled());

    await user.click(applyButton);

    expect(props.onTimeRangeChange).toHaveBeenCalled();
    const [rangeArg, isCustom] = props.onTimeRangeChange.mock.calls.at(-1)!;
    expect(rangeArg).toHaveProperty('startDate');
    expect(rangeArg).toHaveProperty('endDate');
    expect(isCustom).toBe(true);
  });

  test('Cancel does not commit', async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<TimeFilter {...props} />);

    await user.click(screen.getByText(/Last 2d/i));
    const customButtons = screen
      .getAllByRole('button')
      .filter((b) => b.textContent?.trim().startsWith('Telemetry.Custom'));
    await user.click(customButtons[0]);

    const dayCells = document.querySelectorAll<HTMLElement>(
      '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
    );
    fireEvent.click(dayCells[0]);

    await user.click(screen.getByRole('button', { name: /Buttons\.Cancel/i }));

    expect(props.onTimeRangeChange).not.toHaveBeenCalled();
  });
});
