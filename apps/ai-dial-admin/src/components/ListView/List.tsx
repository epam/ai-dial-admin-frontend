'use client';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { MouseEvent, useCallback, useEffect, useState } from 'react';

import GridView, { GridViewProps } from '@/src/components/Grid/GridView/GridView';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import ResetFiltersButton from './Header/ResetFiltersButton';

interface Props<T> extends Omit<GridViewProps<T>, 'showColumnsPanel' | 'toggleColumnsPanel' | 'onGridReady'> {
  listLabel?: string;
  className?: string;
  isEnableColumnPanel?: boolean;
}

// TODO: rename to List view
const ListEntities = <T extends object>({
  listLabel,
  isEnableColumnPanel = false,
  className = 'py-4 px-6',
  ...props
}: Props<T>) => {
  const t = useI18n();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const toggleColumnsPanel = useCallback(() => setShowColumnsPanel((prev) => !prev), [setShowColumnsPanel]);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  return (
    <div className={classNames('flex flex-col bg-layer-2 rounded w-full h-full', className)}>
      <div className="flex flex-row flex-wrap justify-between mb-4 items-center h-[40px]">
        {listLabel && <h1>{listLabel}</h1>}

        <div className="flex gap-4">
          <ResetFiltersButton gridApi={gridApi} />
          {isEnableColumnPanel && !!props.rowData?.length && (
            <DialGhostButton
              label={t(ButtonsI18nKey.Columns)}
              iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onToggleColumnsPanel}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <GridView
          showColumnsPanel={showColumnsPanel}
          toggleColumnsPanel={toggleColumnsPanel}
          onGridReady={onGridReady}
          {...props}
        />
      </div>
    </div>
  );
};

export default ListEntities;
