import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FilterCondition from '@/src/components/Analytics/QueryBuilder/Filter/FilterCondition';
import { QueryBuilderContext, QueryBuilderContextValue } from '@/src/components/Analytics/QueryBuilder/context';
import { createGroup, createPredicate } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { toCompactSelectOptions } from '@/src/components/Analytics/QueryBuilder/utils/options';
import { OPERATOR_OPTION_DESCRIPTORS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryOperator } from '@/src/models/analytics/query';
import { FieldOption, FilterPredicateNode } from '@/src/models/analytics/query-builder';

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
