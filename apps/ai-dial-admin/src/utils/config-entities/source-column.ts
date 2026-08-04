import { ColDef } from 'ag-grid-community';

import { ConfigEntityOrigin } from '@/src/types/config-file-entity';

/**
 * Column showing which of DIAL Core's two populations a row came from.
 *
 * Present because both listings omit a description, so every Description cell on these grids is empty.
 * Without the origin the emptiness reads as missing data; with it, it reads as a property of the source.
 * It also disambiguates the case that makes the reference forms matter — the same name existing in both
 * populations, yielding two rows that are otherwise identical.
 */
const SOURCE_COLUMN_ID = 'origin';

const ORIGIN_LABEL: Record<ConfigEntityOrigin, string> = {
  [ConfigEntityOrigin.Api]: 'API',
  [ConfigEntityOrigin.ConfigFile]: 'Configuration file',
};

const SOURCE_COLUMN: ColDef = {
  field: SOURCE_COLUMN_ID,
  colId: SOURCE_COLUMN_ID,
  headerName: 'Source',
  hide: false,
  maxWidth: 180,
  valueGetter: ({ data }) => ORIGIN_LABEL[data?.[SOURCE_COLUMN_ID] as ConfigEntityOrigin] ?? '',
};

/**
 * Appends the Source column only when the rows actually carry an origin.
 *
 * Deliberately driven by the data rather than by a `view` prop: these grids are shared by roughly
 * fifteen surfaces, and rows built anywhere other than `toConfigEntityRows` have no `origin`, so those
 * surfaces keep their existing columns without needing to know this column exists.
 */
export const withSourceColumn = <T>(columns: ColDef[], rows?: T[] | null): ColDef[] =>
  hasConfigEntityOrigin(rows) ? [...columns, SOURCE_COLUMN] : columns;

/**
 * Whether a row set came from DIAL Core. Used both to add the Source column and to suppress actions
 * that only make sense for admin-backend entities, such as opening an entity's detail page.
 */
export const hasConfigEntityOrigin = <T>(rows?: T[] | null): boolean =>
  !!rows?.some((row) => !!(row as Record<string, unknown>)?.[SOURCE_COLUMN_ID]);
