'use client';

import { FC } from 'react';

import SkillManifestTab from '@/src/components/Assets/Artifacts/Skills/View/SkillManifestTab';
import ProjectProperties from '@/src/components/Publications/Properties/ProjectProperties';
import SkillProperties from '@/src/components/Publications/Properties/SkillProperties';
import { ProjectFolderProvider } from '@/src/context/assets/ProjectFolderContext';
import { SkillFolderProvider } from '@/src/context/assets/SkillFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ProjectPublication, Publication, SkillPublication } from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { ProjectContextLimits } from '@/src/models/project-context';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { SkillPublicationStaging } from './use-skill-publication-staging';
import { ProjectStaging } from './models';
import PublicationInfoHeader from './InfoHeader';
import PublicationPermissions from './Permissions';

interface Props {
  view: ApplicationRoute.SkillPublications | ApplicationRoute.ProjectPublications;
  activeTab: EntityViewTab;
  selectedPublication: Publication;
  onChange: (publication: Publication) => void;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
  skillStaging: SkillPublicationStaging;
  projectStaging: ProjectStaging;
  projectLimits: ProjectContextLimits;
}

/**
 * Tab content for Skill and Project publications. Skill keeps `Properties` / `Skill` / `Permissions`; Project has
 * `Properties` (Description, Instructions, Context) and `Permissions`. The other publication types render through
 * the generic `TabsContent`.
 */
const ComplexResourceTabsContent: FC<Props> = ({
  view,
  activeTab,
  selectedPublication,
  onChange,
  isPermissionsChanged,
  currentRules,
  skillStaging,
  projectStaging,
  projectLimits,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <div className="flex flex-col h-full">
          <PublicationInfoHeader view={view} entity={selectedPublication} />

          {view === ApplicationRoute.SkillPublications && (
            <SkillFolderProvider>
              <SkillProperties
                publication={selectedPublication as SkillPublication}
                onChange={onChange as (p: SkillPublication) => void}
                addedFiles={skillStaging.addedFiles}
                setAddedFiles={skillStaging.setAddedFiles}
                removedFileNames={skillStaging.removedFileNames}
                setRemovedFileNames={skillStaging.setRemovedFileNames}
                disabled={isReadOnlyAdmin}
              />
            </SkillFolderProvider>
          )}
          {view === ApplicationRoute.ProjectPublications && (
            <ProjectFolderProvider>
              <ProjectProperties
                publication={selectedPublication as ProjectPublication}
                onChange={onChange as (p: ProjectPublication) => void}
                description={projectStaging.description}
                instructions={projectStaging.instructions}
                storedFiles={projectStaging.storedFiles}
                addedFiles={projectStaging.addedFiles}
                removedFileNames={projectStaging.removedFileNames}
                limits={projectLimits}
                disabled={isReadOnlyAdmin}
                onChangeDescription={projectStaging.onChangeDescription}
                onChangeInstructions={projectStaging.onChangeInstructions}
                onAddFiles={projectStaging.onAddFiles}
                onRemoveStoredFile={projectStaging.onRemoveStoredFile}
                onRemoveAddedFile={projectStaging.onRemoveAddedFile}
              />
            </ProjectFolderProvider>
          )}
        </div>
      )}

      {activeTab === EntityViewTab.Skill && skillStaging.stagedManifest && (
        <SkillManifestTab
          name={skillStaging.stagedManifest.name}
          description={skillStaging.stagedManifest.description}
          body={skillStaging.stagedManifest.body}
          onChangeDescription={skillStaging.onChangeDescription}
          onChangeBody={skillStaging.onChangeBody}
          disabled={isReadOnlyAdmin}
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
    </>
  );
};

export default ComplexResourceTabsContent;
