'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import PreviewBannerBody from '@/src/components/Analytics/Pipelines/Preview/PreviewBannerBody';
import PreviewServerMessage from '@/src/components/Analytics/Pipelines/Preview/PreviewServerMessage';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { ModelRunEvaluation, ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';

interface Props {
  evaluation: ModelRunEvaluation;
  isGroup: boolean;
}

const ModelRunOutcome: FC<Props> = ({ evaluation, isGroup }) => {
  const t = useI18n();

  if (evaluation.status === ModelRunStatus.Ok) {
    return (
      <Notification
        variant={NotificationVariant.Success}
        type={NotificationType.SectionMessage}
        role="status"
        message={
          <PreviewBannerBody
            title={t(isGroup ? PipelinePreviewI18nKey.OutcomeOkGroupTitle : PipelinePreviewI18nKey.OutcomeOkTitle)}
          >
            <span className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.OutcomeOkBody)}</span>
          </PreviewBannerBody>
        }
      />
    );
  }

  const { stage, dial_status, attempts, message } = evaluation;
  const isValidate = stage === DlqStage.Validate;
  const isDialRefusal = stage === DlqStage.DialCall && dial_status != null;

  let title = t(PipelinePreviewI18nKey.OutcomeStageTitle, {
    stage: stage ?? t(PipelinePreviewI18nKey.UnknownStage),
  });
  let hint: string | undefined;
  if (isValidate) {
    title = t(PipelinePreviewI18nKey.OutcomeValidateTitle);
    hint = t(PipelinePreviewI18nKey.OutcomeValidateBody, { attempts });
  } else if (isDialRefusal) {
    title = t(PipelinePreviewI18nKey.OutcomeDialTitle, { status: dial_status });
    hint = t(PipelinePreviewI18nKey.OutcomeDialBody);
  }

  return (
    <Notification
      variant={NotificationVariant.Error}
      type={NotificationType.SectionMessage}
      role="alert"
      message={
        <PreviewBannerBody title={title}>
          {hint && <span className="text-secondary dial-tiny-text">{hint}</span>}
          <PreviewServerMessage message={message} />
        </PreviewBannerBody>
      }
    />
  );
};

export default ModelRunOutcome;
