import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useMemo, useState } from 'react';
import { describe, expect, test } from 'vitest';

import ChipBar from '@/src/components/Analytics/QueryBuilder/Chips/ChipBar';
import { PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'created_at', type: AnalyticsFieldType.Timestamp, source: 'created_at', tag: 'identity' },
  {
    name: 'activity_type',
    type: AnalyticsFieldType.Enum,
    source: 'activity_type',
    tag: 'insights',
    enum_values: ['coding', 'writing'],
  },
  { name: 'title', type: AnalyticsFieldType.String, source: 'title', tag: 'insights' },
  { name: 'is_resolved', type: AnalyticsFieldType.Boolean, source: 'is_resolved' },
  { name: 'cost', type: AnalyticsFieldType.Decimal, source: 'cost', display_name: 'Cost' },
];

const initialState = (): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  entityName: 'conversations',
  fields: FIELDS,
});

let latest: QueryBuilderState;

const PERIOD: PeriodControl = {
  timePeriod: '2d',
  isCustom: false,
  timeRange: { startDate: new Date('2026-07-01T00:00:00Z'), endDate: new Date('2026-07-03T00:00:00Z') },
  onChangeTimePeriod: () => void 0,
  onChangeTimeRange: () => void 0,
};

const Harness: FC<{ period?: PeriodControl | null }> = ({ period = null }) => {
  const [state, setState] = useState<QueryBuilderState>(initialState);
  latest = state;
  const value = useMemo(
    () => ({
      state,
      refresh: () => setState((prev) => ({ ...prev })),
      patch: (partial: Partial<QueryBuilderState>) => setState((prev) => ({ ...prev, ...partial })),
    }),
    [state],
  );

  return (
    <QueryBuilderContext.Provider value={value}>
      <ChipBar period={period} />
    </QueryBuilderContext.Provider>
  );
};

const query = (): StructuredQuery => buildQuery(latest, null);

const openAdd = async (user: ReturnType<typeof userEvent.setup>, entry: string) => {
  await user.click(screen.getByRole('button', { name: 'QueryChips.AddPart' }));
  await user.click(await screen.findByRole('menuitemcheckbox', { name: entry }));
  return screen.findByRole('dialog');
};

const pick = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, field: RegExp, option: string) => {
  await user.click(within(dialog).getByRole('combobox', { name: field }));
  await user.click(await screen.findByRole('option', { name: option }));
};

const apply = (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
  user.click(within(dialog).getByRole('button', { name: 'Buttons.Apply' }));

describe('ChipBar', () => {
  test('shows the Limit chip and the Add control, and the Period chip only when a period is given', () => {
    const { unmount } = render(<Harness />);

    expect(screen.getByRole('button', { name: /QueryBuilder.Limit/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryChips.AddPart' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /QueryChips.Period/ })).toBeNull();

    unmount();
    render(<Harness period={PERIOD} />);

    expect(screen.getByRole('button', { name: /QueryChips.Period/ })).toBeInTheDocument();
  });

  test('adds a filter on an enum column from its values', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await openAdd(user, 'QueryBuilder.Filter');
    expect(within(dialog).getByRole('button', { name: 'Buttons.Apply' })).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Remove' })).toBeNull();

    await pick(user, dialog, /QueryChips.Column/, 'activity_type');
    await pick(user, dialog, /QueryChips.Value/, 'coding');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /activity_type .* 'coding'/ })).toBeInTheDocument();
    expect(query().filter).toEqual({
      op: 'and',
      args: [
        {
          op: 'eq',
          args: [
            { type: 'field', name: 'activity_type' },
            { type: 'value', value_type: 'string', value: 'coding' },
          ],
        },
      ],
    });
  });

  test('removes a filter from its chip', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const dialog = await openAdd(user, 'QueryBuilder.Filter');
    await pick(user, dialog, /QueryChips.Column/, 'activity_type');
    await pick(user, dialog, /QueryChips.Value/, 'coding');
    await apply(user, dialog);

    await user.click(await screen.findByRole('button', { name: /activity_type/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Buttons.Remove' }));

    expect(screen.queryByRole('button', { name: /activity_type/ })).toBeNull();
    expect(query().filter).toBeUndefined();
  });

  test('adds an aggregate and withholds Aggregate and Show columns afterwards', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await openAdd(user, 'QueryBuilder.Aggregate');
    await pick(user, dialog, /QueryBuilder.GroupBy/, 'activity_type');
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /QueryBuilder.Aggregate.*COUNT\(\)/ })).toBeInTheDocument();
    expect(query().mode).toBe(QueryMode.Aggregate);
    expect(query().group_by).toEqual(['activity_type']);

    await user.click(screen.getByRole('button', { name: 'QueryChips.AddPart' }));
    expect(await screen.findByRole('menuitemcheckbox', { name: 'QueryBuilder.Aggregate' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitemcheckbox', { name: 'QueryChips.ShowColumns' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('returns from an adding popup to the Add menu', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await openAdd(user, 'QueryBuilder.Sort');
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Back' }));

    expect(await screen.findByRole('menuitemcheckbox', { name: 'QueryBuilder.Filter' })).toBeInTheDocument();
  });
});
