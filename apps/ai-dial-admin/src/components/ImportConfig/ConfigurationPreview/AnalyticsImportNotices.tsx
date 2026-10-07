'use client';
import { DialCheckbox, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { getReusedNames, hasFailRow } from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CatalogImportPreview, CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { CatalogImportOutcome } from '@/src/types/analytics/import';

interface Props {
  preview?: CatalogImportPreview;
  result?: CatalogImportResult;
  isReusedNamesAcknowledged: boolean;
  onChangeReusedNamesAcknowledged: (isAcknowledged: boolean) => void;
}

const AnalyticsImportNotices: FC<Props> = ({
  preview,
  result,
  isReusedNamesAcknowledged,
  onChangeReusedNamesAcknowledged,
}) => {
  const t = useI18n();

  if (result) {
    switch (result.outcome) {
      case CatalogImportOutcome.COMPLETED:
        return (
          <DialNotification
            variant={NotificationVariant.Success}
            title={t(ImportI18nKey.AnalyticsResultCompleted)}
            message={t(ImportI18nKey.AnalyticsResultCompletedReminder)}
          />
        );
      case CatalogImportOutcome.ROLLED_BACK:
        return (
          <DialNotification variant={NotificationVariant.Error} message={t(ImportI18nKey.AnalyticsResultRolledBack)} />
        );
      default:
        return (
          <DialNotification
            variant={NotificationVariant.Error}
            message={t(ImportI18nKey.AnalyticsResultRollbackFailed)}
          />
        );
    }
  }

  if (!preview) {
    return null;
  }

  const reusedNames = getReusedNames(preview);

  return (
    <>
      {!!preview.validation_errors?.length && (
        <DialNotification
          variant={NotificationVariant.Error}
          title={t(ImportI18nKey.AnalyticsValidationErrorsHeading)}
          message={
            <ul className="list-disc pl-4">
              {preview.validation_errors.map((error, index) => (
                // The service may report the same message twice, so the text alone is not a unique key.
                <li key={`${index}:${error}`}>{error}</li>
              ))}
            </ul>
          }
        />
      )}
      {hasFailRow(preview) && (
        <DialNotification variant={NotificationVariant.Warning} message={t(ImportI18nKey.AnalyticsSkipHint)} />
      )}
      {!!preview.env_specific?.length && (
        <DialNotification
          variant={NotificationVariant.Info}
          title={t(ImportI18nKey.AnalyticsEnvSpecificHeading)}
          message={
            <ul className="list-disc pl-4">
              {preview.env_specific.map(({ type, name, field, value }) => (
                <li key={`${type}:${name}:${field}`}>{`${type} ${name} · ${field}: ${value}`}</li>
              ))}
            </ul>
          }
        />
      )}
      {!!reusedNames.length && (
        <DialCheckbox
          id="acknowledgeReusedNames"
          checked={isReusedNamesAcknowledged}
          label={t(ImportI18nKey.AnalyticsReusedNamesConfirm, { names: reusedNames.join(', ') })}
          onChange={() => onChangeReusedNamesAcknowledged(!isReusedNamesAcknowledged)}
        />
      )}
    </>
  );
};

export default AnalyticsImportNotices;
