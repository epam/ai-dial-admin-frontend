import { ColDef } from 'ag-grid-community';

import { ASSET_TYPE_ICONS } from '@/src/components/Assets/BaseAssetList/constants';
import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import { EntityHrefGetter } from '@/src/components/Grid/CellRenderers/models';
import { AUTHOR_COLUMN, CREATED_AT_COLUMN, UPDATED_AT_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { displayNameFilterValue } from '@/src/constants/grid-columns/formatters';
import { nameColumnSizing } from '@/src/constants/grid-columns/configs';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import { getCostObjectOfRecord } from '@/src/utils/policies/path';

const COST_OBJECT_COL_ID = 'costObject';
const ASSET_ICON_SIZE = 28;

/** Policies and assignments are stored under a cost object, shown as a column instead of a folder. */
export const isCostObjectView = (view: ApplicationRoute): boolean =>
  view === ApplicationRoute.PlatformPolicies || view === ApplicationRoute.PlatformPolicyAssignments;

const getNameColumn = (view: ApplicationRoute, getHref: EntityHrefGetter, nameHeader: string): ColDef => ({
  field: 'name',
  colId: 'name',
  headerName: nameHeader,
  cellRenderer: DisplayNameCellRenderer,
  cellRendererParams: { typeIcon: ASSET_TYPE_ICONS[view], iconSize: ASSET_ICON_SIZE, getHref },
  filterValueGetter: ({ data }) => displayNameFilterValue(data),
  ...nameColumnSizing,
});

interface ColumnLabels {
  name: string;
  costObject: string;
}

/**
 * The flat grid's data columns. config.json lists names only (Core's config-file route returns nothing else);
 * Platform adds the metadata every flat platform view already showed, plus the cost object where one applies.
 */
export const getFlatAssetColumns = (
  view: ApplicationRoute,
  source: AssetSource.Platform | AssetSource.ConfigFile,
  getHref: EntityHrefGetter,
  labels: ColumnLabels,
): ColDef[] => {
  const nameColumn = getNameColumn(view, getHref, labels.name);
  if (source === AssetSource.ConfigFile) {
    return [nameColumn];
  }

  const folderColumn: ColDef[] = isCostObjectView(view)
    ? [
        {
          colId: COST_OBJECT_COL_ID,
          headerName: labels.costObject,
          valueGetter: ({ data }) => getCostObjectOfRecord(data?.path),
        },
      ]
    : [];

  return [nameColumn, ...folderColumn, AUTHOR_COLUMN, CREATED_AT_COLUMN, UPDATED_AT_COLUMN];
};
