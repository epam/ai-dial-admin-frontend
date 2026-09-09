import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import DiffSection from '@/src/components/ActivityAudit/View/DiffReport/DiffSection';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { AnalyticsTablesI18nKey, CompareI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiff, ActivityAuditDiffSection } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, DiffStatus, DiffView } from '@/src/types/activity-audit';

// The global `t()` mock returns the key as-is and drops interpolation params, which
// would make every column group heading read `Compare.ColumnGroup` — override it
// here so the column name a group is headed by is observable.
vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string, options?: Record<string, string>) =>
    options ? `${key}:${Object.values(options).join(',')}` : key,
  useCurrentLocale: () => 'en',
}));

// AG Grid is heavy and irrelevant here: the rows it receives are asserted as text.
vi.mock('@/src/components/ActivityAudit/EntityGrid/EntityGrid', () => ({
  default: ({ data }: { data?: ActivityAuditDiff[] }) => (
    <div>{(data ?? []).map((row) => row.parameter).join(',')}</div>
  ),
}));

const columnHeading = (name: string) => `${CompareI18nKey.ColumnGroup}:${name}`;

const row = (parameter: string, diffStatus?: DiffStatus): ActivityAuditDiff => ({
  parameter,
  value: 'value',
  diffStatus,
});

const columnSection = (label: string, diffStatus?: DiffStatus, rows = [row('name'), row('type')]) =>
  ({ current: rows, compare: rows, label, diffStatus }) as ActivityAuditDiffSection;

const renderSection = (sections: ActivityAuditDiffSection[], name: string, diffView = DiffView.ALL) =>
  render(<DiffSection sections={sections} name={name} type={ActivityAuditResourceType.TABLE} diffView={diffView} />);

describe('DiffSection', () => {
  test('heads a labelled section with the column name rather than the section title lookup', () => {
    renderSection([columnSection('amount'), columnSection('total')], EntityParameterKeys.COLUMNS);

    expect(screen.getByRole('heading', { name: columnHeading('amount') })).toBeTruthy();
    expect(screen.getByRole('heading', { name: columnHeading('total') })).toBeTruthy();
    expect(screen.getByRole('heading', { name: AnalyticsTablesI18nKey.Columns })).toBeTruthy();
  });

  test('renders the status of a labelled section as visible text', () => {
    renderSection([columnSection('total', DiffStatus.ADDED)], EntityParameterKeys.COLUMNS);

    expect(screen.getByText(CompareI18nKey.Added)).toBeTruthy();
  });

  test('exposes each labelled section as a group whose accessible name carries the column name and its status', () => {
    renderSection(
      [columnSection('legacy_id', DiffStatus.REMOVED), columnSection('email', DiffStatus.CHANGED)],
      EntityParameterKeys.COLUMNS,
    );

    expect(
      screen.getByRole('group', { name: `${columnHeading('legacy_id')}, ${CompareI18nKey.Removed}` }),
    ).toBeTruthy();
    expect(screen.getByRole('group', { name: `${columnHeading('email')}, ${CompareI18nKey.Changed}` })).toBeTruthy();
  });

  test('names an unlabelled section group by its existing section title', () => {
    render(
      <DiffSection
        sections={[{ current: [row('cpu')], compare: [row('cpu')] }]}
        name={EntityParameterKeys.RESOURCES}
        diffView={DiffView.ALL}
      />,
    );

    expect(screen.getByRole('heading', { name: EntityFieldsI18nKey.Compute })).toBeTruthy();
    expect(screen.getByRole('group', { name: EntityFieldsI18nKey.Compute })).toBeTruthy();
  });

  test('keeps the Variable N prefix of the environment-variable section', () => {
    render(
      <DiffSection
        sections={[{ current: [row('envName')], compare: [row('envName')] }]}
        name={EntityParameterKeys.METADATA}
        diffView={DiffView.ALL}
      />,
    );

    expect(screen.getByRole('heading', { name: `Variable 1 ${CompareI18nKey.Before}` })).toBeTruthy();
  });

  test('renders only the changed column group in diff-only view', () => {
    const sections = [
      columnSection('amount'),
      columnSection('email', DiffStatus.CHANGED, [row('name'), row('sensitive', DiffStatus.CHANGED)]),
    ];

    renderSection(sections, EntityParameterKeys.COLUMNS, DiffView.DIFF);

    expect(screen.queryByRole('group', { name: new RegExp(columnHeading('amount')) })).toBeNull();
    expect(screen.getByRole('group', { name: `${columnHeading('email')}, ${CompareI18nKey.Changed}` })).toBeTruthy();
  });

  test('renders every column group again in all-parameters view', () => {
    const sections = [
      columnSection('amount'),
      columnSection('email', DiffStatus.CHANGED, [row('name'), row('sensitive', DiffStatus.CHANGED)]),
    ];

    renderSection(sections, EntityParameterKeys.COLUMNS, DiffView.ALL);

    expect(screen.getByRole('group', { name: columnHeading('amount') })).toBeTruthy();
    expect(screen.getByRole('group', { name: `${columnHeading('email')}, ${CompareI18nKey.Changed}` })).toBeTruthy();
  });

  test('keeps a removed column group whose one side holds only mirror placeholders in diff-only view', () => {
    const removed = {
      current: [row('name', DiffStatus.MIRROR)],
      compare: [row('name', DiffStatus.REMOVED)],
      label: 'legacy_id',
      diffStatus: DiffStatus.REMOVED,
    } as ActivityAuditDiffSection;

    renderSection([removed], EntityParameterKeys.COLUMNS, DiffView.DIFF);

    expect(
      screen.getByRole('group', { name: `${columnHeading('legacy_id')}, ${CompareI18nKey.Removed}` }),
    ).toBeTruthy();
  });

  test('renders nothing when no section has data', () => {
    const { container } = renderSection([{ current: [], compare: [] }], EntityParameterKeys.COLUMNS);

    expect(container.firstChild).toBeNull();
  });
});
