'use client';

import { TooltipContainer, TooltipContent, TooltipTrigger } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';

export interface ClampedTextCellRendererParams extends ICellRendererParams {
  lines?: number;
}

const ClampedTextCellRenderer = ({ value, lines = 2 }: ClampedTextCellRendererParams) => {
  const text = (value as string) ?? '';

  if (!text) {
    return null;
  }

  return (
    <div className="flex size-full items-center overflow-hidden">
      <TooltipContainer>
        <TooltipTrigger asChild>
          <span
            className="w-full break-words leading-5"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: lines,
              WebkitBoxOrient: 'vertical',
              whiteSpace: 'normal',
              overflow: 'hidden',
              maxHeight: `${lines}lh`,
            }}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-primary">{text}</TooltipContent>
      </TooltipContainer>
    </div>
  );
};

export default ClampedTextCellRenderer;
