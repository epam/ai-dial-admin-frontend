'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { PrimaryButton, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ResourceDependency } from '@/src/models/dial/resource-dependency';
import { MAX_DECLARED_DEPENDENCIES } from './constants';
import { getDependencyColumns } from './utils/columns';
import { isDependencyLimitReached } from './utils/validate-dependency';

interface Props {
  dependencies: ResourceDependency[];
  onAdd: () => void;
  onEdit: (dependency?: ResourceDependency) => void;
  onDuplicate: (dependency?: ResourceDependency) => void;
  onRemove: (dependency?: ResourceDependency) => void;
}

const GRID_OPTIONS: GridOptions = {
  suppressCellFocus: true,
  suppressHeaderFocus: true,
};

const DependenciesGrid: FC<Props> = ({ dependencies, onAdd, onEdit, onDuplicate, onRemove }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const gridApiRef = useRef<GridApi | null>(null);
  const isLimitReached = isDependencyLimitReached(dependencies.length);

  const columns = useMemo(
    () => getDependencyColumns({ t, isReadonly: isReadOnlyAdmin, onEdit, onDuplicate, onRemove }),
    [t, isReadOnlyAdmin, onEdit, onDuplicate, onRemove],
  );

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api ?? null;
      event.api?.updateGridOptions({ columnDefs: columns, rowData: dependencies });
    },
    [columns, dependencies],
  );

  useEffect(() => {
    if (gridApiRef.current && !gridApiRef.current.isDestroyed()) {
      gridApiRef.current.updateGridOptions({ columnDefs: columns, rowData: dependencies });
    }
  }, [columns, dependencies]);

  const addButton = (
    <PrimaryButton
      iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      label={t(ResourceDependenciesI18nKey.AddDependency)}
      disabled={isLimitReached}
      onClick={onAdd}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4 flex flex-row items-center justify-between h-[42px]">
        <h1>{t(ResourceDependenciesI18nKey.Header, { count: dependencies.length })}</h1>
        {!isReadOnlyAdmin &&
          (isLimitReached ? (
            <Tooltip tooltip={t(ResourceDependenciesI18nKey.AddLimitReached, { max: MAX_DECLARED_DEPENDENCIES })}>
              {addButton}
            </Tooltip>
          ) : (
            addButton
          ))}
      </div>
      <div className="flex-1 min-h-0">
        <GridView
          emptyDataProps={{ title: t(ResourceDependenciesI18nKey.NoDependencies) }}
          onGridReady={onGridReady}
          additionalGridOptions={GRID_OPTIONS}
          getIsEmptyData={() => !dependencies.length}
        />
      </div>
    </div>
  );
};

export default DependenciesGrid;
