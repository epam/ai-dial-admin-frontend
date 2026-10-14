'use client';

import { ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import HeaderIdBlock from '@/src/components/EntityHeaderControls/HeaderIdBlock';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { useAppContext } from '@/src/context/AppContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '@/src/utils/core-sync/get-core-sync-status-url';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { EntityWithMetadata } from './models';
import SimpleButtonsWrapper, { SimpleButtonsWrapperProps } from './Wrappers/SimpleButtonsWrapper';

interface Entity extends EntityWithMetadata {
  id?: string;
  $id?: string;
  name?: string;
}

interface Props<T> extends SimpleButtonsWrapperProps<T> {
  tabs?: TabModel[];
  activeTab?: EntityViewTab;
  children?: ReactNode;
  leadingActions?: ReactNode;
  tabsTrailing?: ReactNode;

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
          <HeaderIdBlock id={readonlyId} metadata={props.entity._metadata}>
            {hasCoreSyncStatus && <CoreSyncEntityStatus view={props.view} name={readonlyId} />}
          </HeaderIdBlock>
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
