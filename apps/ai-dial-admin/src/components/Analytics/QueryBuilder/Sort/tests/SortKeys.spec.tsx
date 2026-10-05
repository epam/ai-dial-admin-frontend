import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SortKeys from '@/src/components/Analytics/QueryBuilder/Sort/SortKeys';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { createInitialState, createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

const stateWithSort = (nulls: QuerySortNulls): QueryBuilderState => {
  const state = createInitialState(TEST_FUNCTIONS);
  state.fields = [{ name: 'model', type: AnalyticsFieldType.String, source: 'model' }];
  state.sort = [{ ...createSort(), field: 'model', dir: QuerySortDirection.Desc, nulls }];
  return state;
};

const renderSortKeys = (state: QueryBuilderState) => {
  const refresh = vi.fn();
  render(
    <QueryBuilderContext.Provider value={{ state, refresh, patch: vi.fn() }}>
      <SortKeys />
      <button type="button">elsewhere</button>
    </QueryBuilderContext.Provider>,
  );
  return { user: userEvent.setup(), refresh };
};

describe('SortKeys', () => {
  test('offers the null placements under names that say what they place', async () => {
    const { user } = renderSortKeys(stateWithSort(QuerySortNulls.Default));

    await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Nulls }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      QueryBuilderI18nKey.NullsDefault,
      QueryBuilderI18nKey.NullsFirst,
      QueryBuilderI18nKey.NullsLast,
    ]);
  });

  test('hovering the default placement describes where the engine puts empty values', async () => {
    const { user } = renderSortKeys(stateWithSort(QuerySortNulls.Default));

    await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Nulls }));
    await user.hover(screen.getByRole('option', { name: QueryBuilderI18nKey.NullsDefault }));

    expect(await screen.findByText(QueryBuilderI18nKey.NullsDefaultDescription)).toBeInTheDocument();
  });

  test('picking a placement stores it on the sort key', async () => {
    const state = stateWithSort(QuerySortNulls.Default);
    const { user, refresh } = renderSortKeys(state);

    await user.click(screen.getByRole('button', { name: QueryBuilderI18nKey.Nulls }));
    await user.click(screen.getByRole('option', { name: QueryBuilderI18nKey.NullsLast }));

    expect(state.sort[0].nulls).toBe(QuerySortNulls.Last);
    expect(refresh).toHaveBeenCalled();
  });

  test('the collapsed row names a placement other than the default', async () => {
    const { user } = renderSortKeys(stateWithSort(QuerySortNulls.First));

    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(
      screen.getByRole('button', {
        name: `model ${QueryBuilderI18nKey.DirectionDesc} · ${QueryBuilderI18nKey.NullsFirst}`,
      }),
    ).toBeInTheDocument();
  });

  test('the collapsed row leaves the default placement out', async () => {
    const { user } = renderSortKeys(stateWithSort(QuerySortNulls.Default));

    await user.click(screen.getByRole('button', { name: 'elsewhere' }));

    expect(screen.getByRole('button', { name: `model ${QueryBuilderI18nKey.DirectionDesc}` })).toBeInTheDocument();
  });
});
