import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomComponentContext, CustomFilterProps } from 'ag-grid-react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationValueFilter from '@/src/components/Analytics/ConversationsTrace/List/ConversationValueFilter';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationFieldValue,
  ConversationGridContext,
  ConversationRow,
  ConversationValueFilterModel,
  ConversationsField,
} from '@/src/models/analytics/conversations-trace';

type Props = CustomFilterProps<ConversationRow, ConversationGridContext, ConversationValueFilterModel>;

const VALUES: ConversationFieldValue[] = [
  { value: 'positive', count: 920 },
  { value: 'negative', count: 41 },
];

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
          colDef: { field: ConversationsField.InsightSentiment, headerName: 'Sentiment' },
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

beforeEach(() => {
  vi.clearAllMocks();
  lifecycle = {};
  requestFieldValues.mockResolvedValue(VALUES);
});

describe('conversation value filter', () => {
  test('reads the column values when the filter is opened', async () => {
    renderFilter();

    expect(requestFieldValues).not.toHaveBeenCalled();

    await openFilter();

    expect(requestFieldValues).toHaveBeenCalledWith(ConversationsField.InsightSentiment);
    await waitFor(() => expect(optionsGroup()).toBeInTheDocument());
  });

  test('renders each value with its count, most frequent first', async () => {
    renderFilter();
    await openFilter();

    await waitFor(() => expect(screen.getAllByRole('checkbox')).toHaveLength(2));

    expect(optionsGroup().textContent).toBe('positive (920)negative (41)');
    expect(screen.getByRole('checkbox', { name: 'positive (920)' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'negative (41)' })).toBeInTheDocument();
  });

  test('selecting a value drives the model', async () => {
    renderFilter();
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'positive (920)' })));

    expect(onModelChange).toHaveBeenCalledWith({ values: ['positive'] });
  });

  test('adding a second value keeps the first', async () => {
    renderFilter({ values: ['positive'] });
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'negative (41)' })));

    expect(onModelChange).toHaveBeenCalledWith({ values: ['positive', 'negative'] });
  });

  // A null model deactivates the column's filter — the same state a text entry left blank is in.
  test('clearing the last value contributes no filter at all', async () => {
    renderFilter({ values: ['positive'] });
    await openFilter();

    await userEvent.click(await waitFor(() => screen.getByRole('checkbox', { name: 'positive (920)' })));

    expect(onModelChange).toHaveBeenCalledWith(null);
  });

  test('a value already selected renders checked', async () => {
    renderFilter({ values: ['negative'] });
    await openFilter();

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'negative (41)' })).toBeChecked());
    expect(screen.getByRole('checkbox', { name: 'positive (920)' })).not.toBeChecked();
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
  test('a failed read says so and offers no text entry', async () => {
    requestFieldValues.mockResolvedValue(null);
    renderFilter();
    await openFilter();

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.ValueFilterLoadFailed),
    );
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
