import { FC, useState } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import { ParamsView } from '@/src/types/parameters';
import ToolContent from './ToolContent';
import ToolHeader from './ToolHeader';

interface Props {
  tool: ToolType;
  disabled?: boolean;
  isAddedManual?: boolean;
  isMcpToolset?: boolean;
  isAssetToolset?: boolean;
  isPublicationToolset?: boolean;
  containerId?: string;
  toolSetName: string;
}

const Tool: FC<Props> = ({
  tool,
  isAddedManual,
  disabled,
  isMcpToolset,
  isPublicationToolset,
  isAssetToolset,
  containerId,
  toolSetName,
}) => {
  const [view, setView] = useState(ParamsView.TABLE);

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
            isPublicationToolset={isPublicationToolset}
            containerId={containerId}
          />
        </div>
      ) : (
        <Accordion
          header={
            <ToolHeader
              disabled={disabled}
              viewSelector={<ViewSelector view={view} changeView={setView} />}
              tool={tool}
              toolSetName={toolSetName}
              isAddedManual={isAddedManual}
              isMcpToolset={isMcpToolset}
              isAssetToolset={isAssetToolset}
              containerId={containerId}
            />
          }
          containerClassName={isMcpToolset ? '' : 'px-4 py-2'}
        >
          <ToolContent tool={tool} view={view} />
        </Accordion>
      )}
    </>
  );
};

export default Tool;
