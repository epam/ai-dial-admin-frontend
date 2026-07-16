import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const COLUMN: AnalyticsTableColumn = {
  source_name: 'total_money',
  name: 'total_money',
  type: AnalyticsFieldType.Decimal,
  tag: 'metric',
  display_name: 'Total money',
  description: 'Money spent',
};

const renderPopup = (props?: Partial<Parameters<typeof EditColumnPopup>[0]>) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(<EditColumnPopup column={COLUMN} onClose={onClose} onSubmit={onSubmit} {...props} />);
  return { onSubmit, onClose };
};

const setInput = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('EditColumnPopup', () => {
  test('seeds the form with the column values and disables submit while unchanged', () => {
    renderPopup();

    expect(screen.getByLabelText(AnalyticsTablesI18nKey.ColumnName)).toHaveValue('total_money');
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.DisplayName)).toHaveValue('Total money');
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Tag)).toHaveValue('metric');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });

  test('rename plus relabel submits one combined patch referencing the new name', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup();

    setInput(AnalyticsTablesI18nKey.ColumnName, 'total_cost');
    setInput(AnalyticsTablesI18nKey.DisplayName, 'Total money spend');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({
      rename: [{ from: 'total_money', to: 'total_cost' }],
      update: [{ name: 'total_cost', display_name: 'Total money spend' }],
    });
  });

  test('clearing the label submits an empty display_name (the clear signal)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup();

    setInput(AnalyticsTablesI18nKey.DisplayName, '');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({ update: [{ name: 'total_money', display_name: '' }] });
  });

  test('a blank name disables submit', () => {
    renderPopup();

    setInput(AnalyticsTablesI18nKey.ColumnName, '');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });

  test('renameDisabled disables only the name input; metadata stays editable', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup({ renameDisabled: true });

    expect(screen.getByLabelText(AnalyticsTablesI18nKey.ColumnName)).toBeDisabled();

    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Tag)).toBeEnabled();
    setInput(AnalyticsTablesI18nKey.Tag, 'cost');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({
      update: [{ name: 'total_money', tag: 'cost' }],
    });
  });

  test('editing the description submits it in the update entry', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup();

    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Description)).toHaveValue('Money spent');
    setInput(AnalyticsTablesI18nKey.Description, 'Money spent on the request');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({
      update: [{ name: 'total_money', description: 'Money spent on the request' }],
    });
  });

  test('toggling sensitive submits it in the update entry', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup();

    const sensitive = screen.getByRole('checkbox');
    expect(sensitive).not.toBeChecked();
    fireEvent.click(sensitive);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({ update: [{ name: 'total_money', sensitive: true }] });
  });
});
