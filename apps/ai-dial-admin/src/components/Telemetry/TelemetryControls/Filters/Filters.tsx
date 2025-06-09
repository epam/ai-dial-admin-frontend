import React, { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';

import AddFilter from '@/src/components/Telemetry/TelemetryControls/Filters/AddFilter';
import Filter from '@/src/components/Telemetry/TelemetryControls/Filters/Filter';
import { FilterData, TelemetryQuery } from '@/src/models/telemetry';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ServerActionResponse } from '@/src/models/server-action';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ENTITY_QUERY, PROJECT_QUERY } from '@/src/constants/telemetry';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import Button from '@/src/components/Common/Button/Button';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  filters: FilterData[];
  setFilters: Dispatch<SetStateAction<FilterData[]>>;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  route: ApplicationRoute;
}

const Filters: FC<Props> = ({ filters, setFilters, getData, route }) => {
  const t = useI18n();
  const [projects, setProjects] = useState<DropdownItemsModel[]>([]);
  const [entities, setEntities] = useState<DropdownItemsModel[]>([]);

  useEffect(() => {
    const fetch = async (query: TelemetryQuery): Promise<{ data: string[][] }> => {
      const response = await getData(query);
      if (response.success) {
        return response.response as { data: string[][] };
      }
      return { data: [] };
    };

    Promise.all([fetch(PROJECT_QUERY), fetch(ENTITY_QUERY)]).then((responses) => {
      const { data: projectData } = responses[0];
      const { data: entityData } = responses[1];

      if (projectData?.length) {
        setProjects(
          projectData.map((arr: string[]) => {
            return { id: arr[0], name: arr[0] };
          }),
        );
      }
      if (entityData?.length) {
        setEntities(
          entityData.map((arr: string[]) => {
            return { id: arr[0], name: arr[0] };
          }),
        );
      }
    });
  }, [getData]);

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
      {!!filters?.length &&
        filters.map((filter, index) => (
          <Filter
            key={index}
            filterData={filter}
            id={index}
            onClose={onDelete}
            onEdit={addFilter}
            dropdownData={{ projects, entities }}
            route={route}
          />
        ))}
      <AddFilter addFilter={addFilter} dropdownData={{ projects, entities }} route={route}>
        <Button
          title={t(TelemetryI18nKey.AddFilter)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          cssClass="tertiary"
          dataTestId={'dashboard-add-filter'}
        />
      </AddFilter>
    </>
  );
};

export default Filters;
