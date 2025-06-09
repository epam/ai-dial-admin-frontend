import React, { FC, ReactElement, useCallback, useState } from 'react';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import AddFilterModal from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilterModal';
import AddFilterPopover from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilterPopover';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { FilterData } from '@/src/models/telemetry';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';
import { getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';
import { useI18n } from '@/src/locales/client';

interface Props {
  addFilter: (filter: FilterData) => void;
  dropdownData: { projects: DropdownItemsModel[]; entities: DropdownItemsModel[] };
  children: ReactElement;
  filterData?: FilterData;
  route: ApplicationRoute;
  dataTestId?: string;
}

const AddFilter: FC<Props> = ({ addFilter, dropdownData, children, filterData, route, dataTestId }) => {
  const isMobile = useIsMobileScreen();
  const t = useI18n() as (t: string) => string;
  const filterTypeConfig = getFilterTypeConfig(t);
  const filterConditionConfig = getFilterConditionConfig(t);
  const typeValue =
    route === ApplicationRoute.Dashboard
      ? filterTypeConfig[0].id
      : filterTypeConfig.find((item) => item.id === FILTER_TYPE.Project)?.id;
  const [type, setType] = useState<FILTER_TYPE>(filterData?.type ?? typeValue ?? filterTypeConfig[0].id);
  const [condition, setCondition] = useState<FILTER_OPERATOR>(filterData?.condition ?? filterConditionConfig[0].id);
  const [value, setValue] = useState<string>(filterData?.value ?? '');

  const reset = useCallback(() => {
    setType(filterData?.type ?? typeValue ?? filterTypeConfig[0].id);
    setCondition(filterData?.condition ?? filterConditionConfig[0].id);
    setValue(filterData?.value ?? '');
  }, [filterData, typeValue, filterTypeConfig, filterConditionConfig]);

  const onCreate = useCallback(() => {
    addFilter({ type, condition, value });
  }, [condition, value, type, addFilter]);

  return (
    <div data-testid={dataTestId}>
      {isMobile ? (
        <AddFilterModal
          type={type}
          condition={condition}
          value={value}
          setType={setType}
          setCondition={setCondition}
          setValue={setValue}
          onCreate={onCreate}
          dropdownData={dropdownData}
          reset={reset}
          route={route}
        >
          {children}
        </AddFilterModal>
      ) : (
        <AddFilterPopover
          type={type}
          condition={condition}
          value={value}
          setType={setType}
          setCondition={setCondition}
          setValue={setValue}
          onCreate={onCreate}
          dropdownData={dropdownData}
          reset={reset}
          route={route}
        >
          {children}
        </AddFilterPopover>
      )}
    </div>
  );
};

export default AddFilter;
