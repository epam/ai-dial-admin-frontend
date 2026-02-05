import { FC, useState } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import { Tool as ToolType } from '@/src/models/dial/toolset';
import { ParamsView } from '@/src/types/parameters';
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
  const [view, setView] = useState(ParamsView.TABLE);

  return (
    <>
      {isAddedManual ? (
        <div className="flex flex-col rounded border border-primary px-4 pl-[36px] py-4">
          <ToolHeader
            tool={tool}
            toolSetName={toolSetName}
            isAddedManual={isAddedManual}
            isMcpToolset={isMcpToolset}
            isAssetToolset={isAssetToolset}
          />
        </div>
      ) : (
        <Accordion
          header={
            <ToolHeader
              viewSelector={<ViewSelector view={view} changeView={setView} />}
              tool={tool}
              toolSetName={toolSetName}
              isAddedManual={isAddedManual}
              isMcpToolset={isMcpToolset}
              isAssetToolset={isAssetToolset}
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
