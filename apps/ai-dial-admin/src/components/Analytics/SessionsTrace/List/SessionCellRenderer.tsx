'use client';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { sessionDetailHref } from '@/src/components/Analytics/SessionsTrace/utils';
import EntityLinkCell from '@/src/components/Grid/CellRenderers/EntityLinkCell';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionRow } from '@/src/models/analytics/sessions-trace';
import { sessionTitle } from '@/src/utils/analytics/session-detail-fields';

// The session's identity in one cell: its name above, its id below. The two are one column because
// the id is what the name falls back to being — rendering them side by side printed the id twice on every
// session the insight enrichment has not reached, which is most of them.
const SessionCellRenderer: FC<ICellRendererParams<SessionRow>> = ({ data }) => {
  if (!data?.client_session_id) {
    return null;
  }

  const title = sessionTitle(data);
  const href = sessionDetailHref(data.client_session_id);

  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      <span className="text-primary dial-small-semi-text">
        {title ? (
          <EntityLinkCell href={href}>
            <EllipsisTooltip text={title} />
          </EntityLinkCell>
        ) : (
          UNAVAILABLE_VALUE
        )}
      </span>
      <span className="text-secondary dial-tiny-text">
        {title ? (
          <EllipsisTooltip text={data.client_session_id} />
        ) : (
          <EntityLinkCell href={href}>
            <EllipsisTooltip text={data.client_session_id} />
          </EntityLinkCell>
        )}
      </span>
    </div>
  );
};

export default SessionCellRenderer;
