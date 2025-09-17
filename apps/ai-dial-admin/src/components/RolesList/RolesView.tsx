'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { removeRole, updateRole } from '@/src/app/[lang]/roles/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  getEntitiesForRole,
  getRelevantKeysForRole,
  isDialRoleShareKey,
  ROLES_ENTITIES_COLUMNS,
} from '@/src/components/AddEntitiesTab/utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { auditTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getCoreEntity } from '@/src/app/[lang]/export-config/actions';
import { ExportFormat } from '@/src/types/export';
import { getEntityFromFile, getExportType } from '@/src/components/EntityView/View/core-entity-utils';

interface Props {
  originalRole: DialRole;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  keys: DialKey[];
}

const RolesView: FC<Props> = ({ originalRole, names, models, applications, keys }) => {
  const t = useI18n() as (str: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    { id: EntityViewTab.Entities, name: t(TabsI18nKey.Entities) },
    { id: EntityViewTab.Keys, name: t(TabsI18nKey.Keys) },
    auditTabs(t),
  ];

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
      getCoreEntity(name, getExportType(ApplicationRoute.Roles)).then((data) => {
        setCoreRole(getEntityFromFile(ApplicationRoute.Roles, name, data) as DialRole);
      });
    }
  }, [coreRole, originalRole]);

  useEffect(() => {
    setSelectedRole(selectedFormat === ExportFormat.CORE ? cloneDeep(coreRole as DialRole) : cloneDeep(originalRole));
  }, [selectedFormat, coreRole, originalRole]);

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
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onAddEntities = useCallback(
    (rows: EntitiesGridData[]) => {
      const newLimits: Record<string, DialRoleLimits> = {};
      rows.forEach((row) => {
        newLimits[row.name || ''] = {};
      });
      onChangeRole({
        ...selectedRole,
        limits: { ...(selectedRole.limits || {}), ...newLimits },
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
    updateRole(selectedRole).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedRole, router, showNotification]);

  const onChangeRoleToken = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      const limits = entityRef.current.limits ?? {};
      const share = entityRef.current.share ?? {};
      const updatedLimits = {
        ...limits,
        [name]: {
          ...limits[name],
          [token]: value.toString(),
        },
      };

      const updatedShare = {
        ...share,
        [name]: {
          ...share[name],
          [token]: value.toString(),
        },
      };

      const updatedEntity = {
        ...entityRef.current,
        ...(isDialRoleShareKey(token) ? { share: updatedShare } : { limits: updatedLimits }),
      };

      onChangeRole(updatedEntity, true);
    },
    [onChangeRole],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
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
              <div className="lg:w-[35%] mt-3">
                <EntityHeader entity={selectedRole} />
                <div className="flex-1 min-h-0 pt-4">
                  <SimpleEntityProperties
                    entity={selectedRole}
                    onChangeEntity={onChangeRole}
                    names={names}
                    isEntityImmutable={true}
                  />
                </div>
              </div>
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
            getRelevantDataForEntity={getEntitiesForRole.bind(this, selectedRole)}
            isSkipRefresh={isSkipRefresh}
          />
        )}
        {activeTab === EntityViewTab.Keys && (
          <AddEntitiesView
            viewTitle={t(TabsI18nKey.Keys)}
            customColumns={KEYS_COLUMNS}
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
