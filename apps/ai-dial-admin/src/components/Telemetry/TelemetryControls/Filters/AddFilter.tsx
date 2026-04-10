import React, { FC, ReactElement, useCallback, useState } from 'react';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import AddFilterModal from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilterModal';
import AddFilterPopover from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilterPopover';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { FilterData } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { getFilterConditionConfig, getFilterTypeConfig } from '@/src/utils/telemetry';
import { useI18n } from '@/src/locales/client';

interface Props {
  addFilter: (filter: FilterData) => void;
  dropdownData: { projects: SelectOption[]; entities: SelectOption[] };
  children: ReactElement;
  filterData?: FilterData;
  route: ApplicationRoute;
  isMcpView?: boolean;
}

const AddFilter: FC<Props> = ({ addFilter, dropdownData, children, filterData, route, isMcpView = false }) => {
  const isMobile = useIsMobileScreen();
  const t = useI18n();
  const filterTypeConfig = getFilterTypeConfig(t, isMcpView);
  const filterConditionConfig = getFilterConditionConfig(t);
  const typeValue =
    route === ApplicationRoute.Dashboard
      ? filterTypeConfig[0].value
      : filterTypeConfig.find((item) => item.value === FILTER_TYPE.Project)?.value;
  const [type, setType] = useState<FILTER_TYPE>(
    (filterData?.type ?? typeValue ?? filterTypeConfig[0].value) as FILTER_TYPE,
  );
  const [condition, setCondition] = useState<FILTER_OPERATOR>(
    (filterData?.condition ?? filterConditionConfig[0].value) as FILTER_OPERATOR,
  );
  const [value, setValue] = useState<string[]>(filterData?.value ?? []);

  const reset = useCallback(() => {
    setType((filterData?.type ?? typeValue ?? filterTypeConfig[0].value) as FILTER_TYPE);
    setCondition((filterData?.condition ?? filterConditionConfig[0].value) as FILTER_OPERATOR);
    setValue(filterData?.value ?? []);
  }, [filterData, typeValue, filterTypeConfig, filterConditionConfig]);

  const onCreate = useCallback(() => {
    addFilter({ type, condition, value });
  }, [condition, value, type, addFilter]);

  return (
    <div>
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
          isMcpView={isMcpView}
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
          isMcpView={isMcpView}
        >
          {children}
        </AddFilterPopover>
      )}
    </div>
  );
};

export default AddFilter;
