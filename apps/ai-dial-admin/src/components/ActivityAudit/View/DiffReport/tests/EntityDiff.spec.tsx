import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import EntityDiff from '@/src/components/ActivityAudit/View/DiffReport/EntityDiff';
import { ActivityAuditI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiff } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, DiffView } from '@/src/types/activity-audit';

// `DiffSection` renders its `name` prop as text so "a section was rendered" is
// observable without pulling in Accordion / AG Grid.
vi.mock('@/src/components/ActivityAudit/View/DiffReport/DiffSection', () => ({
  default: ({ name }: { name: string }) => <div>{name}</div>,
}));

// The minimap's observer scheduling is irrelevant to this component's own branching.
vi.mock('@/src/components/Common/DiffMiniMap/DiffMiniMap', () => ({
  default: () => <div>minimap</div>,
}));

const emptyBucket = (): Record<string, ActivityAuditDiff[]> => ({ properties: [] });

const populatedBucket = (): Record<string, ActivityAuditDiff[]> => ({
  properties: [{ parameter: 'name', value: 'value' }],
});

describe('EntityDiff', () => {
  test('renders the empty state as a status region carrying only the title, with no description, and suppresses the legend and minimap when both sides carry an empty properties bucket', () => {
    render(<EntityDiff currentEntity={emptyBucket()} compareEntity={emptyBucket()} />);

    const status = screen.getByRole('status');
    expect(status.textContent).toBe(ActivityAuditI18nKey.SnapshotUnavailableTitle);
    expect(screen.queryByText(ButtonsI18nKey.Create)).toBeNull();
    expect(screen.queryByText('minimap')).toBeNull();
  });

  test('renders the empty state the same way for the TABLE resource type', () => {
    render(
      <EntityDiff currentEntity={emptyBucket()} compareEntity={emptyBucket()} type={ActivityAuditResourceType.TABLE} />,
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toContain(ActivityAuditI18nKey.SnapshotUnavailableTitle);
    expect(screen.queryByText(ButtonsI18nKey.Create)).toBeNull();
  });

  test('renders the empty state the same way for a non-analytics resource type, since the requirement is resource-type agnostic', () => {
    render(
      <EntityDiff currentEntity={emptyBucket()} compareEntity={emptyBucket()} type={ActivityAuditResourceType.MODEL} />,
    );

    const status = screen.getByRole('status');
    expect(status.textContent).toContain(ActivityAuditI18nKey.SnapshotUnavailableTitle);
    expect(screen.queryByText(ButtonsI18nKey.Create)).toBeNull();
  });

  test('renders the empty state when both sides carry no buckets at all', () => {
    render(<EntityDiff currentEntity={{}} compareEntity={{}} />);

    const status = screen.getByRole('status');
    expect(status.textContent).toContain(ActivityAuditI18nKey.SnapshotUnavailableTitle);
    expect(screen.queryByText(ButtonsI18nKey.Create)).toBeNull();
  });

  test('renders a section and the legend, and no empty state, when both sides carry a populated properties bucket', () => {
    render(<EntityDiff currentEntity={populatedBucket()} compareEntity={populatedBucket()} />);

    expect(screen.getByText('properties')).toBeTruthy();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeTruthy();
    expect(screen.getByText(ButtonsI18nKey.Update)).toBeTruthy();
    expect(screen.getByText(ButtonsI18nKey.Delete)).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('renders a section and the legend, unchanged from today, when only one side carries a populated properties bucket', () => {
    render(<EntityDiff currentEntity={populatedBucket()} compareEntity={emptyBucket()} />);

    expect(screen.getByText('properties')).toBeTruthy();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  // `DiffSection` is stubbed here on purpose, so this pins `EntityDiff`'s own condition — that it
  // is keyed on `sections`, not on the active filter — and not the filter's own row-hiding
  // behaviour, which `DiffSection.spec.tsx` already covers.
  test('does not render the empty state for the "Changes only" filter, since the predicate ignores which rows the filter hides', () => {
    render(<EntityDiff currentEntity={populatedBucket()} compareEntity={populatedBucket()} diffView={DiffView.DIFF} />);

    expect(screen.getByText('properties')).toBeTruthy();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
