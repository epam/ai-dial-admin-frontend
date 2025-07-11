import { PromptPublication } from '@/src/models/dial/publications';
import PromptsProperties from '@/src/components/PublicationView/PromptProperties/PromptsProperties';

interface Props {
  publication: PromptPublication;
}

const PromptsPropertiesList = ({ publication }: Props) => {
  return (
    <>
      {publication?.prompts?.map((prompt, index) => (
        <PromptsProperties
          key={index}
          prompt={prompt}
          action={publication.action}
          collapsed={publication?.prompts?.length !== 1}
        />
      ))}
    </>
  );
};

export default PromptsPropertiesList;
