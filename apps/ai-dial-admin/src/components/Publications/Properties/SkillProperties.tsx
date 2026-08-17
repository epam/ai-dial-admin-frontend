import { FC } from 'react';

import SkillDetails from '@/src/components/Publications/Assets/Skill/SkillDetails';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { SkillPublication } from '@/src/models/dial/publications';
import BaseProperties from './BaseProperties';

interface Props {
  publication: SkillPublication;
  onChange?: (publication: SkillPublication) => void;
}

/**
 * Read-only counterpart to `ToolsetProperties`/`FileProperties`: `BaseProperties` still edits the
 * standard name/folder/comment fields every publication type carries, but `SkillDetails` never
 * accepts `onChange` — a skill's own content has no editable form (see design.md's Non-Goals).
 *
 * Reuses `FileFolderContext` for `BaseProperties`' "move to folder" browsing rather than a
 * dedicated skill-folder context, since no skill-tree browsing endpoint exists yet on the FE.
 */
const SkillProperties: FC<Props> = ({ publication, onChange }) => {
  return (
    <div className="flex-1 min-h-0 pt-8">
      <div className="w-full flex flex-col gap-y-8">
        <BaseProperties publication={publication} onChange={onChange} getContext={useFileFolder} />
        <SkillDetails publication={publication} />
      </div>
    </div>
  );
};

export default SkillProperties;
