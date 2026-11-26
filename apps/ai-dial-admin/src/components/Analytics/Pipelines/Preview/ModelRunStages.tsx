'use client';

import { FC } from 'react';

import { IconCheck, IconMinus, IconX } from '@tabler/icons-react';
import classNames from 'classnames';

import { ModelRunStageEntry, ModelRunStageState } from '@/src/components/Analytics/Pipelines/Preview/models';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  stages: ModelRunStageEntry[];
}

const ICON_SIZE = 14;

const STATE_LABEL_KEYS: Record<ModelRunStageState, PipelinePreviewI18nKey> = {
  [ModelRunStageState.Passed]: PipelinePreviewI18nKey.StatePassed,
  [ModelRunStageState.Failed]: PipelinePreviewI18nKey.StateFailed,
  [ModelRunStageState.NotReached]: PipelinePreviewI18nKey.StateNotReached,
};

const STATE_ICONS = {
  [ModelRunStageState.Passed]: IconCheck,
  [ModelRunStageState.Failed]: IconX,
  [ModelRunStageState.NotReached]: IconMinus,
};

const ModelRunStages: FC<Props> = ({ stages }) => {
  const t = useI18n();

  return (
    <ol aria-label={t(PipelinePreviewI18nKey.StagesLabel)} className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {stages.map(({ stage, state }) => {
        const Icon = STATE_ICONS[state];

        return (
          <li key={stage} className="flex items-center gap-1.5 dial-tiny-text">
            <Icon
              size={ICON_SIZE}
              aria-hidden
              className={classNames({
                'text-success': state === ModelRunStageState.Passed,
                'text-error': state === ModelRunStageState.Failed,
                'text-secondary': state === ModelRunStageState.NotReached,
              })}
            />
            <span className="font-mono text-primary">{stage}</span>
            <span className="text-secondary">{t(STATE_LABEL_KEYS[state])}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default ModelRunStages;
