'use client';

import { FC } from 'react';

import { ConfirmationPopupVariant, DialConfirmationPopup, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind } from '@/src/models/analytics/pipeline';

interface Props {
  name: string;
  kind: PipelineKind;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The listing and the detail page both delete a pipeline, and the spec holds them to identical
 * confirmation content — the enrichment warning included, which is the part that would drift if each
 * surface wrote its own.
 */
const DeletePipelinePopup: FC<Props> = ({ name, kind, onConfirm, onClose }) => {
  const t = useI18n();

  return (
    <DialConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Danger}
      header={t(AnalyticsPipelinesI18nKey.DeleteConfirmTitle)}
      description={
        <div className="flex flex-col gap-y-2">
          <span>
            {t(
              kind === PipelineKind.Enrich
                ? AnalyticsPipelinesI18nKey.DeleteConfirmDescriptionEnrich
                : AnalyticsPipelinesI18nKey.DeleteConfirmDescription,
            )}
          </span>
          <div className="flex flex-row items-center gap-x-1 text-primary dial-small">
            <span className="shrink-0 text-secondary">{t(AnalyticsPipelinesI18nKey.Name)}:</span>
            <DialEllipsisTooltip text={name} />
          </div>
        </div>
      }
      confirmLabel={t(AnalyticsPipelinesI18nKey.DeletePipeline)}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default DeletePipelinePopup;
