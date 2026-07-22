import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createTable } from '@/src/app/[lang]/tables/actions';
import CreateTablePopup from '@/src/components/Analytics/Tables/CreateTablePopup';
import { AnalyticsTablesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const tables: AnalyticsTable[] = [{ name: 'events', type: AnalyticsTableType.Source }];

const setup = (tableType: AnalyticsTableType = AnalyticsTableType.Source) =>
  render(<CreateTablePopup tableType={tableType} tables={tables} onClose={vi.fn()} onCreated={vi.fn()} />);

const nameField = () => screen.getByLabelText(AnalyticsTablesI18nKey.Name, { exact: false });
// DialInput remounts on re-render, so per-keystroke typing detaches; set the value in one change event.
const typeName = (value: string) => fireEvent.change(nameField(), { target: { value } });
const submitButton = (key: AnalyticsTablesI18nKey) => screen.getByRole('button', { name: key });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateTablePopup source', () => {
  test('renders only identity fields — no columns/ordering key/partition sections', () => {
    setup();
    expect(nameField()).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Columns)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.PartitionColumn)).not.toBeInTheDocument();
  });

  test('submit is disabled while the name is blank', () => {
    setup();
    expect(submitButton(AnalyticsTablesI18nKey.CreateSource)).toBeDisabled();
  });

  test('an invalid name shows the format error and keeps submit disabled', () => {
    setup();
    typeName('Bad Name');
    expect(screen.getByText(ErrorI18nKey.SnakeCaseIdentifier)).toBeInTheDocument();
    expect(submitButton(AnalyticsTablesI18nKey.CreateSource)).toBeDisabled();
  });

  test('a name that collides with an existing table shows the exists error', () => {
    setup();
    typeName('events');
    expect(screen.getByText(ErrorI18nKey.KeyValueExists)).toBeInTheDocument();
  });

  test('a valid, unique name enables submit and sends an identity-only payload', async () => {
    (createTable as any).mockResolvedValue({ success: true });
    setup();
    typeName('orders');
    expect(screen.queryByText(ErrorI18nKey.SnakeCaseIdentifier)).not.toBeInTheDocument();
    const button = submitButton(AnalyticsTablesI18nKey.CreateSource);
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(createTable).toHaveBeenCalledWith({ name: 'orders', type: AnalyticsTableType.Source });
  });
});

describe('CreateTablePopup enrichment', () => {
  test('renders a required source-table select instead of the columns section', () => {
    setup(AnalyticsTableType.Enrichment);
    expect(nameField()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.SourceTable)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Columns)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.GrainKey)).not.toBeInTheDocument();
  });

  test('a valid name and defaulted source table send an identity-only enrichment payload', () => {
    (createTable as any).mockResolvedValue({ success: true });
    setup(AnalyticsTableType.Enrichment);
    typeName('user_flags');

    fireEvent.click(submitButton(AnalyticsTablesI18nKey.CreateEnrichment));

    expect(createTable).toHaveBeenCalledWith({
      name: 'user_flags',
      type: AnalyticsTableType.Enrichment,
      source_table: 'events',
    });
  });
});
