import { useCallback } from 'react';

import { ApiRoute } from '@/src/constants/api-routes';
import { DatasetsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getParsedError } from '@/src/utils/api/error';
import { getFileNameFromContentDisposition } from '@/src/utils/api/get-file-name';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification } from '@/src/utils/notification';

// The export proxy streams the backend body through as an attachment whatever the outcome, so a failed
// export arrives as a JSON error body. Detect it by content type and notify instead of saving it as a CSV.
export const useDatasetExport = () => {
  const t = useI18n();
  const { showNotification } = useNotification();

  return useCallback(
    async (datasetId: string) => {
      const showExportError = (message?: string) =>
        showNotification(
          getErrorNotification(t(DatasetsI18nKey.ExportFailed), message || t(ExportI18nKey.ErrorDescription)),
        );

      try {
        const res = await fetch(`${ApiRoute.DatasetsExport}?id=${encodeURIComponent(datasetId)}`);
        const contentType = res.headers.get('Content-Type') ?? '';

        if (!res.ok || contentType.includes('application/json')) {
          const parsedError = getParsedError(await res.text());
          showExportError(parsedError.message || parsedError.error);
          return;
        }

        const fileName =
          getFileNameFromContentDisposition(res.headers.get('Content-Disposition')) ||
          `dataset_${datasetId}_export.csv`;
        downloadFile(await res.blob(), fileName);
      } catch {
        showExportError();
      }
    },
    [showNotification, t],
  );
};
