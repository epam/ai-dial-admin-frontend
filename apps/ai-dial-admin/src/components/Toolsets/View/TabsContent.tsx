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
import PropertiesTabContent from '../Properties/TabContent';

interface Props {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  selectedToolset: Toolset;
  originalToolset: Toolset;
  names: string[];
  isSkipRefresh: boolean;
  roles?: DialRole[] | null;
  onChange: (toolset: Toolset) => void;
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
