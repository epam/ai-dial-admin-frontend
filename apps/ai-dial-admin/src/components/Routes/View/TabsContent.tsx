'use client';

import { FC } from 'react';

import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { EntityRoleLimits } from '../../../models/dial/base-entity';
import EntityRoles from '../../EntityView/Roles/Roles';
import PropertiesTabContent, { PropertiesProps } from './Properties/TabContent';

interface Props extends PropertiesProps {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  roles: DialRole[];
}

const TabsContent: FC<Props> = ({ activeTab, route, roles, routeNames, onChangeRoute, selectedFormat }) => {
  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent route={route} routeNames={routeNames} onChangeRoute={onChangeRoute} />
        )}
        {activeTab === EntityViewTab.Roles && (
          <EntityRoles
            entity={route as EntityRoleLimits}
            view={ApplicationRoute.Routes}
            roles={roles || []}
            onChangeEntity={onChangeRoute as (entity: EntityRoleLimits, withRefresh?: boolean) => void}
            isSkipRefresh={false}
          />
        )}
        {activeTab === EntityViewTab.Audit && <EntityAudit entity={route} view={ApplicationRoute.Routes} />}
      </>
    )
  );
};

export default TabsContent;
