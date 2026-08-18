import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import SkillDetails from '@/src/components/Publications/Assets/Skill/SkillDetails';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { SkillPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: SkillPublication;
  onChange?: (publication: SkillPublication) => void;
  addedFiles?: File[];
  setAddedFiles: Dispatch<SetStateAction<File[]>>;
  removedFileNames?: string[];
  setRemovedFileNames: Dispatch<SetStateAction<string[]>>;
  disabled?: boolean;
}

/**
 * `BaseProperties` still edits the standard name/folder/comment fields every publication type
 * carries. `SkillDetails` works with the plain skill resource, not the publication wrapper — this
 * component is what extracts it, so the Assets-facing detail view doesn't need to fake a publication
 * shape. File add/remove are staged here (mirroring `FileProperties`'s `addedFiles`/`setAddedFiles`)
 * rather than applied immediately: `PublicationView`'s existing Save/Discard already tracks these as
 * part of `isChanged` and applies them (upload/delete against the skill's own Core routes) when the
 * reviewer saves.
 */
const SkillProperties: FC<Props> = ({
  publication,
  onChange,
  addedFiles,
  setAddedFiles,
  removedFileNames,
  setRemovedFileNames,
  disabled,
}) => {
  const skill = publication.skillResources?.[0]?.skillResource;

  const onAddFile = useCallback(
    (file: File) => {
      setAddedFiles((prev) => [...(prev || []), file]);
    },
    [setAddedFiles],
  );

  const onRemoveExistingFile = useCallback(
    (fileName: string) => {
      setRemovedFileNames((prev) => (prev?.includes(fileName) ? prev : [...(prev || []), fileName]));
    },
    [setRemovedFileNames],
  );

  const onRemoveAddedFile = useCallback(
    (index: number) => {
      setAddedFiles((prev) => {
        const next = [...(prev || [])];
        next.splice(index, 1);
        return next;
      });
    },
    [setAddedFiles],
  );

  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={useSkillFolder} />
        <SkillDetails
          skill={skill}
          disabled={disabled}
          addedFiles={addedFiles}
          removedFileNames={removedFileNames}
          onAddFile={onAddFile}
          onRemoveExistingFile={onRemoveExistingFile}
          onRemoveAddedFile={onRemoveAddedFile}
        />
      </div>
    </div>
  );
};

export default SkillProperties;
