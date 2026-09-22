import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Common/FnArgEditor';
import { QueryBuilderContext, QueryBuilderContextValue } from '@/src/components/Analytics/QueryBuilder/context';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { FieldOption, FnArgValue } from '@/src/models/analytics/query-builder';
import { QueryFunctionArg, QueryFunctionArgKind } from '@/src/models/analytics/query-function';

const FIELD_OPTIONS: FieldOption[] = [
  { name: 'latency', type: 'long' },
  { name: 'deployment', type: 'string' },
];

const renderArg = (arg: QueryFunctionArg, onChange = vi.fn(), value: FnArgValue = {}, isNestingOffered = true) => {
  const ctx = {
    state: createInitialState(TEST_FUNCTIONS),
    refresh: vi.fn(),
    patch: vi.fn(),
  } as unknown as QueryBuilderContextValue;
  render(
    <QueryBuilderContext.Provider value={ctx}>
      <FnArgEditor
        id="arg"
        arg={arg}
        value={value}
        fieldOptions={FIELD_OPTIONS}
        isNestingOffered={isNestingOffered}
        onChange={onChange}
      />
    </QueryBuilderContext.Provider>,
  );
  return onChange;
};

describe('QueryBuilder :: FnArgEditor', () => {
  test('expression argument renders a field dropdown and selects a field', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({ name: 'column', kind: QueryFunctionArgKind.Expression });

    await user.click(screen.getByRole('button', { name: 'column' }));
    // With functions offered beside them the columns get a collapsible header, as they do in a
    // condition's operand dropdown.
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Untagged/ }));
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

  test('an expression argument offers the catalog functions beside the columns', async () => {
    const user = userEvent.setup();
    renderArg({ name: 'column', kind: QueryFunctionArgKind.Expression });

    await user.click(screen.getByRole('button', { name: 'column' }));

    expect(screen.getByRole('button', { name: /QueryBuilder.Functions/ })).toBeInTheDocument();
  });

  test('picking a function nests it and renders its own argument editors', async () => {
    const user = userEvent.setup();
    const onChange = renderArg({ name: 'column', kind: QueryFunctionArgKind.Expression });

    await user.click(screen.getByRole('button', { name: 'column' }));
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Functions/ }));
    await user.click(screen.getByRole('option', { name: /^Now/ }));

    expect(onChange).toHaveBeenCalledWith({ call: { fn: 'now', args: [] } });
  });

  test('a nested argument takes columns only and is named apart from the outer one', async () => {
    const user = userEvent.setup();
    renderArg(
      { name: 'column', kind: QueryFunctionArgKind.Expression },
      vi.fn(),
      { call: { fn: 'date_sub', args: [{ literal: 'minute' }, { literal: '30' }, {}] } },
      true,
    );

    await user.click(screen.getByRole('button', { name: 'date_sub timestamp' }));

    expect(screen.queryByRole('button', { name: /QueryBuilder.Functions/ })).not.toBeInTheDocument();
  });

  test('nesting can be withheld entirely', async () => {
    const user = userEvent.setup();
    renderArg({ name: 'column', kind: QueryFunctionArgKind.Expression }, vi.fn(), {}, false);

    await user.click(screen.getByRole('button', { name: 'column' }));

    expect(screen.queryByRole('button', { name: /QueryBuilder.Functions/ })).not.toBeInTheDocument();
  });
});
