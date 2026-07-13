'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp, IconTrashX } from '@tabler/icons-react';

import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

const COLLAPSED_CHIP = QUERY_BUILDER_PALETTE[QueryBuilderColor.Grouping];

interface Props {
  summary: string;
  onRemove: () => void;
  children: ReactNode;
  defaultExpanded?: boolean;
  // Inline: the expanded editor sits on the chevron's row (compact single-line items like
  // aggregates). Default: the editor stacks under a summary header inside a bordered box.
  inline?: boolean;
}

// A parameterized builder item (aggregate, condition, sort key…) that collapses to a compact
// summary chip and expands into its full editor. Collapse state is presentation-only, so it is
// owned here rather than in the query state. Clicking anywhere outside the item (finishing its
// configuration) collapses it back to the summary chip.
const ChipRow: FC<Props> = ({ summary, onRemove, children, defaultExpanded = true, inline }) => {
  const t = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || containerRef.current?.contains(target)) return;
      // Portaled dropdown overlays (field pickers) belong to the item being configured.
      if (target.closest('[data-floating-ui-portal],[role="listbox"],[role="option"]')) return;
      setExpanded(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [expanded]);

  const removeButton = (
    <DialGhostIconButton
      size={ElementSize.Small}
      aria-label={t(ButtonsI18nKey.Remove)}
      icon={<IconTrashX size={16} className="text-error" />}
      onClick={onRemove}
    />
  );

  if (!expanded) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-expanded="false"
          className={classNames(
            'flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-1 text-left hover:opacity-90',
            COLLAPSED_CHIP.chipBg,
          )}
          onClick={() => setExpanded(true)}
        >
          <IconChevronDown size={14} className={classNames('shrink-0', COLLAPSED_CHIP.chipText)} />
          <span className={classNames('truncate font-mono dial-tiny-text', COLLAPSED_CHIP.chipText)}>{summary}</span>
        </button>
        {removeButton}
      </div>
    );
  }

  const collapseButton = (
    <button
      type="button"
      aria-expanded="true"
      aria-label={summary}
      className="shrink-0 text-secondary hover:text-primary"
      onClick={() => setExpanded(false)}
    >
      <IconChevronUp size={16} />
    </button>
  );

  if (inline) {
    return (
      <div ref={containerRef} className="flex items-center gap-1.5">
        {collapseButton}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
        {removeButton}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2 rounded border border-primary bg-layer-2 p-2">
      <div className="flex items-center justify-between gap-2 border-b border-primary pb-1.5">
        <button
          type="button"
          aria-expanded="true"
          className="flex min-w-0 items-center gap-1.5 text-secondary hover:text-primary"
          onClick={() => setExpanded(false)}
        >
          <IconChevronUp size={16} className="shrink-0" />
          <span className="truncate font-mono dial-tiny-text">{summary}</span>
        </button>
        {removeButton}
      </div>
      {children}
    </div>
  );
};

export default ChipRow;
