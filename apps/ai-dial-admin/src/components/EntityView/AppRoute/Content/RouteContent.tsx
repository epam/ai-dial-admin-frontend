'use client';
import { FC, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import RouteProperties from '@/src/components/Routes/Properties/RouteProperties';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { EntityViewTab, getRouteTabs } from '@/src/utils/tabs/utils';
import RouteAttachments from './RouteAttachments';
import RouteRoles from './RouteRoles';

interface Props {
  route: DialAppRoute;
  iAppRunnerView?: boolean;
  roles: DialRole[];
  readonly?: boolean;
  parentRoles?: string[];
  routeNames?: string[];
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteContent: FC<Props> = ({ route, readonly, routeNames, onChangeRoute, ...props }) => {
  const t = useI18n();

  const tabs = getRouteTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  return (
    <div className="h-full w-full p-4 flex flex-col">
      <div className="mb-4">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={(tab) => setActiveTab(tab as EntityViewTab)} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto mt-4 lg:mt-0">
        {activeTab === EntityViewTab.Properties && (
          <RouteProperties
            route={route}
            onChange={onChangeRoute}
            isAppRoute={true}
            routeNames={routeNames}
            readonly={readonly}
          />
        )}

        {activeTab === EntityViewTab.Attachments && (
          <RouteAttachments route={route} onChangeRoute={onChangeRoute} readonly={readonly} />
        )}
        {activeTab === EntityViewTab.Roles && (
          <RouteRoles route={route} onChangeRoute={onChangeRoute} readonly={readonly} {...props} />
        )}
      </div>
    </div>
  );
};

export default RouteContent;
