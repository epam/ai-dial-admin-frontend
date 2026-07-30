'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';
import { FC } from 'react';

import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { modelDotClass } from '@/src/utils/analytics/conversation-formatting';

const ProjectCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data) {
    return null;
  }

  const { project, model, model_count } = data;
  const extraModels = Number(model_count ?? 0) - 1;

  return (
    <div className="flex flex-col justify-center h-full min-w-0 gap-1">
      <span className="text-primary dial-small-text">
        <DialEllipsisTooltip text={project} />
      </span>
      {model && (
        <span className="flex w-fit max-w-full items-center gap-1.5 rounded border border-primary bg-layer-3 px-1.5 py-0.5">
          <span className={classNames('size-1.5 shrink-0 rounded-full', modelDotClass(model))} />
          <span className="min-w-0 font-mono dial-tiny-text text-secondary">
            <DialEllipsisTooltip text={model} />
          </span>
          {extraModels > 0 && <span className="shrink-0 dial-tiny-text text-secondary">+{extraModels}</span>}
        </span>
      )}
    </div>
  );
};

export default ProjectCellRenderer;
