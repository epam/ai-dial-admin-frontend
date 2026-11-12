'use client';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getEmptyStateContent } from '@/src/components/Assets/BaseAssetList/utils';
import DeletePlatformAssetsModal from '@/src/components/Assets/Modals/DeletePlatformAssetsModal';
import DuplicatePlatformAsset from '@/src/components/Assets/Modals/DuplicatePlatformAsset';
import DuplicatePlatformKeyModal from '@/src/components/Assets/Platform/Keys/DuplicatePlatformKeyModal';
import { isItemOpenable } from '@/src/components/Common/FileManager/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ASSETS_ROW_HEIGHT } from '@/src/components/Grid/constants';
import { MULTI_ROW_SELECTION } from '@/src/constants/ag-grid';
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
import { FlatAssets } from './models';
import { PlatformModalType, usePlatformAssetActions } from './use-platform-asset-actions';

interface Props {
  view: ApplicationRoute;
  source: AssetSource.Platform | AssetSource.ConfigFile;
  assets: FlatAssets;
  /** Select mode: a plain multi-select list with no row actions, for a picker. */
  isSelectMode?: boolean;
  /** Select mode: the names that should show as selected, so a name picked on another tab shows here too. */
  selectedNames?: ReadonlySet<string>;
  /** Reports the rows the user has selected; a selection applied from `selectedNames` is not reported back. */
  onSelectionChange?: (rows: AssetListItem[]) => void;
  onGridApiChange?: (api: GridApi | null) => void;
}

/**
 * The flat grid behind a listing's Platform and config.json tabs: no tree, no folders. Platform rows can be
 * duplicated and deleted; config.json rows are read-only and only open.
 */
const FlatAssetGrid: FC<Props> = ({
  view,
  source,
  assets,
  isSelectMode,
  selectedNames,
  onSelectionChange,
  onGridApiChange,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const isPlatform = source === AssetSource.Platform;
  const canWrite = isPlatform && !isReadOnlyAdmin && !isSelectMode;

  const actions = usePlatformAssetActions({ view, refetch: assets.refetch });
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
    const columns = getFlatAssetColumns(view, source, getHref, {
      name: t(AssetTabsI18nKey.NameColumn),
      costObject: t(PolicyAssignmentsI18nKey.CostObject),
    });
    if (isSelectMode) {
      return columns;
    }

    return ENTITIES_COLUMNS<AssetListItem>(
      columns,
      canWrite ? (row) => onOpenDelete(row ? [row] : []) : undefined,
      canWrite ? onOpenDuplicate : undefined,
      onOpenInNewTab,
    );
  }, [view, source, getHref, t, isSelectMode, canWrite, onOpenDelete, onOpenDuplicate, onOpenInNewTab]);

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
          getHref={getHref}
          emptyDataProps={{ title: emptyState.title, description: emptyState.description }}
          additionalGridOptions={{
            ...(isSelectMode ? MULTI_ROW_SELECTION : {}),
            rowHeight: ASSETS_ROW_HEIGHT,
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
