'use client';

import { useCallback, useMemo, useState } from 'react';

import { ConversationSpanRow, HopBodyGrants, SpanBodyTab } from '@/src/models/analytics/conversations-trace';
import { spanBodyTabsOf } from '@/src/utils/analytics/conversation-spans';

interface Params {
  span: ConversationSpanRow;
  bodyGrants: HopBodyGrants;
}

/**
 * The bodies section's tab set and the reader's place in it.
 *
 * The chosen tab is kept across a change of selected span, because a reader comparing one side of two hops is
 * asking the same question twice; where the new span does not offer it, the first tab it does offer takes
 * over. The derivation itself is pure and lives with the other row-derived predicates, so the trace view can
 * ask whether a span offers anything at all without holding a second copy of this state.
 */
export const useSpanBodyTabs = ({ span, bodyGrants }: Params) => {
  const [chosen, setChosen] = useState(SpanBodyTab.Request);
  const tabs = useMemo(() => spanBodyTabsOf(span, bodyGrants), [span, bodyGrants]);

  // The tab actually on screen, and the only value anything is allowed to decide from. `chosen` is what the
  // reader last picked; it means nothing until this span offers it, because a caller entitled to one side
  // alone never gets to choose. Gating a read on `chosen` while rendering this is two values deciding one
  // thing, and they drift.
  const activeTab = tabs.includes(chosen) ? chosen : (tabs[0] ?? chosen);

  // ui-kit's tab strip answers with a plain id, so the cast lives here rather than at the call site.
  const onSelectTab = useCallback((id: string) => setChosen(id as SpanBodyTab), []);

  return { tabs, activeTab, onSelectTab };
};
