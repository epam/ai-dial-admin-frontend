import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { listSavedQueries } from '@/src/app/[lang]/queries/actions';
import WidgetSettingsModal from '@/src/components/Analytics/CustomDashboards/Modals/WidgetSettingsModal';
import { WidgetSettings, WidgetSourceKind } from '@/src/components/Analytics/CustomDashboards/models';
import { CustomDashboardsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ChangeDirection, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';
import { QueryMode, QueryPageType } from '@/src/models/analytics/query';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions', () => ({ listSavedQueries: vi.fn() }));

const SUBMIT = 'Add';
const ROW_COUNT = new RegExp(CustomDashboardsI18nKey.RowCount);

const PERSONAL = { id: 'q-1', name: 'Personal query' } as SavedQuery;
const COMMON = { id: 'q-2', name: 'Common query' } as SavedQuery;

describe('WidgetSettingsModal', () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
      scope === SavedQueryScope.Personal ? [PERSONAL] : [COMMON],
    );
  });

  const renderModal = (
    props: { initial?: Partial<WidgetSettings>; isQueryPickable?: boolean; isRowCountLocked?: boolean } = {},
  ) =>
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
          view: WidgetView.Query,
          valueColumn: '',
          ...props.initial,
        }}
        isQueryPickable={props.isQueryPickable ?? false}
        isRowCountLocked={props.isRowCountLocked}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

  const rowCountField = () => screen.getByRole('spinbutton', { name: ROW_COUNT });

  test('shows the initial row count and states the allowed range on the label', () => {
    renderModal();

    expect(rowCountField()).toHaveValue(100);
    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.RowCountHint })).toBeTruthy();
  });

  test('shows the range error after the field loses focus with 1001 and blocks submission', async () => {
    renderModal();

    // Per-keystroke typing drops characters in the kit field under jsdom, so the value is set in one change.
    fireEvent.change(rowCountField(), { target: { value: '1001' } });

    expect(screen.queryByText(CustomDashboardsI18nKey.RowCountError)).toBeNull();

    fireEvent.blur(rowCountField());

    expect(await screen.findByText(CustomDashboardsI18nKey.RowCountError)).toBeTruthy();
    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();
  });

  test('submits the default row limit when the field is emptied', async () => {
    renderModal({ initial: { rowCount: '25' } });
    const user = userEvent.setup();

    await user.clear(rowCountField());
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        source: WidgetSourceKind.SavedQuery,
        savedQueryId: 'q-1',
        sql: '',
        title: '',
        description: '',
        rowCount: '',
        view: WidgetView.Query,
        valueColumn: '',
        changeDirection: ChangeDirection.HigherIsBetter,
        valueFormat: WidgetValueFormat.Number,
        currency: 'USD',
      },
      100,
      undefined,
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('submits the entered row limit with a trimmed title and description', async () => {
    renderModal();
    const user = userEvent.setup();

    fireEvent.change(rowCountField(), { target: { value: '250' } });
    fireEvent.change(screen.getByRole('textbox', { name: CustomDashboardsI18nKey.WidgetTitle }), {
      target: { value: '  Spend  ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: EntityFieldsI18nKey.description }), {
      target: { value: '  What agents spend  ' },
    });
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        source: WidgetSourceKind.SavedQuery,
        savedQueryId: 'q-1',
        sql: '',
        title: 'Spend',
        description: 'What agents spend',
        rowCount: '250',
        view: WidgetView.Query,
        valueColumn: '',
        changeDirection: ChangeDirection.HigherIsBetter,
        valueFormat: WidgetValueFormat.Number,
        currency: 'USD',
      },
      250,
      undefined,
    );
  });

  test('keeps submission unavailable until a saved query is picked', async () => {
    renderModal({ initial: { savedQueryId: '' }, isQueryPickable: true });
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: COMMON.name }));

    expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();
  });

  test('starts Row count from the page limit of the picked query', async () => {
    vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
      scope === SavedQueryScope.Personal
        ? [
            {
              ...PERSONAL,
              query: {
                entity: 'e',
                mode: QueryMode.Row,
                page: { type: QueryPageType.Offset, offset: 0, limit: 10, include_total: false },
              },
            },
          ]
        : [COMMON],
    );
    renderModal({ initial: { savedQueryId: '' }, isQueryPickable: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: PERSONAL.name }));
    expect(rowCountField()).toHaveValue(10);

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: COMMON.name }));
    expect(rowCountField()).toHaveValue(100);
  });

  test('lists personal and common saved queries in the picker', async () => {
    renderModal({ initial: { savedQueryId: '' }, isQueryPickable: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));

    expect(await screen.findByRole('option', { name: PERSONAL.name })).toBeTruthy();
    expect(screen.getByRole('option', { name: COMMON.name })).toBeTruthy();
  });

  test('omits the saved-query picker when editing an existing widget', () => {
    renderModal();

    expect(screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) })).toBeNull();
    expect(listSavedQueries).not.toHaveBeenCalled();
  });
});

describe('WidgetSettingsModal — view', () => {
  const renderWithViews = (fittingViews?: WidgetView[]) =>
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          view: WidgetView.Query,
          valueColumn: '',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
        }}
        isQueryPickable={false}
        fittingViews={fittingViews}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

  test('lists only the views the result fits', async () => {
    renderWithViews([WidgetView.Query, WidgetView.Table, WidgetView.Share]);
    const user = userEvent.setup();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.View) }));

    expect(await screen.findByRole('option', { name: CustomDashboardsI18nKey.ViewShare })).toBeTruthy();
    expect(screen.getByRole('option', { name: CustomDashboardsI18nKey.ViewTable })).toBeTruthy();
    expect(screen.queryByRole('option', { name: CustomDashboardsI18nKey.ViewTimeSeries })).toBeNull();
  });

  test('offers the value column only for the Single value view', () => {
    const { unmount } = render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
          view: WidgetView.SingleValue,
          valueColumn: 'spend',
        }}
        isQueryPickable={false}
        fittingViews={[WidgetView.Query, WidgetView.SingleValue]}
        valueColumns={[
          { value: 'spend', label: 'Spend' },
          { value: 'turns', label: 'Turns' },
        ]}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: CustomDashboardsI18nKey.ValueColumn })).toBeTruthy();

    // Settings start from `initial` once, at mount, so the other view is a fresh modal.
    unmount();
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          view: WidgetView.Query,
          valueColumn: '',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
        }}
        isQueryPickable={false}
        fittingViews={[WidgetView.Query]}
        valueColumns={[{ value: 'spend', label: 'Spend' }]}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('combobox', { name: CustomDashboardsI18nKey.ValueColumn })).toBeNull();
  });

  test('offers a currency once a Single value is written as money', async () => {
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          view: WidgetView.SingleValue,
          valueColumn: '',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
        }}
        isQueryPickable={false}
        fittingViews={[WidgetView.Query, WidgetView.SingleValue]}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const user = userEvent.setup();

    expect(screen.queryByRole('combobox', { name: CustomDashboardsI18nKey.Currency })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: CustomDashboardsI18nKey.ValueFormat }));
    await user.click(await screen.findByRole('option', { name: CustomDashboardsI18nKey.FormatMoney }));

    expect(await screen.findByRole('combobox', { name: CustomDashboardsI18nKey.Currency })).toBeTruthy();
  });

  test('hides the picker while there is no result to judge', () => {
    renderWithViews();

    expect(screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.View) })).toBeNull();
  });
});

describe('WidgetSettingsModal — composite SQL', () => {
  test('locks Row count and says the query LIMIT sets it', () => {
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={{
          source: WidgetSourceKind.SavedQuery,
          savedQueryId: 'q-1',
          sql: '',
          title: '',
          description: '',
          rowCount: '100',
          view: WidgetView.Query,
          valueColumn: '',
          changeDirection: ChangeDirection.HigherIsBetter,
          valueFormat: WidgetValueFormat.Number,
          currency: 'USD',
        }}
        isQueryPickable={false}
        isRowCountLocked
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('spinbutton', { name: ROW_COUNT })).toBeDisabled();
    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.RowCountSetByQuery })).toBeTruthy();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.RowCountHint })).toBeNull();
    expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();
  });
});

describe('WidgetSettingsModal — source', () => {
  const onSubmit = vi.fn();

  const INITIAL: WidgetSettings = {
    source: WidgetSourceKind.SavedQuery,
    savedQueryId: '',
    sql: '',
    title: '',
    description: '',
    rowCount: '100',
    view: WidgetView.Query,
    valueColumn: '',
    changeDirection: ChangeDirection.HigherIsBetter,
    valueFormat: WidgetValueFormat.Number,
    currency: 'USD',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
      scope === SavedQueryScope.Personal ? [{ ...PERSONAL, sql: 'SELECT model FROM usage' }] : [COMMON],
    );
  });

  const renderAdd = () =>
    render(
      <WidgetSettingsModal
        header="Widget"
        submitLabel={SUBMIT}
        initial={INITIAL}
        isQueryPickable
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

  const chooseSql = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox', { name: CustomDashboardsI18nKey.Source }));
    await user.click(await screen.findByRole('option', { name: CustomDashboardsI18nKey.SourceSql }));
  };

  test('shows the picked saved query in a read-only preview', async () => {
    renderAdd();
    const user = userEvent.setup();

    expect(screen.queryByRole('group', { name: CustomDashboardsI18nKey.QueryPreview })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: PERSONAL.name }));

    const preview = await screen.findByRole('group', { name: CustomDashboardsI18nKey.QueryPreview });
    expect(preview.textContent).toContain('SELECT model FROM usage');
    expect(within(preview).queryByRole('textbox')).toBeNull();
  });

  describe('copy warning', () => {
    beforeEach(() => {
      vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
        scope === SavedQueryScope.Personal
          ? [{ ...PERSONAL, scope: SavedQueryScope.Personal }]
          : [{ ...COMMON, scope: SavedQueryScope.Common }],
      );
    });

    const renderAddTo = (isDashboardPublic: boolean) =>
      render(
        <WidgetSettingsModal
          header="Widget"
          submitLabel={SUBMIT}
          initial={INITIAL}
          isQueryPickable
          isDashboardPublic={isDashboardPublic}
          onSubmit={onSubmit}
          onClose={vi.fn()}
        />,
      );

    const pick = async (name: string) => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
      await user.click(await screen.findByRole('option', { name }));
    };

    test('warns that a personal query picked for a public dashboard is copied', async () => {
      renderAddTo(true);
      await pick(PERSONAL.name);

      expect(await screen.findByText(CustomDashboardsI18nKey.PersonalQueryCopied)).toBeTruthy();
    });

    test('does not warn for a common query on a public dashboard', async () => {
      renderAddTo(true);
      await pick(COMMON.name);

      expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();
      expect(screen.queryByText(CustomDashboardsI18nKey.PersonalQueryCopied)).toBeNull();
    });

    test('does not warn for a personal query on a private dashboard', async () => {
      renderAddTo(false);
      await pick(PERSONAL.name);

      expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();
      expect(screen.queryByText(CustomDashboardsI18nKey.PersonalQueryCopied)).toBeNull();
    });
  });

  test('passes the picked saved query on submit', async () => {
    renderAdd();
    const user = userEvent.setup();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: PERSONAL.name }));
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ source: WidgetSourceKind.SavedQuery, savedQueryId: 'q-1' }),
      100,
      expect.objectContaining({ id: 'q-1', name: PERSONAL.name }),
    );
  });

  test('replaces the saved-query picker with a SQL statement field', async () => {
    renderAdd();
    const user = userEvent.setup();

    await chooseSql(user);

    expect(await screen.findByRole('textbox', { name: new RegExp(CustomDashboardsI18nKey.SqlStatement) })).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) })).toBeNull();
  });

  test('requires both a title and a statement for a SQL source', async () => {
    renderAdd();
    const user = userEvent.setup();

    await chooseSql(user);
    const sqlField = await screen.findByRole('textbox', { name: new RegExp(CustomDashboardsI18nKey.SqlStatement) });
    const titleField = screen.getByRole('textbox', { name: new RegExp(CustomDashboardsI18nKey.WidgetTitle) });

    fireEvent.change(sqlField, { target: { value: 'SELECT 1' } });
    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();

    fireEvent.change(sqlField, { target: { value: '   ' } });
    fireEvent.change(titleField, { target: { value: 'Spend' } });
    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();

    fireEvent.change(sqlField, { target: { value: '  SELECT 1  ' } });
    expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: SUBMIT }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ source: WidgetSourceKind.Sql, sql: 'SELECT 1', title: 'Spend' }),
      100,
      undefined,
    );
  });

  test("drops the saved query's name from the Title placeholder for a SQL source", async () => {
    renderAdd();
    const user = userEvent.setup();
    const titleField = () => screen.getByRole('textbox', { name: new RegExp(CustomDashboardsI18nKey.WidgetTitle) });

    expect(titleField()).toHaveAttribute('placeholder', CustomDashboardsI18nKey.WidgetTitlePlaceholder);

    await chooseSql(user);
    await screen.findByRole('textbox', { name: new RegExp(CustomDashboardsI18nKey.SqlStatement) });

    expect(titleField()).not.toHaveAttribute('placeholder');
  });
});
