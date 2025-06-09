import { fireEvent, render, screen } from '@testing-library/react';
import DatePicker from './DatePicker';

const setDate = jest.fn();

describe('DatePicker', () => {
  it('should render correctly', () => {
    render(<DatePicker id={'1'} label={'label'} date={new Date('2017-07-01')} setDate={setDate} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('07-01-2017');
  });

  it('should handle date change', async () => {
    render(<DatePicker id={'1'} label={'label'} date={new Date('2017-07-01')} setDate={setDate} />);

    const input = screen.getByRole('textbox');
    fireEvent.click(input);

    const option = await screen.findByText('15');
    fireEvent.click(option);
    expect(setDate).toHaveBeenCalled();
  });
});
