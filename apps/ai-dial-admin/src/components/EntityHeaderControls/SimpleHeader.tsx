'use client';

import { ReactNode } from 'react';

import { TabItem } from '@epam/ai-dial-ui-kit';

import EntityValidityBadge from '@/src/components/Common/EntityValidityBadge/EntityValidityBadge';
import { EntityValidityInput } from '@/src/components/Common/EntityValidityBadge/models';
import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import HeaderIdBlock from '@/src/components/EntityHeaderControls/HeaderIdBlock';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { useAppContext } from '@/src/context/AppContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import SimpleButtonsWrapper, { SimpleButtonsWrapperProps } from './Wrappers/SimpleButtonsWrapper';

interface Entity extends EntityValidityInput {
  id?: string;
  $id?: string;
  name?: string;
}

interface Props<T> extends SimpleButtonsWrapperProps<T> {
  tabs?: TabItem[];
  activeTab?: EntityViewTab;
  children?: ReactNode;
  leadingActions?: ReactNode;
  tabsTrailing?: ReactNode;
  statusBadges?: ReactNode;
  /** An entity can carry validity fields without wanting the badge (datasets); defaults to shown. */
  hasValidityBadge?: boolean;

  onChangeActiveTab?: (tab: EntityViewTab) => void;
}

const SimpleEntityHeader = <T extends Entity>({
  jsonConfiguration,
  children,
  leadingActions,
  adaptiveActions,
  tabs,
  activeTab,
  onChangeActiveTab,
  tabsTrailing,
  statusBadges,
  hasValidityBadge = true,
  ...props
}: Props<T>) => {
  const { featureFlags } = useAppContext();
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const readonlyId =
    props.view === ApplicationRoute.TestSuites || props.view === ApplicationRoute.Datasets
      ? props.entity.name || ''
      : props.entity.id || props.entity.$id || props.entity.name || '';
  const hasCoreSyncStatus = featureFlags.adminApiEnabled && getCoreSyncStatusUrl(props.view, readonlyId) !== null;

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && (
          <HeaderIdBlock
            id={readonlyId}
            statusBadges={
              <>
                {hasValidityBadge && <EntityValidityBadge entity={props.entity} />}
                {hasCoreSyncStatus && <CoreSyncEntityStatus view={props.view} name={readonlyId} />}
                {statusBadges}
              </>
            }
          />
        )}
        <SimpleButtonsWrapper
          jsonConfiguration={jsonConfiguration}
          leadingActions={leadingActions}
          adaptiveActions={adaptiveActions}
          {...props}
        >
          {children}
        </SimpleButtonsWrapper>
      </div>
      {tabs && activeTab && onChangeActiveTab && (
        <div className="flex items-center justify-between gap-4">
          <Tabs
            isEditorEnabled={isEditorEnabled}
            tabs={tabs}
            activeTab={activeTab}
            onChangeActiveTab={onChangeActiveTab}
          />
          {tabsTrailing}
        </div>
      )}
    </div>
  );
};

export default SimpleEntityHeader;
