'use client';

import { FC, ReactElement } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import { getOverallScoreThresholdMessage, parseScoreRaw } from '@/src/components/Runs/utils/test-case-scores';
import { useI18n } from '@/src/locales/client';

interface Props {
  raw: string | null | undefined;
  threshold?: number | null;
  /** The whole value cell: hovering anywhere on it, including an overlay button, shows the tooltip. */
  children: ReactElement;
}

/** Explains an overall score's result against the threshold on hover; renders the cell untouched otherwise. */
const ScoreThresholdTooltip: FC<Props> = ({ raw, threshold, children }) => {
  const t = useI18n();
  const message = getOverallScoreThresholdMessage(t, parseScoreRaw(raw), threshold);

  return (
    <Tooltip tooltip={message} hideTooltip={!message} asChild>
      {children}
    </Tooltip>
  );
};

export default ScoreThresholdTooltip;
