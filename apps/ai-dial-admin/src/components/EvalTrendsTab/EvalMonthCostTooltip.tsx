'use client';

import { FC } from 'react';

interface Props {
  currentLabel: string;
  previousLabel: string;
  currentCostDisplay: string;
  previousCostDisplay: string;
}

const EvalMonthCostTooltip: FC<Props> = ({ currentLabel, previousLabel, currentCostDisplay, previousCostDisplay }) => (
  <div className="flex min-w-[12rem] flex-col gap-2 px-2 py-1">
    <div className="flex items-start justify-between gap-4">
      <span className="dial-tiny-text text-control-inverted whitespace-nowrap">{currentLabel}</span>
      <span className="dial-tiny-semi-text text-control-inverted shrink-0">{currentCostDisplay}</span>
    </div>
    <div className="flex items-start justify-between gap-4">
      <span className="dial-tiny-text text-control-inverted whitespace-nowrap">{previousLabel}</span>
      <span className="dial-tiny-semi-text text-control-inverted shrink-0">{previousCostDisplay}</span>
    </div>
  </div>
);

export default EvalMonthCostTooltip;
