'use client';

import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopClamp } from '@/src/models/analytics/conversations-trace';
import { formatBytes } from '@/src/utils/analytics/conversation-formatting';

interface Props {
  clamp: HopClamp;
}

// Every clamped thing states itself the same way. Silent truncation in an observability tool produces a reader
// who believes they have read the whole thing — which is what the assembled response and the MCP result did
// while computing the flag and never rendering it.
const HopClampNote: FC<Props> = ({ clamp }) => {
  const t = useI18n();

  if (!clamp.isClamped) {
    return null;
  }

  return (
    <p role="status" aria-live="polite" className="text-secondary dial-caption-text">
      {t(ConversationsTraceI18nKey.InspectorRawClamped, {
        delivered: formatBytes(clamp.deliveredBytes),
        recorded: formatBytes(clamp.recordedBytes),
      })}
    </p>
  );
};

export default HopClampNote;
