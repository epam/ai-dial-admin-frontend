import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TabbedSelectionContent from '@/src/components/ExportConfig/Content/TabbedSelectionContent';
import { ExportI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

const TABS = [
  { id: 'first', label: 'First' },
  { id: 'second', label: 'Second' },
];

describe('TabbedSelectionContent', () => {
  const loadCandidates = vi.fn<(tab: string) => Promise<ServerActionResponse<EntitiesGridData[]>>>();

  const renderContent = (props: { isFull?: boolean; customExportData?: Record<string, EntitiesGridData[]> } = {}) =>
    render(
      <TabbedSelectionContent
        tabs={TABS}
        customExportData={props.customExportData ?? {}}
        setCustomExportData={vi.fn()}
        loadCandidates={loadCandidates}
        getColDefs={() => []}
        getAddButtonTitle={(tab) => `add-${tab}`}
        getEmptyTitle={() => 'empty'}
        isFull={props.isFull}
      />,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    loadCandidates.mockResolvedValue({ success: true, response: [{ name: 'a' }, { name: 'b' }] });
  });

  test('counts the selection and offers Add in a custom export', async () => {
    renderContent({ customExportData: { first: [{ name: 'a' }] } });

    expect(await screen.findByText('First: 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'add-first' })).toBeInTheDocument();
  });

  test('counts every candidate and hides Add in a full export', async () => {
    renderContent({ isFull: true, customExportData: { first: [{ name: 'a' }] } });

    expect(await screen.findByText('First: 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'add-first' })).toBeNull();
  });

  test('stops loading and reports when the read is rejected', async () => {
    loadCandidates.mockRejectedValue(new Error('fetch failed'));
    renderContent();

    await waitFor(() => expect(getErrorNotification).toHaveBeenCalledWith(ExportI18nKey.CandidatesReadFailed));
    expect(screen.getByRole('button', { name: 'add-first' })).toBeInTheDocument();
  });

  test('keeps the loader of a tab still loading when an earlier tab finishes', async () => {
    let resolveFirst: (value: ServerActionResponse<EntitiesGridData[]>) => void = () => undefined;
    loadCandidates.mockImplementation((tab) =>
      tab === 'first'
        ? new Promise((resolve) => {
            resolveFirst = resolve;
          })
        : new Promise(() => undefined),
    );
    const user = userEvent.setup();
    renderContent({ isFull: true });

    await user.click(screen.getByText('Second'));
    resolveFirst({ success: true, response: [{ name: 'a' }] });

    await waitFor(() => expect(loadCandidates).toHaveBeenCalledWith('second'));
    expect(screen.getByText('Second: 0')).toBeInTheDocument();
    expect(screen.queryByText('empty')).toBeNull();
  });
});
