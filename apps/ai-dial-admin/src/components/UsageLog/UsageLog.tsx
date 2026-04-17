'use client';

import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { useAppContext } from '@/src/context/AppContext';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import List from '@/src/components/UsageLog/List/List';
import {
  USAGE_LOG_CONVERSATIONS_COLUMNS,
  USAGE_LOG_MCP_COLUMNS,
  USAGE_LOG_TOOLSET_TRACES_COLUMNS,
  USAGE_LOG_TRACES_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, TabsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { CONVERSATIONS_QUERY, MCP_QUERY, TOOLSET_DEPLOYMENT_PREFIX, TRACES_QUERY } from '@/src/constants/telemetry';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TimeFilterValue } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getUsageLogTabs } from '@/src/utils/tabs/utils';
import { isToolsetRoute } from '@/src/utils/is-view';
import { getFormattedFilters } from '@/src/utils/telemetry';

interface Props {
  route: ApplicationRoute;
  entity?: BaseEntity;
  entityView?: EntityViewTab;
  className?: string;
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

const UsageLog: FC<Props> = ({ route, className, entity, entityView, onTimeFilterChange, defaultTimeFilter }) => {
  const t = useI18n();
  const { telemetryMaxRangeMs } = useAppContext();
  const tabs = getUsageLogTabs(t);
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(entityView || EntityViewTab.Traces);
  const { timePeriod, timeRange, isCustom, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
    defaultTimeFilter,
    onTimeFilterChange,
  });

  const entityFilterName = useMemo(() => {
    if (route === ApplicationRoute.AssetsToolsets) {
      const path = (entity as unknown as { path?: string })?.path;
      return path ? `${TOOLSET_DEPLOYMENT_PREFIX}${path}` : entity?.name || null;
    }
    return entity?.name || null;
  }, [route, entity]);

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange, [], entityFilterName);
      } else {
        query.query.from.where = getFormattedFilters(timeRange, [], entityFilterName);
      }

      return getReqRef.current(getDashboardData, query);
    },
    [entityFilterName, timeRange],
  );

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        setActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab],
  );

  const onRefresh = useCallback(() => {
    if (!isCustom && timePeriod) {
      onTimePeriodChange(timePeriod);
    }
  }, [timePeriod, isCustom, onTimePeriodChange]);

  return (
    <div className={classNames('flex flex-col size-full', className)}>
      <div className="flex flex-row h-[40px] justify-between mb-4">
        {!entityView && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <div className={classNames('flex items-center gap-4', entityView && 'justify-between w-full')}>
          <TimeFilter
            timePeriod={timePeriod}
            onTimePeriodChange={onTimePeriodChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            maxRangeMs={telemetryMaxRangeMs}
          />
          <DialNeutralButton
            label={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onRefresh}
          />
        </div>
      </div>
      <div className="flex flex-1 rounded overflow-auto min-h-0 border border-primary">
        {activeTab === EntityViewTab.Traces && (
          <List
            route={route}
            getData={getData}
            columnDefs={isToolsetRoute(route) ? USAGE_LOG_TOOLSET_TRACES_COLUMNS : USAGE_LOG_TRACES_COLUMNS}
            query={isToolsetRoute(route) ? MCP_QUERY : TRACES_QUERY}
            listLabel={t(TabsI18nKey.Traces)}
            emptyDataTitle={t(TelemetryI18nKey.NoTracesTitle)}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <List
            listLabel={t(TabsI18nKey.Conversations)}
            emptyDataTitle={t(TelemetryI18nKey.NoConversationsTitle)}
            route={route}
            getData={getData}
            columnDefs={USAGE_LOG_CONVERSATIONS_COLUMNS}
            query={CONVERSATIONS_QUERY}
          />
        )}
        {activeTab === EntityViewTab.MCP && (
          <List
            listLabel={t(TabsI18nKey.MCP)}
            emptyDataTitle={t(TelemetryI18nKey.NoMcpCalls)}
            route={route}
            getData={getData}
            columnDefs={USAGE_LOG_MCP_COLUMNS}
            query={MCP_QUERY}
          />
        )}
      </div>
    </div>
  );
};

export default UsageLog;
