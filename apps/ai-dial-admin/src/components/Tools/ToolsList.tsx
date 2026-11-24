import { memo, useMemo } from 'react';

import { NoDataContent } from '@epam/ai-dial-ui-kit';

import ToolComponent from '@/src/components/Tools/Tool/Tool';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Tool } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  tools: Tool[] | null;
  visibleTools: Tool[] | null;
  disabled?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  containerId?: string;
  toolSetName: string;
  view?: ApplicationRoute;
}

const ToolsList = memo(
  ({ tools, visibleTools, disabled, isMcpToolset, isAssetToolset, containerId, toolSetName, view }: Props) => {
    const t = useI18n();
    const discoveredNames = useMemo(() => new Set(tools?.map((tool) => tool.name)), [tools]);

    return (
      <div className="flex flex-col gap-6 overflow-y-auto h-full">
        {!visibleTools?.length ? (
          <div className="flex items-center justify-center h-full">
            <NoDataContent title={t(EntitiesI18nKey.NoTools)} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {visibleTools.map((tool) => (
              <ToolComponent
                tool={tool}
                key={tool.name}
                disabled={disabled}
                isAddedManual={!discoveredNames.has(tool.name)}
                isMcpToolset={isMcpToolset}
                isAssetToolset={isAssetToolset}
                containerId={containerId}
                toolSetName={toolSetName}
                view={view}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

ToolsList.displayName = 'ToolsList';

export default ToolsList;
