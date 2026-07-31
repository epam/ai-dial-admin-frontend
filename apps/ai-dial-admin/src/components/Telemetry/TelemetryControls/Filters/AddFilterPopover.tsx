import React, { Dispatch, FC, ReactElement, SetStateAction } from 'react';
import { SelectOption } from '@epam/ai-dial-ui-kit';

import FilterEditorPopover from '@/src/components/Common/FilterEditor/FilterEditorPopover';
import CreateFilter from '@/src/components/Telemetry/TelemetryControls/Filters/CreateFilter';
import { ApplicationRoute } from '@/src/types/routes';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';

interface Props {
  type: FILTER_TYPE;
  condition: FILTER_OPERATOR;
  value: string[];
  setType: Dispatch<SetStateAction<FILTER_TYPE>>;
  setCondition: Dispatch<SetStateAction<FILTER_OPERATOR>>;
  setValue: Dispatch<SetStateAction<string[]>>;
  onCreate: () => void;
  projects: SelectOption[];
  entities: SelectOption[];
  reset: () => void;
  children: ReactElement;
  route: ApplicationRoute;
  isMcpView?: boolean;
  isRouteView?: boolean;
}

const AddFilterPopover: FC<Props> = ({
  type,
  setType,
  setValue,
  value,
  setCondition,
  condition,
  onCreate,
  projects,
  entities,
  reset,
  children,
  route,
  isMcpView = false,
  isRouteView = false,
}) => {
  const isComplete = Boolean(type && condition && value.length > 0 && value.some((v) => v.trim() !== ''));

  return (
    <FilterEditorPopover
      isComplete={isComplete}
      onCommit={onCreate}
      onCancel={reset}
      editor={(onClose) => (
        <CreateFilter
          onClose={onClose}
          type={type}
          condition={condition}
          value={value}
          setType={setType}
          setCondition={setCondition}
          setValue={setValue}
          projects={projects}
          entities={entities}
          route={route}
          isMcpView={isMcpView}
          isRouteView={isRouteView}
        />
      )}
    >
      {children}
    </FilterEditorPopover>
  );
};

export default AddFilterPopover;
