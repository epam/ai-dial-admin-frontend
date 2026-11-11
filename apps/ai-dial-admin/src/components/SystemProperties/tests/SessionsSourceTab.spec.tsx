import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getSessionsSource,
  getSessionsSourceEntities,
  getSessionsSourceSchema,
  saveSessionsSource,
  updateProperties,
} from '@/src/app/[lang]/system-properties/actions';
import SystemProperties from '@/src/components/SystemProperties/SystemProperties';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import { ButtonsI18nKey, SystemPropertiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock('@/src/app/[lang]/system-properties/actions');

vi.mock('@/src/components/EntityView/Interceptors/GlobalInterceptors', () => ({
  default: ({ onChangeInterceptors }: { onChangeInterceptors: (interceptors: string[]) => void }) => (
    <button onClick={() => onChangeInterceptors(['new-interceptor'])}>change-interceptors</button>
  ),
}));

const field = (name: string, type: AnalyticsFieldType): AnalyticsEntityField => ({ name, type, source: 'column' });

const SESSIONS_FIELDS: AnalyticsEntityField[] = [
  field('client_session_id', AnalyticsFieldType.String),
  field('last_request_time', AnalyticsFieldType.Timestamp),
  field('project_id', AnalyticsFieldType.String),
  field('session_insights.title', AnalyticsFieldType.String),
  field('total_price', AnalyticsFieldType.Decimal),
  field('turn_count', AnalyticsFieldType.Integer),
];

const OTHER_FIELDS: AnalyticsEntityField[] = [
  field('client_session_id', AnalyticsFieldType.String),
  field('started_at', AnalyticsFieldType.Timestamp),
  field('project_id', AnalyticsFieldType.String),
];

const STORED: SessionsSourceSetting = {
  baseTable: 'sessions',
  roles: { ...DEFAULT_SESSIONS_SOURCE_SETTING.roles, [SessionsRole.Turns]: null },
};

const { showNotification } = useNotification();

const roleLabel = (role: SessionsRole) =>
  ({
    [SessionsRole.SessionId]: SystemPropertiesI18nKey.SessionsSourceRoleSessionId,
    [SessionsRole.Time]: SystemPropertiesI18nKey.SessionsSourceRoleTime,
    [SessionsRole.Project]: SystemPropertiesI18nKey.SessionsSourceRoleProject,
    [SessionsRole.Title]: SystemPropertiesI18nKey.SessionsSourceRoleTitle,
    [SessionsRole.Cost]: SystemPropertiesI18nKey.SessionsSourceRoleCost,
    [SessionsRole.Turns]: SystemPropertiesI18nKey.SessionsSourceRoleTurns,
  })[role];

const picker = (label: string) => screen.getByRole('combobox', { name: new RegExp(label.replace('.', '\\.')) });
const baseTablePicker = () => picker(SystemPropertiesI18nKey.SessionsSourceBaseTableLabel);
const rolePicker = (role: SessionsRole) => picker(roleLabel(role));
const saveButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });

const renderSystemProperties = (isAnalyticsEnabled = true) =>
  render(
    <SaveValidationContextProvider>
      <SystemProperties
        interceptors={[]}
        globalSettings={{ globalInterceptors: [] }}
        doesSettingsExist
        isAnalyticsEnabled={isAnalyticsEnabled}
      />
    </SaveValidationContextProvider>,
  );

const openSessionsSourceTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText(SystemPropertiesI18nKey.SessionsSourceTitle));
};

const chooseOption = async (user: ReturnType<typeof userEvent.setup>, combobox: HTMLElement, name: string) => {
  await user.click(combobox);
  await user.click(within(screen.getByRole('listbox')).getByRole('option', { name }));
};

describe('SystemProperties — Sessions source tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext().isReadOnlyAdmin = false;
    vi.mocked(getSessionsSource).mockResolvedValue({ success: true, response: STORED });
    vi.mocked(getSessionsSourceEntities).mockResolvedValue({
      success: true,
      response: [{ name: 'sessions' }, { name: 'other_sessions' }],
    });
    vi.mocked(getSessionsSourceSchema).mockImplementation(async (name) => ({
      success: true,
      response: { fields: name === 'sessions' ? SESSIONS_FIELDS : OTHER_FIELDS },
    }));
    vi.mocked(saveSessionsSource).mockImplementation(async (setting) => ({ success: true, response: setting }));
  });

  test('offers no tab and reads nothing from the analytics service when analytics is disabled', () => {
    renderSystemProperties(false);

    expect(screen.getByText(TabsI18nKey.GlobalInterceptors)).toBeTruthy();
    expect(screen.queryByText(SystemPropertiesI18nKey.SessionsSourceTitle)).toBeNull();
    expect(getSessionsSource).not.toHaveBeenCalled();
    expect(getSessionsSourceEntities).not.toHaveBeenCalled();
  });

  test('reads nothing until the tab is opened', () => {
    renderSystemProperties();

    expect(screen.getByText(SystemPropertiesI18nKey.SessionsSourceTitle)).toBeTruthy();
    expect(getSessionsSource).not.toHaveBeenCalled();
  });

  test('shows the stored binding unchanged, with the caveat next to the base-table picker', async () => {
    const user = userEvent.setup();
    renderSystemProperties();
    await openSessionsSourceTab(user);

    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));
    expect(rolePicker(SessionsRole.Time)).toHaveDisplayValue('last_request_time');
    expect(rolePicker(SessionsRole.Turns)).toHaveDisplayValue(SystemPropertiesI18nKey.SessionsSourceRoleNotSet);
    expect(baseTablePicker()).toHaveAccessibleDescription(SystemPropertiesI18nKey.SessionsSourceBaseTableCaveat);
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('shows the default binding as unsaved values when nothing is stored, and saves it', async () => {
    const user = userEvent.setup();
    vi.mocked(getSessionsSource).mockResolvedValue({ success: true });
    renderSystemProperties();
    await openSessionsSourceTab(user);

    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    expect(rolePicker(SessionsRole.Turns)).toHaveDisplayValue('turn_count');
    expect(saveSessionsSource).toHaveBeenCalledWith(DEFAULT_SESSIONS_SOURCE_SETTING);
    expect(updateProperties).not.toHaveBeenCalled();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: SystemPropertiesI18nKey.SessionsSourceSaved }),
    );
  });

  test('reports a failed read and does not present the default as the stored binding', async () => {
    const user = userEvent.setup();
    vi.mocked(getSessionsSource).mockResolvedValue({ success: false, errorMessage: 'Service unavailable' });
    renderSystemProperties();
    await openSessionsSourceTab(user);

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: SystemPropertiesI18nKey.SessionsSourceReadFailed,
          description: 'Service unavailable',
        }),
      ),
    );
    expect(baseTablePicker()).toHaveDisplayValue('');
    expect(rolePicker(SessionsRole.Time)).toHaveDisplayValue('');
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('clears roles the new base table lacks, keeps the rest, and blocks Save until Time is bound', async () => {
    const user = userEvent.setup();
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    await chooseOption(user, baseTablePicker(), 'other_sessions');

    expect(await screen.findByText(SystemPropertiesI18nKey.SessionsSourceRoleRequired)).toBeTruthy();
    expect(rolePicker(SessionsRole.SessionId)).toHaveDisplayValue('client_session_id');
    expect(rolePicker(SessionsRole.Project)).toHaveDisplayValue('project_id');
    expect(rolePicker(SessionsRole.Cost)).toHaveDisplayValue(SystemPropertiesI18nKey.SessionsSourceRoleNotSet);
    expect(rolePicker(SessionsRole.Time)).toHaveDisplayValue('');
    expect(saveButton()).toBeDisabled();

    await chooseOption(user, rolePicker(SessionsRole.Time), 'started_at');

    expect(saveButton()).toBeEnabled();
    await user.click(saveButton());

    expect(saveSessionsSource).toHaveBeenCalledWith({
      baseTable: 'other_sessions',
      roles: {
        [SessionsRole.SessionId]: 'client_session_id',
        [SessionsRole.Time]: 'started_at',
        [SessionsRole.Project]: 'project_id',
        [SessionsRole.Title]: null,
        [SessionsRole.Cost]: null,
        [SessionsRole.Turns]: null,
      },
    });
  });

  test('offers a role only the fields of a fitting type', async () => {
    const user = userEvent.setup();
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    await user.click(rolePicker(SessionsRole.Cost));

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'total_price' })).toBeTruthy();
    expect(within(listbox).getByRole('option', { name: 'turn_count' })).toBeTruthy();
    expect(within(listbox).queryByRole('option', { name: 'project_id' })).toBeNull();
  });

  test('reports a rejected save with the service message and keeps the unsaved edits', async () => {
    const user = userEvent.setup();
    vi.mocked(saveSessionsSource).mockResolvedValue({
      success: false,
      errorHeader: 'Bad Request',
      errorMessage: 'Unknown field',
    });
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    await chooseOption(user, rolePicker(SessionsRole.Turns), 'turn_count');
    await user.click(saveButton());

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Bad Request', description: 'Unknown field' }),
    );
    expect(rolePicker(SessionsRole.Turns)).toHaveDisplayValue('turn_count');
    expect(saveButton()).toBeTruthy();
  });

  test('discards the unsaved edits back to the stored binding', async () => {
    const user = userEvent.setup();
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    await chooseOption(user, rolePicker(SessionsRole.Turns), 'turn_count');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(rolePicker(SessionsRole.Turns)).toHaveDisplayValue(SystemPropertiesI18nKey.SessionsSourceRoleNotSet);
  });

  test('saving global interceptors sends no sessions source write', async () => {
    const user = userEvent.setup();
    vi.mocked(updateProperties).mockResolvedValue({ success: true });
    renderSystemProperties();

    await user.click(screen.getByText('change-interceptors'));
    await user.click(saveButton());

    expect(updateProperties).toHaveBeenCalledOnce();
    expect(saveSessionsSource).not.toHaveBeenCalled();
    expect(getSessionsSource).not.toHaveBeenCalled();
  });

  test('disables every picker for a read-only admin', async () => {
    const user = userEvent.setup();
    useAppContext().isReadOnlyAdmin = true;
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    expect(baseTablePicker()).toBeDisabled();
    expect(rolePicker(SessionsRole.SessionId)).toBeDisabled();
    useAppContext().isReadOnlyAdmin = false;
  });

  test('keeps the base table when the new table schema cannot be read', async () => {
    const user = userEvent.setup();
    vi.mocked(getSessionsSourceSchema).mockImplementation(async (name) =>
      name === 'sessions'
        ? { success: true, response: { fields: SESSIONS_FIELDS } }
        : { success: false, errorMessage: 'Schema unavailable' },
    );
    renderSystemProperties();
    await openSessionsSourceTab(user);
    await vi.waitFor(() => expect(baseTablePicker()).toHaveDisplayValue('sessions'));

    await chooseOption(user, baseTablePicker(), 'other_sessions');

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: SystemPropertiesI18nKey.SessionsSourceSchemaReadFailed,
        description: 'Schema unavailable',
      }),
    );
    expect(baseTablePicker()).toHaveDisplayValue('sessions');
    expect(rolePicker(SessionsRole.Time)).toHaveDisplayValue('last_request_time');
  });

  test('reports a failed table listing', async () => {
    const user = userEvent.setup();
    vi.mocked(getSessionsSourceEntities).mockResolvedValue({ success: false, errorMessage: 'Listing unavailable' });
    renderSystemProperties();
    await openSessionsSourceTab(user);

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: SystemPropertiesI18nKey.SessionsSourceTablesReadFailed,
          description: 'Listing unavailable',
        }),
      ),
    );
  });
});
