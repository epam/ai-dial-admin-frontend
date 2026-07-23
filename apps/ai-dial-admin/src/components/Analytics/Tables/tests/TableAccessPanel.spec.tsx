import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRoles, getTableAccess, replaceTableAccess } from '@/src/app/[lang]/tables/actions';
import TableAccessPanel from '@/src/components/Analytics/Tables/TableAccessPanel';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';

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

const roles = [{ name: 'analytics-writer' }, { name: 'analytics-editor' }, { name: 'analytics-viewer' }];

// The role groups only render once the initial fetch (access + roles catalog) resolves — before that,
// a spinner is shown in their place. Await this once per test before using the sync `*RolesGroup`
// helpers below.
const waitForLoaded = () => screen.findByRole('group', { name: AnalyticsTablesI18nKey.WriteRoles });
const writeRolesGroup = () => screen.getByRole('group', { name: AnalyticsTablesI18nKey.WriteRoles });
const modifyRolesGroup = () => screen.getByRole('group', { name: AnalyticsTablesI18nKey.ModifyRoles });

beforeEach(() => {
  vi.clearAllMocks();
  (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: [] });
  (replaceTableAccess as any).mockResolvedValue({ success: true });
  (getRoles as any).mockResolvedValue(roles);
});

describe('TableAccessPanel', () => {
  test('shows a loading spinner while the initial fetch is in flight', () => {
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  test('loads and checks the roles already granted', async () => {
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);
    await waitForLoaded();

    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-writer' })).toBeChecked();
    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-editor' })).not.toBeChecked();
    expect(getTableAccess).toHaveBeenCalledWith('events');
    expect(getRoles).toHaveBeenCalled();
  });

  test('offers every catalog role as a checkbox, not just the granted ones', async () => {
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);
    await waitForLoaded();

    expect(within(writeRolesGroup()).getAllByRole('checkbox')).toHaveLength(roles.length);
    expect(within(modifyRolesGroup()).getAllByRole('checkbox')).toHaveLength(roles.length);
  });

  test('checking a new role includes it in the saved list', async () => {
    const user = userEvent.setup();
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);
    await waitForLoaded();

    await user.click(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-viewer' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

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
    render(<TableAccessPanel name="events" onClose={onClose} />);
    await waitForLoaded();

    await user.click(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-writer' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() => expect(replaceTableAccess).toHaveBeenCalledWith('events', { write: [], modify: [] }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('keeps Save disabled and does not replace when the initial load fails', async () => {
    (getTableAccess as any).mockResolvedValue(null);
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    await waitFor(() => expect(getTableAccess).toHaveBeenCalledWith('events'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(replaceTableAccess).not.toHaveBeenCalled();
    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
  });

  test('notifies when the roles catalog fails to load, even though access loaded fine', async () => {
    (getRoles as any).mockResolvedValue(null);
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);

    await waitFor(() =>
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: AnalyticsTablesI18nKey.RolesLoadFailed }),
      ),
    );
  });

  test('shows both role lists and round-trips them on save', async () => {
    (getTableAccess as any).mockResolvedValue({ write: ['analytics-writer'], modify: ['analytics-editor'] });
    const user = userEvent.setup();
    render(<TableAccessPanel name="events" onClose={vi.fn()} />);
    await waitForLoaded();

    expect(within(writeRolesGroup()).getByRole('checkbox', { name: 'analytics-writer' })).toBeChecked();
    expect(within(modifyRolesGroup()).getByRole('checkbox', { name: 'analytics-editor' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await waitFor(() =>
      expect(replaceTableAccess).toHaveBeenCalledWith('events', {
        write: ['analytics-writer'],
        modify: ['analytics-editor'],
      }),
    );
  });
});
