'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const ProjectCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  const t = useI18n();

  if (!data) {
    return null;
  }

  // A third of real conversations carry no project, and a blank cell there reads as a rendering fault
  // rather than as an unattributed conversation.
  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      {data.project_id ? (
        <span className="text-primary dial-small-text">
          <DialEllipsisTooltip text={data.project_id} />
        </span>
      ) : (
        <span className="text-secondary dial-small-text italic">{t(ConversationsTraceI18nKey.NoProject)}</span>
      )}
    </div>
  );
};

export default ProjectCellRenderer;
