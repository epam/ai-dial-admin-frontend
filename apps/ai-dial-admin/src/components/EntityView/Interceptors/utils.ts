import { ColDef } from 'ag-grid-community';

import { ACTION_COLUMN, DRAGGABLE_COL_DEF, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { withSourceColumn } from '@/src/utils/config-entities/source-column';
import { AssetInterceptorOrigin, AssetInterceptorTagged } from './models';

export const getInterceptorsGridData = (
  interceptors?: BaseEntity[],
  interceptorNames?: string[] | null,
): BaseEntity[] => {
  return (
    interceptorNames
      ?.map((name) => interceptors?.find((interceptor) => interceptor.name === name) as BaseEntity)
      .filter(Boolean) || []
  );
};

/**
 * Merges the admin-BE-tracked interceptor population with the `Assets > Interceptors` population
 * into one option list, each option tagged with `AssetInterceptorOrigin`. A name present in both
 * populations yields two distinguishable rows rather than one option silently shadowing the other.
 */
export const mergeInterceptorOrigins = (
  entityInterceptors: DialInterceptor[],
  assetInterceptors: DialInterceptorResource[],
): (BaseEntity & AssetInterceptorTagged)[] => [
  ...entityInterceptors.map((interceptor) => ({
    ...interceptor,
    assetOrigin: AssetInterceptorOrigin.Entity,
  })),
  ...assetInterceptors.map((interceptor) => ({
    ...interceptor,
    assetOrigin: AssetInterceptorOrigin.Asset,
  })),
];

const ASSET_ORIGIN_LABEL: Record<AssetInterceptorOrigin, string> = {
  [AssetInterceptorOrigin.Entity]: 'Entity',
  [AssetInterceptorOrigin.Asset]: 'Asset',
};

const ASSET_SOURCE_COLUMN_ID = 'assetOrigin';

const ASSET_SOURCE_COLUMN: ColDef = {
  field: ASSET_SOURCE_COLUMN_ID,
  colId: ASSET_SOURCE_COLUMN_ID,
  headerName: 'Source',
  hide: false,
  maxWidth: 180,
  valueGetter: ({ data }) => ASSET_ORIGIN_LABEL[data?.[ASSET_SOURCE_COLUMN_ID] as AssetInterceptorOrigin] ?? '',
};

/** Whether a row set carries `assetOrigin` — driven by the data, like `hasConfigEntityOrigin`. */
export const hasAssetInterceptorOrigin = <T>(rows?: T[] | null): boolean =>
  !!rows?.some((row) => !!(row as Record<string, unknown>)?.[ASSET_SOURCE_COLUMN_ID]);

export const withAssetSourceColumn = (columns: ColDef[], rows?: unknown[] | null): ColDef[] =>
  hasAssetInterceptorOrigin(rows) ? [...columns, ASSET_SOURCE_COLUMN] : columns;

export const getInterceptorsColumnDefs = (
  /** Omitted on Core-sourced surfaces, where no admin-BE detail page exists to open. */
  open: ((entity?: BaseEntity) => void) | undefined,
  remove?: (entity?: BaseEntity, index?: number) => void,
  startIndex?: number,
  rows?: BaseEntity[] | null,
): ColDef[] => {
  const actions = open ? [getOpenInNewTabOperation(open)] : [];
  if (remove) {
    actions.push(getRemoveOperation(remove));
  }
  const columns: ColDef[] = [
    remove ? DRAGGABLE_COL_DEF : UTILITY_COLUMN,
    {
      headerName: 'Order',
      field: 'order',
      valueGetter: (params) => (params.node?.rowIndex || 0) + 1 + (startIndex || 0),
      width: 60,
      maxWidth: 60,
      minWidth: 60,
      filter: false,
      floatingFilter: false,
    },
    DISPLAY_NAME_COLUMN,
    ...withAssetSourceColumn(withSourceColumn([DESCRIPTION_COLUMN], rows), rows),
    ACTION_COLUMN(actions),
  ];

  return [...columns];
};
