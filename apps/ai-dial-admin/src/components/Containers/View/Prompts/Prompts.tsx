import { FC, useEffect, useState } from 'react';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { useI18n } from '@/src/locales/client';
import { Prompt } from '@/src/models/deployments/containers';
import { getContainerPrompts } from '@/src/app/actions/deployments';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import PromptComponent from '@/src/components/Containers/View/Prompts/Prompt';

interface Props {
  containerId?: string;
}

const Prompts: FC<Props> = ({ containerId }) => {
  const t = useI18n();

  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchTools = async () => {
      if (containerId) {
        setLoading(true);
        const data = await getContainerPrompts(containerId);
        if (data) {
          setPrompts(data.prompts);
        }
        setLoading(false);
      }
    };

    fetchTools().catch((error) => console.error(`Getting container prompts error: ${error}`));
  }, [containerId]);

  if (!loading && !prompts?.length) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoPrompts)} />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6">
        {prompts?.map((prompt, index) => {
          return <PromptComponent prompt={prompt} key={index} />;
        })}
      </div>
    </div>
  );
};

export default Prompts;
