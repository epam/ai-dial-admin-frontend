'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import { getCoreRole, removeRole, updateCoreRole, updateRole } from '@/src/app/[lang]/roles/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  ENTITY_COLUMNS,
  getEntitiesForRole,
  getRelevantKeysForRole,
  ROLES_ENTITIES_COLUMNS,
} from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { isSetNoLimitsHidden } from '@/src/components/EntityView/Roles/utils';
import { getSetNoLimitsOperation } from '@/src/constants/grid-columns/actions';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_VALUE } from '@/src/constants/role';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { DialRoute } from '@/src/models/dial/route';
import { Toolset } from '@/src/models/dial/toolset';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getRoleTabs } from '@/src/utils/tabs/utils';
import RoleProperties from './Properties';

interface Props {
  originalRole: DialRole;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  toolsets?: Toolset[];
  routes?: DialRoute[];
  keys: DialKey[];
  etag: string;
}

const RolesView: FC<Props> = ({ originalRole, etag, names, models, applications, keys, toolsets, routes }) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = getRoleTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRole, setSelectedRole] = useState(cloneDeep(originalRole));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [key, setKey] = useState(0);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreRole, setCoreRole] = useState<DialKey | null>(null);
  const entityRef = useRef(selectedRole);

  useEffect(() => {
    const name = (originalRole as { name: string })?.name;
    if (!coreRole && name) {
      getReqRef.current(getCoreRole, name).then((data) => {
        setCoreRole(data.response);
      });
    }
  }, [coreRole, originalRole]);

  useEffect(() => {
    setSelectedRole(selectedFormat === ExportFormat.CORE ? cloneDeep(coreRole as DialRole) : cloneDeep(originalRole));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalRole]);

  useEffect(() => {
    const isEqualAdminRole = isEqualSkippingUndefined(originalRole, selectedRole);
    const isEqualCoreRole = isEqualSkippingUndefined(selectedRole, coreRole);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreRole : !isEqualAdminRole);
  }, [selectedFormat, originalRole, selectedRole, coreRole]);

  useEffect(() => {
    entityRef.current = selectedRole;
  }, [selectedRole]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setIsSkipRefresh(false);
    setSelectedRole(originalRole);
  }, [isJsonEditorEnabled, originalRole, dispatch]);

  const onChangeRole = useCallback(
    (entity: DialRole, skipRefresh?: boolean) => {
      setSelectedRole(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedRole],
  );

  const onToggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  const onAddEntities = useCallback(
    (rows: EntitiesGridData[]) => {
      const newLimits: Record<string, DialRoleLimits> = {};
      rows.forEach((row) => {
        const limit = row.name as string;
        if (selectedRole.limits && selectedRole.limits[limit]) {
          selectedRole.limits[limit].enabled = true;
        } else {
          newLimits[limit] = { enabled: true };
        }
      });
      onChangeRole({
        ...selectedRole,
        limits: {
          ...(selectedRole.limits || {}),
          ...newLimits,
        },
      });
    },
    [onChangeRole, selectedRole],
  );

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      const newLimits = { ...(selectedRole.limits || {}) };
      delete newLimits[row.name as string];

      onChangeRole({
        ...selectedRole,
        limits: { ...newLimits },
      });
    },
    [onChangeRole, selectedRole],
  );

  const onAddKeys = useCallback(
    (rows: EntitiesGridData[]) => {
      const newKeys = rows.map((row) => row.name as string);
      onChangeRole({
        ...selectedRole,
        grantedKeys: [...(selectedRole.grantedKeys || []), ...newKeys],
      });
    },
    [onChangeRole, selectedRole],
  );

  const onRemoveKey = useCallback(
    (row: EntitiesGridData) => {
      const newRole = cloneDeep(selectedRole);
      newRole.grantedKeys = newRole.grantedKeys?.filter((key) => key !== row.name);
      onChangeRole(newRole);
    },
    [onChangeRole, selectedRole],
  );

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreRole, selectedRole as Record<string, unknown>, originalRole.name || '', etag)
        : getReqRef.current(updateRole, selectedRole, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreRole(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Roles, t),
            getUpdateNotificationDescription(ApplicationRoute.Roles, selectedRole.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedRole, originalRole.name, etag, dispatch, showNotification, t, router]);

  const onChangeRoleToken = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      const limits = entityRef.current.limits ?? {};
      const updatedLimits = {
        ...limits,
        [name]: {
          ...limits[name],
          [token]: value.toString(),
        },
      };

      const updatedEntity = {
        ...entityRef.current,
        limits: updatedLimits,
      };

      onChangeRole(updatedEntity, true);
    },
    [onChangeRole],
  );

  const onSetNoLimits = useCallback(
    (role?: DialRole) => {
      if (role) {
        const limits = entityRef.current.limits ?? {};
        const updatedLimits = {
          ...limits,
          [role?.name as string]: {
            ...limits[role?.name as string],
            day: UNLIMITED_VALUE,
            minute: UNLIMITED_VALUE,
            month: UNLIMITED_VALUE,
            week: UNLIMITED_VALUE,
          },
        };

        const updatedEntity = {
          ...entityRef.current,
          limits: updatedLimits,
        };
        onChangeRole(updatedEntity);
      }
    },
    [onChangeRole],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        {!isJsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          view={ApplicationRoute.Roles}
          entity={selectedRole}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          onRemove={removeRole}
          isJsonEditorEnabled={isJsonEditorEnabled}
          onToggleJsonEditor={onToggleJsonEditor}
          selectedFormat={selectedFormat}
          onChangeSelectedFormat={setSelectedFormat}
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedRole}
            setSelectedEntity={setSelectedRole}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <RoleProperties
                selectedRole={selectedRole}
                names={names}
                onChangeRole={onChangeRole}
                isSkipRefresh={isSkipRefresh}
              />
            )}
          </>
        )}
        {activeTab === EntityViewTab.Entities && (
          <AddEntitiesView
            models={models}
            applications={applications}
            toolsets={toolsets}
            routes={routes}
            onAdd={onAddEntities}
            onRemove={onRemoveEntity}
            customColumns={ENTITY_COLUMNS(t)}
            additionalColumns={ROLES_ENTITIES_COLUMNS(onChangeRoleToken)}
            customActions={[getSetNoLimitsOperation(onSetNoLimits, isSetNoLimitsHidden)]}
            getRelevantDataForEntity={getEntitiesForRole.bind(this, selectedRole)}
            isSkipRefresh={isSkipRefresh}
          />
        )}
        {activeTab === EntityViewTab.Keys && (
          <AddEntitiesView
            viewTitle={t(TabsI18nKey.Keys)}
            customColumns={KEYS_COLUMNS(t)}
            modalTitle={t(KeysI18nKey.AddKeys)}
            emptyDataTitle={t(EntitiesI18nKey.NoKeys)}
            keys={keys}
            onAdd={onAddKeys}
            onRemove={onRemoveKey}
            getRelevantDataForEntity={getRelevantKeysForRole.bind(this, selectedRole)}
          />
        )}
        {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedRole} view={ApplicationRoute.Roles} />}
      </div>
    </div>
  );
};

export default RolesView;
