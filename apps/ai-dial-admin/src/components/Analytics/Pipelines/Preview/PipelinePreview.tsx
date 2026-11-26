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

import ModelResultPanel from '@/src/components/Analytics/Pipelines/Preview/ModelResultPanel';
import ModelRunConfirmPopup from '@/src/components/Analytics/Pipelines/Preview/ModelRunConfirmPopup';
import ModelRunOutcome from '@/src/components/Analytics/Pipelines/Preview/ModelRunOutcome';
import ModelRunWaiting from '@/src/components/Analytics/Pipelines/Preview/ModelRunWaiting';
import PreviewEmptyState from '@/src/components/Analytics/Pipelines/Preview/PreviewEmptyState';
import PreviewError from '@/src/components/Analytics/Pipelines/Preview/PreviewError';
import PreviewGrid from '@/src/components/Analytics/Pipelines/Preview/PreviewGrid';
import PreviewNotes from '@/src/components/Analytics/Pipelines/Preview/PreviewNotes';
import PreviewOutputs from '@/src/components/Analytics/Pipelines/Preview/PreviewOutputs';
import PreviewRunBar from '@/src/components/Analytics/Pipelines/Preview/PreviewRunBar';
import PreviewStatement from '@/src/components/Analytics/Pipelines/Preview/PreviewStatement';
import {
  PreviewFailureKind,
  PreviewGridModelRun,
  PreviewRunKind,
  PreviewSection,
} from '@/src/components/Analytics/Pipelines/Preview/models';
import { PipelinePreviewRun } from '@/src/components/Analytics/Pipelines/Preview/use-pipeline-preview';
import { findEvaluatedRowIndex, getPanelSubject } from '@/src/components/Analytics/Pipelines/Preview/utils/model-run';
import { getCountChips } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import {
  getEmptyKind,
  getFailureKind,
  getFirstVisitKey,
} from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { ModelRunStatus } from '@/src/models/analytics/pipeline-model-run';

interface Props {
  pipeline: Pipeline;
  preview: PipelinePreviewRun;
  /** Whether the detail view holds an edit the saved declaration — the one the preview runs on — does not. */
  hasUnsavedEdits: boolean;
  isRunnerAvailable: boolean;
  onOpenSection: (section: PreviewSection) => void;
  onOpenRuntime: () => void;
}

const PipelinePreview: FC<Props> = ({
  pipeline,
  preview,
  hasUnsavedEdits,
  isRunnerAvailable,
  onOpenSection,
  onOpenRuntime,
}) => {
  const t = useI18n();

  const { result, evaluations, failure, isRunning, runningKind, sampledGeneration, previousGroupKey } = preview;
  const onRun = useCallback(() => void preview.run(), [preview]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const onAskModelRun = useCallback(() => setIsConfirmOpen(true), []);
  const onCloseConfirm = useCallback(() => setIsConfirmOpen(false), []);
  const onConfirmModelRun = useCallback(() => {
    setIsConfirmOpen(false);
    setIsPanelExpanded(true);
    void preview.runWithModel();
  }, [preview]);
  const onTogglePanel = useCallback(() => setIsPanelExpanded((prev) => !prev), []);

  const isModelRunOffered = isRunnerAvailable && pipeline.transform?.type === TransformType.Llm;
  const isGroup = pipeline.trigger?.kind === TriggerKind.Group;
  const evaluation = evaluations?.[0];
  const hasModelResult = evaluation != null;

  const failureKind = failure ? getFailureKind(failure) : undefined;
  const isStale = result != null && sampledGeneration != null && sampledGeneration !== pipeline.generation;
  // What is held may no longer describe the pipeline, or sits under a failure about a later run: it stays on
  // screen for comparison, but is withdrawn from the tab order and the reading order so it is not taken as current.
  const isModelRunning = runningKind === PreviewRunKind.Model;
  const isDimmed = result != null && (failure != null || isStale || (hasUnsavedEdits && !isRunning) || isModelRunning);

  // Said when a run returns, through a region of its own: the run control's label already says "Running".
  const [announcement, setAnnouncement] = useState('');
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning && !failure && result) {
      if (evaluation) {
        setAnnouncement(
          evaluation.status === ModelRunStatus.Ok
            ? t(PipelinePreviewI18nKey.ModelRunFinishedOk)
            : t(PipelinePreviewI18nKey.ModelRunFinishedFailed, {
                stage: evaluation.stage ?? t(PipelinePreviewI18nKey.UnknownStage),
              }),
        );
      } else {
        setAnnouncement(
          t(result.rows.length ? PipelinePreviewI18nKey.RunFinished : PipelinePreviewI18nKey.RunFinishedNoRows, {
            count: result.rows.length,
          }),
        );
      }
    }
    wasRunning.current = isRunning;
  }, [isRunning, failure, result, evaluation, t]);

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
        onRunWithModel={onAskModelRun}
        onOpenSection={onOpenSection}
        onOpenRuntime={onOpenRuntime}
      />
    );
  }

  const emptyKind = result ? getEmptyKind(result, pipeline) : undefined;
  const isLlm = pipeline.transform?.type === TransformType.Llm;

  const evaluatedIndex = result && evaluation ? findEvaluatedRowIndex(result.rows, result.columns, evaluation) : -1;
  const gridModelRun: PreviewGridModelRun | undefined =
    evaluation && !isGroup && evaluatedIndex !== -1
      ? { evaluation, evaluatedIndex, isPanelExpanded, onTogglePanel }
      : undefined;
  const panelSubject = getPanelSubject(evaluation, isGroup, result?.group_key);

  const unsavedBanner = hasUnsavedEdits && (
    <Notification
      variant={NotificationVariant.Warning}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(isModelRunOffered ? PipelinePreviewI18nKey.UnsavedTitleWithModel : PipelinePreviewI18nKey.UnsavedTitle)}
      message={t(isModelRunOffered ? PipelinePreviewI18nKey.UnsavedBodyWithModel : PipelinePreviewI18nKey.UnsavedBody)}
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
          label={t(hasModelResult ? PipelinePreviewI18nKey.RunAgainWithModel : PipelinePreviewI18nKey.RunAgain)}
          disabled={isRunning}
          onClick={hasModelResult ? onAskModelRun : onRun}
        />
      }
    />
  );

  const chips = result ? getCountChips(result) : undefined;
  const modelChip = hasModelResult && {
    count: 1,
    labelKey: isGroup ? PipelinePreviewI18nKey.ChipLabelGroupTried : PipelinePreviewI18nKey.ChipLabelRowTried,
  };

  const groupCaptionKey = isGroup ? PipelinePreviewI18nKey.CaptionModelGroup : PipelinePreviewI18nKey.CaptionModelRow;
  const firstVisitModelHintKey = isGroup
    ? PipelinePreviewI18nKey.FirstVisitModelHintGroup
    : PipelinePreviewI18nKey.FirstVisitModelHintRow;
  const modelCaptionKey = hasModelResult ? groupCaptionKey : undefined;

  const runBar = (
    <PreviewRunBar
      chips={chips && modelChip ? [...chips, modelChip] : chips}
      captionKey={
        result
          ? result.group_key != null
            ? PipelinePreviewI18nKey.CaptionMembers
            : PipelinePreviewI18nKey.CaptionNewest
          : undefined
      }
      modelCaptionKey={modelCaptionKey}
      groupKey={result?.group_key}
      previousGroupKey={previousGroupKey}
      runningKind={runningKind}
      hasResult={result != null}
      hasModelResult={hasModelResult}
      hasUnsavedEdits={hasUnsavedEdits}
      isModelRunOffered={isModelRunOffered}
      isModelRunUnsupported={!!preview.isModelRunUnsupported}
      onRun={onRun}
      onRunWithModel={onAskModelRun}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      {liveRegion}
      {unsavedBanner}
      {staleBanner}
      {runBar}

      {isModelRunning && <ModelRunWaiting pipeline={pipeline} />}

      {failure && failureKind && (
        <PreviewError
          failure={failure}
          kind={failureKind}
          pipeline={pipeline}
          hasEarlierResult={result != null}
          onRun={onRun}
          onRunWithModel={onAskModelRun}
          onOpenSection={onOpenSection}
          onOpenRuntime={onOpenRuntime}
        />
      )}

      {result == null && !failure && !isRunning && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
          <IconEye size={24} className="text-secondary" aria-hidden />
          <h3 className="dial-h3">{t(PipelinePreviewI18nKey.FirstVisitTitle)}</h3>
          <p className="max-w-[440px] text-secondary dial-small-text">{t(getFirstVisitKey(pipeline))}</p>
          {isModelRunOffered && (
            <p className="max-w-[440px] text-secondary dial-small-text">{t(firstVisitModelHintKey)}</p>
          )}
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
          {evaluation ? (
            <ModelRunOutcome evaluation={evaluation} isGroup={isGroup} />
          ) : (
            <PreviewNotes
              notes={result.notes}
              isCurrent={!isDimmed}
              isEnabled={pipeline.enabled}
              kind={pipeline.kind}
            />
          )}
          <PreviewGrid columns={result.columns} rows={result.rows} modelRun={gridModelRun} />
          {emptyKind && (
            <PreviewEmptyState kind={emptyKind} preview={result} pipeline={pipeline} onOpenSection={onOpenSection} />
          )}
          {result.statement != null && <PreviewStatement statement={result.statement} />}
          {result.statement == null && isLlm && !evaluation && (
            <PreviewOutputs pipeline={pipeline} notes={result.notes} />
          )}
          {evaluation && (isGroup || isPanelExpanded) && (
            <ModelResultPanel
              pipeline={pipeline}
              evaluation={evaluation}
              subject={panelSubject}
              generation={sampledGeneration}
            />
          )}
        </div>
      )}

      {isConfirmOpen && (
        <ModelRunConfirmPopup pipeline={pipeline} onConfirm={onConfirmModelRun} onClose={onCloseConfirm} />
      )}
    </div>
  );
};

export default PipelinePreview;
