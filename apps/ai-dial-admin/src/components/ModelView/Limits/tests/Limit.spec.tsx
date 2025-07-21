import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Limits from '../Limits';

describe('Limits', () => {
  test('renders dropdown and no number fields for None', () => {
    const model = { limits: {} };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText('Interaction Limit')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Total Numbers')).toBeInTheDocument();
    expect(screen.getByText('Separate Prompts and Completions')).toBeInTheDocument();
    expect(screen.queryByText('Number of Tokens')).toBeNull();
    expect(screen.queryByText('Prompts')).toBeNull();
    expect(screen.queryByText('Completions')).toBeNull();
  });

  test('renders total tokens input for Total', () => {
    const model = { limits: { maxTotalTokens: 42 } };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText('Number of Tokens')).toBeInTheDocument();
    expect(screen.getByDisplayValue('42')).toBeInTheDocument();
  });

  test('renders prompts and completions inputs for SeparateTokenAndCompletions', () => {
    const model = { limits: { maxPromptTokens: 10, maxCompletionTokens: 20 } };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByText('Completions')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  test('calls onChangeModel when limit type is changed', () => {
    const model = { limits: {} };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    fireEvent.click(screen.getByText('Total Numbers'));
    expect(onChangeModel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Separate Prompts and Completions'));
    expect(onChangeModel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('None'));
    expect(onChangeModel).toHaveBeenCalled();
  });

  test('calls onChangeModel when number fields are changed', () => {
    const model = { limits: { maxTotalTokens: 42 } };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    fireEvent.change(screen.getByDisplayValue('42'), { target: { value: '100' } });
    expect(onChangeModel).toHaveBeenCalled();
  });
});
