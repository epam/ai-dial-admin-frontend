'use client';

import { FC } from 'react';

interface Props {
  suiteName: string;
  runsLabel: string;
  avgScoreLabel: string;
  avgCostLabel: string;
  avgScoreDisplay: string;
  avgCostDisplay: string;
}

const SuiteScorePillTooltip: FC<Props> = ({
  suiteName,
  runsLabel,
  avgScoreLabel,
  avgCostLabel,
  avgScoreDisplay,
  avgCostDisplay,
}) => (
  <div className="flex min-w-[12rem] flex-col gap-1 px-3 py-2">
    <div className="flex items-center justify-between gap-4">
      <span className="dial-small-semi-text text-control-inverted truncate">{suiteName}</span>
      <span className="dial-small-text text-control-inverted shrink-0 whitespace-nowrap">{runsLabel}</span>
    </div>
    <div className="flex items-start justify-between gap-4">
      <div className="dial-small-text text-control-inverted flex flex-col">
        <span>{avgScoreLabel}</span>
        <span>{avgCostLabel}</span>
      </div>
      <div className="dial-small-semi-text text-control-inverted flex shrink-0 flex-col items-end">
        <span>{avgScoreDisplay}</span>
        <span>{avgCostDisplay}</span>
      </div>
    </div>
  </div>
);

export default SuiteScorePillTooltip;
