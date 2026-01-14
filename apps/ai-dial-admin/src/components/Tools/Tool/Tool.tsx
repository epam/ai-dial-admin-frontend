import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import ToolContent from './ToolContent';
import ToolHeader from './ToolHeader';

interface Props {
  tool: ToolType;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  toolSetName: string;
}

const Tool: FC<Props> = ({ tool, isAddedManual, isMcpToolset, isAssetToolset, toolSetName }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col border-primary border px-4 py-2">
      <div className="flex items-center cursor-pointer group" onClick={toggleCollapse} role="button">
        <div className="flex items-center flex-1">
          <i className="text-icon-secondary">
            {isCollapsed ? (
              <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
            ) : (
              <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
            )}
          </i>
          <ToolHeader
            tool={tool}
            toolSetName={toolSetName}
            isCollapsed={isCollapsed}
            isAddedManual={isAddedManual}
            isMcpToolset={isMcpToolset}
            isAssetToolset={isAssetToolset}
          />
        </div>
      </div>
      {!isCollapsed && <ToolContent tool={tool} />}
    </div>
  );
};

export default Tool;
