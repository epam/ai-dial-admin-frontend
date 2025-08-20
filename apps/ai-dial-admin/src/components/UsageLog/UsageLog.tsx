'use client';
import { FC, useCallback, useState } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { TimeRange } from '@/src/models/time-range';
import { TelemetryQuery } from '@/src/models/telemetry';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { EntityViewTab, tracesTabs } from '@/src/components/EntityView/View/utils';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { getFormattedFilters } from '@/src/utils/telemetry';
import { getDashboardData } from '@/src/app/[lang]/dashboard/actions';
import { useI18n } from '@/src/locales/client';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { IconRefresh } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

import Button from '@/src/components/Common/Button/Button';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import Traces from '@/src/components/UsageLog/List/Traces';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';

interface Props {
  route: ApplicationRoute;
}

const UsageLog: FC<Props> = ({ route }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [tracesTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Traces);
  const [timePeriod, setTimePeriod] = useState(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const getData = useCallback(
    (query: TelemetryQuery) => {
      if (typeof query.query.from === 'string') {
        query.query.where = getFormattedFilters(timeRange, [], null);
      } else {
        query.query.from.where = getFormattedFilters(timeRange, [], null);
      }

      return getDashboardData(query);
    },
    [timeRange],
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
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        <div className="flex items-center gap-4">
          <TimeFilter
            timePeriod={timePeriod}
            onTimePeriodChange={onTimePeriodChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
          <Button
            cssClass="secondary"
            title={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
            onClick={onRefresh}
          />
        </div>
      </div>
      <div className="flex flex-1 rounded overflow-auto my-3 min-h-0 border border-primary">
        <>{activeTab === EntityViewTab.Traces && <Traces route={route} getData={getData} />}</>
      </div>
    </div>
  );
};

export default UsageLog;
