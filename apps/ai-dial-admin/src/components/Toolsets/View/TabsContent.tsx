'use client';

import { FC, useMemo } from 'react';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import Tools from '@/src/components/Tools/Tools';
import { AuthHeader } from '@/src/components/Toolsets/Auth/Sections/AuthHeader';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import ToolsetProperties from '../Properties/Properties';

interface Props {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  originalToolset: Toolset;
  isSkipRefresh: boolean;
  roles?: DialRole[] | null;
  selectedToolset: Toolset;
  names: string[];
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
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const headerPostfix = useMemo(() => {
    return <AuthHeader toolset={selectedToolset} />;
  }, [selectedToolset]);

  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent
            entity={selectedToolset}
            view={ApplicationRoute.Toolsets}
            id={selectedToolset.name}
            headerPostfix={headerPostfix}
          >
            <ToolsetProperties selectedToolset={selectedToolset} onChangeToolset={onChange} names={names} />
          </PropertiesTabContent>
        )}

        {activeTab === EntityViewTab.Tools && (
          <Tools
            originalToolset={originalToolset}
            selectedToolset={selectedToolset}
            onChangeToolset={onChange}
            disabled={isReadOnlyAdmin}
          />
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
