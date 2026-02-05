'use client';

import { FC, useCallback } from 'react';

import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantRolesForKey } from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { cloneDeep } from 'lodash';
import PropertiesTabContent from './Properties/TabContent';

interface Props {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  selectedKey: DialKey;
  roles: DialRole[];
  names: string[];
  keys: string[];
  onChange: (key: DialKey) => void;
}

const TabsContent: FC<Props> = ({ activeTab, roles, selectedKey, onChange, selectedFormat, ...props }) => {
  const t = useI18n();

  const onAddRoles = useCallback(
    (rows: EntitiesGridData[]) => {
      const newRoles = rows.map((row) => row.name as string);
      onChange({
        ...selectedKey,
        roles: [...(selectedKey.roles || []), ...newRoles],
      });
    },
    [onChange, selectedKey],
  );

  const onRemoveRole = useCallback(
    (row: EntitiesGridData) => {
      const roleToRemove = row.name;
      const newKey = cloneDeep(selectedKey);
      newKey.roles = newKey.roles?.filter((role) => role !== roleToRemove);
      onChange(newKey);
    },
    [onChange, selectedKey],
  );

  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent selectedKey={selectedKey} onChange={onChange} {...props} />
        )}
        {activeTab === EntityViewTab.Roles && (
          <AddEntitiesView
            viewTitle={t(TabsI18nKey.Roles)}
            customColumns={SIMPLE_ENTITY_COLUMNS}
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyDataTitle={t(EntitiesI18nKey.NoRoles)}
            roles={roles}
            onAdd={onAddRoles}
            onRemove={onRemoveRole}
            getRelevantDataForEntity={getRelevantRolesForKey.bind(this, selectedKey)}
          />
        )}
        {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedKey} view={ApplicationRoute.Keys} />}
      </>
    )
  );
};

export default TabsContent;
