'use client';
import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { previewAnalyticsImportConfig } from '@/src/app/[lang]/import-config/actions';
import AnalyticsImportGrid from '@/src/components/ImportConfig/ConfigurationPreview/AnalyticsImportGrid';
import AnalyticsImportNotices from '@/src/components/ImportConfig/ConfigurationPreview/AnalyticsImportNotices';
import {
  getAnalyticsImportRows,
  isAnalyticsImportBlocked,
} from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { CatalogImportPreview, CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { isUnreachableResponse } from '@/src/utils/api/is-unreachable-response';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  importBody: FormData;
  policy: CatalogResolutionPolicy;
  result?: CatalogImportResult;
  isReusedNamesAcknowledged: boolean;
  onChangeReusedNamesAcknowledged: (isAcknowledged: boolean) => void;
  onBlockedChange: (isBlocked: boolean) => void;
}

const AnalyticsImportPreview: FC<Props> = ({
  importBody,
  policy,
  result,
  isReusedNamesAcknowledged,
  onChangeReusedNamesAcknowledged,
  onBlockedChange,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const getReqRef = useRef(useProtectedRequest());
  const tRef = useRef(t);

  const [preview, setPreview] = useState<CatalogImportPreview>();
  const [isLoading, setIsLoading] = useState(true);

  // The confirmation is sent on the import only: the preview reports re-used names either way.
  useEffect(() => {
    const loadPreview = async () => {
      setIsLoading(true);
      setPreview(undefined);
      const res = await getReqRef.current(previewAnalyticsImportConfig, importBody, policy, false);
      setIsLoading(false);

      if (res.success && res.response) {
        setPreview(res.response as CatalogImportPreview);
      } else {
        const message = isUnreachableResponse(res)
          ? tRef.current(ImportI18nKey.AnalyticsPreviewFailed)
          : res.errorMessage;
        showNotificationRef.current(getErrorNotification(res.errorHeader, message, res.requestId));
      }
    };

    void loadPreview();
  }, [importBody, policy]);

  useEffect(() => {
    onBlockedChange(!!result || isAnalyticsImportBlocked(preview, isReusedNamesAcknowledged));
  }, [preview, result, isReusedNamesAcknowledged, onBlockedChange]);

  const source = result ?? preview;
  const rows = useMemo(() => (source ? getAnalyticsImportRows(source, t) : undefined), [source, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col size-full justify-center items-center">
        <DialLoader size={45} className="h-auto" />
        <p className="mt-3 text-primary small">{t(ImportI18nKey.ConfigurationParsing)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <AnalyticsImportNotices
        preview={preview}
        result={result}
        isReusedNamesAcknowledged={isReusedNamesAcknowledged}
        onChangeReusedNamesAcknowledged={onChangeReusedNamesAcknowledged}
      />
      {rows && <AnalyticsImportGrid rows={rows} hasResult={!!result} />}
    </div>
  );
};

export default AnalyticsImportPreview;
