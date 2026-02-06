'use client';

import { FC, ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AssetButtonsWrapper, { AssetButtonsWrapperProps } from './Wrappers/AssetButtonsWrapper';

interface Props extends AssetButtonsWrapperProps {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const AssetHeader: FC<Props> = ({ jsonConfiguration, children, tabs, activeTab, onChangeActiveTab, ...props }) => {
  const { isEditorEnabled } = jsonConfiguration;
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && <ReadonlyId value={props.entity.name || ''} />}
        <AssetButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </AssetButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default AssetHeader;
