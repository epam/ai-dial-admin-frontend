import { Column, GridApi, IRowNode } from 'ag-grid-community';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { BasicI18nKey, EntitiesI18nKey, PlaceholderI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity, DialRoleLimits, DialRoleLimitsMap } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import RolesGrid from './RolesGrid';

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
    const roleLimits = [...Object.keys(entity?.roleLimits || {}), 'default'];
    setAvailableRoles(roles.filter((role) => !roleLimits.includes(role.name as string)));
  }, [entity, roles]);

  useEffect(() => {
    entityRef.current = entity;
  }, [entity]);

  const onChangeDefaultLimit = useCallback(
    (value: string, key: keyof DialRoleLimits) => {
      onChangeEntity({
        ...entity,
        defaultRoleLimit: { ...entity.defaultRoleLimit, [key]: value },
      });
    },
    [entity, onChangeEntity],
  );

  const onChangeDayDefaultLimit = useCallback(
    (day: string) => {
      onChangeDefaultLimit(day, 'day');
    },
    [onChangeDefaultLimit],
  );

  const onChangeWeekDefaultLimit = useCallback(
    (week: string) => {
      onChangeDefaultLimit(week, 'week');
    },
    [onChangeDefaultLimit],
  );

  const onChangeMonthDefaultLimit = useCallback(
    (month: string) => {
      onChangeDefaultLimit(month, 'month');
    },
    [onChangeDefaultLimit],
  );

  const onChangeMinuteDefaultLimit = useCallback(
    (minute: string) => {
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

  const onOpenInNewTab = (role: DialRole) => {
    window.open(`${ApplicationRoute.Roles}/${role.name}`, '_blank');
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
    <div className="h-full flex flex-col pt-3 divide-y divide-primary">
      <div className="flex flex-col mb-8">
        <h1 className="mb-4">{t(BasicI18nKey.Settings)}</h1>
        <div className="flex flex-row gap-x-3">
          <TextInputField
            elementId="minute"
            value={entity.defaultRoleLimit?.minute || void 0}
            placeholder={t(PlaceholderI18nKey.NoLimits)}
            fieldTitle={t(RolesI18nKey.TokensPerMinute)}
            onChange={onChangeMinuteDefaultLimit}
          />
          <TextInputField
            elementId="day"
            placeholder={t(PlaceholderI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.day || void 0}
            fieldTitle={t(RolesI18nKey.TokensPerDay)}
            onChange={onChangeDayDefaultLimit}
          />
          <TextInputField
            elementId="week"
            placeholder={t(PlaceholderI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.week || void 0}
            fieldTitle={t(RolesI18nKey.TokensPerWeek)}
            onChange={onChangeWeekDefaultLimit}
          />
          <TextInputField
            elementId="month"
            placeholder={t(PlaceholderI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.month || void 0}
            fieldTitle={t(RolesI18nKey.TokensPerMonth)}
            onChange={onChangeMonthDefaultLimit}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 pt-8">
        <RolesGrid
          entity={entity}
          roles={roles}
          onChangeEntity={onChangeEntity}
          onChangeTokensValue={onChangeRoleToken}
          onOpenAddModal={onOpenAddModal}
          onOpenInNewTab={onOpenInNewTab}
          onRemoveRole={onRemoveRole}
          onResetToDefaultRole={onResetToDefaultRole}
          onResetAllRolesToDefault={onResetAllRolesToDefault}
          onSetNoLimits={onSetNoLimits}
          isResetToDefaultHidden={isResetToDefaultHidden}
          isSetNoLimitsHidden={isSetNoLimitsHidden}
          isSkipRefresh={isSkipRefresh}
        />
      </div>

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
