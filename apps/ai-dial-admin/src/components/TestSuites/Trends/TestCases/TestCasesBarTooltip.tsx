import { CSSProperties, FC } from 'react';
import { IconExternalLink } from '@tabler/icons-react';

import { TEST_CASE_SEGMENT_BG, TEST_CASE_SEGMENT_HEX } from '@/src/components/TestSuites/Trends/constants';
import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';
import { TREND_TOOLTIP_TEXT_ACCENT } from '@/src/components/TestSuites/Trends/utils/chart-tooltip-styles';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

const COMPLETED_SPLIT_STYLE = {
  backgroundImage: `linear-gradient(135deg, ${TEST_CASE_SEGMENT_HEX.above} 50%, ${TEST_CASE_SEGMENT_HEX.below} 50%)`,
} satisfies CSSProperties;

interface RowProps {
  label: string;
  value: number;
  swatchClass?: string;
  swatchStyle?: CSSProperties;
  indent?: boolean;
  valueSemiBold?: boolean;
}

const TooltipRow: FC<RowProps> = ({ label, value, swatchClass, swatchStyle, indent, valueSemiBold }) => (
  <div className={`flex w-full items-center justify-between gap-3 ${indent ? 'pl-4' : ''}`}>
    <span className="flex min-w-0 items-center gap-1">
      {(swatchClass != null || swatchStyle != null) && (
        <span
          className={`size-2 shrink-0 rounded-[2px] border border-primary ${swatchClass ?? ''}`}
          style={swatchStyle}
          aria-hidden
        />
      )}
      <span className="dial-tiny-text whitespace-nowrap">{label}</span>
    </span>
    <span className={`dial-tiny-text tabular-nums ${valueSemiBold ? 'dial-tiny-semi-text' : ''}`}>{value}</span>
  </div>
);

export interface TestCasesBarTooltipProps {
  segments: RunTestCaseSegments;
  totalLabel: string;
  completedLabel: string;
  aboveLabel: string;
  belowLabel: string;
  errorLabel: string;
}

const TestCasesBarTooltip: FC<TestCasesBarTooltipProps> = ({
  segments,
  totalLabel,
  completedLabel,
  aboveLabel,
  belowLabel,
  errorLabel,
}) => {
  const { runId, runName, above, below, errorOrNa, total, overallScoreThreshold } = segments;
  const hasThreshold = overallScoreThreshold != null;
  const completedCount = hasThreshold ? above + below : above;
  const aboveWithThreshold = overallScoreThreshold != null ? `${aboveLabel} (${overallScoreThreshold})` : aboveLabel;
  const belowWithThreshold = overallScoreThreshold != null ? `${belowLabel} (${overallScoreThreshold})` : belowLabel;
  const href = getUrnForEntity(ApplicationRoute.Runs, { id: runId, testRunName: runName });

  return (
    <div className="flex min-w-[140px] flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="dial-tiny-semi-text flex w-fit items-center gap-1 no-underline"
          style={{ color: TREND_TOOLTIP_TEXT_ACCENT }}
          onClick={(event) => event.stopPropagation()}
        >
          <span className="whitespace-nowrap">{runName}</span>
          <IconExternalLink {...BASE_BUTTON_ICON_PROPS} width={16} height={16} aria-hidden />
        </a>
        <div className="flex items-start justify-between gap-3">
          <span className="dial-tiny-semi-text whitespace-nowrap">{totalLabel}</span>
          <span className="dial-tiny-semi-text tabular-nums">{total}</span>
        </div>
      </div>
      {hasThreshold ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <TooltipRow
              label={completedLabel}
              value={completedCount}
              swatchStyle={COMPLETED_SPLIT_STYLE}
              valueSemiBold
            />
            <TooltipRow label={aboveWithThreshold} value={above} swatchClass={TEST_CASE_SEGMENT_BG.above} indent />
            <TooltipRow label={belowWithThreshold} value={below} swatchClass={TEST_CASE_SEGMENT_BG.below} indent />
          </div>
          <TooltipRow label={errorLabel} value={errorOrNa} swatchClass={TEST_CASE_SEGMENT_BG.errorOrNa} valueSemiBold />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <TooltipRow
            label={completedLabel}
            value={completedCount}
            swatchClass={TEST_CASE_SEGMENT_BG.above}
            valueSemiBold
          />
          <TooltipRow label={errorLabel} value={errorOrNa} swatchClass={TEST_CASE_SEGMENT_BG.errorOrNa} valueSemiBold />
        </div>
      )}
    </div>
  );
};

export default TestCasesBarTooltip;
