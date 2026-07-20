import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import CreateTablePopup from '@/src/components/Analytics/Tables/CreateTablePopup';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');

// The rows editor is exercised in its own spec; stub it so these tests stay focused on the popup's
// name validation, required markers, and submit gating.
vi.mock('@/src/components/Analytics/Tables/ColumnRowsEditor', () => ({
  default: () => <div>column-rows-editor</div>,
}));

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
  test('renders the name field and the required Columns / Ordering key sections', () => {
    setup();
    expect(nameField()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.Columns)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
  });

  test('submit is disabled while the form is incomplete (no name, columns, or ordering key)', () => {
    setup();
    expect(submitButton(AnalyticsTablesI18nKey.CreateSource)).toBeDisabled();
  });

  test('an invalid name shows the format error and keeps submit disabled', () => {
    setup();
    typeName('Bad Name');
    expect(screen.getByText(AnalyticsTablesI18nKey.NameFormatError)).toBeInTheDocument();
    expect(submitButton(AnalyticsTablesI18nKey.CreateSource)).toBeDisabled();
  });

  test('a name that collides with an existing table shows the exists error', () => {
    setup();
    typeName('events');
    expect(screen.getByText(AnalyticsTablesI18nKey.NameExistsError)).toBeInTheDocument();
  });

  test('a valid, unique name clears the inline error (submit still gated on columns/ordering key)', () => {
    setup();
    typeName('orders');
    expect(screen.queryByText(AnalyticsTablesI18nKey.NameFormatError)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.NameExistsError)).not.toBeInTheDocument();
  });
});

describe('CreateTablePopup enrichment', () => {
  test('renders source table / grain key selects instead of the columns section', () => {
    setup(AnalyticsTableType.Enrichment);
    expect(nameField()).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.SourceTable)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.GrainKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.Columns)).not.toBeInTheDocument();
  });
});
