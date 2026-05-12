import { DialGhostButton, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import AddFilter from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilter';
import Filter from '@/src/components/Telemetry/TelemetryControls/Filters/Filter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { getEntityQuery, getProjectQuery, MCP_TABLE_NAME } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  filters: FilterData[];
  setFilters: Dispatch<SetStateAction<FilterData[]>>;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  route: ApplicationRoute;
  isMcpView?: boolean;
  isRouteView?: boolean;
}

const Filters: FC<Props> = ({ filters, setFilters, getData, route, isMcpView = false, isRouteView = false }) => {
  const t = useI18n();
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [entities, setEntities] = useState<SelectOption[]>([]);

  const filtersWithId = useMemo(() => filters.map((filter) => ({ ...filter, id: uuidv4() })), [filters]);

  useEffect(() => {
    const fetch = async (query: TelemetryQuery): Promise<{ data: string[][] }> => {
      const response = await getData(query);
      if (response.success) {
        return response.response as { data: string[][] };
      }
      return { data: [] };
    };

    const tableName = isMcpView ? MCP_TABLE_NAME : undefined;

    Promise.all([fetch(getProjectQuery(tableName)), fetch(getEntityQuery(tableName))]).then((responses) => {
      const { data: projectData } = responses[0];
      const { data: entityData } = responses[1];

      if (projectData?.length) {
        setProjects(
          projectData
            .filter((v) => !!v[0])
            .map((arr: string[]) => {
              return { value: arr[0], label: arr[0] };
            }),
        );
      }
      if (entityData?.length) {
        setEntities(
          entityData
            .filter((v) => !!v[0])
            .map((arr: string[]) => {
              return { value: arr[0], label: arr[0] };
            }),
        );
      }
    });
  }, [getData, isMcpView]);

  const onDelete = useCallback(
    (index: number) => {
      setFilters((prev) => {
        const filters = [...prev];
        filters.splice(index, 1);
        return filters;
      });
    },
    [setFilters],
  );

  const addFilter = useCallback(
    (filter: FilterData, index?: number) => {
      setFilters((prev) => {
        if (index === undefined) {
          return [...prev, filter];
        } else {
          const filters = [...prev];
          filters.splice(index, 1, filter);
          return filters;
        }
      });
    },
    [setFilters],
  );

  return (
    <>
      {!!filtersWithId?.length &&
        filtersWithId.map((filter, index) => (
          <Filter
            key={filter.id}
            filterData={filter}
            id={index}
            onClose={onDelete}
            onEdit={addFilter}
            dropdownData={{ projects, entities }}
            route={route}
            isMcpView={isMcpView}
            isRouteView={isRouteView}
          />
        ))}
      <AddFilter
        addFilter={addFilter}
        dropdownData={{ projects, entities }}
        route={route}
        isMcpView={isMcpView}
        isRouteView={isRouteView}
      >
        <DialGhostButton label={t(TelemetryI18nKey.AddFilter)} iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />} />
      </AddFilter>
    </>
  );
};

export default Filters;
