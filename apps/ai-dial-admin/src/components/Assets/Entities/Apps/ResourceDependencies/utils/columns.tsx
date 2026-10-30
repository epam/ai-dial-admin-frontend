import { ColDef, ValueGetterParams } from 'ag-grid-community';

import FormattedValueCellRenderer from '@/src/components/Grid/CellRenderers/FormattedValueCellRenderer';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getDuplicateOperation, getEditOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ResourceAccess, ResourceDependency } from '@/src/models/dial/resource-dependency';

interface Params {
  t: ReturnType<typeof useI18n>;
  isReadonly?: boolean;
  onEdit: (dependency?: ResourceDependency) => void;
  onDuplicate: (dependency?: ResourceDependency) => void;
  onRemove: (dependency?: ResourceDependency) => void;
}

const ACCESS_LABEL_KEYS: Record<ResourceAccess, ResourceDependenciesI18nKey> = {
  [ResourceAccess.Read]: ResourceDependenciesI18nKey.Read,
  [ResourceAccess.Write]: ResourceDependenciesI18nKey.Write,
};

// Declaration order is part of what Core approves, so the grid never re-sorts or filters rows.
const TEXT_COLUMN: ColDef = {
  cellRenderer: FormattedValueCellRenderer,
  sortable: false,
  filter: false,
  floatingFilter: false,
};

export const getDependencyColumns = ({ t, isReadonly, onEdit, onDuplicate, onRemove }: Params): ColDef[] => {
  const columns: ColDef[] = [
    {
      ...TEXT_COLUMN,
      colId: 'link_id',
      headerName: t(ResourceDependenciesI18nKey.LinkId),
      valueGetter: ({ data }: ValueGetterParams<ResourceDependency>) => data?.link_id,
      flex: 1,
    },
    {
      ...TEXT_COLUMN,
      colId: 'path',
      headerName: t(ResourceDependenciesI18nKey.TargetPath),
      valueGetter: ({ data }: ValueGetterParams<ResourceDependency>) => data?.target?.path,
      flex: 2,
    },
    {
      ...TEXT_COLUMN,
      colId: 'access',
      headerName: t(ResourceDependenciesI18nKey.Access),
      valueGetter: ({ data }: ValueGetterParams<ResourceDependency>) => data?.access,
      valueFormatter: ({ value }) =>
        ((value as ResourceAccess[]) ?? []).map((right) => t(ACCESS_LABEL_KEYS[right])).join(', '),
      flex: 1,
    },
    {
      ...TEXT_COLUMN,
      colId: 'required',
      headerName: t(ResourceDependenciesI18nKey.Required),
      valueGetter: ({ data }: ValueGetterParams<ResourceDependency>) => !!data?.required,
      valueFormatter: ({ value }) => t(value ? ResourceDependenciesI18nKey.Yes : ResourceDependenciesI18nKey.No),
      width: 120,
    },
  ];

  if (!isReadonly) {
    columns.push(
      { ...ONE_ACTION_COLUMN(getEditOperation(onEdit)), colId: 'edit', floatingFilter: false },
      { ...ONE_ACTION_COLUMN(getDuplicateOperation(onDuplicate)), colId: 'duplicate', floatingFilter: false },
      {
        ...ONE_ACTION_COLUMN(getRemoveOperation(onRemove, undefined, 'text-error w-4 h-4')),
        colId: 'remove',
        floatingFilter: false,
      },
    );
  }

  return columns;
};
