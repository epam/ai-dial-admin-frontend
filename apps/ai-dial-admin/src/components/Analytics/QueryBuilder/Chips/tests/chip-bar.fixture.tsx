import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useMemo, useState } from 'react';

import ChipBar from '@/src/components/Analytics/QueryBuilder/Chips/ChipBar';
import { PeriodControl } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { StructuredQuery } from '@/src/models/analytics/query';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';

export type ChipUser = ReturnType<typeof userEvent.setup>;

export interface ChipBarHarnessProps {
  initial?: Partial<QueryBuilderState>;
  period?: PeriodControl | null;
}

export const CHIP_FIELDS: AnalyticsEntityField[] = [
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

const latest: { state: QueryBuilderState | null } = { state: null };

const ChipBarHarness: FC<ChipBarHarnessProps> = ({ initial, period = null }) => {
  const [state, setState] = useState<QueryBuilderState>(() => ({
    ...createInitialState(TEST_FUNCTIONS),
    entityName: 'conversations',
    fields: CHIP_FIELDS,
    ...initial,
  }));
  latest.state = state;
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

export const renderChipBar = (props: ChipBarHarnessProps = {}) => render(<ChipBarHarness {...props} />);

export const currentState = (): QueryBuilderState => {
  if (!latest.state) throw new Error('ChipBar harness is not rendered');
  return latest.state;
};

export const currentQuery = (): StructuredQuery => buildQuery(currentState(), null);

export const openAddMenu = (user: ChipUser) => user.click(screen.getByRole('button', { name: 'QueryChips.AddPart' }));

export const openAdd = async (user: ChipUser, entry: string): Promise<HTMLElement> => {
  await openAddMenu(user);
  await user.click(await screen.findByRole('menuitemcheckbox', { name: entry }));
  return screen.findByRole('dialog');
};

export const openChip = async (user: ChipUser, name: RegExp): Promise<HTMLElement> => {
  await user.click(screen.getByRole('button', { name }));
  return screen.findByRole('dialog');
};

export const pick = async (user: ChipUser, dialog: HTMLElement, field: RegExp, option: string | RegExp) => {
  await user.click(within(dialog).getByRole('combobox', { name: field }));
  await user.click(await screen.findByRole('option', { name: option }));
};

export const applyButton = (dialog: HTMLElement): HTMLElement =>
  within(dialog).getByRole('button', { name: 'Buttons.Apply' });

export const apply = (user: ChipUser, dialog: HTMLElement) => user.click(applyButton(dialog));
