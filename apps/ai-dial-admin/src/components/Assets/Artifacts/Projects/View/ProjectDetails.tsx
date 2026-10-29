'use client';

import { FC } from 'react';

import { Input } from '@epam/ai-dial-ui-kit';

import ContextFiles from '@/src/components/Assets/Artifacts/Projects/View/ContextFiles';
import { ProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/models';
import DescriptionControl from '@/src/components/BaseControls/Description';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ProjectContextLimits } from '@/src/models/project-context';

interface Props {
  name: string;
  /** The project's path, used to download stored context files. */
  projectPath?: string;
  /** The owning view's staged edits; this component reads and changes them, the view saves them. */
  staging: ProjectStaging;
  limits: ProjectContextLimits;
  disabled?: boolean;
}

/**
 * A project's editable fields, shared between the `Assets > Projects` Properties tab and the Project
 * Publications properties view: a disabled `Name` (a project's identity is its path), `Description` and
 * markdown `Instructions` from `PROJECT.md`, and the `Context` files. Everything is staged by the owning view
 * and only written to Core on its Save — this component never calls Core.
 */
const ProjectDetails: FC<Props> = ({ name, projectPath, staging, limits, disabled }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-8">
      <Input
        disabled
        placeholder={t(EntityPlaceholdersI18nKey.Name)}
        labelProps={{ label: t(EntityFieldsI18nKey.name) }}
        id="project-name"
        value={name}
        containerClassName={STANDARD_CONTROL_WIDTH}
      />
      <DescriptionControl
        entity={{ description: staging.description }}
        onChangeEntity={(updated) => staging.onChangeDescription(updated.description ?? '')}
        disabled={disabled}
        isFullWidth={false}
      />
      <div>
        <div className="dial-tiny-semi-text mb-2 text-secondary">{t(ProjectI18nKey.Instructions)}</div>
        <MdEditor content={staging.instructions} onChangeContent={staging.onChangeInstructions} readOnly={disabled} />
      </div>
      <ContextFiles
        projectPath={projectPath}
        storedFiles={staging.storedFiles}
        addedFiles={staging.addedFiles}
        removedFileNames={staging.removedFileNames}
        limits={limits}
        disabled={disabled}
        onAddFiles={staging.onAddFiles}
        onRemoveStoredFile={staging.onRemoveStoredFile}
        onRemoveAddedFile={staging.onRemoveAddedFile}
      />
    </div>
  );
};

export default ProjectDetails;
