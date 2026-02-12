'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';

import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import List from '@/src/components/UsageLog/List/List';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { USAGE_LOG_CONVERSATIONS_COLUMNS, USAGE_LOG_TRACES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { CONVERSATIONS_QUERY, TRACES_QUERY } from '@/src/constants/telemetry';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getUsageLogTabs } from '@/src/utils/tabs/utils';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';

interface Props {
  route: ApplicationRoute;
  entity?: BaseEntity;
  entityView?: EntityViewTab;
  className?: string;
  initTimeFilter?: string;
  onChangeTimeFilter?: (filter: string) => void;
}

const UsageLog: FC<Props> = ({ route, className, entity, entityView, onChangeTimeFilter, initTimeFilter }) => {
  const t = useI18n();
  const tabs = getUsageLogTabs(t);
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(entityView || EntityViewTab.Traces);
  const [timePeriod, setTimePeriod] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  useEffect(() => {
    if (!timePeriod) {
      setTimePeriod(initTimeFilter || DEFAULT_TIME_PERIOD);
      setTimeRange(getTimeRangeById(initTimeFilter || DEFAULT_TIME_PERIOD));
    }
  }, [initTimeFilter, timePeriod]);

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange, [], entity?.name || null);
      } else {
        query.query.from.where = getFormattedFilters(timeRange, [], entity?.name || null);
      }

      return getReqRef.current(getDashboardData, query);
    },
    [entity?.name, timeRange],
  );

  const onTimePeriodChange = useCallback(
    (period: string) => {
      setTimePeriod(period);
      onChangeTimeFilter?.(period);
      setTimeRange(getTimeRangeById(period));
    },
    [onChangeTimeFilter],
  );

  const onTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      if (tab !== activeTab) {
        setActiveTab(tab as EntityViewTab);
      }
    },
    [activeTab],
  );

  const onRefresh = useCallback(() => {
    setTimeRange(getTimeRangeById(timePeriod || ''));
  }, [timePeriod]);

  return (
    <div className={classNames('flex flex-col h-full w-full', className)}>
      <div className="flex flex-row h-[40px] justify-between mb-4">
        {!entityView && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <div className={classNames('flex items-center gap-4', entityView && 'justify-between w-full')}>
          {timePeriod && (
            <TimeFilter
              timePeriod={timePeriod}
              onTimePeriodChange={onTimePeriodChange}
              timeRange={timeRange}
              onTimeRangeChange={onTimeRangeChange}
            />
          )}
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
            columnDefs={USAGE_LOG_TRACES_COLUMNS}
            query={TRACES_QUERY}
            listLabel={t(TelemetryI18nKey.TracesTitle)}
            emptyDataTitle={t(TelemetryI18nKey.NoTracesTitle)}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <List
            listLabel={t(TelemetryI18nKey.ConversationsTitle)}
            emptyDataTitle={t(TelemetryI18nKey.NoConversationsTitle)}
            route={route}
            getData={getData}
            columnDefs={USAGE_LOG_CONVERSATIONS_COLUMNS}
            query={CONVERSATIONS_QUERY}
          />
        )}
      </div>
    </div>
  );
};

export default UsageLog;
