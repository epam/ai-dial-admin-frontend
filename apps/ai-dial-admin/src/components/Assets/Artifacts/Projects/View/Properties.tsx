import { FC } from 'react';

import ProjectDetails from '@/src/components/Assets/Artifacts/Projects/View/ProjectDetails';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialProjectResource } from '@/src/models/dial/resource';
import { ProjectContextLimits, StoredContextFile } from '@/src/models/project-context';

interface Props {
  project: DialProjectResource;
  description: string;
  instructions: string;
  storedFiles: StoredContextFile[];
  addedFiles: File[];
  removedFileNames: string[];
  limits: ProjectContextLimits;
  onChangeDescription: (description: string) => void;
  onChangeInstructions: (instructions: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveStoredFile: (fileName: string) => void;
  onRemoveAddedFile: (index: number) => void;
}

/**
 * Read-only project metadata (path/author/dates, via the shared `ResourceInfoHeader`) followed by the project's
 * editable fields. There is no destination-folder field: moving a project is blocked by Core
 * (https://github.com/epam/ai-dial-core/issues/1861), as it is for Skills.
 */
const ProjectAssetProperties: FC<Props> = ({ project, ...detailsProps }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <div className="flex flex-col gap-y-8 flex-1 min-h-0 overflow-auto">
      <ResourceInfoHeader
        entity={project}
        prefix={<LabelledText label={t(EntityFieldsI18nKey.path)} text={project.path} />}
      />
      <ProjectDetails name={project.name} projectPath={project.path} disabled={isReadOnlyAdmin} {...detailsProps} />
    </div>
  );
};

export default ProjectAssetProperties;
