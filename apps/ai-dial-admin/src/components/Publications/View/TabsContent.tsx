'use client';
import { Dispatch, SetStateAction } from 'react';

import ParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import FilesDetails from '@/src/components/Publications/Assets/Files/FilesDetails';
import ApplicationProperties from '@/src/components/Publications/Properties/ApplicationProperties';
import FileProperties from '@/src/components/Publications/Properties/FileProperties';
import PromptProperties from '@/src/components/Publications/Properties/PromptProperties';
import ToolsetProperties from '@/src/components/Publications/Properties/ToolsetProperties';
import Tools from '@/src/components/Tools/Tools';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { PromptFolderProvider } from '@/src/context/assets/PromptFolderContext';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { DialApplicationScheme } from '@/src/models/dial/application';
import {
  ApplicationPublication,
  FilePublication,
  PromptPublication,
  Publication,
  ToolsetPublication,
} from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PublicationInfoHeader from './InfoHeader';
import PublicationPermissions from './Permissions';

interface Props<T> {
  view: ApplicationRoute;
  selectedPublication: T;
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
  applicationSchemes,
  activeTab,
  onChange,
  isPermissionsChanged,
  currentRules,
  addedFiles,
  setAddedFiles,
}: Props<T>) => {
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
          originalToolset={(selectedPublication as ToolsetPublication).toolSetResources?.[0].toolSetResource}
          readonly={true}
          isAssetToolset={true}
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
        />
      )}
    </>
  );
};

export default TabsContent;
