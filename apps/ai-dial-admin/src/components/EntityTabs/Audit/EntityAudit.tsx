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
import { TimeRange } from '@/src/models/time-range';

interface Props {
  entity: BaseEntity;
  view: ApplicationRoute;
}

const EntityAudit: FC<Props> = ({ entity, view }) => {
  const t = useI18n();

  const { featureFlags } = useAppContext();
  const tabs = getAuditTabs(t, featureFlags, view);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const [timeFilter, setTimeFilter] = useState<string | TimeRange>(DEFAULT_TIME_PERIOD);
  const [isCustomRange, setIsCustomRange] = useState(false);

  return (
    <div className="flex flex-row gap-4 h-full w-full">
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
          <Dashboard
            initTimeFilter={timeFilter}
            onChangeTimeFilter={setTimeFilter}
            entity={entity}
            route={view}
            isCustomRange={isCustomRange}
            setIsCustomRange={setIsCustomRange}
          />
        )}
        {activeTab === EntityViewTab.Traces && (
          <UsageLog
            initTimeFilter={timeFilter}
            onChangeTimeFilter={setTimeFilter}
            entity={entity}
            route={view}
            entityView={activeTab}
            isCustomRange={isCustomRange}
            setIsCustomRange={setIsCustomRange}
          />
        )}
        {activeTab === EntityViewTab.Conversations && (
          <UsageLog
            initTimeFilter={timeFilter}
            onChangeTimeFilter={setTimeFilter}
            entity={entity}
            route={view}
            entityView={activeTab}
            isCustomRange={isCustomRange}
            setIsCustomRange={setIsCustomRange}
          />
        )}
        {activeTab === EntityViewTab.Activities && (
          <ActivityAuditList
            initTimeFilter={timeFilter}
            onChangeTimeFilter={setTimeFilter}
            entity={entity}
            entityType={routeAuditResource[view]}
            refresh
            isCustomRange={isCustomRange}
            setIsCustomRange={setIsCustomRange}
          />
        )}
      </div>
    </div>
  );
};

export default EntityAudit;
