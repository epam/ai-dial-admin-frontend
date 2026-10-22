'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  ButtonVariant,
  Spinner,
  ElementSize,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconEye } from '@tabler/icons-react';
import classNames from 'classnames';

import PreviewEmptyState from '@/src/components/Analytics/Pipelines/Preview/PreviewEmptyState';
import PreviewError from '@/src/components/Analytics/Pipelines/Preview/PreviewError';
import PreviewGrid from '@/src/components/Analytics/Pipelines/Preview/PreviewGrid';
import PreviewNotes from '@/src/components/Analytics/Pipelines/Preview/PreviewNotes';
import PreviewOutputs from '@/src/components/Analytics/Pipelines/Preview/PreviewOutputs';
import PreviewRunBar from '@/src/components/Analytics/Pipelines/Preview/PreviewRunBar';
import PreviewStatement from '@/src/components/Analytics/Pipelines/Preview/PreviewStatement';
import { PreviewFailureKind, PreviewSection } from '@/src/components/Analytics/Pipelines/Preview/models';
import { PipelinePreviewRun } from '@/src/components/Analytics/Pipelines/Preview/use-pipeline-preview';
import { getCountChips } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import {
  getEmptyKind,
  getFailureKind,
  getFirstVisitKey,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, TransformType } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  preview: PipelinePreviewRun;
  /** Whether the detail view holds an edit the saved declaration — the one the preview runs on — does not. */
  hasUnsavedEdits: boolean;
  onOpenSection: (section: PreviewSection) => void;
}

const PipelinePreview: FC<Props> = ({ pipeline, preview, hasUnsavedEdits, onOpenSection }) => {
  const t = useI18n();

  const { result, failure, isRunning, sampledGeneration, previousGroupKey } = preview;
  const onRun = useCallback(() => void preview.run(), [preview]);

  const failureKind = failure ? getFailureKind(failure) : undefined;
  const isStale = result != null && sampledGeneration != null && sampledGeneration !== pipeline.generation;
  // What is held may no longer describe the pipeline, or sits under a failure about a later run: it stays on
  // screen for comparison, but is withdrawn from the tab order and the reading order so it is not taken as current.
  const isDimmed = result != null && (failure != null || isStale || (hasUnsavedEdits && !isRunning));

  // Said when a run returns, through a region of its own: the run control's label already says "Running".
  const [announcement, setAnnouncement] = useState('');
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning && !failure && result) {
      setAnnouncement(
        t(result.rows.length ? PipelinePreviewI18nKey.RunFinished : PipelinePreviewI18nKey.RunFinishedNoRows, {
          count: result.rows.length,
        }),
      );
    }
    wasRunning.current = isRunning;
  }, [isRunning, failure, result, t]);

  const liveRegion = (
    <span role="status" aria-live="polite" className="sr-only">
      {announcement}
    </span>
  );

  // Nothing here can be fixed from this page, so the tab explains instead of offering a run.
  if (failure && failureKind === PreviewFailureKind.NoAccess) {
    return (
      <PreviewError
        failure={failure}
        kind={failureKind}
        pipeline={pipeline}
        hasEarlierResult={false}
        onRun={onRun}
        onOpenSection={onOpenSection}
      />
    );
  }

  const emptyKind = result ? getEmptyKind(result, pipeline) : undefined;
  const isLlm = pipeline.transform?.type === TransformType.Llm;

  const unsavedBanner = hasUnsavedEdits && (
    <Notification
      variant={NotificationVariant.Warning}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(PipelinePreviewI18nKey.UnsavedTitle)}
      message={t(PipelinePreviewI18nKey.UnsavedBody)}
    />
  );

  const staleBanner = isStale && !hasUnsavedEdits && (
    <Notification
      variant={NotificationVariant.Info}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(PipelinePreviewI18nKey.StaleTitle)}
      message={t(PipelinePreviewI18nKey.StaleBody, { sampled: sampledGeneration, current: pipeline.generation })}
      action={
        <Button
          variant={ButtonVariant.Primary}
          size={ElementSize.Small}
          label={t(PipelinePreviewI18nKey.RunAgain)}
          disabled={isRunning}
          onClick={onRun}
        />
      }
    />
  );

  const runBar = (
    <PreviewRunBar
      chips={result ? getCountChips(result) : undefined}
      captionKey={
        result
          ? result.group_key != null
            ? PipelinePreviewI18nKey.CaptionMembers
            : PipelinePreviewI18nKey.CaptionNewest
          : undefined
      }
      groupKey={result?.group_key}
      previousGroupKey={previousGroupKey}
      isRunning={isRunning}
      hasResult={result != null}
      hasUnsavedEdits={hasUnsavedEdits}
      onRun={onRun}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      {liveRegion}
      {unsavedBanner}
      {staleBanner}
      {runBar}

      {failure && failureKind && (
        <PreviewError
          failure={failure}
          kind={failureKind}
          pipeline={pipeline}
          hasEarlierResult={result != null}
          onRun={onRun}
          onOpenSection={onOpenSection}
        />
      )}

      {result == null && !failure && !isRunning && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <IconEye size={24} className="text-secondary" aria-hidden />
          <h3 className="dial-h3">{t(PipelinePreviewI18nKey.FirstVisitTitle)}</h3>
          <p className="max-w-[440px] text-secondary dial-small-text">{t(getFirstVisitKey(pipeline))}</p>
        </div>
      )}

      {result == null && isRunning && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center" aria-busy="true">
          <Spinner size={40} fullWidth />
          <h3 className="dial-h3">{t(PipelinePreviewI18nKey.ReadingTitle)}</h3>
          <p className="max-w-[440px] text-secondary dial-small-text">{t(PipelinePreviewI18nKey.ReadingHint)}</p>
        </div>
      )}

      {result && (
        <div
          inert={isDimmed}
          aria-busy={isRunning}
          className={classNames('flex flex-col gap-4', isDimmed && 'opacity-60')}
        >
          <PreviewNotes notes={result.notes} isCurrent={!isDimmed} isEnabled={pipeline.enabled} kind={pipeline.kind} />
          <PreviewGrid columns={result.columns} rows={result.rows} />
          {emptyKind && (
            <PreviewEmptyState kind={emptyKind} preview={result} pipeline={pipeline} onOpenSection={onOpenSection} />
          )}
          {result.statement != null && <PreviewStatement statement={result.statement} />}
          {result.statement == null && isLlm && <PreviewOutputs pipeline={pipeline} notes={result.notes} />}
        </div>
      )}
    </div>
  );
};

export default PipelinePreview;
