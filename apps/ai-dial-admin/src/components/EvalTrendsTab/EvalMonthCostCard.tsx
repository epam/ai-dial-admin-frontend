'use client';

import { FC, useMemo } from 'react';

import { Spinner, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';

import { formatGroupedMonthCost, formatMonthCostDelta } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import EvalMonthCostDeltaBadge from '@/src/components/EvalTrendsTab/EvalMonthCostDeltaBadge';
import EvalMonthCostTooltip from '@/src/components/EvalTrendsTab/EvalMonthCostTooltip';
import { useDeploymentMonthCosts } from '@/src/components/EvalTrendsTab/use-deployment-month-costs';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  deploymentId: string;
  suiteCount: number;
}

const MISSING_COST = '—';

const EvalMonthCostCard: FC<Props> = ({ deploymentId, suiteCount }) => {
  const t = useI18n();
  const { windows, currentTotal, previousTotal, isLoading } = useDeploymentMonthCosts(deploymentId);
  const title = t(TestSuitesI18nKey.EvalTrendsMonthCostTitle);

  const currentDisplay = currentTotal != null ? formatGroupedMonthCost(currentTotal) : MISSING_COST;
  const previousDisplay = previousTotal != null ? formatGroupedMonthCost(previousTotal) : MISSING_COST;
  const deltaLabel = useMemo(() => formatMonthCostDelta(currentTotal, previousTotal), [currentTotal, previousTotal]);

  const tooltip = (
    <EvalMonthCostTooltip
      currentLabel={windows.current.label}
      previousLabel={windows.previous.label}
      currentCostDisplay={currentDisplay}
      previousCostDisplay={previousDisplay}
    />
  );

  return (
    <KpiCardFrame className="w-full max-w-[24.625rem]" ariaLabel={title} title={title}>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <Tooltip
          tooltip={tooltip}
          placement={TooltipPlacement.Bottom}
          hideTooltip={isLoading}
          triggerClassName="w-fit max-w-full"
        >
          <div className="flex flex-wrap items-center gap-1">
            {isLoading ? (
              <Spinner size={24} />
            ) : currentTotal == null ? (
              <p className="dial-display2-text text-secondary">{MISSING_COST}</p>
            ) : (
              <>
                <p className="dial-display2-text text-primary">{currentDisplay}</p>
                {deltaLabel != null && <EvalMonthCostDeltaBadge deltaLabel={deltaLabel} />}
              </>
            )}
          </div>
        </Tooltip>
        <p className="dial-tiny-text text-secondary">
          {t(TestSuitesI18nKey.EvalTrendsBasedOnAllSuites, { count: suiteCount })}
        </p>
      </div>
      <span className="sr-only">
        {windows.current.label}: {currentDisplay}. {windows.previous.label}: {previousDisplay}.
      </span>
    </KpiCardFrame>
  );
};

export default EvalMonthCostCard;
