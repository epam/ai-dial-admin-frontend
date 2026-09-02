import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EditColumnPopup from '@/src/components/Analytics/Tables/EditColumnPopup';
import { AnalyticsTablesI18nKey, ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
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

  test('a rename to an invalid identifier shows the format error and disables submit', () => {
    renderPopup();

    setInput(AnalyticsTablesI18nKey.ColumnName, 'Total-Cost');

    expect(screen.getByText(ErrorI18nKey.SnakeCaseIdentifier)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });

  test('a rename that collides with another column shows the exists error and disables submit', () => {
    renderPopup({ existingNames: ['total_cost'] });

    setInput(AnalyticsTablesI18nKey.ColumnName, 'total_cost');

    expect(screen.getByText(ErrorI18nKey.KeyValueExists)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });

  test('a tag longer than the length cap shows the length error and disables submit', () => {
    renderPopup();

    setInput(AnalyticsTablesI18nKey.Tag, 'a'.repeat(65));

    expect(screen.getByText(ErrorI18nKey.Length)).toBeInTheDocument();
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

  test('sensitiveDisabled disables the switch and explains why', () => {
    renderPopup({ sensitiveDisabled: true });

    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByText(AnalyticsTablesI18nKey.ScanColumnNotSensitive)).toBeInTheDocument();
  });

  test('sensitiveDisabled leaves every other field editable and still submits a patch', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPopup({ sensitiveDisabled: true });

    setInput(AnalyticsTablesI18nKey.ColumnName, 'event_identifier');
    setInput(AnalyticsTablesI18nKey.Description, 'Row identity');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onSubmit).toHaveBeenCalledWith({
      rename: [{ from: 'total_money', to: 'event_identifier' }],
      update: [{ name: 'event_identifier', description: 'Row identity' }],
    });
  });

  test('the switch is enabled and unexplained by default', () => {
    renderPopup();

    expect(screen.getByRole('checkbox')).toBeEnabled();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ScanColumnNotSensitive)).not.toBeInTheDocument();
  });

  describe('an enum column', () => {
    const ENUM_COLUMN: AnalyticsTableColumn = {
      source_name: 'status',
      name: 'status',
      type: AnalyticsFieldType.Enum,
      enum_values: ['pending', 'running', 'failed'],
    };

    // Shown through the same field the schema editor authors with, in its disabled mode — so read-only here
    // means there is no way into the value popup at all, not merely that the values render as text.
    test('shows the declared values with no way to edit them', () => {
      renderPopup({ column: ENUM_COLUMN });

      expect(screen.getByText(AnalyticsTablesI18nKey.EnumValues)).toBeInTheDocument();
      for (const value of ['pending', 'running', 'failed']) {
        expect(screen.getAllByText(value).length).toBeGreaterThan(0);
      }
      expect(screen.queryByRole('button', { name: 'open-popup' })).toBeNull();
    });

    // Presenting the restriction is the point — without it the closed domain is invisible, and an operator
    // would have no way to learn that widening it means dropping and re-adding the column.
    test('says the value set cannot be changed', () => {
      renderPopup({ column: ENUM_COLUMN });
      expect(screen.getByText(AnalyticsTablesI18nKey.EnumValuesImmutable)).toBeInTheDocument();
    });

    test('shows nothing of the kind for a column of any other type', () => {
      renderPopup();

      expect(screen.queryByRole('group', { name: AnalyticsTablesI18nKey.EnumValues })).toBeNull();
      expect(screen.queryByText(AnalyticsTablesI18nKey.EnumValuesImmutable)).toBeNull();
    });

    // The service answers 422 for an `update` entry carrying `enum_values` rather than ignoring it.
    test('a metadata edit submits a patch that does not carry the domain', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderPopup({ column: ENUM_COLUMN });

      setInput(AnalyticsTablesI18nKey.DisplayName, 'Run status');
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

      expect(onSubmit).toHaveBeenCalledWith({ update: [{ name: 'status', display_name: 'Run status' }] });
      expect(JSON.stringify(onSubmit.mock.calls[0][0])).not.toContain('enum_values');
    });

    test('a rename is still offered and carries no domain either', async () => {
      const user = userEvent.setup();
      const { onSubmit } = renderPopup({ column: ENUM_COLUMN });

      setInput(AnalyticsTablesI18nKey.ColumnName, 'run_status');
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

      expect(onSubmit).toHaveBeenCalledWith({ rename: [{ from: 'status', to: 'run_status' }] });
    });
  });
});
