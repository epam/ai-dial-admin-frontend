'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import FieldCaveat from '@/src/components/Analytics/ConversationsTrace/FieldCaveat';
import { ConversationTerm } from '@/src/models/analytics/conversations-trace';

interface Props {
  terms: ConversationTerm[];
}

// The rail's one label-and-value register, shared by every panel that presents rows rather than headline
// figures — the insights panel and the metadata panel. Both list fields of the same record, so giving one of
// them a treatment of its own (metadata carried monospace text and ruled rows) stated a difference in kind
// the record does not have. Monospace in particular is a claim this feature makes elsewhere: it marks a
// catalog identifier naming an entity the page queried, which a conversation id or a user hash is not.
//
// One line per value, whatever its length. Nothing bounds an insight value and most metadata values are
// opaque identifiers, so letting them reflow would give a handful of fields most of a panel whose point is
// that every field is visible at once — the row rhythm is what makes the list scannable. `DialEllipsisTooltip`
// keeps the full value reachable: it clamps only when the value actually overflows, and exposes what it
// clipped through the trigger's accessible name rather than a `title`.
const ConversationTermList: FC<Props> = ({ terms }) => (
  <dl className="flex flex-col gap-1.5">
    {terms.map(({ key, label, hint, value }) => (
      <div key={key} className="grid grid-cols-[auto_1fr] items-baseline gap-x-4">
        <dt className="flex items-center gap-1 text-secondary dial-tiny-text">
          {label}
          {/* Either a caveat on a figure that cannot be read at face value, or the service's own description
              of a column this frontend has never heard of. It hangs off a focusable control so it reaches a
              keyboard. */}
          {hint && <FieldCaveat caveat={hint} />}
        </dt>
        {/* The alignment goes on the tooltip's own `className`, not on the `dd`: it renders the value in a
            span of its own carrying `text-start`, which wins over an inherited alignment. */}
        <dd className="min-w-0 text-primary dial-tiny-text">
          <DialEllipsisTooltip text={value} className="text-right" contentClassName="break-all" />
        </dd>
      </div>
    ))}
  </dl>
);

export default ConversationTermList;
