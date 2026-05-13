import { FC, useState } from 'react';

import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialTabs } from '@epam/ai-dial-ui-kit';

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { routeAuditResource } from '@/src/components/ActivityAudit/View/Header/constants';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import UsageLog from '@/src/components/UsageLog/UsageLog';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { TabOrientation } from '@/src/types/tab';
import { EntityViewTab, getAuditTabs } from '@/src/utils/tabs/utils';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { TimeFilterValue } from '@/src/models/time-range';

interface Props {
  entity: BaseEntity;
  view: ApplicationRoute;
  initialAuditTab?: EntityViewTab;
}

const EntityAudit: FC<Props> = ({ entity, view, initialAuditTab }) => {
  const t = useI18n();

  const { featureFlags } = useAppContext();
  const tabs = getAuditTabs(t, featureFlags, view);
  const [activeTab, setActiveTab] = useState(initialAuditTab ?? tabs[0].id);

  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>(DEFAULT_TIME_PERIOD);

  return (
    <div className="flex flex-row gap-4 size-full">
      <div className="bg-layer-3 h-full w-[296px] p-4 relative">
        <h1 className="mb-4">{t(TabsI18nKey.Audit)}</h1>
        <div className="flex-1 min-h-0 relative">
          <DialTabs
            activeTab={activeTab}
            tabs={tabs}
            onClick={(tab) => setActiveTab(tab)}
            orientation={TabOrientation.Vertical}
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 w-full relative">
        {activeTab === EntityViewTab.Dashboard && (
          <Dashboard defaultTimeFilter={timeFilter} onTimeFilterChange={setTimeFilter} entity={entity} route={view} />
        )}
        {activeTab === EntityViewTab.Traces && (
          <UsageLog
            defaultTimeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            entity={entity}
            route={view}
            entityView={activeTab}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <UsageLog
            defaultTimeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            entity={entity}
            route={view}
            entityView={activeTab}
          />
        )}
        {activeTab === EntityViewTab.Activities && (
          <ActivityAuditList
            defaultTimeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            entity={entity}
            entityType={routeAuditResource[view]}
            refresh
          />
        )}
      </div>
    </div>
  );
};

export default EntityAudit;
