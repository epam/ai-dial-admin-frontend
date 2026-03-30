import { Dispatch, FC, SetStateAction } from 'react';

import Refresh from '@/src/components/Common/Refresh/Refresh';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
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
  isCustomRange?: boolean;
  setIsCustomRange?: Dispatch<SetStateAction<boolean>>;
  showFilters?: boolean;
  isMcpView?: boolean;
  timePeriodOptions?: typeof timePeriodOptionsConfig;
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
  isCustomRange,
  setIsCustomRange,
  showFilters = true,
  isMcpView = false,
  timePeriodOptions,
}) => {
  return (
    <div className="flex w-full justify-between flex-wrap">
      <div className="flex gap-x-3 items-center flex-wrap mb-1 md:mb-0 lg:mb-0">
        <TimeFilter
          timePeriod={timePeriod}
          onTimePeriodChange={onTimePeriodChange}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          isCustomRange={isCustomRange}
          setIsCustomRange={setIsCustomRange}
          timePeriodOptions={timePeriodOptions}
        />
        {showFilters && (
          <Filters filters={filters} setFilters={setFilters} getData={getData} route={route} isMcpView={isMcpView} />
        )}
      </div>
      <Refresh onChange={onRefreshTimeChange} selectedValue={selectedRefreshValue} />
    </div>
  );
};

export default TelemetryControls;
