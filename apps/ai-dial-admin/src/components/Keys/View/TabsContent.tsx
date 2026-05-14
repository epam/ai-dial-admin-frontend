'use client';

import { FC, useCallback, useMemo } from 'react';

import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantRolesForKey } from '@/src/components/AddEntitiesTab/utils';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ValidityStatusLabel from '@/src/components/Common/ValidityStatus/ValidityStatusLabel';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, EntityFieldsI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { cloneDeep } from 'lodash';
import KeyProperties from './Properties/Properties';

interface Props {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  roles: DialRole[];
  names: string[];
  keys: string[];
  selectedKey: DialKey;
  originalKey: DialKey;
  onChange: (key: DialKey) => void;
  initialAuditTab?: EntityViewTab;
}

const TabsContent: FC<Props> = ({
  activeTab,
  roles,
  selectedKey,
  originalKey,
  onChange,
  selectedFormat,
  keys,
  names,
  initialAuditTab,
}) => {
  const t = useI18n();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <LabelledText
          label={t(EntityFieldsI18nKey.keyGeneratedAt)}
          text={formatDateTimeToLocalString(selectedKey.keyGeneratedAt)}
        />
        <LabelledText
          label={t(EntityFieldsI18nKey.expiresAt)}
          text={formatDateTimeToLocalString(selectedKey.expiresAt)}
        />
        <ValidityStatusLabel {...selectedKey.validityState} />
      </>
    );
  }, [selectedKey.keyGeneratedAt, selectedKey.expiresAt, selectedKey.validityState, t]);

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
          <PropertiesTabContent
            entity={selectedKey}
            view={ApplicationRoute.Keys}
            id={selectedKey.name}
            headerPostfix={headerPostfix}
          >
            <KeyProperties
              originalEntity={originalKey}
              entity={selectedKey}
              names={names}
              keys={keys}
              onChangeKey={onChange}
              isKeyImmutable={true}
            />
          </PropertiesTabContent>
        )}
        {activeTab === EntityViewTab.Roles && (
          <AddEntitiesView
            viewTitle={t(TabsI18nKey.Roles)}
            customColumns={BASE_COLUMNS}
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyDataTitle={t(EntitiesI18nKey.NoRoles)}
            roles={roles}
            onAdd={onAddRoles}
            onRemove={onRemoveRole}
            getRelevantDataForEntity={getRelevantRolesForKey.bind(this, selectedKey)}
          />
        )}
        {activeTab === EntityViewTab.Audit && (
          <EntityAudit entity={selectedKey} view={ApplicationRoute.Keys} initialAuditTab={initialAuditTab} />
        )}
      </>
    )
  );
};

export default TabsContent;
