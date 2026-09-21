'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionRow } from '@/src/models/analytics/sessions-trace';

const ProjectCellRenderer: FC<ICellRendererParams<SessionRow>> = ({ data }) => {
  const t = useI18n();

  if (!data) {
    return null;
  }

  // A third of real sessions carry no project, and a blank cell there reads as a rendering fault
  // rather than as an unattributed session.
  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      {data.project_id ? (
        <span className="text-primary dial-small-text">
          <DialEllipsisTooltip text={data.project_id} />
        </span>
      ) : (
        <span className="text-secondary dial-small-text italic">{t(SessionsTraceI18nKey.NoProject)}</span>
      )}
    </div>
  );
};

export default ProjectCellRenderer;
