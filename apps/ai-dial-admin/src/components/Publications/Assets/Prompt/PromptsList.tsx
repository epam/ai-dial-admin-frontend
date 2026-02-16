import { FC, useCallback } from 'react';

import { DialPrompt } from '@/src/models/dial/prompt';
import { PromptPublication } from '@/src/models/dial/publications';
import { updatePathWithNameAndVersion } from '@/src/utils/files/path';
import PromptDetails from './PromptDetails';

interface Props {
  publication: PromptPublication;
  onChange?: (publication: PromptPublication) => void;
}

const PromptsList: FC<Props> = ({ publication, onChange }) => {
  const onChangePrompt = useCallback(
    (updatedPrompt: DialPrompt, index: number) => {
      const path = updatePathWithNameAndVersion(updatedPrompt.path, updatedPrompt.name || '', updatedPrompt.version);
      const updatedPrompts = [...(publication.prompts || [])];
      updatedPrompts[index] = { ...updatedPrompts[index], ...updatedPrompt, path };
      onChange?.({ ...publication, prompts: updatedPrompts });
    },
    [publication, onChange],
  );

  const onRemovePrompt = useCallback(
    (index: number) => {
      const updatedPrompts = [...(publication.prompts || [])];
      updatedPrompts.splice(index, 1);
      onChange?.({ ...publication, prompts: updatedPrompts });
    },
    [publication, onChange],
  );

  return (
    <div className="flex-1 min-h-0 relative overflow-auto">
      {publication.prompts?.map((prompt, index) => (
        <div key={index} className="mb-6">
          <PromptDetails
            prompt={prompt as DialPrompt}
            onChange={(updatedPrompt) => onChangePrompt(updatedPrompt, index)}
            onRemove={() => onRemovePrompt(index)}
          />
        </div>
      ))}
    </div>
  );
};

export default PromptsList;
