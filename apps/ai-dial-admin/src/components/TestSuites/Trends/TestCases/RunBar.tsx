'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { InteractiveTooltip } from '@epam/ai-dial-ui-kit';

import TrendRunNameLabel, {
  TREND_RUN_AXIS_LABEL_HEIGHT_PX,
} from '@/src/components/TestSuites/Trends/TrendRunNameLabel';
import TestCasesBarTooltip from '@/src/components/TestSuites/Trends/TestCases/TestCasesBarTooltip';
import { TEST_CASE_SEGMENT_BG } from '@/src/components/TestSuites/Trends/constants';
import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';

/** Label column under each bar (shared Trends x-axis height, Figma 12405:245295). */
export const BAR_LABEL_HEIGHT_PX = TREND_RUN_AXIS_LABEL_HEIGHT_PX;

/** Plot area height from Figma frame 11960:157015. */
export const BAR_PLOT_HEIGHT_PX = 211;

interface Props {
  segments: RunTestCaseSegments;
  hasThreshold: boolean;
  threshold?: number | null;
  successLabel: string;
  completedLabel: string;
  belowLabel: string | null;
  aboveLabel: string;
  errorLabel: string;
  totalLabel: string;
}

const RunBar: FC<Props> = ({
  segments,
  hasThreshold,
  threshold,
  successLabel,
  completedLabel,
  belowLabel,
  aboveLabel,
  errorLabel,
  totalLabel,
}) => {
  const { above, below, errorOrNa, total, runName } = segments;
  const ariaLabel =
    belowLabel != null
      ? `${runName}: ${above} ${successLabel}, ${below} ${belowLabel}, ${errorOrNa} ${errorLabel}`
      : `${runName}: ${above} ${successLabel}, ${errorOrNa} ${errorLabel}`;

  const barTooltip = (
    <TestCasesBarTooltip
      segments={segments}
      hasThreshold={hasThreshold}
      threshold={threshold}
      totalLabel={totalLabel}
      completedLabel={completedLabel}
      aboveLabel={aboveLabel}
      belowLabel={belowLabel ?? ''}
      errorLabel={errorLabel}
    />
  );

  return (
    <div className="flex h-full min-w-px max-w-[52px] flex-1 flex-col items-center gap-4">
      <InteractiveTooltip content={barTooltip} asChild triggerClassName="flex min-h-0 w-full flex-1 flex-col">
        <div
          className="flex w-full min-h-0 flex-1 cursor-pointer flex-col overflow-hidden rounded"
          style={{ maxHeight: BAR_PLOT_HEIGHT_PX - BAR_LABEL_HEIGHT_PX }}
          role="img"
          aria-label={ariaLabel}
        >
          {total === 0 ? (
            <div className="h-full w-full bg-layer-4" />
          ) : (
            <>
              {errorOrNa > 0 && (
                <div
                  className={classNames('w-full min-h-0', TEST_CASE_SEGMENT_BG.errorOrNa)}
                  style={{ flexGrow: errorOrNa, flexShrink: 0, flexBasis: 0 }}
                  data-segment="errorOrNa"
                />
              )}
              {belowLabel != null && below > 0 && (
                <div
                  className={classNames('w-full min-h-0', TEST_CASE_SEGMENT_BG.below)}
                  style={{ flexGrow: below, flexShrink: 0, flexBasis: 0 }}
                  data-segment="below"
                />
              )}
              {above > 0 && (
                <div
                  className={classNames('w-full min-h-0', TEST_CASE_SEGMENT_BG.above)}
                  style={{ flexGrow: above, flexShrink: 0, flexBasis: 0 }}
                  data-segment="above"
                />
              )}
            </>
          )}
        </div>
      </InteractiveTooltip>
      <div className="flex shrink-0 items-end justify-center overflow-hidden" style={{ height: BAR_LABEL_HEIGHT_PX }}>
        <TrendRunNameLabel
          name={runName}
          triggerClassName="flex h-full cursor-pointer items-center justify-center overflow-hidden"
        />
      </div>
    </div>
  );
};

export default RunBar;
