import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, test, vi } from 'vitest';
import RangePicker from './RangePicker';

const getDate = (year: number, month: number, day: number, h = 0, m = 0, s = 0) => {
  return new Date(year, month - 1, day, h, m, s, 0);
};

describe('RangePicker', () => {
  test('renders start and end date pickers and button', () => {
    render(<RangePicker timeRange={null} onChange={vi.fn()} />);
    expect(screen.getByText(BasicI18nKey.From)).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.To)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Apply)).toBeInTheDocument();
  });

  test('calls onChange with correct range when button is clicked', () => {
    const onChange = vi.fn();
    const start = getDate(2023, 1, 1);
    const end = getDate(2023, 1, 2);
    render(<RangePicker timeRange={{ startDate: start, endDate: end }} onChange={onChange} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Apply));
    expect(onChange).toHaveBeenCalledWith({ startDate: start, endDate: end });
  });
});
