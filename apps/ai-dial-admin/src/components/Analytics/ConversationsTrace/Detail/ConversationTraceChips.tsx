'use client';

import classNames from 'classnames';
import { FC } from 'react';

import {
  EMBEDDING_EVENT_KIND,
  LLM_CALL_EVENT_KIND,
  MCP_EVENT_KIND,
  ROUTE_EVENT_KIND,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationTraceChip } from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber, readableWords } from '@/src/utils/analytics/conversation-formatting';

// One hue per recorded kind, so a reader can pick a kind out of a row at a glance. Every colour is a theme
// token — a hardcoded hex is where contrast quietly breaks, and a theme served by the themes service can
// repaint any of these.
//
// Colour is never the only thing distinguishing a chip: each states its kind in words and its count beside
// it, so the hue is redundant by construction rather than load-bearing.
const CHIP_CLASS: Record<string, string> = {
  [LLM_CALL_EVENT_KIND]: 'border-accent-primary text-accent-primary',
  [EMBEDDING_EVENT_KIND]: 'border-accent-secondary text-accent-secondary',
  [MCP_EVENT_KIND]: 'border-accent-tertiary text-accent-tertiary',
  [ROUTE_EVENT_KIND]: 'border-warning text-warning',
};

// The empty kind is an unclassified pass-through hop, not a marker for the trace's entry call — so it reads
// as the muted one rather than taking a hue of its own.
const UNCLASSIFIED_CHIP_CLASS = 'border-primary text-secondary';

interface Props {
  chips: ConversationTraceChip[];
}

const ConversationTraceChips: FC<Props> = ({ chips }) => {
  const t = useI18n();

  if (!chips.length) {
    return null;
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {chips.map(({ eventKind, spans }) => (
        <span
          key={eventKind || 'unclassified'}
          className={classNames(
            'flex items-center gap-1.5 rounded border px-1.5 py-0.5 dial-tiny-text',
            CHIP_CLASS[eventKind] ?? UNCLASSIFIED_CHIP_CLASS,
          )}
        >
          {eventKind ? readableWords(eventKind) : t(ConversationsTraceI18nKey.TraceChipUnclassified)}
          <span className="font-mono text-secondary">{formatCompactNumber(spans)}</span>
        </span>
      ))}
    </span>
  );
};

export default ConversationTraceChips;
