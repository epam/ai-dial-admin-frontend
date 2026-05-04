import { FC, useState } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import { ParamsView } from '@/src/types/parameters';
import { ApplicationRoute } from '@/src/types/routes';
import ToolContent from './ToolContent';
import ToolHeader from './ToolHeader';

interface Props {
  tool: ToolType;
  disabled?: boolean;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  containerId?: string;
  toolSetName: string;
  view?: ApplicationRoute;
}

const Tool: FC<Props> = ({
  tool,
  isAddedManual,
  disabled,
  isMcpToolset,
  isAssetToolset,
  containerId,
  toolSetName,
  view,
}) => {
  const [currentView, setCurrentView] = useState(ParamsView.TABLE);

  return (
    <>
      {isAddedManual ? (
        <div className="flex flex-col rounded border border-primary p-4 pl-[36px]">
          <ToolHeader
            tool={tool}
            disabled={disabled}
            toolSetName={toolSetName}
            isAddedManual={isAddedManual}
            isMcpToolset={isMcpToolset}
            isAssetToolset={isAssetToolset}
            containerId={containerId}
            view={view}
          />
        </div>
      ) : (
        <Accordion
          header={
            <ToolHeader
              disabled={disabled}
              viewSelector={<ViewSelector view={currentView} changeView={setCurrentView} />}
              tool={tool}
              toolSetName={toolSetName}
              isAddedManual={isAddedManual}
              isMcpToolset={isMcpToolset}
              isAssetToolset={isAssetToolset}
              containerId={containerId}
              view={view}
            />
          }
          containerClassName={isMcpToolset ? '' : 'px-4 py-2'}
        >
          <ToolContent tool={tool} view={currentView} />
        </Accordion>
      )}
    </>
  );
};

export default Tool;
