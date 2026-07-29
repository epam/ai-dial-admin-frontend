import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { ComparisonOp, ExprType, ValueType } from '@/src/models/evaluation/structured-query';
import { TestCaseItemType } from '@/src/types/evaluation';

import RunCondition from '../RunCondition';

describe('RunCondition', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  test('renders label and add control', () => {
    render(<RunCondition onChange={onChange} schema={[]} />);

    expect(screen.getByText(TestSuitesI18nKey.RunCondition)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('renders chips from existing testCaseFilter and removes them', () => {
    render(
      <RunCondition
        onChange={onChange}
        schema={[{ name: 'filename', type: TestCaseItemType.STRING, required: false, description: '' }]}
        testCaseFilter={{
          op: ComparisonOp.Co,
          args: [
            { type: ExprType.Field, name: 'data::filename' },
            { type: ExprType.Value, value_type: ValueType.String, value: 'gpt' },
          ],
        }}
      />,
    );

    expect(screen.getByText('filename')).toBeInTheDocument();
    expect(screen.getByText('gpt')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  test('renders add control', () => {
    render(<RunCondition onChange={onChange} schema={[]} />);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });
});
