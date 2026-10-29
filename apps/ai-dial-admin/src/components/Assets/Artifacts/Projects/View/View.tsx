'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback } from 'react';

import { removeProject } from '@/src/app/[lang]/projects/actions';
import ProjectAssetProperties from '@/src/components/Assets/Artifacts/Projects/View/Properties';
import { useProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/use-project-staging';
import SkillHeader from '@/src/components/EntityHeaderControls/SkillHeader';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useProjectFolder } from '@/src/context/assets/ProjectFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialProjectResource } from '@/src/models/dial/resource';
import { ProjectContextLimits } from '@/src/models/project-context';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

interface Props {
  project: DialProjectResource;
  /** `PROJECT.md`'s raw content, read by the page; empty when the manifest is missing. */
  manifestContent: string;
  limits: ProjectContextLimits;
}

/**
 * `Assets > Projects` detail view: a single `Properties` tab with Description, Instructions and Context. No
 * Audit tab, no JSON editor and no destination-folder field. Every edit — including Context file additions and
 * removals — is staged locally and only written to Core on Save, in order: `PROJECT.md`, removals, additions.
 * The header is the Skill one: nothing in it is specific to skills beyond its name.
 */
const ProjectView: FC<Props> = ({ project, manifestContent, limits }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useProjectFolder();
  const { showNotification } = useNotification();
  const tabs = getTabsForAsset(t, ApplicationRoute.Projects);

  const staging = useProjectStaging({ manifestContent, projectName: project.name, files: project.files });
  const { apply, discard } = staging;

  const onSave = useCallback(async () => {
    try {
      const result = await apply(project.path);
      if (!result.success) {
        showNotification(
          getErrorNotification(
            result.errorHeader || t(ErrorI18nKey.ServerError),
            result.errorMessage,
            result.requestId,
          ),
        );
        return;
      }

      showNotification(
        getSuccessNotification(
          getUpdateNotificationTitle(ApplicationRoute.Projects, t),
          getUpdateNotificationDescription(ApplicationRoute.Projects, project.name, t),
        ),
      );
      fetchFiles(project.folderId);
      router.refresh();
    } catch (e) {
      // A server action rejecting (rather than resolving `{ success: false }`) would otherwise be a silent
      // no-op, indistinguishable from the Save button doing nothing at all.
      console.error('Failed to save project changes', e);
      showNotification(getErrorNotification(t(ErrorI18nKey.ServerError)));
    }
  }, [apply, fetchFiles, project, router, showNotification, t]);

  const onRemoveProject = useCallback(
    (path: string) => removeProject(path, project.etag || DEFAULT_ETAG),
    [project.etag],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SkillHeader
        view={ApplicationRoute.Projects}
        entity={project}
        etag={project.etag}
        isChanged={staging.isChanged}
        onDiscard={discard}
        onSave={onSave}
        tabs={tabs}
        activeTab={EntityViewTab.Properties}
        onChangeActiveTab={() => undefined}
        onRemove={onRemoveProject}
        getAssetContext={useProjectFolder}
      />
      <div className="flex-1 overflow-auto min-h-0">
        <ProjectAssetProperties project={project} staging={staging} limits={limits} />
      </div>
    </div>
  );
};

export default ProjectView;
