import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import Limits from '../Limits';

describe('Limits', () => {
  test('renders dropdown and no number fields for None', () => {
    const model = { limits: {} };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText(ModelViewI18nKey.InteractionLimit)).toBeInTheDocument();
    expect(screen.getByText(BasicI18nKey.None)).toBeInTheDocument();
  });

  test('renders prompts and completions inputs for SeparateTokenAndCompletions', () => {
    const model = { limits: { maxPromptTokens: 10, maxCompletionTokens: 20 } };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    expect(screen.getByText(ModelViewI18nKey.Prompts)).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByText(ModelViewI18nKey.Completions)).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  test('calls onChangeModel when number fields are changed', () => {
    const model = { limits: { maxTotalTokens: 42 } };
    const onChangeModel = vi.fn();

    render(<Limits model={model} onChangeModel={onChangeModel} />);
    fireEvent.change(screen.getByDisplayValue('42'), { target: { value: '100' } });
    expect(onChangeModel).toHaveBeenCalled();
  });
});
