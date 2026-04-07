'use client';

import { FC } from 'react';

import { IconChevronDown, IconChevronRight, IconFocus2, IconMaximize } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import CellValue from './CellValue';
import { ComparisonRow, ComparisonSection, TRUNCATE_THRESHOLD } from './models';
import { formatFieldValue, getDiffClass, SECTION_I18N } from './utils';

interface Props {
  section: ComparisonSection;
  isCollapsed: boolean;
  onToggle: () => void;
  hasTwoColumns: boolean;
  spotlightedFields: Set<string>;
  onToggleSpotlight: (fieldKey: string) => void;
  expandedCells: Set<string>;
  onToggleCellExpand: (cellKey: string) => void;
  onOpenDiff: (row: ComparisonRow) => void;
}

const SectionGroup: FC<Props> = ({
  section,
  isCollapsed,
  onToggle,
  hasTwoColumns,
  spotlightedFields,
  onToggleSpotlight,
  expandedCells,
  onToggleCellExpand,
  onOpenDiff,
}) => {
  const t = useI18n();
  const i18nKey = SECTION_I18N[section.key];
  const sectionLabel = i18nKey ? t(i18nKey) : section.label;
  return (
    <>
      {/* Section header — spans all grid columns */}
      <div
        className="cursor-pointer hover:bg-layer-2 px-3 py-1 border-b border-secondary"
        style={{ gridColumn: `1 / -1` }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-1 text-xxs font-semibold text-secondary uppercase">
          {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
          {sectionLabel}
        </div>
      </div>
      {!isCollapsed &&
        section.rows.map((row) => {
          const fullKey = `${section.key}:${row.fieldKey}`;
          const isSpotlighted = spotlightedFields.has(fullKey);
          const diffClass = hasTwoColumns ? getDiffClass(row) : '';

          return (
            <div key={fullKey} className="contents">
              <div className="group px-3 py-1 border-b border-secondary">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleSpotlight(fullKey)}
                    className={classNames(
                      'shrink-0',
                      isSpotlighted
                        ? 'text-accent-primary'
                        : 'text-secondary hover:text-primary opacity-0 group-hover:opacity-100',
                    )}
                    title={isSpotlighted ? t(RunsI18nKey.RemoveSpotlight) : t(RunsI18nKey.Spotlight)}
                  >
                    <IconFocus2 size={12} />
                  </button>
                  {hasTwoColumns && diffClass && (
                    <button
                      onClick={() => onOpenDiff(row)}
                      className="shrink-0 text-secondary hover:text-accent-primary"
                      title={t(RunsI18nKey.CompareFullscreen)}
                    >
                      <IconMaximize size={12} />
                    </button>
                  )}
                  <DialEllipsisTooltip text={row.label} className="text-xxs font-mono text-primary" />
                </div>
              </div>
              {row.values.map((val, idx) => {
                const cellKey = `${fullKey}:${idx}`;
                const isExpanded = expandedCells.has(cellKey);
                const raw = val.raw;
                const displayText = formatFieldValue(raw);
                const isLong = raw !== null && raw.length > TRUNCATE_THRESHOLD;
                const isActiveColumn = hasTwoColumns && idx === 1;
                const cellDiffClass = isActiveColumn ? diffClass : '';

                return (
                  <div key={idx} className={classNames('px-3 py-1 border-b border-secondary', cellDiffClass)}>
                    <CellValue
                      text={displayText}
                      raw={raw}
                      isLong={isLong}
                      isExpanded={isExpanded}
                      cellKey={cellKey}
                      onToggleExpand={onToggleCellExpand}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
    </>
  );
};

export default SectionGroup;
