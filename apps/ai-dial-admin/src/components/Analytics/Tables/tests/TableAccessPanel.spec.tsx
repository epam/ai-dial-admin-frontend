import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRoles, getTableAccess, replaceTableAccess } from '@/src/app/[lang]/tables/actions';
import TableAccessPanel from '@/src/components/Analytics/Tables/TableAccessPanel';
import { AnalyticsTablesI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { ConfigEntityRow } from '@/src/models/dial/config-file';
import { ConfigEntityOrigin } from '@/src/types/config-file-entity';

vi.mock('@/src/app/[lang]/tables/actions');

const showNotificationSpy = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

// Renders each role as a checkbox instead of the real floating dropdown/checkbox-list, so tests can
// assert selection state and toggle roles directly (matches this repo's convention for mocking heavy
// interactive ui-kit components, e.g. DialButtonDropdown in TableDetailView.spec.tsx).
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ label, options, value, onChange }: any) => (
      <div role="group" aria-label={label}>
        {options.map((o: any) => (
          <label key={o.value}>
            <input
              type="checkbox"
              checked={(value ?? []).includes(o.value)}
              onChange={() =>
                onChange(
                  (value ?? []).includes(o.value)
                    ? value.filter((v: string) => v !== o.value)
                    : [...(value ?? []), o.value],
                )
              }
            />
            {o.label}
          </label>
        ))}
      </div>
    ),
  };
});

const toRow = (name: string): ConfigEntityRow => ({ name, displayName: name, origin: ConfigEntityOrigin.Api });
const catalog = [toRow('analytics-writer'), toRow('analytics-editor'), toRow('analytics-viewer')];
const renderPanel = (onClose = vi.fn()) => render(<TableAccessPanel name="events" onClose={onClose} />);
const waitForLoaded = () => screen.findByRole('group', { name: AnalyticsTablesI18nKey.WriteRoles });
const writeRolesGroup = () => screen.getByRole('group', { name: AnalyticsTablesI18nKey.WriteRoles });
const modifyRolesGroup = () => screen.getByRole('group', { name: AnalyticsTablesI18nKey.ModifyRoles });
const offeredRoles = (group: HTMLElement) =>
  within(group)
    .getAllByRole('checkbox')
    .map((option) => option.parentElement?.textContent);

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

beforeEach(() => {
  vi.clearAllMocks();
  (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: [] });
  (replaceTableAccess as any).mockResolvedValue({ success: true });
  (getRoles as any).mockResolvedValue({ roles: catalog, warnings: [] });
});

describe('TableAccessPanel', () => {
  test('shows a loading spinner while the initial fetch is in flight', () => {
    renderPanel();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  test('checks the roles already granted in the list that granted them', async () => {
    (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: ['analytics-editor'] });
    renderPanel();
    await waitForLoaded();

    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-writer' })).toBeChecked();
    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-editor' })).not.toBeChecked();
    expect(within(modifyRolesGroup()).getByRole('checkbox', { name: 'analytics-editor' })).toBeChecked();
    expect(getTableAccess).toHaveBeenCalledWith('events');
    expect(getRoles).toHaveBeenCalledOnce();
  });

  test('offers every catalog role, not just the granted ones, in alphabetical order', async () => {
    renderPanel();
    await waitForLoaded();

    expect(offeredRoles(writeRolesGroup())).toEqual(['analytics-editor', 'analytics-viewer', 'analytics-writer']);
    expect(offeredRoles(modifyRolesGroup())).toEqual(['analytics-editor', 'analytics-viewer', 'analytics-writer']);
  });

  test('checking a new role includes it in the saved list', async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitForLoaded();

    await user.click(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-viewer' }));
    await save(user);

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', {
        write: ['analytics-writer', 'analytics-viewer'],
        modify: [],
      }),
    );
  });

  test('unchecking a granted role removes it from the saved list', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPanel(onClose);
    await waitForLoaded();

    await user.click(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-writer' }));
    await save(user);

    await waitFor(() => expect(replaceTableAccess).toHaveBeenCalledWith('events', { write: [], modify: [] }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('offers a granted role the catalog does not contain, and sends it back unchanged', async () => {
    (getTableAccess as any).mockResolvedValue({ write: ['config-file-only-role'], modify: [] });
    const user = userEvent.setup();
    renderPanel();
    await waitForLoaded();

    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'config-file-only-role' })).toBeChecked();
    expect(within(modifyRolesGroup()).getByRole('checkbox', { name: 'config-file-only-role' })).not.toBeChecked();

    await user.click(within(modifyRolesGroup()).getByRole('checkbox', { name: 'analytics-editor' }));
    await save(user);

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', {
        write: ['config-file-only-role'],
        modify: ['analytics-editor'],
      }),
    );
  });

  test('keeps Save disabled and does not replace when the access load fails', async () => {
    (getTableAccess as any).mockResolvedValue(null);
    renderPanel();

    await waitFor(() => expect(getTableAccess).toHaveBeenCalledWith('events'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(replaceTableAccess).not.toHaveBeenCalled();
    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
  });

  test('reports a role-catalog failure separately and still offers the granted roles', async () => {
    (getRoles as any).mockResolvedValue({ roles: [], warnings: [EntitiesI18nKey.OptionListUnavailable] });
    renderPanel();
    await waitForLoaded();

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: AnalyticsTablesI18nKey.RolesLoadFailed,
        description: EntitiesI18nKey.OptionListUnavailable,
      }),
    );
    expect(showNotificationSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
    expect(offeredRoles(writeRolesGroup())).toEqual(['analytics-writer']);
  });

  test('round-trips both lists on save when nothing is edited', async () => {
    (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: ['analytics-editor'] });
    const user = userEvent.setup();
    renderPanel();
    await waitForLoaded();

    await save(user);

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', {
        write: ['analytics-writer'],
        modify: ['analytics-editor'],
      }),
    );
  });
});
