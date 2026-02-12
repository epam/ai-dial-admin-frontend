'use client';

import { FC, ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ImagesButtonsWrapper, { ImagesButtonsWrapperProps } from './Wrappers/ImagesButtonsWrapper';

interface Props extends ImagesButtonsWrapperProps {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const ImagesHeader: FC<Props> = ({ jsonConfiguration, children, tabs, activeTab, onChangeActiveTab, ...props }) => {
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && <ReadonlyId value={props.image.name || ''} />}
        <ImagesButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </ImagesButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default ImagesHeader;
