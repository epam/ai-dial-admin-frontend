'use client';

import { ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import CoreSyncEntityStatus from '@/src/components/Common/SyncCoreStatus/SyncCoreStatus';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { ApplicationRoute } from '@/src/types/routes';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import SimpleButtonsWrapper, { SimpleButtonsWrapperProps } from './Wrappers/SimpleButtonsWrapper';

interface Entity {
  id?: string;
  $id?: string;
  name?: string;
}

interface Props<T> extends SimpleButtonsWrapperProps<T> {
  tabs?: TabModel[];
  activeTab?: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab?: (tab: EntityViewTab) => void;
}

const SimpleEntityHeader = <T extends Entity>({
  jsonConfiguration,
  children,
  tabs,
  activeTab,
  onChangeActiveTab,
  ...props
}: Props<T>) => {
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const readonlyId =
    props.view === ApplicationRoute.TestSuites
      ? props.entity.name || ''
      : props.entity.id || props.entity.$id || props.entity.name || '';

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && (
          <div className="flex flex-col gap-0.5">
            <CoreSyncEntityStatus view={props.view} name={readonlyId} />

            <ReadonlyId value={readonlyId} />
          </div>
        )}
        <SimpleButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </SimpleButtonsWrapper>
      </div>
      {tabs && activeTab && onChangeActiveTab && (
        <Tabs
          isEditorEnabled={isEditorEnabled}
          tabs={tabs}
          activeTab={activeTab}
          onChangeActiveTab={onChangeActiveTab}
        />
      )}
    </div>
  );
};

export default SimpleEntityHeader;
