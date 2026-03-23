import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import RolesGrid from '@/src/components/EntityView/Roles/RolesGrid';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
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
import { DialRoleLimits, DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import RolesDefaults from './RolesDefaults';
import { UNLIMITED_VALUE } from '@/src/constants/role';

interface Props {
  entity: EntityRoleLimits;
  view: ApplicationRoute;
  isSkipRefresh: boolean;
  roles: DialRole[];
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
}

const EntityRoles: FC<Props> = ({ entity, roles, view, onChangeEntity, isSkipRefresh }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isRolesWithDefaults = view !== ApplicationRoute.Routes && view !== ApplicationRoute.Toolsets;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<DialRole[]>([]);

  const entityRef = useRef(entity);

  useEffect(() => {
    const roleLimits = Object.keys(entity?.roleLimits || {}).filter(
      (key) => entity?.roleLimits?.[key]?.enabled === true,
    );

    setAvailableRoles(roles.filter((role) => !roleLimits.includes(role.name as string)));
  }, [entity, roles]);

  useEffect(() => {
    entityRef.current = entity;
  }, [entity]);

  const onChangeRoleToken = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      const roleLimits = entityRef.current.roleLimits ?? {};
      const updatedLimits = {
        ...roleLimits,
        [name]: {
          ...roleLimits[name],
          [token]: value.toString(),
        },
      };

      const updatedEntity = {
        ...entityRef.current,
        roleLimits: updatedLimits,
      };

      onChangeEntity(updatedEntity, true);
    },
    [onChangeEntity],
  );

  const onAddRoles = useCallback(
    (roles: DialRole[]) => {
      const newRoles = {} as DialRoleLimitsMap;
      roles.forEach((role) => {
        const limit = role.name as string;
        if (entity.roleLimits && entity.roleLimits[limit]) {
          entity.roleLimits[limit].enabled = true;
        } else {
          newRoles[limit] = { enabled: true };
        }
      });

      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entity.roleLimits,
          ...newRoles,
        } as DialRoleLimitsMap,
      });
      setIsModalOpen(false);
    },
    [entity, onChangeEntity, setIsModalOpen],
  );

  const onRemoveRole = useCallback(
    (role?: DialRole) => {
      const newLimits = { ...(entity.roleLimits || {}) };
      delete newLimits[role?.name as string];

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
    (role?: DialRole) => {
      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entityRef.current.roleLimits,
          [role?.name as string]: {
            enabled: true,
          },
        } as DialRoleLimitsMap,
      });
    },
    [onChangeEntity, entity],
  );

  const onResetAllRolesToDefault = useCallback(() => {
    const updatedRoleLimits: Record<string, DialRoleLimits> = {};

    Object.keys(entityRef.current.roleLimits || {}).forEach((roleName) => {
      updatedRoleLimits[roleName] = {
        enabled: true,
      };
    });
    onChangeEntity({
      ...entity,
      roleLimits: updatedRoleLimits,
    });
  }, [onChangeEntity, entity]);

  const onSetNoLimits = useCallback(
    (role?: DialRole) => {
      onChangeEntity({
        ...entity,
        roleLimits: {
          ...entityRef.current.roleLimits,
          [role?.name as string]: {
            ...entityRef.current.roleLimits?.[role?.name as string],
            day: UNLIMITED_VALUE,
            minute: UNLIMITED_VALUE,
            month: UNLIMITED_VALUE,
            week: UNLIMITED_VALUE,
          },
        } as DialRoleLimitsMap,
      });
    },
    [onChangeEntity, entity],
  );

  const onOpenAddModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseAddModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onOpen = (role?: DialRole) => {
    onOpenInNewTab(ApplicationRoute.Roles, role);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col flex-1 min-h-0 divide-y divide-primary gap-y-8">
        {isRolesWithDefaults && (
          <RolesDefaults entity={entity} onChangeEntity={onChangeEntity} disabled={isReadOnlyAdmin} />
        )}

        <div className={classNames('flex-1 min-h-0 mb-4', isRolesWithDefaults && 'pt-8')}>
          <RolesGrid
            view={view}
            entity={entity}
            roles={roles}
            onChangeEntity={onChangeEntity}
            onChangeTokensValue={onChangeRoleToken}
            onOpenAddModal={isReadOnlyAdmin ? undefined : onOpenAddModal}
            onOpenInNewTab={onOpen}
            onRemoveRole={isReadOnlyAdmin ? undefined : onRemoveRole}
            onResetToDefaultRole={isReadOnlyAdmin ? undefined : onResetToDefaultRole}
            onResetAllRolesToDefault={onResetAllRolesToDefault}
            onSetNoLimits={isReadOnlyAdmin ? undefined : onSetNoLimits}
            isResetToDefaultHidden={(api, node) => isResetToDefaultHidden(api, node, entity)}
            isSetNoLimitsHidden={isSetNoLimitsHidden}
            isSkipRefresh={isSkipRefresh}
            isReadOnlyAdmin={isReadOnlyAdmin}
          />
        </div>
      </div>
      {isDisableRole(entity) && view !== ApplicationRoute.Routes && (
        <DialAlert variant={AlertVariant.Info} message={t(getNoAvailableTitle(view))} />
      )}
      {!isReadOnlyAdmin &&
        isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyTitle={t(EntitiesI18nKey.NoRoles)}
            isModalOpen={isModalOpen}
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
