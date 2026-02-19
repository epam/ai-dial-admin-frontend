'use client';

import FileProperties from '@/src/components/Publications/Properties/FileProperties';
import PromptProperties from '@/src/components/Publications/Properties/PromptProperties';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { FilePublication, PromptPublication, Publication } from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PublicationInfoHeader from './InfoHeader';
import PublicationPermissions from './Permissions';

interface Props<T> {
  view: ApplicationRoute;
  selectedPublication: T;
  activeTab: EntityViewTab;
  onChange: (publication: T) => void;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
}

const TabsContent = <T extends Publication>({
  view,
  selectedPublication,
  activeTab,
  onChange,
  isPermissionsChanged,
  currentRules,
}: Props<T>) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <div className="flex flex-col h-full">
          <PublicationInfoHeader view={view} entity={selectedPublication} />

          {view === ApplicationRoute.FilePublications && (
            <FileFolderProvider>
              <FileProperties publication={selectedPublication} onChange={onChange as (p: FilePublication) => void} />
            </FileFolderProvider>
          )}
          {view === ApplicationRoute.PromptPublications && (
            <FileFolderProvider>
              <PromptProperties
                publication={selectedPublication}
                onChange={onChange as (p: PromptPublication) => void}
              />
            </FileFolderProvider>
          )}
        </div>
      )}

      {activeTab === EntityViewTab.Permissions && (
        <PublicationPermissions
          selectedPublication={selectedPublication}
          onChange={onChange}
          isPermissionsChanged={isPermissionsChanged}
          currentRules={currentRules}
        />
      )}
    </>
  );
};

export default TabsContent;
