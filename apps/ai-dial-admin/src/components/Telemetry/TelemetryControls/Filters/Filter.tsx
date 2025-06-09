import { FC, useCallback } from 'react';
import { IconX } from '@tabler/icons-react';
import { FilterData } from '@/src/models/telemetry';
import AddFilter from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilter';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';

interface Props {
  id: number;
  onClose: (id: number) => void;
  onEdit: (filter: FilterData, index?: number) => void;
  filterData: FilterData;
  dropdownData: { projects: DropdownItemsModel[]; entities: DropdownItemsModel[] };
  route: ApplicationRoute;
}

const Filter: FC<Props> = ({ id, onClose, onEdit, dropdownData, filterData, route }) => {
  const { type, condition, value } = filterData;
  const t = useI18n() as (t: string) => string;
  const filterTypeConfig = getFilterTypeConfig(t);
  const filterConditionConfig = getFilterConditionConfig(t);
  const typeText = filterTypeConfig.find((item) => item.id === type)?.name;
  const conditionIcon = filterConditionConfig.find((item) => item.id === condition)?.icon;

  const addFilter = useCallback(
    (filter: FilterData) => {
      onEdit(filter, id);
    },
    [id, onEdit],
  );

  return (
    <AddFilter addFilter={addFilter} dropdownData={dropdownData} filterData={filterData} route={route}>
      <div
        data-testid="dashboard-filter"
        className="flex text-primary small rounded bg-layer-3 my-[5px] mr-4 px-1.5 py-1"
      >
        <p className="flex items-center">
          <span className="mr-1">{typeText}</span>
          <i className="mr-1">{conditionIcon}</i>
          <span className="mr-1 max-w-[250px]">{value}</span>
        </p>

        <button
          type="button"
          aria-label="button"
          className="hover:text-accent-primary ml-2"
          onClick={() => onClose(id)}
        >
          <IconX height={16} width={16} />
        </button>
      </div>
    </AddFilter>
  );
};

export default Filter;
