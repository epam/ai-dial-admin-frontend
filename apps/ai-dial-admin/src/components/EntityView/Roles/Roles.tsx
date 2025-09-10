import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { isDialRoleShareKey } from '@/src/components/AddEntitiesTab/utils';
import AlertInfo from '@/src/components/Common/Alerts/AlertInfo';
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import RolesGrid from '@/src/components/EntityView/Roles/RolesGrid';
import {
  getNoAvailableTitle,
  isDisableRole,
  isResetToDefaultHidden,
  isSetNoLimitsHidden,
} from '@/src/components/EntityView/Roles/utils';
import { EntitiesI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimits, DialRoleLimitsMap, DialRoleShare, DialRoleShareMap } from '@/src/models/dial/role-limits';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import RolesDefaults from './RolesDefaults';
import { NO_LIMITS_ACCEPTED_USERS, NO_LIMITS_VALUE } from './constants';

interface Props {
  entity: EntityRoleLimits;
  view: ApplicationRoute;
  isSkipRefresh: boolean;
  roles: DialRole[];
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
}

const EntityRoles: FC<Props> = ({ entity, roles, view, onChangeEntity, isSkipRefresh }) => {
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

  const onChangeRoleToken = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      const roleLimits = entityRef.current.roleLimits ?? {};
      const roleShareResourceLimits = entityRef.current.roleShareResourceLimits ?? {};
      const updatedLimits = {
        ...roleLimits,
        [name]: {
          ...roleLimits[name],
          [token]: value.toString(),
        },
      };

      const updatedShare = {
        ...roleShareResourceLimits,
        [name]: {
          ...roleShareResourceLimits[name],
          [token]: value.toString(),
        },
      };

      const updatedEntity = {
        ...entityRef.current,
        ...(isDialRoleShareKey(token) ? { roleShareResourceLimits: updatedShare } : { roleLimits: updatedLimits }),
      };

      onChangeEntity(updatedEntity, true);
    },
    [onChangeEntity],
  );

  const onAddRoles = useCallback(
    (roles: DialRole[]) => {
      const newRoles = {} as DialRoleLimitsMap;
      const newRoleShare = {} as DialRoleShareMap;
      roles.forEach((role) => {
        newRoles[role.name as string] = {};
        newRoleShare[role.name as string] = {};
      });

      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entity.roleLimits,
          ...newRoles,
        } as DialRoleLimitsMap,
        roleShareResourceLimits: {
          ...entity.roleShareResourceLimits,
          ...newRoleShare,
        },
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
      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entityRef.current.roleLimits,
          [role.name as string]: {},
        } as DialRoleLimitsMap,
        roleShareResourceLimits: {
          ...entityRef.current.roleShareResourceLimits,
          [role.name as string]: {},
        },
      });
    },
    [onChangeEntity, entity],
  );

  const onResetAllRolesToDefault = useCallback(() => {
    const updatedRoleLimits: Record<string, DialRoleLimits> = {};
    const updatedRoleShareResourceLimits: Record<string, DialRoleShare> = {};

    Object.keys(entityRef.current.roleLimits || {}).forEach((roleName) => {
      updatedRoleLimits[roleName] = {};
      updatedRoleShareResourceLimits[roleName] = {};
    });
    onChangeEntity({
      ...entity,
      roleLimits: updatedRoleLimits,
      roleShareResourceLimits: updatedRoleShareResourceLimits,
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
            day: NO_LIMITS_VALUE,
            minute: NO_LIMITS_VALUE,
            month: NO_LIMITS_VALUE,
            week: NO_LIMITS_VALUE,
          },
        } as DialRoleLimitsMap,
        roleShareResourceLimits: {
          ...entityRef.current.roleShareResourceLimits,
          [role.name as string]: {
            invitationTtl: NO_LIMITS_VALUE,
            maxAcceptedUsers: NO_LIMITS_ACCEPTED_USERS,
          },
        } as DialRoleShareMap,
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

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex flex-col flex-1 min-h-0 divide-y divide-primary">
        {view !== ApplicationRoute.Routes && <RolesDefaults entity={entity} onChangeEntity={onChangeEntity} />}

        <div className="flex-1 min-h-0 pt-8 mb-4">
          <RolesGrid
            view={view}
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
            isResetToDefaultHidden={(api, node) => isResetToDefaultHidden(api, node, entity)}
            isSetNoLimitsHidden={isSetNoLimitsHidden}
            isSkipRefresh={isSkipRefresh}
          />
        </div>
      </div>
      {isDisableRole(entity) && view !== ApplicationRoute.Routes && <AlertInfo text={t(getNoAvailableTitle(view))} />}
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
