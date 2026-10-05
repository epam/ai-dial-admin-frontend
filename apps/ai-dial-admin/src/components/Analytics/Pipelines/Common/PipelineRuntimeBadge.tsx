import { FC } from 'react';

import classNames from 'classnames';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineRuntimeStatus } from '@/src/models/analytics/pipeline-runtime';

interface Props {
  status: PipelineRuntimeStatus;
  className?: string;
}

const LABEL: Record<PipelineRuntimeStatus, AnalyticsPipelinesI18nKey | null> = {
  [PipelineRuntimeStatus.Running]: AnalyticsPipelinesI18nKey.RuntimeRunning,
  [PipelineRuntimeStatus.Paused]: AnalyticsPipelinesI18nKey.RuntimePaused,
  [PipelineRuntimeStatus.NotTracked]: AnalyticsPipelinesI18nKey.RuntimeNotTracked,
  [PipelineRuntimeStatus.Unknown]: null,
};

const TONE: Record<PipelineRuntimeStatus, string> = {
  [PipelineRuntimeStatus.Running]: 'text-info bg-info',
  [PipelineRuntimeStatus.Paused]: 'text-warning bg-warning',
  [PipelineRuntimeStatus.NotTracked]: 'text-error bg-error',
  [PipelineRuntimeStatus.Unknown]: '',
};

/**
 * What the runner is doing with this pipeline — a different axis from `enabled`, which is the
 * declaration. A paused pipeline is still enabled, so the two badges stand side by side rather than one
 * replacing the other.
 *
 * `Unknown` renders nothing: a disabled pipeline, an unread runner and a caller without the rights to
 * ask are all cases where the console has no answer, and an "unknown" chip would imply it looked.
 */
const PipelineRuntimeBadge: FC<Props> = ({ status, className }) => {
  const t = useI18n();

  const label = LABEL[status];
  if (!label) return null;

  return (
    <div
      className={classNames(
        'flex items-center gap-x-1 py-1 px-2 uppercase dial-caption-text font-semibold rounded-full',
        TONE[status],
        className,
      )}
    >
      <span>{t(label)}</span>
    </div>
  );
};

export default PipelineRuntimeBadge;
