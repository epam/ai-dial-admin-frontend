'use client';

import { FC, ReactNode, useMemo } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ConversationButtonsWrapper, { ConversationButtonsWrapperProps } from './Wrappers/ConversationButtonsWrapper';
import { DialConversation } from '@/src/models/dial/conversation';
import { getNameVersionFromAsset } from '@/src/utils/entities/versions';
import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';

interface Props extends ConversationButtonsWrapperProps<DialConversation> {
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;

  onChangeActiveTab: (tab: EntityViewTab) => void;
}

const ConversationHeader: FC<Props> = ({ children, tabs, activeTab, onChangeActiveTab, ...props }) => {
  const conversationName = useMemo(() => {
    const { name } = getNameVersionFromAsset(props.entity.name || '');
    return name || '';
  }, [props.entity.name]);

  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(false)}>
        <ReadonlyId value={conversationName} />
        <ConversationButtonsWrapper {...props}>{children}</ConversationButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={false} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default ConversationHeader;
