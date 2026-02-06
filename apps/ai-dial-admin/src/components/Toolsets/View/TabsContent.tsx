'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import Tools from '@/src/components/Tools/Tools';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent, { PropertiesProps } from '../Properties/TabContent';

interface Props extends PropertiesProps {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  originalToolset: Toolset;
  isSkipRefresh: boolean;
  roles?: DialRole[] | null;
}

const TabsContent: FC<Props> = ({
  activeTab,
  names,
  onChange,
  isSkipRefresh,
  roles,
  selectedToolset,
  originalToolset,
  selectedFormat,
}) => {
  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent selectedToolset={selectedToolset} onChange={onChange} names={names} />
        )}

        {activeTab === EntityViewTab.Tools && (
          <Tools originalToolset={originalToolset} selectedToolset={selectedToolset} onChangeToolset={onChange} />
        )}

        {activeTab === EntityViewTab.Roles && (
          <EntityRoles
            entity={selectedToolset}
            view={ApplicationRoute.Toolsets}
            roles={roles || []}
            onChangeEntity={onChange}
            isSkipRefresh={isSkipRefresh}
          />
        )}

        {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedToolset} view={ApplicationRoute.Toolsets} />}
      </>
    )
  );
};

export default TabsContent;
