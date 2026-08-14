import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTableAccess } from '@/src/app/[lang]/tables/actions';
import ConnectPanel from '@/src/components/Analytics/Tables/ConnectPanel/ConnectPanel';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const table: AnalyticsTable = {
  name: 'widget_metrics',
  type: AnalyticsTableType.Source,
  columns: [
    { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid },
    { source_name: 'score', name: 'score', type: AnalyticsFieldType.Decimal },
  ],
};

const renderPanel = (onClose = vi.fn()) =>
  render(<ConnectPanel table={table} apiBaseUrl="https://analytics.example.com" onClose={onClose} />);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTableAccess).mockResolvedValue({ write: ['analytics-writer'], modify: [] });
});

describe('ConnectPanel :: tabs', () => {
  test('opens on the Write data tab', async () => {
    renderPanel();

    expect(await screen.findByText(AnalyticsTablesI18nKey.ConnectWhoCanWrite)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectWhoCanRead)).not.toBeInTheDocument();
  });

  test('switching to Read data swaps which authorization statement is shown', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(await screen.findByText(AnalyticsTablesI18nKey.ConnectTabRead));

    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectWhoCanRead)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectWhoCanWrite)).not.toBeInTheDocument();
  });

  test('Flight SQL is offered under Read only — it cannot write', async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectFlight)).not.toBeInTheDocument();

    await user.click(await screen.findByText(AnalyticsTablesI18nKey.ConnectTabRead));
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectFlight)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectFlightReadOnly)).toBeInTheDocument();
  });

  test('row limits are stated per surface on the Read tab', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(await screen.findByText(AnalyticsTablesI18nKey.ConnectTabRead));

    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectRestLimits)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectFlightLimits)).toBeInTheDocument();
  });
});

describe('ConnectPanel :: roles', () => {
  test('lists the write roles the backend returned', async () => {
    renderPanel();

    expect(await screen.findByText('analytics-writer')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectAdminWrites)).toBeInTheDocument();
  });

  test('shows a loading state while the access request is in flight', () => {
    vi.mocked(getTableAccess).mockReturnValue(new Promise(() => undefined));
    renderPanel();

    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectRolesLoading)).toBeInTheDocument();
  });

  test('names the consequence when no role grants write access', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ write: [], modify: [] });
    renderPanel();

    expect(await screen.findByText(AnalyticsTablesI18nKey.ConnectNoWriteRoles)).toBeInTheDocument();
  });

  test('degrades quietly when access cannot be read, without an error notification', async () => {
    vi.mocked(getTableAccess).mockRejectedValue(new Error('403'));
    renderPanel();

    await waitFor(() => expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectRolesLoading)).not.toBeInTheDocument());
    expect(screen.queryByText('analytics-writer')).not.toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
    // The rest of the panel is unaffected — the snippets are the point of the panel, not the roles.
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectPython)).toBeInTheDocument();
  });

  test('renders no analytics-backend application-role constant on either tab', async () => {
    const user = userEvent.setup();
    const { container } = renderPanel();
    await screen.findByText('analytics-writer');
    await user.click(screen.getByText(AnalyticsTablesI18nKey.ConnectTabRead));

    expect(container.textContent).not.toContain('FULL_ADMIN');
    expect(container.textContent).not.toContain('READ_ONLY_ADMIN');
  });
});

describe('ConnectPanel :: dismissal', () => {
  test('closes from its close control', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPanel(onClose);

    await user.click(await screen.findByLabelText('Buttons.Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('closes on Escape', () => {
    const onClose = vi.fn();
    renderPanel(onClose);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('returns focus to whatever opened it', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = renderPanel();
    expect(document.activeElement).not.toBe(opener);

    unmount();
    expect(document.activeElement).toBe(opener);
  });
});

describe('ConnectPanel :: snippets', () => {
  test('generates snippets against this table', async () => {
    renderPanel();
    await screen.findByText('analytics-writer');

    const blocks = Array.from(document.querySelectorAll('pre')).map((pre) => pre.textContent ?? '');
    expect(blocks.some((block) => block.includes('/v1/tables/{TABLE}/rows'))).toBe(true);
    expect(blocks.some((block) => block.includes('widget_metrics'))).toBe(true);
  });

  test('states the write formats this table actually carries, naming its columns', async () => {
    renderPanel();

    expect(await screen.findByText(AnalyticsTablesI18nKey.ConnectFormatDecimal)).toBeInTheDocument();
    // No timestamp column declared, so no timestamp rule is shown.
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectFormatTimestamp)).not.toBeInTheDocument();
  });
});

describe('ConnectPanel :: system tables', () => {
  const systemTable: AnalyticsTable = { ...table, system: true };

  const renderSystemPanel = () =>
    render(<ConnectPanel table={systemTable} apiBaseUrl="https://analytics.example.com" onClose={vi.fn()} />);

  test('offers no write path at all, since the backend refuses row writes to a system table', () => {
    renderSystemPanel();

    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectTabWrite)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectWhoCanWrite)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.ConnectRejected)).not.toBeInTheDocument();
  });

  test('shows the read path and says why it is the only one', () => {
    renderSystemPanel();

    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectSystemReadOnly)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectWhoCanRead)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.ConnectFlight)).toBeInTheDocument();
  });

  test('does not ask the backend for a write-role list it could never act on', () => {
    renderSystemPanel();

    expect(getTableAccess).not.toHaveBeenCalled();
  });
});
