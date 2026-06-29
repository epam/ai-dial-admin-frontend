'use client';
import { FC, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';

import RouteProperties from '@/src/components/Routes/View/Properties/RouteProperties';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { EntityViewTab, getAppRouteTabs } from '@/src/utils/tabs/utils';
import RouteAttachments from './RouteAttachments';
import RouteRoles from './RouteRoles';

interface Props {
  route: DialAppRoute;
  isAppRunnerView?: boolean;
  useAggregateRouteValidation?: boolean;
  roles: DialRole[];
  disabled?: boolean;
  parentRoles?: string[];
  routeNames?: string[];
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteContent: FC<Props> = ({ route, disabled, routeNames, onChangeRoute, ...props }) => {
  const t = useI18n();

  const tabs = getAppRouteTabs(t);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  return (
    <div className="size-full p-4 flex flex-col">
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
            disabled={disabled}
            isAppRunnerView={props.isAppRunnerView}
            useAggregateRouteValidation={props.useAggregateRouteValidation}
          />
        )}

        {activeTab === EntityViewTab.Attachments && (
          <RouteAttachments route={route} onChangeRoute={onChangeRoute} disabled={disabled} />
        )}
        {activeTab === EntityViewTab.Roles && (
          <RouteRoles route={route} onChangeRoute={onChangeRoute} disabled={disabled} {...props} />
        )}
      </div>
    </div>
  );
};

export default RouteContent;
