import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EnumValuesField from '@/src/components/Analytics/Tables/EnumValuesField';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';

const renderField = (props?: Partial<Parameters<typeof EnumValuesField>[0]>) => {
  const onChange = vi.fn();
  const view = render(
    <EnumValuesField rowId="col-1" values={['pending', 'running', 'failed']} onChange={onChange} {...props} />,
  );
  return { onChange, view };
};

// The ui-kit `DialInputPopup` trigger changes element depending on state: with no value it is a real
// `<button aria-label="open-popup">`, and once values are selected it becomes a plain `<div>` with no role and
// no accessible name. That inconsistency is upstream's (no 2.0 replacement exists), so the popup is driven from
// the **empty** state here — which is also the state a new enum column starts in — and the populated field is
// asserted only on what it renders.
describe('EnumValuesField', () => {
  test('labels itself as the value set', () => {
    renderField();
    expect(screen.getByText(AnalyticsTablesI18nKey.EnumValues)).toBeInTheDocument();
  });

  // The declared-order note is deliberately NOT here: anything rendered beneath the control lifts it out of
  // line with the row's other inputs, so `ColumnRowsEditor` states it once for the row set instead.
  test('renders nothing beneath the control', () => {
    renderField();
    expect(screen.queryByText(AnalyticsTablesI18nKey.EnumValuesOrderHint)).toBeNull();
  });

  test('shows the declared values in the collapsed field, in order', () => {
    renderField();

    for (const value of ['pending', 'running', 'failed']) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  test('renders the row-level validation message when one is given', () => {
    renderField({ errorText: AnalyticsTablesI18nKey.EnumValuesRequired });
    expect(screen.getByText(AnalyticsTablesI18nKey.EnumValuesRequired)).toBeInTheDocument();
  });

  test('renders no validation message when there is none', () => {
    renderField();
    expect(screen.queryByText(AnalyticsTablesI18nKey.EnumValuesRequired)).toBeNull();
  });

  test('renders an empty domain without a value readout', () => {
    renderField({ values: [] });

    expect(screen.getByText(AnalyticsTablesI18nKey.EnumValues)).toBeInTheDocument();
    expect(screen.queryByText('pending')).toBeNull();
  });

  // Two enum columns authored in the same draft each get their own field identity. The validation *isolation*
  // they also rely on comes from the private `SaveValidationContextProvider`, which is React context and
  // leaves no DOM trace — so it is asserted by the code, not here; this pins the half that is observable.
  test("keeps each row's field identity distinct", () => {
    const { container } = render(
      <>
        <EnumValuesField rowId="col-1" values={['a']} onChange={vi.fn()} />
        <EnumValuesField rowId="col-2" values={['b']} onChange={vi.fn()} />
      </>,
    );

    const labelTargets = Array.from(container.querySelectorAll('label')).map((el) => el.getAttribute('for'));
    expect(labelTargets).toEqual(['col-enum-values-col-1', 'col-enum-values-col-2']);
  });

  describe('the values popup', () => {
    // Reachable only from the empty state, per the trigger note above.
    const openPopup = async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<EnumValuesField rowId="col-1" values={[]} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: 'open-popup' }));
      return { user, onChange, dialog: screen.getByRole('dialog') };
    };

    test('opens on the field and starts with no value rows', async () => {
      const { dialog } = await openPopup();

      expect(within(dialog).getByRole('button', { name: AnalyticsTablesI18nKey.EnumValuesAdd })).toBeInTheDocument();
      expect(within(dialog).queryAllByRole('textbox')).toHaveLength(0);
    });

    test('adds a row and publishes the authored value on apply', async () => {
      const { user, onChange, dialog } = await openPopup();

      await user.click(within(dialog).getByRole('button', { name: AnalyticsTablesI18nKey.EnumValuesAdd }));
      await user.type(within(dialog).getByRole('textbox'), 'pending');

      const apply = within(dialog).getByRole('button', { name: ButtonsI18nKey.Apply });
      await waitFor(() => expect(apply).toBeEnabled());
      await user.click(apply);

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(['pending']));
    });

    test('publishes both values in the order they were authored', async () => {
      const { user, onChange, dialog } = await openPopup();

      const add = within(dialog).getByRole('button', { name: AnalyticsTablesI18nKey.EnumValuesAdd });
      await user.click(add);
      await user.type(within(dialog).getAllByRole('textbox')[0], 'low');
      await user.click(add);
      await user.type(within(dialog).getAllByRole('textbox')[1], 'high');

      const apply = within(dialog).getByRole('button', { name: ButtonsI18nKey.Apply });
      await waitFor(() => expect(apply).toBeEnabled());
      await user.click(apply);

      await waitFor(() => expect(onChange).toHaveBeenCalledWith(['low', 'high']));
    });

    test('cancelling publishes nothing', async () => {
      const { user, onChange, dialog } = await openPopup();

      await user.click(within(dialog).getByRole('button', { name: AnalyticsTablesI18nKey.EnumValuesAdd }));
      await user.type(within(dialog).getByRole('textbox'), 'pending');
      await user.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Cancel }));

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
