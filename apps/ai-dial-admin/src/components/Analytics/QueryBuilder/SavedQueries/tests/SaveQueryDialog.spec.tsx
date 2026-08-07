import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SaveQueryDialog from '@/src/components/Analytics/QueryBuilder/SavedQueries/SaveQueryDialog';
import { describeSavedQueryError } from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { useAppContext } from '@/src/context/AppContext';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import {
  SaveQueryDialogMode,
  SaveQueryForm,
  SavedQueryErrorCode,
  SavedQueryScope,
  SavedQueryTimeMode,
} from '@/src/models/analytics/saved-query';

// The shared AppContext mock returns a fixed object; scope gating is decided by isFullAdmin and
// isEnableAuth, so this spec needs to vary them per test.
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

const setRoles = ({ isFullAdmin = true, isEnableAuth = true } = {}) => {
  vi.mocked(useAppContext).mockReturnValue({
    isFullAdmin,
    isEnableAuth,
  } as ReturnType<typeof useAppContext>);
};

const FORM: SaveQueryForm = {
  name: 'Top chats',
  description: '',
  tag: '',
  scope: SavedQueryScope.Personal,
  captureTime: true,
  saveAsChart: true,
};

const renderDialog = (overrides: Partial<Parameters<typeof SaveQueryDialog>[0]> = {}) => {
  const props = {
    open: true,
    mode: SaveQueryDialogMode.Create,
    initial: FORM,
    tagSuggestions: ['Adoption'],
    resultView: QueryResultView.Table,
    chartConfig: { type: ChartType.Bar, xField: null, yField: null },
    currentTime: { mode: SavedQueryTimeMode.Relative as const, period: '2d' },
    saveDisabled: false,
    isSaving: false,
    error: null,
    onSave: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<SaveQueryDialog {...props} />);
  return props;
};

describe('QueryBuilder :: SaveQueryDialog', () => {
  beforeEach(() => setRoles());

  test('renders the name and the time checkbox', () => {
    renderDialog();

    expect(screen.getByDisplayValue('Top chats')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.SaveQueryCaptureTime')).toBeInTheDocument();
  });

  test('saving reports the collected form', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Top chats', captureTime: true }));
  });

  test('a blank name blocks saving and says why', async () => {
    const user = userEvent.setup();
    const { onSave } = renderDialog({ initial: { ...FORM, name: '' } });

    expect(screen.getByText('QueryBuilder.SavedQueryNameRequired')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  test('an unrunnable query cannot be saved — the service could not store it either', () => {
    renderDialog({ saveDisabled: true });

    expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeDisabled();
  });

  test('Common is offered to a full admin', () => {
    renderDialog();

    expect(screen.getByText('QueryBuilder.SaveQueryDestinationCommon')).toBeInTheDocument();
  });

  test('Common is not offered without the full admin role', () => {
    setRoles({ isFullAdmin: false });
    renderDialog();

    expect(screen.queryByText('QueryBuilder.SaveQueryDestinationCommon')).not.toBeInTheDocument();
  });

  test('both destinations always carry a description', () => {
    renderDialog();

    expect(screen.getByText('QueryBuilder.SaveQueryDestinationPersonalHint')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.SaveQueryDestinationCommonHint')).toBeInTheDocument();
  });

  test('the privacy claim gives way to a neutral one when authentication is off', () => {
    setRoles({ isFullAdmin: true, isEnableAuth: false });
    renderDialog();

    // Nothing is enforced in this mode, so claiming privacy would be untrue — but the option still
    // needs a description, or the pair reads lopsided.
    expect(screen.queryByText('QueryBuilder.SaveQueryDestinationPersonalHint')).not.toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.SaveQueryDestinationPersonalHintOpen')).toBeInTheDocument();
  });

  test('the chart block appears only in the Chart view', () => {
    renderDialog();
    expect(screen.queryByText('QueryBuilder.SaveQueryChart')).not.toBeInTheDocument();

    renderDialog({ resultView: QueryResultView.Chart });
    expect(screen.getByText('QueryBuilder.SaveQueryChart')).toBeInTheDocument();
  });

  test('an unpicked axis is described as a default in the chart block', () => {
    renderDialog({ resultView: QueryResultView.Chart });

    expect(screen.getAllByText(/QueryBuilder.SaveQueryChartAxisDefault/).length).toBeGreaterThan(0);
  });

  test('rename hides the capture options — the stored body is unchanged', () => {
    renderDialog({ mode: SaveQueryDialogMode.Rename });

    expect(screen.queryByText('QueryBuilder.SaveQueryCaptureTime')).not.toBeInTheDocument();
  });

  test('a rename is still allowed while the query is unrunnable', () => {
    renderDialog({ mode: SaveQueryDialogMode.Rename, saveDisabled: true });

    expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeEnabled();
  });

  test('an untranslatable body keeps the dialog filled and surfaces the service message', () => {
    renderDialog({
      error: describeSavedQueryError({
        success: false,
        status: 400,
        errorHeader: SavedQueryErrorCode.BadRequest,
        errorMessage: "unknown field 'user_hash'",
      }),
    });

    expect(screen.getByDisplayValue('Top chats')).toBeInTheDocument();
    expect(screen.getByText("unknown field 'user_hash'")).toBeInTheDocument();
  });

  test('a sensitive literal blocks with its own message and offers no workaround', () => {
    renderDialog({
      error: describeSavedQueryError({
        success: false,
        status: 422,
        errorHeader: SavedQueryErrorCode.SensitiveLiteralNotAllowed,
        errorMessage: "column 'user_email' is sensitive",
      }),
    });

    expect(screen.getByText('QueryBuilder.SavedQueryErrorSensitiveLiteral')).toBeInTheDocument();
    expect(screen.getByText("column 'user_email' is sensitive")).toBeInTheDocument();
  });

  test('a missing principal reads as a configuration problem, without the service message', () => {
    renderDialog({
      error: describeSavedQueryError({
        success: false,
        status: 500,
        errorHeader: SavedQueryErrorCode.PrincipalUnavailable,
        errorMessage: 'principal claim absent',
      }),
    });

    expect(screen.getByText('QueryBuilder.SavedQueryErrorPrincipalUnavailable')).toBeInTheDocument();
    expect(screen.queryByText('principal claim absent')).not.toBeInTheDocument();
  });

  test('forbidden gets its own message', () => {
    renderDialog({
      error: describeSavedQueryError({ success: false, status: 403, errorHeader: SavedQueryErrorCode.Forbidden }),
    });

    expect(screen.getByText('QueryBuilder.SavedQueryErrorForbidden')).toBeInTheDocument();
  });

  test('no parameter affordance is offered anywhere', () => {
    renderDialog({ resultView: QueryResultView.Chart });

    expect(screen.queryByText(/[Pp]arameter/)).not.toBeInTheDocument();
  });
});
