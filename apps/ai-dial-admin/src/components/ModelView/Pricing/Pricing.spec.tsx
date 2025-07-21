import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Pricing from './Pricing';

describe('Pricing', () => {
  test('renders dropdown and number fields', () => {
    const model = { pricing: { unit: 'Tokens', prompt: '1', completion: '2' } };
    const onChangeModel = vi.fn();

    render(<Pricing model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText('Cost Unit')).toBeInTheDocument();
    expect(screen.getByText('Tokens')).toBeInTheDocument();
    expect(screen.getByText('Prompt Price')).toBeInTheDocument();
    expect(screen.getByText('Completion Price')).toBeInTheDocument();
    expect(screen.getAllByText('$').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  test('disables inputs when unit is None', () => {
    const model = { pricing: { unit: 'None', prompt: '0', completion: '0' } };
    const onChangeModel = vi.fn();

    render(<Pricing model={model as any} onChangeModel={onChangeModel} />);
    const inputs = screen.getAllByRole('spinbutton');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  test('calls onChangeModel when dropdown changes', () => {
    const model = { pricing: { unit: 'None', prompt: '0', completion: '0' } };
    const onChangeModel = vi.fn();

    render(<Pricing model={model as any} onChangeModel={onChangeModel} />);
    fireEvent.click(screen.getByText('Tokens'));
    expect(onChangeModel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Char Without Whitespace'));
    expect(onChangeModel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('None'));
    expect(onChangeModel).toHaveBeenCalled();
  });

  test('calls onChangeModel when prompt/completion changes', () => {
    const model = { pricing: { unit: 'Tokens', prompt: '1', completion: '2' } };
    const onChangeModel = vi.fn();

    render(<Pricing model={model as any} onChangeModel={onChangeModel} />);
    const promptInput = screen.getByDisplayValue('1');
    fireEvent.change(promptInput, { target: { value: '10' } });
    expect(onChangeModel).toHaveBeenCalled();

    const completionInput = screen.getByDisplayValue('2');
    fireEvent.change(completionInput, { target: { value: '20' } });
    expect(onChangeModel).toHaveBeenCalled();
  });
});
