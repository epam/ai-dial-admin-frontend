import { Dispatch, FC, SetStateAction } from 'react';

import Refresh from '@/src/components/Common/Refresh/Refresh';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { TimeRange } from '@/src/models/time-range';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';

interface Props {
  onRefreshTimeChange: (value: string) => void;
  onTimePeriodChange: (value: string) => void;
  onTimeRangeChange: (value: TimeRange) => void;
  selectedRefreshValue: string;
  timePeriod: string;
  timeRange: TimeRange;
  filters: FilterData[];
  setFilters: Dispatch<SetStateAction<FilterData[]>>;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  route: ApplicationRoute;
}

const TelemetryControls: FC<Props> = ({
  selectedRefreshValue,
  onRefreshTimeChange,
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  filters,
  setFilters,
  getData,
  route,
}) => {
  return (
    <div className="flex w-full justify-between">
      <div className="flex flex-wrap">
        <TimeFilter
          timePeriod={timePeriod}
          onTimePeriodChange={onTimePeriodChange}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
        />
        <Filters filters={filters} setFilters={setFilters} getData={getData} route={route} />
      </div>
      <Refresh onChange={onRefreshTimeChange} selectedValue={selectedRefreshValue} />
    </div>
  );
};

export default TelemetryControls;
