import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import FilterCondition from '@/src/components/Analytics/QueryBuilder/Filter/FilterCondition';
import { QueryBuilderContext, QueryBuilderContextValue } from '@/src/components/Analytics/QueryBuilder/context';
import { createGroup, createInitialState, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { toCompactSelectOptions } from '@/src/components/Analytics/QueryBuilder/utils/options';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { OPERATOR_OPTION_DESCRIPTORS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { FieldOption, FilterPredicateNode, QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';

const t = (key: string) => key;

const FIELD_OPTIONS: FieldOption[] = [
  { name: 'chat_id', type: AnalyticsFieldType.String },
  { name: 'sentiment', type: AnalyticsFieldType.Enum },
  { name: 'total_tokens', type: AnalyticsFieldType.Long },
];

const operatorOptions = toCompactSelectOptions(OPERATOR_OPTION_DESCRIPTORS, t);

const renderCondition = (node: FilterPredicateNode) => {
  const parent = createGroup();
  parent.children.push(node);
  const ctx = { state: {}, refresh: vi.fn(), patch: vi.fn() } as unknown as QueryBuilderContextValue;
  render(
    <QueryBuilderContext.Provider value={ctx}>
      <FilterCondition node={node} parent={parent} fieldOptions={FIELD_OPTIONS} operatorOptions={operatorOptions} />
    </QueryBuilderContext.Provider>,
  );
  return { user: userEvent.setup(), ctx };
};

const predicateOn = (field: string, op = QueryOperator.Eq): FilterPredicateNode => ({
  ...createPredicate(),
  field,
  op,
});

const openOperators = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Operator }));
  return screen.getByRole('listbox', { name: QueryBuilderI18nKey.Operator });
};

const offeredOperatorLabels = async (user: ReturnType<typeof userEvent.setup>) => {
  await openOperators(user);
  return screen.getAllByRole('option').map((el) => el.textContent);
};

describe('FilterCondition operator options', () => {
  test('offers every authoring operator for a string field', async () => {
    const { user } = renderCondition(predicateOn('chat_id'));

    const labels = await offeredOperatorLabels(user);

    expect(labels).toContain(QueryBuilderI18nKey.OperatorCo);
    expect(labels).toContain(QueryBuilderI18nKey.OperatorNc);
    expect(labels).toHaveLength(OPERATOR_OPTION_DESCRIPTORS.length);
  });

  // ClickHouse defines comparison over an enum but not the string functions, so the service refuses the
  // LIKE-based operators — and rejects the whole query for one bad predicate.
  test('withholds the two contains operators for an enum field', async () => {
    const { user } = renderCondition(predicateOn('sentiment'));

    const labels = await offeredOperatorLabels(user);

    expect(labels).not.toContain(QueryBuilderI18nKey.OperatorCo);
    expect(labels).not.toContain(QueryBuilderI18nKey.OperatorNc);
  });

  test('keeps equality, the magnitude comparisons and in-list for an enum field', async () => {
    const { user } = renderCondition(predicateOn('sentiment'));

    const labels = await offeredOperatorLabels(user);

    for (const key of [
      QueryBuilderI18nKey.OperatorEq,
      QueryBuilderI18nKey.OperatorNe,
      QueryBuilderI18nKey.OperatorLt,
      QueryBuilderI18nKey.OperatorGt,
      QueryBuilderI18nKey.OperatorLe,
      QueryBuilderI18nKey.OperatorGe,
      QueryBuilderI18nKey.OperatorIn,
    ]) {
      expect(labels).toContain(key);
    }
  });

  test('offers everything again for a numeric field', async () => {
    const { user } = renderCondition(predicateOn('total_tokens'));

    const labels = await offeredOperatorLabels(user);

    expect(labels).toHaveLength(OPERATOR_OPTION_DESCRIPTORS.length);
  });
});

describe('FilterCondition field changes', () => {
  const pickField = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Field }));
    await user.click(screen.getByText(name));
  };

  // Left alone, the condition would keep serializing a predicate the service rejects outright.
  test('moves a contains condition off the LIKE operator when retargeted at an enum field', async () => {
    const node = predicateOn('chat_id', QueryOperator.Ico);
    const { user } = renderCondition(node);

    await pickField(user, 'sentiment');

    expect(node.field).toBe('sentiment');
    expect(node.op).toBe(QueryOperator.Eq);
  });

  test('leaves a contains condition alone when retargeted at another string field', async () => {
    const node = predicateOn('total_tokens', QueryOperator.Ico);
    const { user } = renderCondition(node);

    await pickField(user, 'chat_id');

    expect(node.op).toBe(QueryOperator.Ico);
  });

  test('leaves a supported operator alone when retargeted at an enum field', async () => {
    const node = predicateOn('chat_id', QueryOperator.In);
    const { user } = renderCondition(node);

    await pickField(user, 'sentiment');

    expect(node.op).toBe(QueryOperator.In);
  });
});

describe('FilterCondition function operands', () => {
  const FIELDS = [
    { name: 'request_tags', type: AnalyticsFieldType.String, source: 'request_tags' },
    { name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id' },
  ];

  // The condition mutates `node` in place and calls refresh(), so anything asserted after an
  // interaction needs a refresh that actually re-renders.
  const renderWithCatalog = (
    node: FilterPredicateNode,
    {
      isFunctionOperandOffered = true,
      functions = TEST_FUNCTIONS,
    }: Partial<{
      isFunctionOperandOffered: boolean;
      functions: QueryFunction[];
    }> = {},
  ) => {
    const parent = createGroup();
    parent.children.push(node);
    const state: QueryBuilderState = { ...createInitialState(functions), fields: FIELDS };
    const Harness = () => {
      const [, setTick] = useState(0);
      return (
        <QueryBuilderContext.Provider value={{ state, refresh: () => setTick((tick) => tick + 1), patch: vi.fn() }}>
          <FilterCondition
            node={node}
            parent={parent}
            fieldOptions={FIELD_OPTIONS}
            operatorOptions={operatorOptions}
            isFunctionOperandOffered={isFunctionOperandOffered}
          />
        </QueryBuilderContext.Provider>
      );
    };
    render(<Harness />);
    return userEvent.setup();
  };

  const openOperand = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Field }));
  };

  const pickFunction = async (user: ReturnType<typeof userEvent.setup>, label: RegExp) => {
    await openOperand(user);
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Functions/ }));
    await user.click(screen.getByRole('option', { name: label }));
  };

  test('offers the catalog scalar functions as an alternative left operand', async () => {
    const user = renderWithCatalog(createPredicate());

    await openOperand(user);

    expect(screen.getByRole('button', { name: /QueryBuilder.Functions/ })).toBeInTheDocument();
  });

  // Having filters the query's own output columns, so a source-column function has nothing to stand on.
  test('offers no Functions group in a section that does not allow one', async () => {
    const user = renderWithCatalog(createPredicate(), { isFunctionOperandOffered: false });

    await openOperand(user);

    expect(screen.queryByRole('button', { name: /QueryBuilder.Functions/ })).not.toBeInTheDocument();
  });

  test('picking a function fills the condition with its arguments and an editor each', async () => {
    const node = createPredicate();
    const user = renderWithCatalog(node);

    await pickFunction(user, /Json extract string/);

    expect(node).toMatchObject({ fn: 'json_extract_string', field: '', args: [{}, {}] });
    expect(screen.getByRole('button', { name: 'json' })).toBeInTheDocument();
    expect(screen.getByLabelText('key')).toBeInTheDocument();
  });

  test("the condition's value type follows the function's return type", async () => {
    const node = createPredicate();
    const user = renderWithCatalog(node);

    await pickFunction(user, /String length/);

    expect(node.valueType).toBe(QueryValueType.Integer);
  });

  test('a function operand reads as its call in the row label', () => {
    const node = { ...createPredicate(), fn: 'lower', args: [{ field: 'chat_id' }] };
    renderWithCatalog(node);

    expect(screen.getByRole('button', { name: /lower\(chat_id\)/ })).toBeInTheDocument();
  });

  test('withholds array-returning functions the projection still offers', async () => {
    const user = renderWithCatalog(createPredicate());

    await openOperand(user);
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Functions/ }));

    expect(screen.getByRole('option', { name: /Json extract string/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Json extract array/ })).not.toBeInTheDocument();
  });

  test('a boolean-returning function gives the condition its boolean value control', async () => {
    const node = createPredicate();
    const user = renderWithCatalog(node);

    await pickFunction(user, /Starts with/);

    expect(node.valueType).toBe(QueryValueType.Boolean);
  });

  test('an empty catalog leaves the condition a column-only operand', async () => {
    const user = renderWithCatalog(createPredicate(), { functions: [] });

    await openOperand(user);

    expect(screen.queryByRole('button', { name: /QueryBuilder.Functions/ })).not.toBeInTheDocument();
  });
});
