'use client';

import { FC } from 'react';

import { Input } from '@epam/ai-dial-ui-kit';

import ContextFiles from '@/src/components/Assets/Artifacts/Projects/View/ContextFiles';
import DescriptionControl from '@/src/components/BaseControls/Description';
import MdEditor from '@/src/components/Common/MdEditor/MdEditor';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ProjectContextLimits, StoredContextFile } from '@/src/models/project-context';

interface Props {
  name: string;
  description: string;
  instructions: string;
  /** The project's path, used to download stored context files. */
  projectPath?: string;
  storedFiles: StoredContextFile[];
  addedFiles: File[];
  removedFileNames: string[];
  limits: ProjectContextLimits;
  disabled?: boolean;
  onChangeDescription: (description: string) => void;
  onChangeInstructions: (instructions: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveStoredFile: (fileName: string) => void;
  onRemoveAddedFile: (index: number) => void;
}

/**
 * A project's editable fields, shared between the `Assets > Projects` Properties tab and the Project
 * Publications properties view: a disabled `Name` (a project's identity is its path), `Description` and
 * markdown `Instructions` from `PROJECT.md`, and the `Context` files. Everything is staged by the owning view
 * and only written to Core on its Save — this component never calls Core.
 */
const ProjectDetails: FC<Props> = ({
  name,
  description,
  instructions,
  projectPath,
  storedFiles,
  addedFiles,
  removedFileNames,
  limits,
  disabled,
  onChangeDescription,
  onChangeInstructions,
  onAddFiles,
  onRemoveStoredFile,
  onRemoveAddedFile,
}) => {
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
        entity={{ description }}
        onChangeEntity={(updated) => onChangeDescription(updated.description ?? '')}
        disabled={disabled}
        isFullWidth={false}
      />
      <div>
        <div className="dial-tiny-semi-text mb-2 text-secondary">{t(ProjectI18nKey.Instructions)}</div>
        <MdEditor content={instructions} onChangeContent={onChangeInstructions} readOnly={disabled} />
      </div>
      <ContextFiles
        projectPath={projectPath}
        storedFiles={storedFiles}
        addedFiles={addedFiles}
        removedFileNames={removedFileNames}
        limits={limits}
        disabled={disabled}
        onAddFiles={onAddFiles}
        onRemoveStoredFile={onRemoveStoredFile}
        onRemoveAddedFile={onRemoveAddedFile}
      />
    </div>
  );
};

export default ProjectDetails;
