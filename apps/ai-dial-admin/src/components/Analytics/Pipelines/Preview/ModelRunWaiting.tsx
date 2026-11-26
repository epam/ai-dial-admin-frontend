'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import PreviewBannerBody from '@/src/components/Analytics/Pipelines/Preview/PreviewBannerBody';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, TriggerKind } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
}

const ModelRunWaiting: FC<Props> = ({ pipeline }) => {
  const t = useI18n();

  const titleKey =
    pipeline.trigger?.kind === TriggerKind.Group
      ? PipelinePreviewI18nKey.WaitingGroupTitle
      : PipelinePreviewI18nKey.WaitingRowTitle;

  return (
    <Notification
      variant={NotificationVariant.Loading}
      type={NotificationType.SectionMessage}
      role="status"
      message={
        <PreviewBannerBody title={t(titleKey, { model: pipeline.transform?.model ?? '' })}>
          <span className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.WaitingHint)}</span>
        </PreviewBannerBody>
      }
    />
  );
};

export default ModelRunWaiting;
