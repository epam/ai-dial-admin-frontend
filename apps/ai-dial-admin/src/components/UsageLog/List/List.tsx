import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { getTracesListingData } from '@/src/utils/telemetry';
import { useI18n } from '@/src/locales/client';
import { IconColumns2, IconFileArrowRight } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { logger } from 'nx/src/utils/logger';

import Button from '@/src/components/Common/Button/Button';
import ListView from '@/src/components/ListView/ListView';
import ResetFiltersButton from '@/src/components/EntityListView/HeaderButtons/ResetFiltersButton';
import Loader from '@/src/components/Common/Loader/Loader';

interface Props {
  route: ApplicationRoute;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query: TelemetryQuery;
  columnDefs: ColDef[];
  title: string;
  emptyDataTitle: string;
}

const List: FC<Props> = ({ route, getData, query, columnDefs, title, emptyDataTitle }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const [data, setData] = useState<Record<string, string>[] | undefined>(void 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel((prev) => !prev), [setShowColumnsPanel]);

  const gridOptions: GridOptions = {
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        // TODO: Details view
      }
    },
  };

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await getData(query);
      if (response.success) {
        const data = getTracesListingData(response.response as TelemetryData);
        setData(data);
      } else {
        setData(void 0);
      }
      setLoading(false);
    };

    fetchData().catch((error) => logger.error(`Getting usage log view data error: ${error}`));
  }, [getData, query]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  if (!data?.length && loading) {
    return <Loader size={40} />;
  }

  return (
    <ListView
      data={data}
      columnDefs={columnDefs}
      title={title}
      emptyDataTitle={emptyDataTitle}
      additionalGridOptions={gridOptions}
      showColumnsPanel={showColumnsPanel}
      toggleColumnsPanel={toggleColumnsPanel}
      view={route}
      onGridReady={onGridReady}
    >
      <div className="flex gap-4">
        <ResetFiltersButton gridApi={gridApi} />
        {!!data?.length && (
          <Button
            cssClass="tertiary"
            title={t(ButtonsI18nKey.Columns)}
            iconBefore={<IconColumns2 {...BASE_ICON_PROPS} />}
            onClick={onToggleColumnsPanel}
          />
        )}
        <Button
          cssClass="secondary"
          title={t(ButtonsI18nKey.Export)}
          iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
          onClick={() => {
            /*TODO: Export*/
          }}
        />
      </div>
    </ListView>
  );
};

export default List;
