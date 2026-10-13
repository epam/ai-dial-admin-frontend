'use client';

import { FC, useCallback, useState } from 'react';

import BackfillSection from '@/src/components/Analytics/Common/BackfillSidebar/BackfillSection';
import PipelineBackfillRunsList from '@/src/components/Analytics/Pipelines/Backfill/PipelineBackfillRunsList';
import PipelineBackfillRunView from '@/src/components/Analytics/Pipelines/Backfill/PipelineBackfillRunView';
import PipelineBackfillStartForm from '@/src/components/Analytics/Pipelines/Backfill/PipelineBackfillStartForm';
import {
  findActivePipelineBackfill,
  usePipelineBackfillRuns,
} from '@/src/components/Analytics/Pipelines/Backfill/use-pipeline-backfill-runs';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineBackfillRequest, PipelineBackfillRun } from '@/src/models/analytics/pipeline-backfill';

interface Props {
  pipelineName: string;
  isGroupTrigger: boolean;
  isPipelinePaused: boolean;
  /** Called with every answer, so the banner above the tab strip stays current while this is open. */
  onRunsChange: (runs: PipelineBackfillRun[]) => void;
}

/**
 * The pipeline's Backfill drawer content, in three blocks: the start form first, only while the pipeline holds no
 * running or paused run (a paused one is ended by cancelling it); then one run (the chosen one, else the active
 * one, else the newest); then the latest runs, absent when there are none.
 */
const PipelineBackfillSidebar: FC<Props> = ({ pipelineName, isGroupTrigger, isPipelinePaused, onRunsChange }) => {
  const t = useI18n();
  const { runs, isBusy, start, applyVerb } = usePipelineBackfillRuns({ pipelineName, onRunsChange });
  const [selectedRunId, setSelectedRunId] = useState<string>();

  const activeRun = findActivePipelineBackfill(runs);
  const presented = runs.find((run) => run.id === selectedRunId) ?? activeRun ?? runs[0];

  const onStart = useCallback(
    async (window: PipelineBackfillRequest) => {
      if (await start(window)) setSelectedRunId(undefined);
    },
    [start],
  );

  return (
    <div className="flex flex-col gap-y-4">
      {!activeRun && (
        <BackfillSection title={t(BackfillI18nKey.SectionStart)}>
          <PipelineBackfillStartForm isBusy={isBusy} onStart={(window) => void onStart(window)} />
        </BackfillSection>
      )}
      {presented && (
        <BackfillSection title={t(BackfillI18nKey.SectionRun)}>
          <PipelineBackfillRunView
            // A new key per run: the dead-letter counts and the requeue outcome belong to one run.
            key={presented.id}
            pipelineName={pipelineName}
            run={presented}
            isGroupTrigger={isGroupTrigger}
            isPipelinePaused={isPipelinePaused}
            isBusy={isBusy}
            onVerb={applyVerb}
          />
        </BackfillSection>
      )}
      {activeRun && presented?.id === activeRun.id && (
        <p className="m-0 text-secondary dial-small">{t(BackfillI18nKey.OnlyOneRunHint)}</p>
      )}
      <PipelineBackfillRunsList
        runs={runs}
        isGroupTrigger={isGroupTrigger}
        selectedRunId={presented?.id}
        onSelect={setSelectedRunId}
      />
    </div>
  );
};

export default PipelineBackfillSidebar;
