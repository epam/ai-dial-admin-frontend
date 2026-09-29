import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global NotificationContext mock, whose showNotification is a fresh spy per call and so
// cannot be asserted against.
const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/utils/download', () => ({
  downloadFile: vi.fn(),
}));

import { ApiRoute } from '@/src/constants/api-routes';
import { DatasetsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useDatasetExport } from '@/src/hooks/use-dataset-export';
import { NotificationType } from '@/src/models/notification';
import { downloadFile } from '@/src/utils/download';

const fetchMock = vi.fn();

const exportDataset = async (id = 'ds/1') => {
  const { result } = renderHook(() => useDatasetExport());
  await result.current(id);
};

const expectErrorNotification = (description: string) =>
  expect(showNotification).toHaveBeenCalledWith(
    expect.objectContaining({
      type: NotificationType.error,
      title: DatasetsI18nKey.ExportFailed,
      description,
    }),
  );

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useDatasetExport', () => {
  test('downloads the CSV under the name the backend sent', async () => {
    fetchMock.mockResolvedValue(
      new Response('a,b\n1,2', {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="cases.csv"' },
      }),
    );

    await exportDataset();

    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.DatasetsExport}?id=ds%2F1`);
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'cases.csv');
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('falls back to a dataset-derived name when no disposition is sent', async () => {
    fetchMock.mockResolvedValue(new Response('a,b', { headers: { 'Content-Type': 'text/csv' } }));

    await exportDataset('ds-2');

    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'dataset_ds-2_export.csv');
  });

  test('shows the backend message instead of downloading a JSON error body', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Dataset is empty' }), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="cases.csv"' },
      }),
    );

    await exportDataset();

    expect(downloadFile).not.toHaveBeenCalled();
    expectErrorNotification('Dataset is empty');
  });

  test('uses the `error` field when the body has no message', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Forbidden' }), { headers: { 'Content-Type': 'application/json' } }),
    );

    await exportDataset();

    expectErrorNotification('Forbidden');
  });

  test('falls back to the generic description for a non-ok response without a parseable body', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500, headers: { 'Content-Type': 'text/plain' } }));

    await exportDataset();

    expect(downloadFile).not.toHaveBeenCalled();
    expectErrorNotification(ExportI18nKey.ErrorDescription);
  });

  test('notifies when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await exportDataset();

    expectErrorNotification(ExportI18nKey.ErrorDescription);
  });
});
