import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Aggregate/FnArgEditor';
import { FieldOption } from '@/src/models/analytics/query-builder';
import { QueryFunctionArg, QueryFunctionArgKind } from '@/src/models/analytics/query-function';

const FIELD_OPTIONS: FieldOption[] = [
  { name: 'latency', type: 'long' },
  { name: 'deployment', type: 'string' },
];

const renderArg = (arg: QueryFunctionArg, onChange = vi.fn(), value = {}) => {
  render(<FnArgEditor id="arg" arg={arg} value={value} fieldOptions={FIELD_OPTIONS} onChange={onChange} />);
  return onChange;
};

describe('QueryBuilder :: FnArgEditor', () => {
  test('expression argument renders a field dropdown and selects a field', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({ name: 'column', kind: QueryFunctionArgKind.Expression });

    await user.click(screen.getByRole('button', { name: 'column' }));
    await user.click(screen.getByRole('option', { name: /latency/ }));

    expect(onChange).toHaveBeenCalledWith({ field: 'latency' });
  });

  test('string literal with allowed_values renders a select of those values', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({
      name: 'unit',
      kind: QueryFunctionArgKind.StringLiteral,
      constraints: { allowed_values: ['minute', 'hour'] },
    });

    await user.click(screen.getByRole('button', { name: 'unit' }));
    expect(screen.getByRole('option', { name: 'minute' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'hour' }));
    expect(onChange).toHaveBeenCalledWith({ literal: 'hour' });
  });

  test('string literal without allowed_values renders a free text input', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({ name: 'text', kind: QueryFunctionArgKind.StringLiteral });

    await user.type(screen.getByLabelText('text'), 'x');
    expect(onChange).toHaveBeenCalledWith({ literal: 'x' });
  });

  test('integer literal clamps to the minimum bound', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({
      name: 'amount',
      kind: QueryFunctionArgKind.IntegerLiteral,
      constraints: { min: 1 },
    });

    await user.type(screen.getByLabelText('amount'), '0');
    expect(onChange).toHaveBeenCalledWith({ literal: '1' });
  });

  test('numeric literal clamps to the maximum bound (percentile fraction)', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({
      name: 'fraction',
      kind: QueryFunctionArgKind.NumericLiteral,
      constraints: { min: 0, max: 1 },
    });

    await user.type(screen.getByLabelText('fraction'), '5');
    expect(onChange).toHaveBeenCalledWith({ literal: '1' });
  });

  test('numeric literal keeps an in-range decimal value', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({
      name: 'fraction',
      kind: QueryFunctionArgKind.NumericLiteral,
      constraints: { min: 0, max: 1 },
    });

    await user.type(screen.getByLabelText('fraction'), '.');
    expect(onChange).toHaveBeenLastCalledWith({ literal: '.' });
  });
});
