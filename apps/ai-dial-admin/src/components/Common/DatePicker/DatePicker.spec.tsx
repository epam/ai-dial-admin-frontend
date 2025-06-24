import { fireEvent, render, screen } from '@testing-library/react';
import DatePicker from './DatePicker';
import { describe, expect, test, vi } from 'vitest';

const setDate = vi.fn();

describe('DatePicker', () => {
  test('should render correctly', () => {
    render(<DatePicker id={'1'} label={'label'} date={new Date('2017-07-01')} setDate={setDate} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('07-01-2017');
  });

  test('should handle date change', async () => {
    render(<DatePicker id={'1'} label={'label'} date={new Date('2017-07-01')} setDate={setDate} />);

    const input = screen.getByRole('textbox');
    fireEvent.click(input);

    const option = await screen.findByText('15');
    fireEvent.click(option);
    expect(setDate).toHaveBeenCalled();
  });
});
