import { FC } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
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
              tool={tool}
              toolSetName={toolSetName}
              isAddedManual={isAddedManual}
              isMcpToolset={isMcpToolset}
              isAssetToolset={isAssetToolset}
            />
          }
          containerClassName={isMcpToolset ? 'px-4 py-4' : 'px-4 py-2'}
        >
          <ToolContent tool={tool} />
        </Accordion>
      )}
    </>
  );
};

export default Tool;
