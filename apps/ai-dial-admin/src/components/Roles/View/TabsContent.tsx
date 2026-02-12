'use client';

import { cloneDeep } from 'lodash';
import { FC, useCallback, useEffect, useRef } from 'react';

import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  ENTITY_COLUMNS,
  getEntitiesForRole,
  getRelevantKeysForRole,
  ROLES_ENTITIES_COLUMNS,
} from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { isSetNoLimitsHidden } from '@/src/components/EntityView/Roles/utils';
import { getSetNoLimitsOperation } from '@/src/constants/grid-columns/actions';
import { KEYS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, KeysI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_VALUE } from '@/src/constants/role';
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
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RoleProperties from './Properties/Properties';

interface Props {
  selectedRole: DialRole;
  activeTab: EntityViewTab;
  selectedFormat: ExportFormat;
  keys: DialKey[];
  isSkipRefresh: boolean;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  toolsets?: Toolset[];
  routes?: DialRoute[];
  onChange: (key: DialRole, skipRefresh?: boolean) => void;
}

const TabsContent: FC<Props> = ({
  activeTab,
  selectedFormat,
  isSkipRefresh,
  onChange,
  selectedRole,
  keys,
  names,
  ...props
}) => {
  const t = useI18n();
  const entityRef = useRef(selectedRole);

  useEffect(() => {
    entityRef.current = selectedRole;
  }, [selectedRole]);

  const onAddKeys = useCallback(
    (rows: EntitiesGridData[]) => {
      const newKeys = rows.map((row) => row.name as string);
      onChange({
        ...selectedRole,
        grantedKeys: [...(selectedRole.grantedKeys || []), ...newKeys],
      });
    },
    [onChange, selectedRole],
  );

  const onRemoveKey = useCallback(
    (row: EntitiesGridData) => {
      const newRole = cloneDeep(selectedRole);
      newRole.grantedKeys = newRole.grantedKeys?.filter((key) => key !== row.name);
      onChange(newRole);
    },
    [onChange, selectedRole],
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
        onChange(updatedEntity);
      }
    },
    [onChange],
  );

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

      onChange(updatedEntity, true);
    },
    [onChange],
  );

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      const newLimits = { ...(selectedRole.limits || {}) };
      delete newLimits[row.name as string];

      onChange({
        ...selectedRole,
        limits: { ...newLimits },
      });
    },
    [onChange, selectedRole],
  );

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
      onChange({
        ...selectedRole,
        limits: {
          ...(selectedRole.limits || {}),
          ...newLimits,
        },
      });
    },
    [onChange, selectedRole],
  );

  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent entity={selectedRole} id={selectedRole.name} view={ApplicationRoute.Roles}>
            <RoleProperties
              selectedRole={selectedRole}
              names={names}
              onChangeRole={onChange}
              isSkipRefresh={isSkipRefresh}
            />
          </PropertiesTabContent>
        )}
        {activeTab === EntityViewTab.Entities && (
          <AddEntitiesView
            onAdd={onAddEntities}
            onRemove={onRemoveEntity}
            customColumns={ENTITY_COLUMNS(t)}
            additionalColumns={ROLES_ENTITIES_COLUMNS(onChangeRoleToken)}
            customActions={[getSetNoLimitsOperation(onSetNoLimits, isSetNoLimitsHidden)]}
            getRelevantDataForEntity={getEntitiesForRole.bind(this, selectedRole)}
            isSkipRefresh={isSkipRefresh}
            {...props}
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
      </>
    )
  );
};

export default TabsContent;
