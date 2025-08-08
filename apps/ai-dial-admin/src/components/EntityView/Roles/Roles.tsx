import { Column, GridApi, IRowNode } from 'ag-grid-community';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { BasicI18nKey, EntitiesI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialRoleLimits, DialRoleLimitsMap } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import RolesGrid from '@/src/components/EntityView/Roles/RolesGrid';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import AlertInfo from '@/src/components/Common/Alerts/AlertInfo';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';

interface Props {
  view: ApplicationRoute;
  entity: DialBaseEntity;
  isSkipRefresh: boolean;
  roles: DialRole[];
  onChangeEntity: (entity: DialBaseEntity, withRefresh?: boolean) => void;
}

const EntityRoles: FC<Props> = ({ entity, roles, onChangeEntity, isSkipRefresh }) => {
  const t = useI18n();

  const [addModalState, setAddModalState] = useState(PopUpState.Closed);
  const [availableRoles, setAvailableRoles] = useState<DialRole[]>([]);

  const entityRef = useRef(entity);

  useEffect(() => {
    const roleLimits = [...Object.keys(entity?.roleLimits || {})];
    setAvailableRoles(roles.filter((role) => !roleLimits.includes(role.name as string)));
  }, [entity, roles]);

  useEffect(() => {
    entityRef.current = entity;
  }, [entity]);

  const onChangeDefaultLimit = useCallback(
    (value: number | string, key: keyof DialRoleLimits) => {
      onChangeEntity({
        ...entity,
        defaultRoleLimit: { ...entity.defaultRoleLimit, [key]: value },
      });
    },
    [entity, onChangeEntity],
  );

  const onChangeDayDefaultLimit = useCallback(
    (day: number | string) => {
      onChangeDefaultLimit(day, 'day');
    },
    [onChangeDefaultLimit],
  );

  const onChangeWeekDefaultLimit = useCallback(
    (week: number | string) => {
      onChangeDefaultLimit(week, 'week');
    },
    [onChangeDefaultLimit],
  );

  const onChangeMonthDefaultLimit = useCallback(
    (month: number | string) => {
      onChangeDefaultLimit(month, 'month');
    },
    [onChangeDefaultLimit],
  );

  const onChangeMinuteDefaultLimit = useCallback(
    (minute: number | string) => {
      onChangeDefaultLimit(minute, 'minute');
    },
    [onChangeDefaultLimit],
  );

  const onChangeRoleToken = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      onChangeEntity(
        {
          ...entity,
          roleLimits: {
            ...entityRef.current.roleLimits,
            [name]: {
              ...entityRef.current.roleLimits?.[name],
              [token]: value.toString(),
            },
          } as DialRoleLimitsMap,
        },
        true,
      );
    },
    [onChangeEntity, entity],
  );

  const onAddRoles = useCallback(
    (roles: DialRole[]) => {
      const newRoles = {} as Record<string, DialRoleLimits>;
      roles.forEach((role) => {
        newRoles[role.name as string] = {
          ...entity.defaultRoleLimit,
        };
      });

      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entity.roleLimits,
          ...newRoles,
        } as DialRoleLimitsMap,
      });
      setAddModalState(PopUpState.Closed);
    },
    [entity, onChangeEntity, setAddModalState],
  );

  const onRemoveRole = useCallback(
    (role: DialRole) => {
      const newLimits = { ...(entity.roleLimits || {}) };
      delete newLimits[role.name as string];

      onChangeEntity({
        ...entity,
        roleLimits: {
          ...newLimits,
        } as DialRoleLimitsMap,
      });
    },
    [entity, onChangeEntity],
  );

  const onResetToDefaultRole = useCallback(
    (role: DialRole) => {
      const defaultRoleLimit = entity.defaultRoleLimit;
      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entityRef.current.roleLimits,
          [role.name as string]: {
            ...entityRef.current.roleLimits?.[role.name as string],
            ...defaultRoleLimit,
          },
        } as DialRoleLimitsMap,
      });
    },
    [onChangeEntity, entity],
  );

  const onResetAllRolesToDefault = useCallback(() => {
    const defaultRoleLimit = entity.defaultRoleLimit;
    const updatedRoleLimits: Record<string, DialRoleLimits> = {};

    Object.keys(entityRef.current.roleLimits || {}).forEach((roleName) => {
      updatedRoleLimits[roleName] = {
        ...defaultRoleLimit,
      };
    });
    onChangeEntity({
      ...entity,
      roleLimits: updatedRoleLimits,
    });
  }, [onChangeEntity, entity]);

  const onSetNoLimits = useCallback(
    (role: DialRole) => {
      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entityRef.current.roleLimits,
          [role.name as string]: {
            ...entityRef.current.roleLimits?.[role.name as string],
            day: null,
            minute: null,
            month: null,
            week: null,
          },
        } as DialRoleLimitsMap,
      });
    },
    [onChangeEntity, entity],
  );

  const onOpenAddModal = useCallback(() => {
    setAddModalState(PopUpState.Opened);
  }, [setAddModalState]);

  const onCloseAddModal = useCallback(() => {
    setAddModalState(PopUpState.Closed);
  }, [setAddModalState]);

  const onOpen = (role: DialRole) => {
    onOpenInNewTab(ApplicationRoute.Roles, role);
  };

  const isResetToDefaultHidden = (api: GridApi, node: IRowNode) => {
    const minute = api.getCellValue({
      colKey: api.getColumn('minute') as Column,
      rowNode: node,
    });
    const day = api.getCellValue({
      colKey: api.getColumn('day') as Column,
      rowNode: node,
    });
    const defaultDay = entity.defaultRoleLimit?.day;
    const defaultMinute = entity.defaultRoleLimit?.minute;
    return (day === defaultDay && minute === defaultMinute) || !defaultDay || !defaultMinute;
  };

  const isSetNoLimitsHidden = (api: GridApi, node: IRowNode) => {
    const month = api.getCellValue({
      colKey: api.getColumn('month') as Column,
      rowNode: node,
    });
    const week = api.getCellValue({
      colKey: api.getColumn('week') as Column,
      rowNode: node,
    });
    const minute = api.getCellValue({
      colKey: api.getColumn('minute') as Column,
      rowNode: node,
    });
    const day = api.getCellValue({
      colKey: api.getColumn('day') as Column,
      rowNode: node,
    });
    return !day && !minute && !month && !week;
  };

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex flex-col flex-1 min-h-0 divide-y divide-primary">
        <div className="flex flex-col mb-8">
          <h1 className="mb-4">{t(BasicI18nKey.Settings)}</h1>
          <div className="flex flex-row gap-x-3">
            <NumberInputField
              elementId="minute"
              value={entity.defaultRoleLimit?.minute}
              placeholder={t(RolesI18nKey.NoLimits)}
              fieldTitle={t(RolesI18nKey.TokensPerMinute)}
              onChange={onChangeMinuteDefaultLimit}
            />
            <NumberInputField
              elementId="day"
              placeholder={t(RolesI18nKey.NoLimits)}
              value={entity.defaultRoleLimit?.day}
              fieldTitle={t(RolesI18nKey.TokensPerDay)}
              onChange={onChangeDayDefaultLimit}
            />
            <NumberInputField
              elementId="week"
              placeholder={t(RolesI18nKey.NoLimits)}
              value={entity.defaultRoleLimit?.week}
              fieldTitle={t(RolesI18nKey.TokensPerWeek)}
              onChange={onChangeWeekDefaultLimit}
            />
            <NumberInputField
              elementId="month"
              placeholder={t(RolesI18nKey.NoLimits)}
              value={entity.defaultRoleLimit?.month}
              fieldTitle={t(RolesI18nKey.TokensPerMonth)}
              onChange={onChangeMonthDefaultLimit}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 pt-8 mb-4">
          <RolesGrid
            entity={entity}
            roles={roles}
            onChangeEntity={onChangeEntity}
            onChangeTokensValue={onChangeRoleToken}
            onOpenAddModal={onOpenAddModal}
            onOpenInNewTab={onOpen}
            onRemoveRole={onRemoveRole}
            onResetToDefaultRole={onResetToDefaultRole}
            onResetAllRolesToDefault={onResetAllRolesToDefault}
            onSetNoLimits={onSetNoLimits}
            isResetToDefaultHidden={isResetToDefaultHidden}
            isSetNoLimitsHidden={isSetNoLimitsHidden}
            isSkipRefresh={isSkipRefresh}
          />
        </div>
      </div>
      {isDisableRole(entity) && <AlertInfo text={t(RolesI18nKey.NotAvailableModel)} />}
      {addModalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyTitle={t(EntitiesI18nKey.NoRoles)}
            modalState={addModalState}
            entities={availableRoles}
            onClose={onCloseAddModal}
            onApply={onAddRoles}
          />,
          document.body,
        )}
    </div>
  );
};

export default EntityRoles;
