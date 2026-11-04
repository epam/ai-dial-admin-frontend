'use client';

import { FC, ReactNode } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { mergeClasses } from '@/src/utils/merge-classes';

interface Props {
  label: ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  /** Chevron size in px; the default matches the Compare table. */
  iconSize?: number;
  /** Merged over the button's defaults, e.g. a fixed row height. */
  className?: string;
  /** Merged over the label wrapper's defaults (`gap-1 text-secondary`). */
  contentClassName?: string;
}

const SectionHeaderRow: FC<Props> = ({ label, isCollapsed, onToggle, iconSize = 12, className, contentClassName }) => (
  <button
    type="button"
    className={mergeClasses(
      'cursor-pointer hover:bg-layer-2 p-3 border-b border-tertiary bg-layer-3 text-left w-full',
      className,
    )}
    style={{ gridColumn: '1 / -1' }}
    onClick={onToggle}
    aria-expanded={!isCollapsed}
  >
    <div className={mergeClasses('flex items-center min-w-0 gap-1 dial-small-text text-secondary', contentClassName)}>
      {isCollapsed ? (
        <IconChevronRight size={iconSize} className="shrink-0" aria-hidden />
      ) : (
        <IconChevronDown size={iconSize} className="shrink-0" aria-hidden />
      )}
      {label}
    </div>
  </button>
);

export default SectionHeaderRow;
