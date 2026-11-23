import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import {
  apply,
  applyButton,
  ChipUser,
  currentQuery,
  openAdd,
  openChip,
  pick,
  renderChipBar,
} from '@/src/components/Analytics/QueryBuilder/Chips/tests/chip-bar.fixture';
import { createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { QueryMode, QuerySortDirection } from '@/src/models/analytics/query';

const AGGREGATE = 'QueryBuilder.Aggregate';
const AGGREGATE_CHIP = /^QueryBuilder.Aggregate: /;
const GROUP_BY = /QueryBuilder.GroupBy/;
const SPLIT = /QueryChips.SplitByPeriod/;
const SECONDARY = /QueryChips.SecondaryGroupBy/;
const FUNCTION = /QueryChips.Function/;
const ADD_SECONDARY = 'QueryChips.AddSecondaryGrouping';

const field = (name: string) => ({ type: 'field', name });

const optionLabels = async () => (await screen.findAllByRole('option')).map((option) => option.textContent);

const addAggregate = async (user: ChipUser, groupBy: string) => {
  const dialog = await openAdd(user, AGGREGATE);
  await pick(user, dialog, GROUP_BY, groupBy);
  await apply(user, dialog);
  return screen.findByRole('button', { name: AGGREGATE_CHIP });
};

describe('AggregatePanel', () => {
  test('requires a group-by column and switches the query to aggregate mode on Apply', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    expect(within(dialog).getByRole('heading', { name: 'QueryChips.AddAggregate' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: FUNCTION })).toHaveAccessibleName(
      'QueryChips.Function, Row count',
    );
    expect(applyButton(dialog)).toBeDisabled();
    expect(within(dialog).queryByRole('button', { name: 'Buttons.Remove' })).toBeNull();
    expect(currentQuery().mode).toBe(QueryMode.Row);

    await pick(user, dialog, GROUP_BY, 'activity_type');
    expect(applyButton(dialog)).toBeEnabled();
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', {
        name: 'QueryBuilder.Aggregate: COUNT() QueryChips.AggregateBy activity_type',
      }),
    ).toBeInTheDocument();
    const query = currentQuery();
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['activity_type']);
    expect(query.select).toEqual([
      { expr: field('activity_type') },
      { expr: { type: 'fn', name: 'count', args: [] }, as: expect.any(String) },
    ]);
  });

  test('drops the row projection when the query becomes an aggregate', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const columns = await openAdd(user, 'QueryChips.ShowColumns');
    await user.click(within(columns).getByRole('checkbox', { name: 'title' }));
    await apply(user, columns);
    expect(await screen.findByRole('button', { name: /^QueryChips.ShowColumns: / })).toBeInTheDocument();

    await addAggregate(user, 'activity_type');

    expect(screen.queryByRole('button', { name: /^QueryChips.ShowColumns: / })).toBeNull();
    expect(currentQuery().select).toEqual([
      { expr: field('activity_type') },
      { expr: { type: 'fn', name: 'count', args: [] }, as: expect.any(String) },
    ]);
  });

  test('offers Split by period only once a timestamp column is grouped by', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    expect(within(dialog).queryByRole('combobox', { name: SPLIT })).toBeNull();

    await pick(user, dialog, GROUP_BY, 'activity_type');
    expect(within(dialog).queryByRole('combobox', { name: SPLIT })).toBeNull();

    await pick(user, dialog, GROUP_BY, 'created_at');
    expect(await within(dialog).findByRole('combobox', { name: SPLIT })).toHaveAccessibleName(
      'QueryChips.SplitByPeriod, QueryChips.BucketNone',
    );

    await user.click(within(dialog).getByRole('combobox', { name: SPLIT }));
    expect(await optionLabels()).toEqual([
      'QueryChips.BucketNone',
      'QueryChips.Bucket15m',
      'QueryChips.Bucket30m',
      'QueryChips.Bucket1h',
      'QueryChips.Bucket3h',
      'QueryChips.Bucket6h',
      'QueryChips.Bucket12h',
      'QueryChips.Bucket24h',
      'QueryChips.Bucket1w',
      'QueryChips.BucketCustom',
    ]);
  });

  test('withholds Split by period when the catalog serves no date_bin', async () => {
    const user = userEvent.setup();
    renderChipBar({ initial: { functions: TEST_FUNCTIONS.filter((fn) => fn.name !== 'date_bin') } });
    const dialog = await openAdd(user, AGGREGATE);

    await pick(user, dialog, GROUP_BY, 'created_at');

    expect(
      await within(dialog).findByRole('combobox', { name: 'QueryBuilder.GroupBy, created_at' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: SPLIT })).toBeNull();
    expect(applyButton(dialog)).toBeEnabled();
  });

  test('groups a timestamp column by the column itself when no period is chosen', async () => {
    const user = userEvent.setup();
    renderChipBar();

    await addAggregate(user, 'created_at');

    expect(currentQuery().group_by).toEqual(['created_at']);
  });

  test('buckets a timestamp column by a preset period', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    await pick(user, dialog, GROUP_BY, 'created_at');
    await pick(user, dialog, SPLIT, 'QueryChips.Bucket3h');
    expect(within(dialog).queryByRole('textbox', { name: 'QueryChips.BucketPeriod' })).toBeNull();
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', {
        name: 'QueryBuilder.Aggregate: COUNT() QueryChips.AggregateBy created_at QueryChips.AggregatePer 3 hour',
      }),
    ).toBeInTheDocument();
    const query = currentQuery();
    expect(query.select?.[0]).toEqual({
      expr: {
        type: 'fn',
        name: 'date_bin',
        args: [
          { type: 'value', value_type: 'integer', value: '3' },
          { type: 'value', value_type: 'string', value: 'hour' },
          field('created_at'),
        ],
      },
      as: expect.any(String),
    });
    expect(query.group_by).toEqual([query.select?.[0].as]);
  });

  test.each(['soon', '0 hours', '3 months', '1.5 hours'])('disables Apply for the custom period "%s"', async (text) => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    await pick(user, dialog, GROUP_BY, 'created_at');
    await pick(user, dialog, SPLIT, 'QueryChips.BucketCustom');
    const input = await within(dialog).findByRole('textbox', { name: 'QueryChips.BucketPeriod' });
    expect(applyButton(dialog)).toBeDisabled();

    await user.type(input, text);

    expect(input).toHaveValue(text);
    expect(applyButton(dialog)).toBeDisabled();
  });

  test.each([
    ['2 days', '2', 'day'],
    ['45min', '45', 'minute'],
    ['2 w', '2', 'week'],
  ])('buckets by the custom period "%s"', async (text, amount, unit) => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    await pick(user, dialog, GROUP_BY, 'created_at');
    await pick(user, dialog, SPLIT, 'QueryChips.BucketCustom');
    await user.type(await within(dialog).findByRole('textbox', { name: 'QueryChips.BucketPeriod' }), text);
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', { name: new RegExp(`QueryChips.AggregatePer ${amount} ${unit}$`) }),
    ).toBeInTheDocument();
    expect(currentQuery().select?.[0].expr).toEqual({
      type: 'fn',
      name: 'date_bin',
      args: [
        { type: 'value', value_type: 'integer', value: amount },
        { type: 'value', value_type: 'string', value: unit },
        field('created_at'),
      ],
    });
  });

  test('reopens a custom period as text and a preset as its entry', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'created_at');
    await pick(user, dialog, SPLIT, 'QueryChips.BucketCustom');
    await user.type(await within(dialog).findByRole('textbox', { name: 'QueryChips.BucketPeriod' }), '2 days');
    await apply(user, dialog);

    const edit = await openChip(user, AGGREGATE_CHIP);

    expect(within(edit).getByRole('heading', { name: AGGREGATE })).toBeInTheDocument();
    expect(within(edit).getByRole('combobox', { name: GROUP_BY })).toHaveAccessibleName(
      'QueryBuilder.GroupBy, created_at',
    );
    expect(within(edit).getByRole('textbox', { name: 'QueryChips.BucketPeriod' })).toHaveValue('2 day');

    await pick(user, edit, SPLIT, 'QueryChips.BucketNone');
    await apply(user, edit);

    expect(
      await screen.findByRole('button', { name: 'QueryBuilder.Aggregate: COUNT() QueryChips.AggregateBy created_at' }),
    ).toBeInTheDocument();
    expect(currentQuery().group_by).toEqual(['created_at']);
  });

  test('resets the period when the group-by column changes', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    await pick(user, dialog, GROUP_BY, 'created_at');
    await pick(user, dialog, SPLIT, 'QueryChips.Bucket1h');
    await pick(user, dialog, GROUP_BY, 'title');
    await pick(user, dialog, GROUP_BY, 'created_at');

    expect(await within(dialog).findByRole('combobox', { name: SPLIT })).toHaveAccessibleName(
      'QueryChips.SplitByPeriod, QueryChips.BucketNone',
    );
  });

  test('adds a secondary group-by column that excludes the primary one', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'activity_type');

    await user.click(within(dialog).getByRole('button', { name: ADD_SECONDARY }));

    expect(within(dialog).queryByRole('button', { name: ADD_SECONDARY })).toBeNull();
    expect(applyButton(dialog)).toBeDisabled();

    await user.click(within(dialog).getByRole('combobox', { name: SECONDARY }));
    expect(await optionLabels()).toEqual(['created_at', 'title', 'is_resolved', 'Cost']);
    await user.click(screen.getByRole('option', { name: 'title' }));
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', {
        name: 'QueryBuilder.Aggregate: COUNT() QueryChips.AggregateBy activity_type, title',
      }),
    ).toBeInTheDocument();
    expect(currentQuery().group_by).toEqual(['activity_type', 'title']);
  });

  test('removes the secondary group-by column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'activity_type');
    await user.click(within(dialog).getByRole('button', { name: ADD_SECONDARY }));
    await pick(user, dialog, SECONDARY, 'title');

    await user.click(within(dialog).getByRole('button', { name: 'QueryChips.RemoveSecondaryGrouping' }));

    expect(within(dialog).getByRole('button', { name: ADD_SECONDARY })).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox', { name: SECONDARY })).toBeNull();

    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: AGGREGATE_CHIP })).toBeInTheDocument();
    expect(currentQuery().group_by).toEqual(['activity_type']);
  });

  test('lists the aggregate functions of the catalog with a distinct entry for the count', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);

    await user.click(within(dialog).getByRole('combobox', { name: FUNCTION }));

    expect(await optionLabels()).toEqual([
      'Average',
      'Row count',
      'QueryChips.DistinctFunction',
      'Maximum',
      'Minimum',
      'Continuous percentile',
      'Discrete percentile',
      'Sum',
    ]);
  });

  test('requires the column of a function that takes one', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'activity_type');
    expect(within(dialog).queryByRole('combobox', { name: /^Row count/ })).toBeNull();

    await pick(user, dialog, FUNCTION, 'Average');
    expect(applyButton(dialog)).toBeDisabled();

    await pick(user, dialog, /^Average/, 'Cost');
    expect(applyButton(dialog)).toBeEnabled();
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', {
        name: 'QueryBuilder.Aggregate: AVG(Cost) QueryChips.AggregateBy activity_type',
      }),
    ).toBeInTheDocument();
    expect(currentQuery().select?.[1]).toEqual({
      expr: { type: 'fn', name: 'avg', args: [field('cost')] },
      as: expect.any(String),
    });
  });

  test('requires a column for the distinct count and marks the measure distinct', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'activity_type');

    await pick(user, dialog, FUNCTION, 'QueryChips.DistinctFunction');
    expect(applyButton(dialog)).toBeDisabled();

    await pick(user, dialog, /^QueryChips.DistinctFunction/, 'title');
    await apply(user, dialog);

    expect(
      await screen.findByRole('button', {
        name: 'QueryBuilder.Aggregate: COUNT(DISTINCT title) QueryChips.AggregateBy activity_type',
      }),
    ).toBeInTheDocument();
    expect(currentQuery().select?.[1]).toEqual({
      expr: { type: 'fn', name: 'count', args: [field('title')], distinct: true },
      as: expect.any(String),
    });
  });

  test('requires every argument of a function that takes a literal and a column', async () => {
    const user = userEvent.setup();
    renderChipBar();
    const dialog = await openAdd(user, AGGREGATE);
    await pick(user, dialog, GROUP_BY, 'activity_type');
    await pick(user, dialog, FUNCTION, 'Continuous percentile');

    await pick(user, dialog, /^Continuous percentile/, 'Cost');
    expect(applyButton(dialog)).toBeDisabled();

    await user.type(within(dialog).getByRole('spinbutton', { name: 'Fraction' }), '0.9');
    expect(applyButton(dialog)).toBeEnabled();
    await apply(user, dialog);

    expect(await screen.findByRole('button', { name: /PERCENTILE_CONT\(Cost\)/ })).toBeInTheDocument();
    expect(currentQuery().select?.[1].expr).toEqual({
      type: 'fn',
      name: 'percentile_cont',
      args: [{ type: 'value', value_type: 'decimal', value: '0.9' }, field('cost')],
    });
  });

  test('returns to a row query on Remove', async () => {
    const user = userEvent.setup();
    renderChipBar();
    await addAggregate(user, 'activity_type');
    const dialog = await openChip(user, AGGREGATE_CHIP);

    expect(within(dialog).queryByRole('button', { name: 'Buttons.Back' })).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Remove' }));

    expect(await screen.findByRole('button', { name: 'QueryChips.AddPart' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: AGGREGATE_CHIP })).toBeNull();
    const query = currentQuery();
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.group_by).toBeUndefined();
    expect(query.select).toBeUndefined();
  });

  test('prunes the sort keys on fields the aggregate no longer returns', async () => {
    const user = userEvent.setup();
    renderChipBar({
      initial: {
        sort: [
          { ...createSort(), field: 'title', dir: QuerySortDirection.Asc },
          { ...createSort(), field: 'activity_type', dir: QuerySortDirection.Desc },
        ],
      },
    });

    await addAggregate(user, 'activity_type');

    expect(screen.getByRole('button', { name: /^QueryBuilder.Sort: activity_type/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^QueryBuilder.Sort: title/ })).toBeNull();
    expect(currentQuery().sort).toEqual([{ field: 'activity_type', dir: 'desc' }]);
  });

  test('prunes the sort key on the measure when the aggregate is removed', async () => {
    const user = userEvent.setup();
    renderChipBar();
    await addAggregate(user, 'activity_type');
    const measure = currentQuery().select?.[1].as ?? '';
    const sort = await openAdd(user, 'QueryBuilder.Sort');
    await pick(user, sort, /QueryChips.Field/, measure);
    await apply(user, sort);
    expect(await screen.findByRole('button', { name: /^QueryBuilder.Sort: / })).toBeInTheDocument();

    const dialog = await openChip(user, AGGREGATE_CHIP);
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Remove' }));

    expect(await screen.findByRole('button', { name: 'QueryChips.AddPart' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /^QueryBuilder.Sort: / })).toBeNull();
    expect(currentQuery().sort).toBeUndefined();
  });
});
