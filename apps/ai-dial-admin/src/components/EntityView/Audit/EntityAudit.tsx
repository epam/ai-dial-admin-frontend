import { BaseEntity } from '@/src/models/dial/base-entity';
import { FC, useState } from 'react';

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { EntityViewTab } from '@/src/components/EntityView/View/utils';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { TabOrientation } from '@/src/types/tab';
import { getAuditTabs } from './utils';

interface Props {
  entity: BaseEntity;
  view: ApplicationRoute;
}

const EntityAudit: FC<Props> = ({ entity, view }) => {
  const t = useI18n() as (str: string) => string;

  const { featureFlags } = useAppContext();
  const tabs = getAuditTabs(t, featureFlags, view);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="flex flex-row gap-4 h-full w-full">
      <div className="bg-layer-3 h-full w-[296px] p-4 relative">
        <h1 className="mb-4">{t(TabsI18nKey.Audit)}</h1>
        <div className="flex-1 min-h-0 relative">
          <Tabs
            activeTab={activeTab}
            tabs={tabs}
            onClick={(tab) => setActiveTab(tab)}
            orientation={TabOrientation.Vertical}
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 w-full relative">
        {activeTab === EntityViewTab.Dashboard && <Dashboard entity={entity} route={view} />}
        {activeTab === EntityViewTab.Activities && <ActivityAuditList entity={entity} />}
      </div>
    </div>
  );
};

export default EntityAudit;
