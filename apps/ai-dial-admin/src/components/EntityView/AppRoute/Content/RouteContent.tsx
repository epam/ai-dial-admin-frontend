'use client';
import { FC, useState } from 'react';

import Tabs from '@/src/components/Common/Tabs/Tabs';
import { attachmentsTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { useI18n } from '@/src/locales/client';
import { DialAppRoute } from '@/src/models/dial/route';
import RouteProperties from '@/src/components/Routes/Properties/RouteProperties';
import RouteAttachments from './RouteAttachments';

interface Props {
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteContent: FC<Props> = ({ route, onChangeRoute }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const tabs = [propertiesTabs(t), attachmentsTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  return (
    <div className="h-full w-full p-4 border flex flex-col border-primary rounded">
      <div className="mb-4">
        <Tabs tabs={tabs} activeTab={activeTab} onClick={(tab) => setActiveTab(tab as EntityViewTab)} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === EntityViewTab.Properties && (
          <RouteProperties route={route} updateRoute={onChangeRoute} isAppRoute={true} />
        )}

        {activeTab === EntityViewTab.Attachments && <RouteAttachments route={route} onChangeRoute={onChangeRoute} />}
      </div>
    </div>
  );
};

export default RouteContent;
