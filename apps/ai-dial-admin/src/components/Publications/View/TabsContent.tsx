'use client';
import { Dispatch, SetStateAction, useCallback } from 'react';

import ParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import Conversations from '@/src/components/Assets/Conversations/View/Conversations';
import FilesDetails from '@/src/components/Publications/Assets/Files/FilesDetails';
import ApplicationProperties from '@/src/components/Publications/Properties/ApplicationProperties';
import ConversationProperties from '@/src/components/Publications/Properties/ConversationProperties';
import FileProperties from '@/src/components/Publications/Properties/FileProperties';
import PromptProperties from '@/src/components/Publications/Properties/PromptProperties';
import ToolsetProperties from '@/src/components/Publications/Properties/ToolsetProperties';
import Tools from '@/src/components/Tools/Tools';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { ConversationFolderProvider } from '@/src/context/assets/ConversationsFolderContext';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { PromptFolderProvider } from '@/src/context/assets/PromptFolderContext';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { DialConversation } from '@/src/models/dial/conversation';
import {
  ApplicationPublication,
  ConversationPublication,
  FilePublication,
  PromptPublication,
  Publication,
  ToolsetPublication,
} from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PublicationInfoHeader from './InfoHeader';
import PublicationPermissions from './Permissions';

interface Props<T> {
  view: ApplicationRoute;
  selectedPublication: T;
  originalPublication: T;
  applicationSchemes?: DialApplicationScheme[];
  activeTab: EntityViewTab;
  onChange: (publication: T) => void;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
  addedFiles?: File[];
  setAddedFiles: Dispatch<SetStateAction<File[]>>;
}

const TabsContent = <T extends Publication>({
  view,
  selectedPublication,
  originalPublication,
  applicationSchemes,
  activeTab,
  onChange,
  isPermissionsChanged,
  currentRules,
  addedFiles,
  setAddedFiles,
}: Props<T>) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeToolset = useCallback(
    (toolSetResource: DialApplicationResource) => {
      const updatedToolsets = [...((selectedPublication as ToolsetPublication).toolSetResources || [])];
      updatedToolsets[0] = {
        ...updatedToolsets[0],
        toolSetResource: toolSetResource as unknown as DialApplicationResource,
      };
      onChange({ ...selectedPublication, toolSetResources: updatedToolsets } as T);
    },
    [selectedPublication, onChange],
  );

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <div className="flex flex-col h-full">
          <PublicationInfoHeader view={view} entity={selectedPublication} />

          {view === ApplicationRoute.FilePublications && (
            <FileFolderProvider>
              <FileProperties
                publication={selectedPublication as FilePublication}
                onChange={onChange as (p: FilePublication) => void}
                addedFiles={addedFiles}
                setAddedFiles={setAddedFiles}
                disabled={isReadOnlyAdmin}
              />
            </FileFolderProvider>
          )}
          {view === ApplicationRoute.PromptPublications && (
            <PromptFolderProvider>
              <PromptProperties
                publication={selectedPublication as PromptPublication}
                onChange={onChange as (p: PromptPublication) => void}
              />
            </PromptFolderProvider>
          )}
          {view === ApplicationRoute.ApplicationPublications && (
            <AppsFolderProvider>
              <ApplicationProperties
                publication={selectedPublication as ApplicationPublication}
                applicationSchemes={applicationSchemes}
                onChange={onChange as (p: ApplicationPublication) => void}
              />
            </AppsFolderProvider>
          )}
          {view === ApplicationRoute.ToolsetPublications && (
            <ToolsetFolderProvider>
              <ToolsetProperties
                publication={selectedPublication as ToolsetPublication}
                onChange={onChange as (p: ToolsetPublication) => void}
              />
            </ToolsetFolderProvider>
          )}
          {view === ApplicationRoute.ConversationPublications && (
            <ConversationFolderProvider>
              <ConversationProperties
                publication={selectedPublication as ConversationPublication}
                onChange={onChange as (p: ConversationPublication) => void}
              />
            </ConversationFolderProvider>
          )}
        </div>
      )}
      {activeTab === EntityViewTab.Parameters && (
        <ParametersTab
          application={(selectedPublication as ApplicationPublication).applicationResources?.[0].applicationResource}
          view={ApplicationRoute.ApplicationPublications}
          applicationSchemes={applicationSchemes}
        />
      )}

      {activeTab === EntityViewTab.Tools && (
        <Tools
          originalEntity={(originalPublication as ToolsetPublication).toolSetResources?.[0].toolSetResource}
          selectedEntity={(selectedPublication as ToolsetPublication).toolSetResources?.[0].toolSetResource}
          onChangeEntity={onChangeToolset as (toolset: Toolset) => void}
          disabled={isReadOnlyAdmin}
          isAsset
        />
      )}

      {activeTab === EntityViewTab.Permissions && (
        <PublicationPermissions
          selectedPublication={selectedPublication}
          onChange={onChange}
          isPermissionsChanged={isPermissionsChanged}
          currentRules={currentRules}
        />
      )}

      {activeTab === EntityViewTab.Files && (
        <FilesDetails
          publication={selectedPublication}
          onChange={onChange as (publication: FilePublication) => void}
          addedFiles={addedFiles}
          setAddedFiles={setAddedFiles}
          disabled={isReadOnlyAdmin || view === ApplicationRoute.ConversationPublications}
        />
      )}

      {activeTab === EntityViewTab.Conversation && (
        <Conversations
          selectedConversation={
            (selectedPublication as ConversationPublication).conversations?.[0].conversation as DialConversation
          }
        />
      )}
    </>
  );
};

export default TabsContent;
