import { DialGhostButton, DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { getListingData } from '@/src/utils/telemetry';
import { IconColumns2 } from '@tabler/icons-react';

import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import ListView from '@/src/components/ListView/ListView';

interface Props {
  route: ApplicationRoute;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  query: TelemetryQuery;
  columnDefs: ColDef[];
  title: string;
  emptyDataTitle: string;
}

const List: FC<Props> = ({ route, getData, query, columnDefs, title, emptyDataTitle }) => {
  const t = useI18n();

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

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
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
        const data = getListingData(response.response as TelemetryData);

        setData(data);
      } else {
        setData([]);
      }
      setLoading(false);
    };

    fetchData().catch((error) => console.error(`Getting usage log view data error: ${error}`));
  }, [getData, query]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  if (!data?.length && loading) {
    return <DialLoader size={40} />;
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
      storageKey={`${route}/${title}`}
      onGridReady={onGridReady}
    >
      <div className="flex gap-4">
        <ResetFiltersButton gridApi={gridApi} />
        {!!data?.length && (
          <DialGhostButton
            label={t(ButtonsI18nKey.Columns)}
            iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onToggleColumnsPanel}
          />
        )}
      </div>
    </ListView>
  );
};

export default List;
