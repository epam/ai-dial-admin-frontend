import { FC, useEffect, useRef, useState } from 'react';
import { DialTextInputField, DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import ToolComponent from '@/src/components/Containers/View/Tools/Tool';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { Tool } from '@/src/models/deployments/containers';
import { getContainerTools } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { BasicI18nKey, EntitiesI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

interface Props {
  containerId?: string;
}

const Tools: FC<Props> = ({ containerId }) => {
  const t = useI18n();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState<boolean>(false);
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [displayTools, setDisplayTools] = useState<Tool[] | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchTools = async () => {
      if (containerId) {
        setLoading(true);
        const res = await getContainerTools(containerId);
        if (!res.success) {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
        if (res.response) {
          setTools((res.response as { tools: Tool[] }).tools);
        }
        setLoading(false);
      }
    };

    fetchTools().catch((error) => console.error(`Getting container tools error: ${error}`));
  }, [containerId, showNotification]);

  useEffect(() => {
    if (!tools?.length) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (search.length) {
        const searchText = search.toLowerCase().trim();

        setDisplayTools(
          tools.filter(
            (tool) =>
              tool.name.toLowerCase().includes(searchText) ||
              tool.description?.toLowerCase().includes(searchText) ||
              JSON.stringify(tool.inputSchema?.properties)?.toLowerCase().includes(searchText) ||
              JSON.stringify(tool.annotations)?.toLowerCase().includes(searchText),
          ),
        );
      } else {
        setDisplayTools(tools);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [search, tools]);

  if (loading) {
    return <DialLoader size={40} />;
  }

  if (!loading && !tools?.length) {
    return <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="lg:max-w-[480px]">
        <DialTextInputField
          elementId="search"
          fieldTitle={t(BasicI18nKey.Search)}
          placeholder={t(EntityPlaceholdersI18nKey.Search)}
          value={search}
          onChange={(search) => setSearch(search as string)}
        />
      </div>
      <div className="flex flex-col gap-6">
        {displayTools?.map((tool, index) => {
          return <ToolComponent tool={tool} key={index} />;
        })}
      </div>
    </div>
  );
};

export default Tools;
