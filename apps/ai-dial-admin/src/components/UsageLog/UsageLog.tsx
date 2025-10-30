'use client';
import { ButtonVariant, DialButton, DialTabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useState } from 'react';

import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { conversationsTabs, EntityViewTab, tracesTabs } from '@/src/components/EntityView/View/utils';
import List from '@/src/components/UsageLog/List/List';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { USAGE_LOG_CONVERSATIONS_COLUMNS, USAGE_LOG_TRACES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { CONVERSATIONS_QUERY, TRACES_QUERY } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { IconRefresh } from '@tabler/icons-react';

interface Props {
  route: ApplicationRoute;
  entity?: BaseEntity;
  entityView?: EntityViewTab;
}

const UsageLog: FC<Props> = ({ route, entity, entityView }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [tracesTabs(t), conversationsTabs(t)];

  const [activeTab, setActiveTab] = useState(entityView || EntityViewTab.Traces);
  const [timePeriod, setTimePeriod] = useState(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange, [], entity?.name || null);
      } else {
        query.query.from.where = getFormattedFilters(timeRange, [], entity?.name || null);
      }

      return getDashboardData(query);
    },
    [entity?.name, timeRange],
  );

  const onTimePeriodChange = useCallback((period: string) => {
    setTimePeriod(period);
    setTimeRange(getTimeRangeById(period));
  }, []);

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
    setTimeRange(getTimeRangeById(timePeriod));
  }, [timePeriod]);

  return (
    <div className="flex flex-col h-full w-full bg-layer-2 rounded p-4">
      <div className="flex flex-row min-h-[34px] justify-between">
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
          />
          <DialButton
            variant={ButtonVariant.Secondary}
            title={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
            onClick={onRefresh}
          />
        </div>
      </div>
      <div className="flex flex-1 rounded overflow-auto my-3 min-h-0 border border-primary">
        {activeTab === EntityViewTab.Traces && (
          <List
            route={route}
            getData={getData}
            columnDefs={USAGE_LOG_TRACES_COLUMNS}
            query={TRACES_QUERY}
            title={t(TelemetryI18nKey.TracesTitle)}
            emptyDataTitle={t(TelemetryI18nKey.NoTracesTitle)}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <List
            title={t(TelemetryI18nKey.ConversationsTitle)}
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
