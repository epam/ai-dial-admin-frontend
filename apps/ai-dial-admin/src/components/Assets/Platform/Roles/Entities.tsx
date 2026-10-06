'use client';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation, getSetNoLimitsOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRoleResource } from '@/src/models/dial/resource';
import { DialCoreRoleLimits } from '@/src/models/dial/role-limits';
import { getPlatformRoleModelColumns, MODEL_PICKER_COLUMNS } from './entities-columns';
import { PlatformRoleModelLimitRow, PlatformRoleModelOption } from './models';
import {
  addModelLimits,
  clearModelLimits,
  getAvailableModels,
  getModelLimitRows,
  removeModelLimit,
  updateModelLimit,
} from './utils';

interface Props {
  selectedRole: DialRoleResource;
  models: PlatformRoleModelOption[];
  isSkipRefresh: boolean;
  onChangeRole: (role: DialRoleResource, skipRefresh?: boolean) => void;
}

const RoleEntities: FC<Props> = ({ selectedRole, models, isSkipRefresh, onChangeRole }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [gridApi, setGridApi] = useState<GridApi>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const roleRef = useRef(selectedRole);
  const onChangeRef = useRef(onChangeRole);

  useEffect(() => {
    roleRef.current = selectedRole;
    onChangeRef.current = onChangeRole;
  }, [onChangeRole, selectedRole]);

  const data = useMemo(() => getModelLimitRows(selectedRole.limits), [selectedRole.limits]);
  const availableModels = useMemo(() => getAvailableModels(models, selectedRole.limits), [models, selectedRole.limits]);

  const onChangeModelLimit = useCallback(
    (value: number | string, data: PlatformRoleModelLimitRow, token: keyof DialCoreRoleLimits) => {
      const numericValue = value === '' ? undefined : Number(value);
      if (numericValue !== undefined && !Number.isFinite(numericValue)) {
        return;
      }

      if (numericValue === undefined) {
        delete data[token];
      } else {
        data[token] = numericValue;
      }

      const updatedRole = {
        ...roleRef.current,
        limits: updateModelLimit(roleRef.current.limits, data.name, token, numericValue),
      };
      roleRef.current = updatedRole;
      onChangeRef.current(updatedRole, true);
    },
    [],
  );

  const onSetNoLimitsModel = useCallback((model?: PlatformRoleModelLimitRow) => {
    if (!model) {
      return;
    }

    const updatedRole = {
      ...roleRef.current,
      limits: clearModelLimits(roleRef.current.limits, model.name),
    };
    roleRef.current = updatedRole;
    onChangeRef.current(updatedRole);
  }, []);

  const onRemoveModel = useCallback((model?: PlatformRoleModelLimitRow) => {
    if (!model) {
      return;
    }

    const updatedRole = {
      ...roleRef.current,
      limits: removeModelLimit(roleRef.current.limits, model.name),
    };
    roleRef.current = updatedRole;
    onChangeRef.current(updatedRole);
  }, []);

  const onAddModels = useCallback((models: PlatformRoleModelOption[]) => {
    const updatedRole = {
      ...roleRef.current,
      limits: addModelLimits(roleRef.current.limits, models),
    };
    roleRef.current = updatedRole;
    onChangeRef.current(updatedRole);
    setIsModalOpen(false);
  }, []);

  const columns = useMemo(() => {
    const modelColumns = getPlatformRoleModelColumns(onChangeModelLimit, isReadOnlyAdmin);
    return isReadOnlyAdmin
      ? modelColumns
      : [
          ...modelColumns,
          ACTION_COLUMN([getSetNoLimitsOperation(onSetNoLimitsModel), getRemoveOperation(onRemoveModel)]),
        ];
  }, [isReadOnlyAdmin, onChangeModelLimit, onRemoveModel, onSetNoLimitsModel]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      event.api.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    },
    [columns, data],
  );

  useEffect(() => {
    if (gridApi && !gridApi.isDestroyed()) {
      gridApi.updateGridOptions({ columnDefs: columns });
    }
  }, [columns, gridApi]);

  useEffect(() => {
    if (!isSkipRefresh && gridApi && !gridApi.isDestroyed()) {
      gridApi.updateGridOptions({ rowData: data });
    }
  }, [data, gridApi, isSkipRefresh]);

  return (
    <>
      <div className="size-full flex flex-col">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>
            {t(TabsI18nKey.Entities)}: {data.length}
          </h1>
          {!isReadOnlyAdmin && (
            <DialPrimaryButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              onClick={() => setIsModalOpen(true)}
            />
          )}
        </div>
        <GridView<PlatformRoleModelLimitRow>
          getIsEmptyData={() => data.length === 0}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoModels) }}
          onGridReady={onGridReady}
        />
      </div>
      {!isReadOnlyAdmin &&
        isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(EntitiesI18nKey.AddEntities)}
            emptyTitle={t(EntitiesI18nKey.NoModels)}
            columnDefs={MODEL_PICKER_COLUMNS}
            isModalOpen={isModalOpen}
            entities={availableModels}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddModels}
          />,
          document.body,
        )}
    </>
  );
};

export default RoleEntities;
