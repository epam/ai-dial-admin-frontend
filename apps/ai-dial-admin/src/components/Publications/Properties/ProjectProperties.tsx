import { FC } from 'react';

import { ProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/models';
import ProjectDetails from '@/src/components/Assets/Artifacts/Projects/View/ProjectDetails';
import { useProjectFolder } from '@/src/context/assets/ProjectFolderContext';
import { ProjectPublication } from '@/src/models/dial/publications';
import { ProjectContextLimits } from '@/src/models/project-context';
import BaseProperties from './BaseProperties';

interface Props {
  publication: ProjectPublication;
  staging: ProjectStaging;
  limits: ProjectContextLimits;
  disabled?: boolean;
  onChange?: (publication: ProjectPublication) => void;
}

/**
 * `BaseProperties` edits the standard name/folder/comment fields every publication type carries;
 * `ProjectDetails` works with the project itself, not the publication wrapper, so this component extracts it.
 * Description, Instructions and Context edits are staged by `ComplexResourcePublicationView` and written to
 * the project (through Core's per-file project routes) when the reviewer saves the publication.
 */
const ProjectProperties: FC<Props> = ({ publication, staging, limits, disabled, onChange }) => {
  const project = publication.projectResources?.[0]?.projectResource;

  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={useProjectFolder} />
        <ProjectDetails
          name={project?.name ?? ''}
          projectPath={project?.path}
          staging={staging}
          limits={limits}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ProjectProperties;
