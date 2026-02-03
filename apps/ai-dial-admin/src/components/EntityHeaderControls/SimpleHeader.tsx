'use client';

import { ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ReadonlyId from '../BaseControls/Id/ReadonlyId';
import SimpleButtonsWrapper from './Wrappers/SimpleButtonsWrapper';

interface Props<T> {
  entity: T;
  etag?: string;
  view: ApplicationRoute;
  tabs: TabModel[];
  activeTab: EntityViewTab;
  isEditorEnabled?: boolean;
  children?: ReactNode;
  isChanged: boolean;

  onChangeActiveTab: (tab: EntityViewTab) => void;
  onToggleEditor?: () => void;
  onDiscard: () => void;
  onSave: () => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

const SimpleEntityHeader = <T extends { id?: string; name?: string }>({
  isEditorEnabled,
  children,
  tabs,
  activeTab,
  onChangeActiveTab,
  ...props
}: Props<T>) => {
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        <ReadonlyId value={props.entity.id || props.entity.name || ''} />
        <SimpleButtonsWrapper isEditorEnabled={isEditorEnabled} {...props}>
          {children}
        </SimpleButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default SimpleEntityHeader;
