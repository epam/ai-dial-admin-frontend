import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { NumberInputField } from '../InputField';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('NumberInputField', () => {
  test('renders with value and calls onChange with getInputValue', () => {
    const onChange = vi.fn();
    render(<NumberInputField elementId="num" value={5} onChange={onChange} fieldTitle="Number" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5);
    fireEvent.change(input, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  test('renders readonly input with value', () => {
    const onChange = vi.fn();
    render(<NumberInputField elementId="num" value={5} onChange={onChange} fieldTitle="Number" readonly={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    render(<NumberInputField elementId="num" onChange={onChange} fieldTitle="Number" readonly={true} />);
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });

  test('renders readonly input with value', () => {
    const onChange = vi.fn();
    render(
      <NumberInputField
        elementId="num"
        value={5}
        onChange={onChange}
        fieldTitle="Number"
        textBeforeInput="text-before-input"
      />,
    );
    expect(screen.getByText('text-before-input')).toBeInTheDocument();
  });
});
