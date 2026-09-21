'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useId, useMemo } from 'react';

import SpanFactRow from '@/src/components/Analytics/ConversationsTrace/Detail/SpanFactRow';
import SpanObjectFactRow from '@/src/components/Analytics/ConversationsTrace/Detail/SpanObjectFactRow';
import { SPAN_FIELD_TAG_LABEL_KEY, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { useI18n } from '@/src/locales/client';
import { SpanFieldDescriptor, SpanFieldGroup, SpanFieldRow } from '@/src/models/analytics/conversations-trace';
import { readableWords } from '@/src/utils/analytics/conversation-formatting';
import {
  isSpanFieldEmpty,
  spanFieldText,
  spanGroupSummary,
  spanObjectEntries,
} from '@/src/utils/analytics/conversation-span-fields';

const CHEVRON_SIZE = 12;

interface Props {
  group: SpanFieldGroup;
  row: SpanFieldRow;
  isOpen: boolean;
  onToggle: (tag: string) => void;
}

interface FieldRowProps {
  field: SpanFieldDescriptor;
  row: SpanFieldRow;
}

const GroupFieldRow: FC<FieldRowProps> = ({ field: { name, label, type, tag }, row }) => {
  const entries = spanObjectEntries(row[name]);

  if (entries.length > 0) {
    return <SpanObjectFactRow label={label} entries={entries} />;
  }

  // Absence is the shared predicate's call, never an empty formatted string: a metered zero formats as `0`,
  // so `spanFieldText(…) || UNAVAILABLE_VALUE` would state a figure the hop never metered.
  const isAbsent = isSpanFieldEmpty(row[name], tag);

  const value = isAbsent ? UNAVAILABLE_VALUE : spanFieldText(row[name], type, tag);

  return <SpanFactRow label={label} value={value} isMono />;
};

const SpanGroupPanel: FC<Props> = ({ group, row, isOpen, onToggle }) => {
  const t = useI18n();
  const headerId = useId();
  const contentId = useId();
  const summary = useMemo(() => spanGroupSummary(row, group), [row, group]);

  const labelKey = SPAN_FIELD_TAG_LABEL_KEY[group.tag];
  const title = labelKey ? t(labelKey) : readableWords(group.tag);

  return (
    // Never shrinks: the section it sits in is a bounded flex column, and a group that gives up its height
    // there has its open content collapsed to nothing while the header stays. jsdom does not lay this out, so
    // only a CSS-level test catches it.
    <div className="shrink-0">
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={isOpen ? contentId : undefined}
        className={classNames(
          'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left hover:bg-layer-4 focus-visible:bg-layer-4 focus-visible:outline focus-visible:outline-focus',
          isOpen && 'bg-layer-4',
        )}
        onClick={() => onToggle(group.tag)}
      >
        {isOpen ? (
          <IconChevronDown size={CHEVRON_SIZE} aria-hidden className="shrink-0 text-accent-primary" />
        ) : (
          <IconChevronRight size={CHEVRON_SIZE} aria-hidden className="shrink-0 text-secondary" />
        )}
        <span className="shrink-0 text-primary dial-tiny-semi-text">{title}</span>
        {!isOpen && summary && (
          <span className="min-w-0 flex-1 truncate text-right font-mono text-secondary dial-tiny-text">{summary}</span>
        )}
      </button>
      {isOpen && (
        <div id={contentId} role="region" aria-labelledby={headerId} className="pb-2 pl-8 pr-2 pt-1">
          {group.fields.map((field) => (
            <GroupFieldRow key={field.name} field={field} row={row} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpanGroupPanel;
