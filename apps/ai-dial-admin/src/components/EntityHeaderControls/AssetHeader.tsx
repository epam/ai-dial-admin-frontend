'use client';

import { FC, ReactNode } from 'react';

import { TabItem } from '@epam/ai-dial-ui-kit';

import EntityValidityBadge from '@/src/components/Common/EntityValidityBadge/EntityValidityBadge';
import { EntityValidityInput } from '@/src/components/Common/EntityValidityBadge/models';
import HeaderIdBlock from '@/src/components/EntityHeaderControls/HeaderIdBlock';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AssetButtonsWrapper, { AssetButtonsWrapperProps } from './Wrappers/AssetButtonsWrapper';

interface Props extends AssetButtonsWrapperProps {
  tabs: TabItem[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const AssetHeader: FC<Props> = ({ jsonConfiguration, children, tabs, activeTab, onChangeActiveTab, ...props }) => {
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && (
          <HeaderIdBlock
            id={props.entity.name || ''}
            statusBadges={<EntityValidityBadge entity={props.entity as EntityValidityInput} />}
          />
        )}
        <AssetButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </AssetButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default AssetHeader;
