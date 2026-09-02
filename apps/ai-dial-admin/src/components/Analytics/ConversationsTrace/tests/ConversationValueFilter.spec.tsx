import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomComponentContext, CustomFilterProps } from 'ag-grid-react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationValueFilter from '@/src/components/Analytics/ConversationsTrace/List/ConversationValueFilter';
import { ButtonsI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationFieldValue,
  ConversationGridContext,
  ConversationRow,
  ConversationValueFilterModel,
} from '@/src/models/analytics/conversations-trace';

type Props = CustomFilterProps<ConversationRow, ConversationGridContext, ConversationValueFilterModel>;

// A made-up column and domain. Nothing here names a field or a value that exists in a real deployment —
// the control is driven by the declared type, so any closed set exercises it identically.
const COLUMN_FIELD = 'widget_status';
const COLUMN_HEADER = 'Status';

const VALUES: ConversationFieldValue[] = [
  { value: 'pending', count: 920 },
  { value: 'failed', count: 41 },
];

// Twelve values clears the search threshold of ten, which is what makes the search field render.
const MANY_VALUES: ConversationFieldValue[] = Array.from({ length: 12 }, (_, i) => ({
  value: i === 0 ? 'pending' : `value_${i}`,
  count: 100 - i,
}));

const requestFieldValues = vi.fn();
const onModelChange = vi.fn();

// The grid normally owns the filter lifecycle: it collects the component's callbacks through this context
// and calls `afterGuiAttached` each time the popup opens. Standing in for it is what lets the test open and
// close the filter the way an operator does.
let lifecycle: Partial<Record<'afterGuiAttached' | 'afterGuiDetached', () => void>> = {};

const withGrid = (children: ReactNode) => (
  <CustomComponentContext.Provider
    value={{
      setMethods: (methods) => {
        lifecycle = methods as typeof lifecycle;
      },
    }}
  >
    {children}
  </CustomComponentContext.Provider>
);

const renderFilter = (model: ConversationValueFilterModel | null = null) =>
  render(
    withGrid(
      <ConversationValueFilter
        {...({
          model,
          onModelChange,
          colDef: { field: COLUMN_FIELD, headerName: COLUMN_HEADER },
          context: { requestFieldValues },
        } as unknown as Props)}
      />,
    ),
  );

const openFilter = async () => {
  await act(async () => {
    lifecycle.afterGuiAttached?.();
  });
};

const optionsGroup = () => screen.getByRole('group', { name: ConversationsTraceI18nKey.ValueFilterGroup });

// The select-all control is a checkbox too, and it sits outside the options group — so scoping to the group
// is what separates the value rows from it.
const valueCheckboxes = () => within(optionsGroup()).getAllByRole('checkbox');

const selectAllCheckbox = () => screen.getByRole('checkbox', { name: ConversationsTraceI18nKey.ValueFilterSelectAll });

beforeEach(() => {
  vi.clearAllMocks();
  lifecycle = {};
  requestFieldValues.mockResolvedValue(VALUES);
});

describe('ConversationValueFilter', () => {
  test('reads the column values when the filter is opened', async () => {
    renderFilter();

    expect(requestFieldValues).not.toHaveBeenCalled();

    await openFilter();

    expect(requestFieldValues).toHaveBeenCalledWith(COLUMN_FIELD);
    await waitFor(() => expect(optionsGroup()).toBeInTheDocument());
  });

  // The name is what a selection means; a name carrying the count would rename the same option every time
  // the data moved, so the count is rendered outside the label.
  test("names each option by its value alone, with the count outside the option's name", async () => {
    renderFilter();
    await openFilter();

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'pending' })).toBeInTheDocument());

    expect(screen.getByRole('checkbox', { name: 'failed' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'pending (920)' })).toBeNull();
    // Still on screen, just not part of any option's accessible name.
    expect(optionsGroup().textContent).toContain('920');
    expect(optionsGroup().textContent).toContain('41');
  });

  test('lists the values most frequent first, as the query returned them', async () => {
    renderFilter();
    await openFilter();

    await waitFor(() => expect(valueCheckboxes()).toHaveLength(2));

    // Rendered order is the query's order; each value is followed by its own count.
    expect(optionsGroup().textContent).toBe('pending920failed41');
  });

  test('selecting a value drives the model', async () => {
    renderFilter();
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'pending' })));

    expect(onModelChange).toHaveBeenCalledWith({ values: ['pending'] });
  });

  test('adding a second value keeps the first', async () => {
    renderFilter({ values: ['pending'] });
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'failed' })));

    expect(onModelChange).toHaveBeenCalledWith({ values: ['pending', 'failed'] });
  });

  // A null model deactivates the column's filter — the same state a text entry left blank is in.
  test('clearing the last value contributes no filter at all', async () => {
    renderFilter({ values: ['pending'] });
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'pending' })));

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('a value already selected renders checked', async () => {
    renderFilter({ values: ['failed'] });
    await openFilter();

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'failed' })).toBeChecked());
    expect(screen.getByRole('checkbox', { name: 'pending' })).not.toBeChecked();
  });

  describe('select all', () => {
    test('selects every listed value, and clears them when activated again', async () => {
      const { rerender } = renderFilter();
      await openFilter();

      await userEvent.click(await waitFor(() => selectAllCheckbox()));
      expect(onModelChange).toHaveBeenCalledWith({ values: ['pending', 'failed'] });

      // The model is the grid's to hold, so the "everything selected" state has to be fed back in.
      rerender(
        withGrid(
          <ConversationValueFilter
            {...({
              model: { values: ['pending', 'failed'] },
              onModelChange,
              colDef: { field: COLUMN_FIELD, headerName: COLUMN_HEADER },
              context: { requestFieldValues },
            } as unknown as Props)}
          />,
        ),
      );

      expect(selectAllCheckbox()).toBeChecked();

      await userEvent.click(selectAllCheckbox());
      expect(onModelChange).toHaveBeenLastCalledWith(null);
    });

    test('reports a partial selection as mixed rather than checked', async () => {
      renderFilter({ values: ['pending'] });
      await openFilter();

      await waitFor(() => expect(selectAllCheckbox()).toBeInTheDocument());

      expect(selectAllCheckbox()).toHaveAttribute('aria-checked', 'mixed');
    });
  });

  describe('search', () => {
    test('is offered only once the list is long enough to be worth scanning', async () => {
      renderFilter();
      await openFilter();

      await waitFor(() => expect(optionsGroup()).toBeInTheDocument());
      expect(screen.queryAllByRole('textbox')).toHaveLength(0);

      requestFieldValues.mockResolvedValue(MANY_VALUES);
      await act(async () => {
        lifecycle.afterGuiDetached?.();
      });
      await openFilter();

      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument());
    });

    // Presentational only: narrowing what renders must never change what is selected, or clearing the term
    // would silently drop values the operator had already chosen.
    test('narrows the list without changing the selection', async () => {
      requestFieldValues.mockResolvedValue(MANY_VALUES);
      renderFilter({ values: ['pending'] });
      await openFilter();

      const search = await waitFor(() => screen.getByRole('textbox'));
      await userEvent.type(search, 'value_1');

      await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'pending' })).toBeNull());
      // Hiding the selected value did not deselect it.
      expect(onModelChange).not.toHaveBeenCalled();

      await userEvent.clear(search);

      await waitFor(() => expect(screen.getByRole('checkbox', { name: 'pending' })).toBeChecked());
    });
  });

  test('reset clears the selection and contributes no predicate', async () => {
    renderFilter({ values: ['pending'] });
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('button', { name: ButtonsI18nKey.Reset })));

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('reset is disabled while nothing is selected', async () => {
    renderFilter();
    await openFilter();

    await waitFor(() => expect(optionsGroup()).toBeInTheDocument());

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Reset })).toBeDisabled();
  });

  test('the loading state is announced and offers nothing to select', async () => {
    requestFieldValues.mockReturnValue(new Promise(() => undefined));
    renderFilter();
    await openFilter();

    expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.ValueFilterLoading);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(onModelChange).not.toHaveBeenCalled();
  });

  test('an empty result says so and offers nothing to select', async () => {
    requestFieldValues.mockResolvedValue([]);
    renderFilter();
    await openFilter();

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.ValueFilterEmpty),
    );
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(onModelChange).not.toHaveBeenCalled();
  });

  // Never a text entry in its place: an operator who opened one control and was handed another would enter a
  // value under the wrong operator.
  test('a failed read says so, in the error treatment, and offers no text entry', async () => {
    requestFieldValues.mockResolvedValue(null);
    renderFilter();
    await openFilter();

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.ValueFilterLoadFailed),
    );
    expect(screen.getByRole('status')).toHaveClass('text-error');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    expect(onModelChange).not.toHaveBeenCalled();
  });

  // The list is faceted against the page's other narrowing, so one held from a previous period or search
  // term would state counts that no longer match the rows a selection returns.
  test('re-opening the filter reads the values again', async () => {
    renderFilter();
    await openFilter();
    await waitFor(() => expect(optionsGroup()).toBeInTheDocument());

    await act(async () => {
      lifecycle.afterGuiDetached?.();
    });
    await openFilter();

    expect(requestFieldValues).toHaveBeenCalledTimes(2);
  });
});
