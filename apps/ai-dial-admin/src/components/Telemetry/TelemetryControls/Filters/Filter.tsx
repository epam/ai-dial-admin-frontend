import { FC, useCallback } from 'react';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import FilterChip from '@/src/components/Common/FilterEditor/FilterChip';
import AddFilter from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilter';
import { useI18n } from '@/src/locales/client';
import { FilterData } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';

interface Props {
  id: number;
  onClose: (id: number) => void;
  onEdit: (filter: FilterData, index?: number) => void;
  filterData: FilterData;
  projects: SelectOption[];
  entities: SelectOption[];
  route: ApplicationRoute;
  isMcpView?: boolean;
  isRouteView?: boolean;
}

const Filter: FC<Props> = ({
  id,
  onClose,
  onEdit,
  projects,
  entities,
  filterData,
  route,
  isMcpView = false,
  isRouteView = false,
}) => {
  const { type, condition, value } = filterData;
  const t = useI18n();
  const filterTypeConfig = getFilterTypeConfig(t, isMcpView, isRouteView);
  const filterConditionConfig = getFilterConditionConfig(t);
  const typeText = filterTypeConfig.find((item) => item.value === type)?.value;
  const conditionIcon = filterConditionConfig.find((item) => item.value === condition)?.icon;

  const addFilter = useCallback(
    (filter: FilterData) => {
      onEdit(filter, id);
    },
    [id, onEdit],
  );

  return (
    <AddFilter
      addFilter={addFilter}
      projects={projects}
      entities={entities}
      filterData={filterData}
      route={route}
      isMcpView={isMcpView}
      isRouteView={isRouteView}
    >
      <FilterChip className="my-[5px] mr-4" onRemove={() => onClose(id)} removeAriaLabel="button">
        <span className="mr-1">{typeText}</span>
        <i className="mr-1">{conditionIcon}</i>
        <span className="mr-1 max-w-[250px] break-words">
          {value.length <= 2 ? value.join(', ') : `${value.slice(0, 2).join(', ')}, +${value.length - 2} more`}
        </span>
      </FilterChip>
    </AddFilter>
  );
};

export default Filter;
