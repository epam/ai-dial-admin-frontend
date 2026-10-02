'use client';

import { FC } from 'react';

import { ConfirmationPopup, ConfirmationPopupVariant } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  count: number;
  /** Present when the re-run is scoped to one backfill run, absent when it is the whole pipeline. */
  runId?: string;
  /** The grid's own filters, already worded, named so the mismatch with the selection is stated. */
  activeFilters: string[];
  isPaused: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * The confirmation for both bulk re-runs.
 *
 * A dialog rather than something inline because the sentence that matters does not fit beside two
 * buttons: the service selects by pipeline and run and by nothing else, so the re-run reaches items on
 * pages the grid never loaded and items its filters are hiding. Stating the count alone is what would
 * mislead — the count is the one number that looks like it describes the rows on screen.
 *
 * Informational rather than danger: re-running is additive. Nothing is destroyed, and an item that
 * succeeds this time leaves the queue the way it was always meant to.
 */
const RequeueFailuresPopup: FC<Props> = ({ count, runId, activeFilters, isPaused, onConfirm, onClose }) => {
  const t = useI18n();

  const title = runId
    ? t(AnalyticsPipelinesI18nKey.FailuresRetryRunTitle, { count })
    : t(AnalyticsPipelinesI18nKey.FailuresRetryAllTitle, { count });

  const body = runId
    ? t(AnalyticsPipelinesI18nKey.FailuresRetryRunBody)
    : t(AnalyticsPipelinesI18nKey.FailuresRetryAllBody);

  return (
    <ConfirmationPopup
      open
      variant={ConfirmationPopupVariant.Info}
      header={title}
      description={
        <div className="flex flex-col gap-y-2">
          <span>{body}</span>
          {activeFilters.length > 0 && (
            <span className="text-secondary">
              {t(AnalyticsPipelinesI18nKey.FailuresRetryIgnoresFilters, { filters: activeFilters.join(', ') })}
            </span>
          )}
          {isPaused && <span className="text-secondary">{t(AnalyticsPipelinesI18nKey.FailuresRetryWhilePaused)}</span>}
        </div>
      }
      confirmLabel={t(AnalyticsPipelinesI18nKey.FailuresRetry)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onClose}
      onCancel={onClose}
    />
  );
};

export default RequeueFailuresPopup;
