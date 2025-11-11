'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { getCoreRole, removeRole, updateCoreRole, updateRole } from '@/src/app/[lang]/roles/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  getEntitiesForRole,
  getRelevantKeysForRole,
  ROLES_ENTITIES_COLUMNS,
} from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { isSetNoLimitsHidden } from '@/src/components/EntityView/Roles/utils';
import { EntityViewTab, getRoleTabs } from '@/src/components/EntityView/View/utils';
import { getSetNoLimitsOperation } from '@/src/constants/grid-columns/actions';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_VALUE } from '@/src/constants/role';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import RoleProperties from './Properties';

interface Props {
  originalRole: DialRole;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  keys: DialKey[];
  etag: string;
}

const RolesView: FC<Props> = ({ originalRole, etag, names, models, applications, keys }) => {
  const t = useI18n() as (str: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = getRoleTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRole, setSelectedRole] = useState(cloneDeep(originalRole));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreRole, setCoreRole] = useState<DialKey | null>(null);
  const entityRef = useRef(selectedRole);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    const name = (originalRole as { name: string })?.name;
    if (!coreRole && name) {
      getCoreRole(name).then((data) => {
        setCoreRole(data.response as DialRole);
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
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setIsSkipRefresh(false);
    setSelectedRole(originalRole);
  }, [jsonEditorEnabled, originalRole, dispatch]);

  const onChangeRole = useCallback(
    (entity: DialRole, skipRefresh?: boolean) => {
      setSelectedRole(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedRole],
  );

  const toggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

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
        ? updateCoreRole(selectedRole as Record<string, unknown>, originalRole.name || '', etag)
        : updateRole(selectedRole, etag);

    req.then((res) => {
      if (res.success) {
        setCoreRole(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Roles, t),
            getUpdateNotificationDescription(ApplicationRoute.Roles, selectedRole.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedFormat, selectedRole, originalRole.name, etag, showNotification, t, router]);

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
      <div className={headerClassName}>
        {!jsonEditorEnabled && (
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
          removeEntity={removeRole}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
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
            onAdd={onAddEntities}
            onRemove={onRemoveEntity}
            customColumns={ROLES_ENTITIES_COLUMNS(t, onChangeRoleToken)}
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
