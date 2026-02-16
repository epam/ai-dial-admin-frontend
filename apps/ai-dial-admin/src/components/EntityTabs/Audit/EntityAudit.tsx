import { FC, useCallback, useMemo, useState } from 'react';

import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialTabs } from '@epam/ai-dial-ui-kit';

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { routeAuditResource } from '@/src/components/ActivityAudit/View/Header/constants';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import UsageLog from '@/src/components/UsageLog/UsageLog';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { TabOrientation } from '@/src/types/tab';
import { EntityViewTab, getAuditTabs } from '@/src/utils/tabs/utils';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';

interface Props {
  entity: BaseEntity;
  view: ApplicationRoute;
}

const EntityAudit: FC<Props> = ({ entity, view }) => {
  const t = useI18n();

  const { featureFlags } = useAppContext();
  const tabs = getAuditTabs(t, featureFlags, view);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const [isCustomRange, setIsCustomRange] = useState(false);
  const [timePeriod, setTimePeriod] = useState<string>(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const onTimePeriodChange = useCallback((period: string) => {
    setTimePeriod(period);
    setTimeRange(getTimeRangeById(period));
  }, []);

  const onTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const onRefresh = useCallback(() => {
    setTimeRange(timeRange);
  }, [timeRange]);

  const timeFilter = useMemo(() => {
    return (
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        isCustomRange={isCustomRange}
        setIsCustomRange={setIsCustomRange}
      />
    );
  }, [isCustomRange, onTimePeriodChange, onTimeRangeChange, timePeriod, timeRange]);

  return (
    <div className="flex flex-row gap-4 h-full w-full">
      <div className="bg-layer-3 h-full w-[296px] p-4 relative">
        <h1 className="mb-4">{t(TabsI18nKey.Audit)}</h1>
        <div className="flex-1 min-h-0 relative">
          <DialTabs
            activeTab={activeTab}
            tabs={tabs}
            onClick={(tab) => setActiveTab(tab)}
            orientation={TabOrientation.Vertical}
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 w-full relative">
        {activeTab === EntityViewTab.Dashboard && (
          <Dashboard timeFilter={timeFilter} timeRange={timeRange} entity={entity} route={view} />
        )}
        {activeTab === EntityViewTab.Traces && (
          <UsageLog
            timeFilter={timeFilter}
            timeRange={timeRange}
            entity={entity}
            route={view}
            entityView={activeTab}
            onRefresh={onRefresh}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <UsageLog
            timeFilter={timeFilter}
            timeRange={timeRange}
            entity={entity}
            route={view}
            entityView={activeTab}
            onRefresh={onRefresh}
          />
        )}
        {activeTab === EntityViewTab.Activities && (
          <ActivityAuditList
            timeFilter={timeFilter}
            timeRange={timeRange}
            entity={entity}
            entityType={routeAuditResource[view]}
            allowPadding={false}
            refresh
          />
        )}
      </div>
    </div>
  );
};

export default EntityAudit;
