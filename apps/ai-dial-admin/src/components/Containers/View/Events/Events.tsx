import { FC, MouseEvent, useCallback, useEffect, useState } from 'react';
import { GridApi } from 'ag-grid-community';
import { IconColumns2 } from '@tabler/icons-react';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { KubEvent } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import ListView from '@/src/components/ListView/ListView';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import ResetFiltersButton from '@/src/components/EntityListView/HeaderButtons/ResetFiltersButton';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { CONTAINER_EVENTS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  route: ApplicationRoute;
  events: KubEvent[];
}

const Events: FC<Props> = ({ route, events }) => {
  const t = useI18n();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel(!showColumnsPanel), [showColumnsPanel]);
  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  return (
    <div className="h-full flex">
      <ListView
        view={route}
        data={events}
        allowPadding={false}
        columnDefs={CONTAINER_EVENTS(t)}
        title={t(TabsI18nKey.Events)}
        emptyDataTitle={t(EntitiesI18nKey.NoEvents)}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        onGridReady={onGridReady}
        storageKey={`${route}/events`}
      >
        <div className="flex gap-4">
          {!!events.length && (
            <>
              <ResetFiltersButton gridApi={gridApi} />
              <DialGhostButton
                label={t(ButtonsI18nKey.Columns)}
                iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onToggleColumnsPanel}
              />
            </>
          )}
        </div>
      </ListView>
    </div>
  );
};

export default Events;
