'use client';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent, RowSelectedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getEmptyStateContent } from '@/src/components/Assets/BaseAssetList/utils';
import DeletePlatformAssetsModal from '@/src/components/Assets/Modals/DeletePlatformAssetsModal';
import DuplicatePlatformAsset from '@/src/components/Assets/Modals/DuplicatePlatformAsset';
import DuplicatePlatformKeyModal from '@/src/components/Assets/Platform/Keys/DuplicatePlatformKeyModal';
import { isItemOpenable } from '@/src/components/Common/FileManager/utils';
import RadioNameCellRenderer from '@/src/components/Grid/CellRenderers/RadioNameCellRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ASSETS_ROW_HEIGHT } from '@/src/components/Grid/constants';
import { MULTI_ROW_SELECTION, SINGLE_ROW_SELECTION_NO_CHECKBOX } from '@/src/constants/ag-grid';
import { ENTITIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetTabsI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialKeyResource, PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { appendUrlQuery, getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getFlatAssetColumns } from './columns';
import { FlatAssets, FlatAssetSource } from './models';
import { PlatformModalType, usePlatformAssetActions } from './use-platform-asset-actions';

interface Props {
  view: ApplicationRoute;
  source: FlatAssetSource;
  assets: FlatAssets;
  /** Select mode: a plain multi-select list with no row actions, for a picker. */
  isSelectMode?: boolean;
  /** Select mode: one row at a time, as a radio, instead of a multi-select list. */
  isSingleSelect?: boolean;
  /** Select mode: the names that should show as selected, so a name picked on another tab shows here too. */
  selectedNames?: ReadonlySet<string>;
  /** Reports the rows the user has selected; a selection applied from `selectedNames` is not reported back. */
  onSelectionChange?: (rows: AssetListItem[]) => void;
  onGridApiChange?: (api: GridApi | null) => void;
}

const SELECT_RADIO_GROUP_NAME = 'flat-asset-selection';
const SELECT_ICON_SIZE = 28;

/**
 * The flat grid behind a listing's Platform and config.json tabs, and its Public tab where that is flat too: no
 * tree, no folders. Platform and Public rows can be duplicated and deleted; config.json rows are read-only and only
 * open.
 */
const FlatAssetGrid: FC<Props> = ({
  view,
  source,
  assets,
  isSelectMode,
  isSingleSelect,
  selectedNames,
  onSelectionChange,
  onGridApiChange,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const canWrite = source !== AssetSource.ConfigFile && !isReadOnlyAdmin && !isSelectMode;

  const actions = usePlatformAssetActions({ view, source, refetch: assets.refetch });
  const { onOpenDuplicate, onOpenDelete } = actions;

  // A config.json row opens read-only through `configFile=true`; Catalog Schemas resolve by `$id` instead.
  const getHref = useCallback(
    (row?: unknown) => {
      const item = row as AssetListItem | undefined;
      if (!item?.name || !isItemOpenable(view, item.name)) {
        return undefined;
      }

      const url = getUrnForEntity(view, item);
      return source === AssetSource.ConfigFile && view !== ApplicationRoute.PlatformCatalogSchemas
        ? appendUrlQuery(url, 'configFile=true')
        : url;
    },
    [view, source],
  );

  const onOpenInNewTab = useCallback(
    (row?: AssetListItem) => {
      const href = getHref(row);
      if (href) {
        window.open(href, '_blank');
      }
    },
    [getHref],
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    // A picker row is chosen, not opened, so its name is not a link.
    const columns = getFlatAssetColumns(view, source, isSelectMode ? () => undefined : getHref, {
      name: t(AssetTabsI18nKey.NameColumn),
      costObject: t(PolicyAssignmentsI18nKey.CostObject),
    });
    if (isSelectMode) {
      // A single pick puts the radio inside the name cell (as the other radio pickers do), so there is no
      // separate selection column to leave empty.
      return isSingleSelect
        ? columns.map((column, index) =>
            index === 0
              ? {
                  ...column,
                  cellRenderer: RadioNameCellRenderer,
                  cellRendererParams: {
                    groupName: SELECT_RADIO_GROUP_NAME,
                    idField: 'name',
                    iconSize: SELECT_ICON_SIZE,
                  },
                  tooltipValueGetter: () => undefined,
                }
              : column,
          )
        : columns;
    }

    return ENTITIES_COLUMNS<AssetListItem>(
      columns,
      canWrite ? (row) => onOpenDelete(row ? [row] : []) : undefined,
      canWrite ? onOpenDuplicate : undefined,
      onOpenInNewTab,
    );
  }, [view, source, getHref, t, isSelectMode, isSingleSelect, canWrite, onOpenDelete, onOpenDuplicate, onOpenInNewTab]);

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      // A selection the picker applied from `selectedNames` is already known to it.
      if (event.source === 'api') {
        return;
      }

      onSelectionChange?.(event.api.getSelectedRows() as AssetListItem[]);
    },
    [onSelectionChange],
  );

  // `RadioNameCellRenderer` reads the node's selection state on render, so the row is refreshed when it changes.
  const onRowSelected = useCallback((event: RowSelectedEvent) => {
    event.api.refreshCells({ rowNodes: [event.node], force: true });
  }, []);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      onGridApiChange?.(event.api);
    },
    [onGridApiChange],
  );

  useEffect(() => {
    if (!isSelectMode || !selectedNames || !gridApi || gridApi.isDestroyed()) {
      return;
    }

    gridApi.forEachNode((node) => {
      const shouldSelect = selectedNames.has(node.data?.name);
      if (node.isSelected() !== shouldSelect) {
        node.setSelected(shouldSelect, false, 'api');
      }
    });
  }, [gridApi, isSelectMode, selectedNames, assets.rows]);

  const names = useMemo(() => assets.rows.map((row) => row.name), [assets.rows]);
  const emptyState = getEmptyStateContent(view, t);
  // The description points at the Create button, which a picker and the read-only config.json tab do not have.
  const emptyDescription = isSelectMode || source === AssetSource.ConfigFile ? '' : emptyState.description;

  if (assets.isLoading && assets.rows.length === 0) {
    return <Spinner size={40} fullWidth />;
  }

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <GridView
          rowData={assets.rows}
          columnDefs={columnDefs}
          storageKey={`${view}:${source}`}
          getRowId={({ data }) => data.path || data.name}
          getHref={isSelectMode ? undefined : getHref}
          emptyDataProps={{ title: emptyState.title, description: emptyDescription }}
          additionalGridOptions={{
            ...(isSelectMode ? (isSingleSelect ? SINGLE_ROW_SELECTION_NO_CHECKBOX : MULTI_ROW_SELECTION) : {}),
            rowHeight: ASSETS_ROW_HEIGHT,
            ...(isSelectMode && isSingleSelect ? { onRowSelected } : {}),
            onSelectionChanged,
          }}
          onGridReady={onGridReady}
        />
      </div>
      {actions.modalType === PlatformModalType.Duplicate &&
        actions.duplicateItem &&
        (view === ApplicationRoute.PlatformKeys ? (
          <DuplicatePlatformKeyModal
            isOpen
            names={names}
            entity={actions.duplicateItem as unknown as DialKeyResource}
            onClose={actions.onCloseModal}
          />
        ) : (
          <DuplicatePlatformAsset
            view={view}
            isModalOpen
            names={names}
            entity={actions.duplicateItem as unknown as PlatformAsset}
            onClose={actions.onCloseModal}
            onDuplicate={(asset) => actions.onDuplicate(asset as unknown as AssetWithVersion)}
          />
        ))}
      {actions.modalType === PlatformModalType.Delete && actions.deletedItems && (
        <DeletePlatformAssetsModal
          view={view}
          isOpen
          itemsToDelete={actions.deletedItems as never}
          onRemove={actions.onDelete}
          onClose={actions.onCloseModal}
        />
      )}
    </div>
  );
};

export default FlatAssetGrid;
