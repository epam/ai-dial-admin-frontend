import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import SkillDetails from '@/src/components/Publications/Assets/Skill/SkillDetails';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  skill: DialSkillResource;
  onChangeFolderId: (folderId: string) => void;
  addedFiles?: File[];
  removedFileNames?: string[];
  onAddFile: (file: File) => void;
  onRemoveExistingFile: (fileName: string) => void;
  onRemoveAddedFile: (index: number) => void;
}

/**
 * Read-only skill metadata (path/author/dates, via the shared `ResourceInfoHeader` every other
 * asset's Properties uses) plus the folder field that drives Move — editing it and saving is what
 * triggers `moveSkills`, matching how `Assets > Prompts`/`Assets > Toolsets` move their own entities
 * — and the editable file listing (add/preview/download/remove).
 */
const SkillAssetProperties: FC<Props> = ({
  skill,
  onChangeFolderId,
  addedFiles,
  removedFileNames,
  onAddFile,
  onRemoveExistingFile,
  onRemoveAddedFile,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <div className="flex flex-col gap-y-8 flex-1 min-h-0 overflow-auto">
      <ResourceInfoHeader
        entity={skill}
        prefix={<LabelledText label={t(EntityFieldsI18nKey.path)} text={skill.path} />}
      />
      <FilePath
        value={skill.folderId}
        label={t(EntitiesI18nKey.FolderStorage)}
        modalTitle={t(BasicI18nKey.MoveToFolder)}
        placeholder={t(EntityPlaceholdersI18nKey.Path)}
        onChange={onChangeFolderId}
        context={useSkillFolder}
        disabled={isReadOnlyAdmin}
        view={ApplicationRoute.Skills}
        shouldAbleToCreateNewFolder={false}
      />
      <SkillDetails
        skill={skill}
        disabled={isReadOnlyAdmin}
        addedFiles={addedFiles}
        removedFileNames={removedFileNames}
        onAddFile={onAddFile}
        onRemoveExistingFile={onRemoveExistingFile}
        onRemoveAddedFile={onRemoveAddedFile}
      />
    </div>
  );
};

export default SkillAssetProperties;
