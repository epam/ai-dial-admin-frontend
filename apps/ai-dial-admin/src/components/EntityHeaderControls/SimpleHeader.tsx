'use client';

import { ReactNode } from 'react';

import { TabModel } from '@epam/ai-dial-ui-kit';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import SimpleButtonsWrapper from './Wrappers/SimpleButtonsWrapper';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';

interface Entity {
  id?: string;
  $id?: string;
  name?: string;
}
interface Props<T> {
  entity: T;
  etag?: string;
  view: ApplicationRoute;
  tabs: TabModel[];
  activeTab: EntityViewTab;
  children?: ReactNode;
  isChanged: boolean;
  jsonConfiguration: JsonConfiguration;

  onChangeActiveTab: (tab: EntityViewTab) => void;
  onDiscard: () => void;
  onSave: () => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

const SimpleEntityHeader = <T extends Entity>({
  jsonConfiguration,
  children,
  tabs,
  activeTab,
  onChangeActiveTab,
  ...props
}: Props<T>) => {
  const { isEditorEnabled } = jsonConfiguration;
  return (
    <div className="flex flex-col gap-y-4 mb-8">
      <div className={getHeaderClassName(isEditorEnabled)}>
        {!isEditorEnabled && <ReadonlyId value={props.entity.id || props.entity.$id || props.entity.name || ''} />}
        <SimpleButtonsWrapper jsonConfiguration={jsonConfiguration} {...props}>
          {children}
        </SimpleButtonsWrapper>
      </div>
      <Tabs isEditorEnabled={isEditorEnabled} tabs={tabs} activeTab={activeTab} onChangeActiveTab={onChangeActiveTab} />
    </div>
  );
};

export default SimpleEntityHeader;
