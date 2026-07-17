import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import Aggregates from '@/src/components/Analytics/QueryBuilder/Aggregate/Aggregates';
import GroupBySection from '@/src/components/Analytics/QueryBuilder/Aggregate/GroupBySection';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import {
  createAggregate,
  createGroupByFn,
  createInitialState,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QueryMode } from '@/src/models/analytics/query';

const FIELDS = [
  { name: 'latency', type: AnalyticsFieldType.Long, source: 'latency' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
];

const stateWith = (
  overrides: Partial<QueryBuilderState>,
  functions: QueryFunction[] = TEST_FUNCTIONS,
): QueryBuilderState => ({
  ...createInitialState(functions),
  mode: QueryMode.Aggregate,
  fields: FIELDS,
  ...overrides,
});

const renderWith = (state: QueryBuilderState, node: ReactNode) =>
  render(
    <QueryBuilderContext.Provider value={{ state, refresh: vi.fn(), patch: vi.fn() }}>
      {node}
    </QueryBuilderContext.Provider>,
  );

describe('QueryBuilder :: Aggregates', () => {
  test('renders a DISTINCT control only for aggregates whose catalog entry supports it', () => {
    const countRow = { ...createAggregate(fnFixture('count'), [{ field: 'latency' }]), alias: 'n' };
    const minRow = { ...createAggregate(fnFixture('min'), [{ field: 'latency' }]), alias: 'lo' };
    renderWith(stateWith({ aggregates: [countRow, minRow] }), <Aggregates />);

    // count → distinct_supported true (one checkbox); min → false (none).
    expect(screen.getAllByRole('checkbox', { name: 'QueryBuilder.Distinct' })).toHaveLength(1);
  });

  test('ordered-set aggregate renders a bounded fraction input and a field dropdown', () => {
    const pct = { ...createAggregate(fnFixture('percentile_cont'), [{}, {}]), alias: 'p95' };
    renderWith(stateWith({ aggregates: [pct] }), <Aggregates />);

    expect(screen.getByLabelText('fraction')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'column' })).toBeInTheDocument();
    // percentile_cont has distinct_supported false → no distinct control.
    expect(screen.queryByRole('checkbox', { name: 'QueryBuilder.Distinct' })).not.toBeInTheDocument();
  });

  test('degrades when the catalog is empty: no metric function can be added', () => {
    renderWith(stateWith({ aggregates: [] }, []), <Aggregates />);
    expect(screen.queryByRole('button', { name: 'QueryBuilder.AddField' })).not.toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.CountOnly')).toBeInTheDocument();
  });
});

describe('QueryBuilder :: GroupBySection', () => {
  test('date_bin row renders amount (numeric), unit (select) and timestamp (field) editors', () => {
    const row = { ...createGroupByFn(fnFixture('date_bin')), alias: 'bucket' };
    renderWith(stateWith({ groupBy: [row] }), <GroupBySection />);

    expect(screen.getByLabelText('amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'unit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'timestamp' })).toBeInTheDocument();
  });

  test('multi-arg scalar function (width_bucket) renders one field dropdown per expression arg', () => {
    const row = { ...createGroupByFn(fnFixture('width_bucket')), alias: 'bkt' };
    renderWith(stateWith({ groupBy: [row] }), <GroupBySection />);

    ['operand', 'low', 'high', 'count'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });
});
