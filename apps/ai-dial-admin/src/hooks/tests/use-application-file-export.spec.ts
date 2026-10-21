import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/utils/download', () => ({
  downloadFile: vi.fn(),
}));

import { ApiRoute } from '@/src/constants/api-routes';
import { ExportI18nKey } from '@/src/constants/i18n';
import { useApplicationFileExport } from '@/src/hooks/use-application-file-export';
import { NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile } from '@/src/utils/download';

const fetchMock = vi.fn();

const exportFile = async (view?: ApplicationRoute, entityId = 'suite-1', fileName = 'notes.pdf') => {
  const { result } = renderHook(() => useApplicationFileExport(view));
  await result.current(entityId, fileName);
};

const expectErrorNotification = (description: string) =>
  expect(showNotification).toHaveBeenCalledWith(
    expect.objectContaining({
      type: NotificationType.error,
      title: ExportI18nKey.ErrorTitle,
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

describe('useApplicationFileExport', () => {
  test('downloads a test suite file under the disposition name', async () => {
    fetchMock.mockResolvedValue(
      new Response('bytes', {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="notes.pdf"',
        },
      }),
    );

    await exportFile(ApplicationRoute.TestSuites);

    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.TestSuitesFilesDownload}?id=suite-1&fileName=notes.pdf`);
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'notes.pdf');
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('uses the datasets download route for datasets view', async () => {
    fetchMock.mockResolvedValue(new Response('bytes', { headers: { 'Content-Type': 'application/octet-stream' } }));

    await exportFile(ApplicationRoute.Datasets, 'ds/1', 'a b.txt');

    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.DatasetsFilesDownload}?id=ds%2F1&fileName=a%20b.txt`);
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'a b.txt');
  });

  test('falls back to the provided file name when no disposition is sent', async () => {
    fetchMock.mockResolvedValue(new Response('bytes', { headers: { 'Content-Type': 'application/octet-stream' } }));

    await exportFile(undefined, 'suite-1', 'fallback.bin');

    expect(fetchMock).toHaveBeenCalledWith(`${ApiRoute.TestSuitesFilesDownload}?id=suite-1&fileName=fallback.bin`);
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'fallback.bin');
  });

  test('shows the backend message instead of downloading a JSON error body', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'File not found' }), {
        headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="notes.pdf"' },
      }),
    );

    await exportFile();

    expect(downloadFile).not.toHaveBeenCalled();
    expectErrorNotification('File not found');
  });

  test('falls back to the generic description for a non-ok response without a parseable body', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 500, headers: { 'Content-Type': 'text/plain' } }));

    await exportFile();

    expect(downloadFile).not.toHaveBeenCalled();
    expectErrorNotification(ExportI18nKey.ErrorDescription);
  });

  test('notifies when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'));

    await exportFile();

    expectErrorNotification(ExportI18nKey.ErrorDescription);
  });
});
