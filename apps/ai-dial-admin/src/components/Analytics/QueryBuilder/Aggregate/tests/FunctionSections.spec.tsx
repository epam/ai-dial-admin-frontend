import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import Aggregates from '@/src/components/Analytics/QueryBuilder/Aggregate/Aggregates';
import GroupBySection from '@/src/components/Analytics/QueryBuilder/Aggregate/GroupBySection';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import {
  createAggregate,
  createGroup,
  createGroupByFn,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { FilterPredicateNode, QueryBuilderState } from '@/src/models/analytics/query-builder';
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

// The sections mutate `state` in place and call `refresh()` to re-render, so a spy refresh leaves
// controlled inputs showing stale values. Typing tests need a refresh that actually re-renders.
const renderLive = (state: QueryBuilderState, node: ReactNode) => {
  const Harness = () => {
    const [, setTick] = useState(0);
    return (
      <QueryBuilderContext.Provider value={{ state, refresh: () => setTick((tick) => tick + 1), patch: vi.fn() }}>
        {node}
      </QueryBuilderContext.Provider>
    );
  };
  return render(<Harness />);
};

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

describe('QueryBuilder :: computed row aliases', () => {
  const LABELED_FIELDS = [
    { name: 'total_tokens', type: AnalyticsFieldType.Long, source: 'total_tokens', display_name: 'Total tokens' },
    { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', display_name: 'Project ID' },
  ];

  const aliasInput = () => screen.getAllByRole('textbox', { name: 'QueryBuilder.AliasPlaceholder' })[0];

  test('a new aggregate row is prefilled with an alias derived from its function and argument', async () => {
    const user = userEvent.setup();
    const state = stateWith({ fields: LABELED_FIELDS, aggregates: [] });
    renderLive(state, <Aggregates />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AddField' }));

    // The first catalog aggregate has no argument filled yet, so the alias is its label alone.
    expect(state.aggregates[0].alias).toBe('Average');
    expect(state.aggregates[0].aliasEdited).toBe(false);
    expect(aliasInput()).toHaveValue('Average');
  });

  test('the alias follows the row until the user edits it, then stays put', async () => {
    const user = userEvent.setup();
    const row = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    const state = stateWith({ fields: LABELED_FIELDS, aggregates: [row] });
    renderLive(state, <Aggregates />);

    // Switching the function rederives the alias.
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Function' }));
    await user.click(screen.getByRole('option', { name: 'Minimum' }));
    expect(state.aggregates[0].alias).toBe('Minimum');

    // Typing takes ownership: a later function change leaves the custom alias alone.
    await user.clear(aliasInput());
    await user.type(aliasInput(), 'my metric');
    expect(state.aggregates[0].aliasEdited).toBe(true);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Function' }));
    await user.click(screen.getByRole('option', { name: 'Maximum' }));
    expect(state.aggregates[0].alias).toBe('my metric');
  });

  test('a second aggregate over the same shape is prefilled with a unique alias', async () => {
    const user = userEvent.setup();
    const first = createAggregate(fnFixture('avg'), [{}], 'Average');
    const state = stateWith({ fields: LABELED_FIELDS, aggregates: [first] });
    renderWith(state, <Aggregates />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.AddField' }));

    expect(state.aggregates.map((a) => a.alias)).toEqual(['Average', 'Average 2']);
  });

  test('a new group-by function row is prefilled too', async () => {
    const user = userEvent.setup();
    const state = stateWith({ fields: LABELED_FIELDS, groupBy: [] });
    renderWith(state, <GroupBySection />);

    await user.click(screen.getByRole('button', { name: /QueryBuilder.AddField/ }));
    await user.click(screen.getByRole('button', { name: /QueryBuilder.Functions/ }));
    await user.click(screen.getByRole('option', { name: /Lowercase/ }));

    expect(state.groupBy[0]).toMatchObject({ fn: 'lower', alias: 'Lowercase', aliasEdited: false });
  });

  test('the aggregate function list shows each catalog description as a tooltip', async () => {
    const user = userEvent.setup();
    const row = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    renderWith(stateWith({ fields: LABELED_FIELDS, aggregates: [row] }), <Aggregates />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Function' }));
    await user.hover(screen.getByRole('option', { name: 'Continuous percentile' }));

    expect(await screen.findByText('continuous percentile')).toBeInTheDocument();
  });
});

// Review defect: a rederived alias used to leave sort keys and having conditions pointing at a column
// name the query no longer emits, which the backend rejects.
describe('QueryBuilder :: alias rename carries its references', () => {
  const state = () => {
    const s = stateWith({
      fields: [
        { name: 'total_tokens', type: AnalyticsFieldType.Long, source: 'total_tokens', display_name: 'Total tokens' },
        { name: 'latency', type: AnalyticsFieldType.Long, source: 'latency', display_name: 'Latency' },
      ],
    });
    const row = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    s.aggregates = [row];
    s.sort = [{ ...createSort(), field: 'Total tokens (Sum)' }];
    s.having = { ...createGroup(), children: [{ ...createPredicate(), field: 'Total tokens (Sum)' }] };
    return s;
  };

  test('changing the function moves the sort key and having condition with the alias', async () => {
    const user = userEvent.setup();
    const s = state();
    renderLive(s, <Aggregates />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Function' }));
    await user.click(screen.getByRole('option', { name: 'Minimum' }));

    expect(s.aggregates[0].alias).toBe('Minimum');
    expect(s.sort[0].field).toBe('Minimum');
    expect((s.having.children[0] as FilterPredicateNode).field).toBe('Minimum');
  });

  test('a reference to a different column is left alone', async () => {
    const user = userEvent.setup();
    const s = state();
    s.sort = [{ ...createSort(), field: 'deployment' }];
    renderLive(s, <Aggregates />);

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Function' }));
    await user.click(screen.getByRole('option', { name: 'Maximum' }));

    expect(s.sort[0].field).toBe('deployment');
  });
});
