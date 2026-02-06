'use client';

import { FC } from 'react';

import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RouteProperties from '@/src/components/Routes/View/Properties/RouteProperties';

interface Props {
  selectedFormat: ExportFormat;
  activeTab: EntityViewTab;
  roles: DialRole[];
  route: DialRoute;
  routeNames: string[];
  onChangeRoute: (route: DialRoute) => void;
}

const TabsContent: FC<Props> = ({ activeTab, route, roles, routeNames, onChangeRoute, selectedFormat }) => {
  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent entity={route} view={ApplicationRoute.Routes} id={route.name}>
            <RouteProperties route={route} onChange={onChangeRoute} routeNames={routeNames} />
          </PropertiesTabContent>
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
