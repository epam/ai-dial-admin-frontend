import { Dispatch, FC, ReactNode, SetStateAction } from 'react';

import Refresh from '@/src/components/Common/Refresh/Refresh';
import Filters from '@/src/components/Telemetry/TelemetryControls/Filters/Filters';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';

interface Props {
  onRefreshTimeChange: (value: string) => void;
  selectedRefreshValue: string;
  filters: FilterData[];
  setFilters: Dispatch<SetStateAction<FilterData[]>>;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  route: ApplicationRoute;
  timeFilter?: ReactNode;
}

const TelemetryControls: FC<Props> = ({
  selectedRefreshValue,
  onRefreshTimeChange,
  filters,
  setFilters,
  getData,
  route,
  timeFilter,
}) => {
  return (
    <div className="flex w-full justify-between flex-wrap">
      <div className="flex gap-x-3 items-center flex-wrap mb-1 md:mb-0 lg:mb-0">
        {timeFilter}
        <Filters filters={filters} setFilters={setFilters} getData={getData} route={route} />
      </div>
      <Refresh onChange={onRefreshTimeChange} selectedValue={selectedRefreshValue} />
    </div>
  );
};

export default TelemetryControls;
