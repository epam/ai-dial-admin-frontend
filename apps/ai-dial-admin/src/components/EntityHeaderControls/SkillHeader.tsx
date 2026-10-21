'use client';

import { FC, ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import SkillButtonsWrapper, { SkillButtonsWrapperProps } from './Wrappers/SkillButtonsWrapper';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props extends SkillButtonsWrapperProps {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const SkillHeader: FC<Props> = ({ children, tabs, activeTab, onChangeActiveTab, ...props }) => {
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(false)}>
        <ReadonlyId value={props.entity.name || ''} />
        <SkillButtonsWrapper {...props}>{children}</SkillButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={false} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default SkillHeader;
