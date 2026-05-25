import { Dispatch, FC, SetStateAction } from 'react';

import Refresh from '@/src/components/Common/Refresh/Refresh';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { useAppContext } from '@/src/context/AppContext';
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
  getBaseData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  route: ApplicationRoute;
  showFilters?: boolean;
  isRouteView?: boolean;
  isMcpView?: boolean;
  canAutoRefresh?: boolean;
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
  getBaseData,
  route,
  showFilters = true,
  isRouteView = false,
  isMcpView = false,
  canAutoRefresh = true,
}) => {
  const { telemetryMaxRangeMs } = useAppContext();
  return (
    <div className="flex w-full justify-between flex-wrap">
      <div className="flex gap-x-3 items-center flex-wrap mb-1 md:mb-0 lg:mb-0">
        <TimeFilter
          timePeriod={timePeriod}
          onTimePeriodChange={onTimePeriodChange}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          maxRangeMs={telemetryMaxRangeMs}
        />
        {showFilters && (
          <Filters
            filters={filters}
            setFilters={setFilters}
            getBaseData={getBaseData}
            route={route}
            isMcpView={isMcpView}
            isRouteView={isRouteView}
          />
        )}
      </div>
      <Refresh onChange={onRefreshTimeChange} selectedValue={selectedRefreshValue} disabled={!canAutoRefresh} />
    </div>
  );
};

export default TelemetryControls;
