'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
}

/**
 * The three runtime states an operator acts on: a failed run, a pipeline held at its input's watermark,
 * and an output a rebuilt input left behind.
 *
 * They sit above the tab strip rather than among the read-only facts. Two reasons: among the facts they
 * read as a footnote to them, and they are true of the pipeline rather than of the tab in view — from
 * inside the facts they vanished the moment the reader opened the activity history.
 *
 * `role="status"` is set on all three, including the two the component would otherwise announce
 * assertively: nothing here interrupts the reader, because the page renders them as it loads rather than
 * raising them while it is read.
 */
const PipelineRuntimeAlerts: FC<Props> = ({ pipeline }) => {
  const t = useI18n();

  const state = pipeline.state;
  const clamp = state?.clamp;
  const rebuild = state?.rebuild_required;

  if (!state?.last_error && !clamp && !rebuild) return null;

  return (
    <div className="flex flex-col gap-2">
      {state?.last_error && (
        <Notification
          variant={NotificationVariant.Error}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.LastErrorTitle)}
          message={state.last_error}
        />
      )}

      {clamp && (
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.ClampedByTitle)}
          message={t(AnalyticsPipelinesI18nKey.ClampedBy, { enrichment: clamp.enrichment })}
        />
      )}

      {rebuild && (
        <Notification
          variant={NotificationVariant.Warning}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.RebuildRequiredTitle)}
          message={t(AnalyticsPipelinesI18nKey.RebuildRequired, { enrichment: rebuild.enrichment })}
        />
      )}
    </div>
  );
};

export default PipelineRuntimeAlerts;
