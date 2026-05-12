import React, { FC, ReactElement, use, useCallback, useEffect, useMemo, useState } from 'react';
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
  projects: SelectOption[];
  entities: SelectOption[];
  children: ReactElement;
  filterData?: FilterData;
  route: ApplicationRoute;
  isMcpView?: boolean;
  isRouteView?: boolean;
}

const AddFilter: FC<Props> = ({
  addFilter,
  projects,
  entities,
  children,
  filterData,
  route,
  isRouteView = false,
  isMcpView = false,
}) => {
  const isMobile = useIsMobileScreen();
  const t = useI18n();
  const filterTypeConfig = getFilterTypeConfig(t, isMcpView, isRouteView);
  const filterConditionConfig = getFilterConditionConfig(t);

  const typeValue = useMemo(() => {
    return route === ApplicationRoute.Dashboard
      ? filterTypeConfig[0].value
      : filterTypeConfig.find((item) => item.value === FILTER_TYPE.Project)?.value;
  }, [route, filterTypeConfig]);

  const initialType = useMemo(() => {
    return (filterData?.type ?? typeValue ?? filterTypeConfig[0].value) as FILTER_TYPE;
  }, [filterData, typeValue, filterTypeConfig]);

  const [type, setType] = useState<FILTER_TYPE>(initialType);

  const [condition, setCondition] = useState<FILTER_OPERATOR>(
    (filterData?.condition ?? filterConditionConfig[0].value) as FILTER_OPERATOR,
  );
  const [value, setValue] = useState<string[]>(filterData?.value ?? []);

  useEffect(() => {
    setType(initialType);
  }, [isRouteView, isMcpView, initialType]);

  const reset = useCallback(() => {
    setType(initialType);
    setCondition((filterData?.condition ?? filterConditionConfig[0].value) as FILTER_OPERATOR);
    setValue(filterData?.value ?? []);
  }, [filterData, initialType, filterConditionConfig]);

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
          projects={projects}
          entities={entities}
          reset={reset}
          route={route}
          isMcpView={isMcpView}
          isRouteView={isRouteView}
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
          projects={projects}
          entities={entities}
          reset={reset}
          route={route}
          isMcpView={isMcpView}
          isRouteView={isRouteView}
        >
          {children}
        </AddFilterPopover>
      )}
    </div>
  );
};

export default AddFilter;
