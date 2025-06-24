'use client';

import { cloneDeep, isEqual } from 'lodash';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';

import { removeRole, updateRole } from '@/src/app/[lang]/roles/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  getRelevantKeysForRole,
  getEntitiesForRole,
  ROLES_ENTITIES_COLUMNS,
} from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import { EntityViewTab, propertiesTabs } from '@/src/components/EntityView/entity-view';
import { useNotification } from '@/src/context/NotificationContext';
import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { EntitiesI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits, DialRoleLimitsMap } from '@/src/models/dial/base-entity';
import { DialAddon } from '@/src/models/dial/addon';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';
import { DialKey } from '@/src/models/dial/key';
import { KEY_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  originalRole: DialRole;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  addons: DialAddon[];
  keys: DialKey[];
}

const RolesView: FC<Props> = ({ originalRole, names, models, addons, applications, keys }) => {
  const t = useI18n() as (str: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    { id: EntityViewTab.Entities, name: t(TabsI18nKey.Entities) },
    { id: EntityViewTab.Keys, name: t(TabsI18nKey.Keys) },
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRole, setSelectedRole] = useState(cloneDeep(originalRole));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);

  const entityRef = useRef(selectedRole);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    entityRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    setSelectedRole(cloneDeep(originalRole));
  }, [originalRole]);

  useEffect(() => {
    setIsChanged(!isEqual(originalRole, selectedRole));
  }, [selectedRole, originalRole]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      setJsonErrors([]);
      setIsChanged(false);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setIsSkipRefresh(false);
    setSelectedRole(originalRole);
  }, [setSelectedRole, originalRole, jsonEditorEnabled]);

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
      onChangeRole(
        {
          ...entityRef.current,
          limits: {
            ...entityRef.current.limits,
            [name]: {
              ...entityRef.current.limits?.[name],
              [token]: value.toString(),
            },
          } as DialRoleLimitsMap,
        },
        true,
      );
    },
    [onChangeRole],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <EntityViewHeaderButtons
          view={ApplicationRoute.Roles}
          entity={selectedRole}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeRole}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          jsonErrors={jsonErrors}
          setErrorNotifications={setErrorNotifications}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <JSONEditor
            key={key}
            model={selectedRole}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedRole}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="h-full lg:w-[35%] mt-3">
                <SimpleEntityProperties
                  entity={selectedRole}
                  onChangeEntity={onChangeRole}
                  names={names}
                  isEntityImmutable={true}
                />
              </div>
            )}
          </>
        )}
        {activeTab === EntityViewTab.Entities && (
          <AddEntitiesView
            models={models}
            applications={applications}
            addons={addons}
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
            customColumns={KEY_ENTITY_COLUMNS}
            modalTitle={t(KeysI18nKey.AddKeys)}
            emptyDataTitle={t(EntitiesI18nKey.NoKeys)}
            keys={keys}
            onAdd={onAddKeys}
            onRemove={onRemoveKey}
            getRelevantDataForEntity={getRelevantKeysForRole.bind(this, selectedRole)}
          />
        )}
      </div>
    </div>
  );
};

export default RolesView;
