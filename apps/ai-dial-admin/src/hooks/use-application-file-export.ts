import { useCallback } from 'react';

import { ApiRoute } from '@/src/constants/api-routes';
import { ExportI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getParsedError } from '@/src/utils/api/error';
import { getFileNameFromContentDisposition } from '@/src/utils/api/get-file-name';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification } from '@/src/utils/notification';

// Same streaming proxy pattern as useDatasetExport: the API route pipes the EF download body through as
// an attachment, so a failed response can arrive as JSON with Content-Disposition still set.
export const useApplicationFileExport = (view?: ApplicationRoute) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  return useCallback(
    async (entityId: string, fileName: string) => {
      const showExportError = (message?: string) =>
        showNotification(
          getErrorNotification(
            t(ExportI18nKey.ErrorTitle, { type: t(ImportI18nKey.Files) }),
            message || t(ExportI18nKey.ErrorDescription),
          ),
        );

      const apiRoute =
        view === ApplicationRoute.Datasets ? ApiRoute.DatasetsFilesDownload : ApiRoute.TestSuitesFilesDownload;

      try {
        const res = await fetch(
          `${apiRoute}?id=${encodeURIComponent(entityId)}&fileName=${encodeURIComponent(fileName)}`,
        );
        const contentType = res.headers.get('Content-Type') ?? '';

        if (!res.ok || contentType.includes('application/json')) {
          const parsedError = getParsedError(await res.text());
          showExportError(parsedError.message || parsedError.error);
          return;
        }

        const resolvedName = getFileNameFromContentDisposition(res.headers.get('Content-Disposition')) || fileName;
        downloadFile(await res.blob(), resolvedName);
      } catch {
        showExportError();
      }
    },
    [showNotification, t, view],
  );
};
