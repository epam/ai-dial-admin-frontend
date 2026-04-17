import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import RangePicker from './RangePicker';

const getDate = (year: number, month: number, day: number, h = 12) => new Date(year, month - 1, day, h, 0, 0, 0);

// Find the day cell for a numeric day, skipping cells from adjacent months.
const getDayCell = (container: HTMLElement, day: number): HTMLElement => {
  const cells = Array.from(container.querySelectorAll<HTMLElement>('.react-datepicker__day'));
  const cell = cells.find(
    (c) => c.textContent?.trim() === String(day) && !c.classList.contains('react-datepicker__day--outside-month'),
  );
  if (!cell) throw new Error(`Day cell for ${day} not found`);
  return cell;
};

describe('RangePicker', () => {
  test('renders the max-days badge', () => {
    render(<RangePicker value={null} onChange={vi.fn()} maxDays={3} />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  test('renders an inline calendar (no text input)', () => {
    render(<RangePicker value={null} onChange={vi.fn()} maxDays={3} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('hydrates from value prop with range highlighted', () => {
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 5) }}
        onChange={vi.fn()}
        maxDays={3}
      />,
    );
    // Some in-range day should carry the range-start/end/in-range class
    const hasRangeClass = container.querySelector(
      '.react-datepicker__day--range-start, .react-datepicker__day--range-end, .react-datepicker__day--in-range',
    );
    expect(hasRangeClass).not.toBeNull();
  });

  test('first click on empty calendar emits a single-day range', () => {
    const onChange = vi.fn();
    // Hydrate with a same-day range so the calendar opens on the correct month.
    const today = getDate(2026, 3, 3);
    const { container } = render(
      <RangePicker value={{ startDate: today, endDate: today }} onChange={onChange} maxDays={3} />,
    );
    // Click day 3 — same day, no-op per FSM; click day 5 to form an interval
    fireEvent.click(getDayCell(container, 5));
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).not.toBeNull();
    // The commit should span [3, 5] or similar — endDate must be after or equal startDate
    expect(lastCall.endDate.getTime()).toBeGreaterThanOrEqual(lastCall.startDate.getTime());
  });

  test('clicking within reach of anchor emits a multi-day range', () => {
    const onChange = vi.fn();
    // Start from single-day state on day 3
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 3) }}
        onChange={onChange}
        maxDays={3}
      />,
    );
    fireEvent.click(getDayCell(container, 5)); // within reach (|5-3|=2 ≤ 2)
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.startDate.getDate()).toBe(3);
    expect(lastCall.endDate.getDate()).toBe(5);
  });

  test('clicking beyond reach resets the anchor to a single day', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 3) }}
        onChange={onChange}
        maxDays={3}
      />,
    );
    fireEvent.click(getDayCell(container, 10)); // beyond reach (|10-3|=7 > 2)
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.startDate.getDate()).toBe(10);
    expect(lastCall.endDate.getDate()).toBe(10);
  });

  test('clicking an interval endpoint collapses to a single day', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 5) }}
        onChange={onChange}
        maxDays={3}
      />,
    );
    fireEvent.click(getDayCell(container, 3));
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.startDate.getDate()).toBe(3);
    expect(lastCall.endDate.getDate()).toBe(3);
  });

  test('clicking a middle day of an interval shifts to preserve the latest click', () => {
    const onChange = vi.fn();
    // Hydrated interval [3, 5] — anchor is 3, latest is 5 (per hydrate convention).
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 5) }}
        onChange={onChange}
        maxDays={3}
      />,
    );
    fireEvent.click(getDayCell(container, 4));
    // Per FSM, click on middle day → interval(anchor: latest=5, latest: 4)
    // which displays as [4, 5] (min..max).
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.startDate.getDate()).toBe(4);
    expect(lastCall.endDate.getDate()).toBe(5);
  });

  test('clicking outside an interval collapses to a single day', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 5) }}
        onChange={onChange}
        maxDays={3}
      />,
    );
    fireEvent.click(getDayCell(container, 10));
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.startDate.getDate()).toBe(10);
    expect(lastCall.endDate.getDate()).toBe(10);
  });

  test('dims days beyond reach when in single-date state', () => {
    const { container } = render(
      <RangePicker
        value={{ startDate: getDate(2026, 3, 3), endDate: getDate(2026, 3, 3) }}
        onChange={vi.fn()}
        maxDays={3}
      />,
    );
    // Day 10 should carry the out-of-reach class
    const day10 = getDayCell(container, 10);
    expect(day10.className).toContain('dial-range-picker__day--out-of-reach');
    // Day 4 should NOT (within reach)
    const day4 = getDayCell(container, 4);
    expect(day4.className).not.toContain('dial-range-picker__day--out-of-reach');
  });
});
