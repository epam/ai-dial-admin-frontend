'use client';
import { ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { Publication } from '@/src/models/dial/publications';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PublicationsButtonsWrapper, { PublicationsButtonsWrapperProps } from './Wrappers/PublicationsButtonsWrapper';

interface Props<T> extends PublicationsButtonsWrapperProps<T> {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  onChangeActiveTab: (tab: EntityViewTab) => void;
  warning: ReactNode | null;
  children?: ReactNode;
}

const PublicationsHeader = <T extends Publication>({
  jsonConfiguration,
  tabs,
  activeTab,
  warning,
  onChangeActiveTab,
  children,
  ...props
}: Props<T>) => {
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && <h1>{props.entity.requestName}</h1>}
        <div className="flex items-center gap-x-2">
          {children}
          <PublicationsButtonsWrapper
            jsonConfiguration={jsonConfiguration}
            {...props}
            isOnlyDeleteAvailable={!!warning}
          />
        </div>
      </div>
      {warning ? (
        warning
      ) : (
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

export default PublicationsHeader;
