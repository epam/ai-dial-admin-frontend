import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EditTableMetadataPopup from '@/src/components/Analytics/Tables/EditTableMetadataPopup';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

const table: AnalyticsTable = {
  name: 'orders',
  type: AnalyticsTableType.Source,
  description: 'Order events',
  columns: [
    { source_name: 'a', name: 'a', type: AnalyticsFieldType.String, tag: 'identity' },
    { source_name: 'b', name: 'b', type: AnalyticsFieldType.String, tag: 'pii' },
  ],
};

const submitButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EditTableMetadataPopup', () => {
  test('renders the description field and the table’s distinct tags', () => {
    render(<EditTableMetadataPopup table={table} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByDisplayValue('Order events')).toBeInTheDocument();
    expect(screen.getByText('identity')).toBeInTheDocument();
    expect(screen.getByText('pii')).toBeInTheDocument();
  });

  test('shows an empty-tags hint when the table has no tags', () => {
    render(<EditTableMetadataPopup table={{ ...table, columns: [] }} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.TagOrderEmpty)).toBeInTheDocument();
  });

  test('submit is disabled until a field changes', () => {
    render(<EditTableMetadataPopup table={table} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(submitButton()).toBeDisabled();
  });

  test('changing the description enables submit and sends only the changed field', () => {
    const onSubmit = vi.fn();
    render(<EditTableMetadataPopup table={table} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByDisplayValue('Order events'), { target: { value: 'Updated description' } });
    expect(submitButton()).not.toBeDisabled();

    fireEvent.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith({ description: 'Updated description' });
  });
});
