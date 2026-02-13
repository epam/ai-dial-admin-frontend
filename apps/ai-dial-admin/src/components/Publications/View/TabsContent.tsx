'use client';

import FilesProperties from '@/src/components/Publications/Properties/FilesProperties';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { FilePublication, Publication } from '@/src/models/dial/publications';
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
        <div className="flex flex-col">
          <PublicationInfoHeader view={view} entity={selectedPublication} />

          {view === ApplicationRoute.FilePublications && (
            <FileFolderProvider>
              <FilesProperties publication={selectedPublication} onChange={onChange as (p: FilePublication) => void} />
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
