import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import SelectProjection from '@/src/components/Analytics/QueryBuilder/Select/SelectProjection';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { createColumnRow, createFnRow, createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QueryMode } from '@/src/models/analytics/query';

const FIELDS = [
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id' },
  { name: 'request_tags', type: AnalyticsFieldType.String, source: 'request_tags' },
];

const ADD_LABEL = 'QueryBuilder.Select: QueryBuilder.AddField';

const stateWith = (
  overrides: Partial<QueryBuilderState>,
  functions: QueryFunction[] = TEST_FUNCTIONS,
): QueryBuilderState => ({
  ...createInitialState(functions),
  mode: QueryMode.Row,
  fields: FIELDS,
  ...overrides,
});

// The section mutates `state` in place and calls `refresh()` to re-render, so the harness needs a
// refresh that actually re-renders for anything asserted after an interaction.
const renderLive = (state: QueryBuilderState, node: ReactNode) => {
  const Harness = () => {
    const [, setTick] = useState(0);
    return (
      <QueryBuilderContext.Provider value={{ state, refresh: () => setTick((tick) => tick + 1), patch: vi.fn() }}>
        {node}
      </QueryBuilderContext.Provider>
    );
  };
  render(<Harness />);
  return userEvent.setup();
};

const openFunctions = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: ADD_LABEL }));
  await user.click(screen.getByRole('button', { name: /QueryBuilder.Functions/ }));
};

describe('QueryBuilder :: SelectProjection', () => {
  test('offers the catalog scalar functions alongside the schema columns', async () => {
    const user = renderLive(stateWith({}), <SelectProjection />);

    await openFunctions(user);

    expect(screen.getByRole('option', { name: /Json extract string/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Lowercase/ })).toBeInTheDocument();
  });

  test('picking a function adds a row with an editor per catalog argument and a prefilled alias', async () => {
    const state = stateWith({});
    const user = renderLive(state, <SelectProjection />);

    await openFunctions(user);
    await user.click(screen.getByRole('option', { name: /Json extract string/ }));

    expect(state.select).toHaveLength(1);
    expect(state.select[0]).toMatchObject({ fn: 'json_extract_string', alias: 'Json extract string' });
    expect(screen.getByRole('button', { name: 'json' })).toBeInTheDocument();
    expect(screen.getByLabelText('key')).toBeInTheDocument();
    expect(screen.getByLabelText('QueryBuilder.AliasPlaceholder')).toBeInTheDocument();
  });

  // The dropdown memoizes its selected set on the `selected` prop's identity, so a section that hands
  // it a list it mutates in place leaves the open overlay showing a stale mark.
  test('marks a column as selected in the open overlay, and unmarks it on a second pick', async () => {
    const user = renderLive(stateWith({}), <SelectProjection />);

    await user.click(screen.getByRole('button', { name: ADD_LABEL }));
    await user.click(screen.getByRole('button', { name: /PRINCIPAL|Untagged|project_id/i }));
    const option = screen.getByRole('option', { name: /project_id/ });

    await user.click(option);
    expect(screen.getByRole('option', { name: /project_id/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: /project_id/ }));
    expect(screen.getByRole('option', { name: /project_id/ })).toHaveAttribute('aria-selected', 'false');
  });

  test('a plain column renders as a removable chip', async () => {
    const state = stateWith({ select: [createColumnRow('project_id')] });
    const user = renderLive(state, <SelectProjection />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Remove project_id' }));

    expect(state.select).toEqual([]);
  });

  test('a function row is labelled by the call it makes', () => {
    const row = { ...createFnRow(fnFixture('lower'), [{ field: 'project_id' }]), alias: 'lowered' };
    renderLive(stateWith({ select: [row] }), <SelectProjection />);

    expect(screen.getByRole('button', { name: 'lower(project_id) AS lowered' })).toBeInTheDocument();
  });

  test('warns when a function column is left out for want of an argument', () => {
    renderLive(stateWith({ select: [createFnRow(fnFixture('lower'))] }), <SelectProjection />);

    expect(screen.getByRole('img', { name: 'QueryBuilder.WarningDroppedProjectionColumn' })).toBeInTheDocument();
  });

  test('does not warn once the argument is filled', () => {
    const row = createFnRow(fnFixture('lower'), [{ field: 'project_id' }]);
    renderLive(stateWith({ select: [row] }), <SelectProjection />);

    expect(screen.queryByRole('img', { name: 'QueryBuilder.WarningDroppedProjectionColumn' })).not.toBeInTheDocument();
  });

  // No local fallback catalog: with nothing served, the projection still builds from columns alone.
  test('an empty catalog offers columns only', async () => {
    const user = renderLive(stateWith({}, []), <SelectProjection />);

    await user.click(screen.getByRole('button', { name: ADD_LABEL }));

    expect(screen.queryByRole('button', { name: /QueryBuilder.Functions/ })).not.toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: ADD_LABEL })).toBeInTheDocument();
  });
});
