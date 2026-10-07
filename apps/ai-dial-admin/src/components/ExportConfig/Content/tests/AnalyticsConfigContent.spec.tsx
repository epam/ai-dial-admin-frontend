import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getAnalyticsEntities } from '@/src/app/[lang]/export-config/actions';
import AnalyticsConfigContent from '@/src/components/ExportConfig/Content/AnalyticsConfigContent';
import { ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/app/[lang]/export-config/actions', () => ({
  getAnalyticsEntities: vi.fn(),
}));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

describe('AnalyticsConfigContent', () => {
  const renderContent = (customExportData = {}, isFull = false) =>
    render(
      <AnalyticsConfigContent customExportData={customExportData} setCustomExportData={vi.fn()} isFull={isFull} />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAnalyticsEntities).mockResolvedValue({ success: true, response: [] });
  });

  test('reads table candidates first and pipeline candidates when that tab opens', async () => {
    const user = userEvent.setup();
    renderContent();

    await waitFor(() => expect(getAnalyticsEntities).toHaveBeenCalledWith(AnalyticsExportEntityType.TABLE));
    await user.click(screen.getByText(MenuI18nKey.Pipelines));

    await waitFor(() => expect(getAnalyticsEntities).toHaveBeenCalledWith(AnalyticsExportEntityType.PIPELINE));
  });

  test('shows the selected count and the Add button for the open tab', async () => {
    renderContent({ [AnalyticsExportEntityType.TABLE]: [{ name: 'usage_sentiment' }] });

    expect(await screen.findByText(`${MenuI18nKey.Tables}: 1`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${ButtonsI18nKey.Add} ${MenuI18nKey.Tables}` })).toBeInTheDocument();
  });

  test('reports a failed candidate read in the service words', async () => {
    vi.mocked(getAnalyticsEntities).mockResolvedValue({
      success: false,
      errorHeader: 'Forbidden',
      errorMessage: 'No access to the registry',
      requestId: 'r-1',
    });

    renderContent();

    await waitFor(() =>
      expect(getErrorNotification).toHaveBeenCalledWith('Forbidden', 'No access to the registry', 'r-1'),
    );
  });

  test('reads a tab again after a failed read once the tab is reopened', async () => {
    vi.mocked(getAnalyticsEntities).mockResolvedValueOnce({ success: false, errorMessage: 'down' });
    const user = userEvent.setup();
    renderContent();

    await waitFor(() => expect(getErrorNotification).toHaveBeenCalledOnce());
    await user.click(screen.getByText(MenuI18nKey.Pipelines));
    await user.click(screen.getByText(MenuI18nKey.Tables));

    await waitFor(() =>
      expect(
        vi.mocked(getAnalyticsEntities).mock.calls.filter(([tab]) => tab === AnalyticsExportEntityType.TABLE),
      ).toHaveLength(2),
    );
  });

  test('stops loading and reports when the service is unreachable', async () => {
    vi.mocked(getAnalyticsEntities).mockRejectedValue(new Error('fetch failed'));
    renderContent();

    await waitFor(() => expect(getErrorNotification).toHaveBeenCalledWith(ExportI18nKey.CandidatesReadFailed));
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('lists every candidate with no Add button in Full mode', async () => {
    vi.mocked(getAnalyticsEntities).mockResolvedValue({
      success: true,
      response: [{ name: 'usage_sentiment' }, { name: 'json_source' }],
    });
    renderContent({}, true);

    expect(await screen.findByText(`${MenuI18nKey.Tables}: 2`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `${ButtonsI18nKey.Add} ${MenuI18nKey.Tables}` })).toBeNull();
  });
});
