'use client';

import { FC, useMemo } from 'react';

import classNames from 'classnames';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import { StatusBadge } from './ComparisonTableView';
import { ComparisonSection } from './types';
import { formatFieldValue, SECTION_I18N, valuesAreEqual } from './utils';

interface Props {
  sections: ComparisonSection[];
  activeDetail: AnalyticsResult | null;
  pinnedDetail: AnalyticsResult | null;
  spotlightedFields: Set<string>;
}

const ComparisonPivotView: FC<Props> = ({ sections, activeDetail, pinnedDetail, spotlightedFields }) => {
  const t = useI18n();
  const hasTwoRows = pinnedDetail != null && pinnedDetail.id !== activeDetail?.id;

  const details = useMemo(() => {
    const arr: AnalyticsResult[] = [];
    if (pinnedDetail && hasTwoRows) arr.push(pinnedDetail);
    if (activeDetail) arr.push(activeDetail);
    return arr;
  }, [activeDetail, pinnedDetail, hasTwoRows]);

  // Flatten all visible fields across sections
  const flatFields = useMemo(() => {
    return sections.flatMap((section) => {
      const i18nKey = SECTION_I18N[section.key];
      const resolvedLabel = i18nKey ? t(i18nKey) : section.label;
      return section.rows.map((row) => ({
        sectionKey: section.key,
        sectionLabel: resolvedLabel,
        fieldKey: row.fieldKey,
        label: row.label,
        isNumeric: row.isNumeric,
        values: row.values,
        fullKey: `${section.key}:${row.fieldKey}`,
      }));
    });
  }, [sections, t]);

  return (
    <div className="animate-fadeIn h-full overflow-auto">
      <table className="text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-layer-1">
          <tr>
            <th className="sticky left-0 z-20 bg-layer-1 text-left text-xxs text-secondary font-medium px-3 py-1.5 min-w-[160px] border-b border-r border-secondary">
              {t(RunsI18nKey.TestCaseColumn)}
            </th>
            {flatFields.map((field) => {
              const isSpotlighted = spotlightedFields.has(field.fullKey);
              return (
                <th
                  key={field.fullKey}
                  className={classNames(
                    'text-left text-xxs font-medium px-3 py-1.5 min-w-[120px] border-b border-secondary',
                    isSpotlighted && 'border-t-2 border-t-accent-primary',
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xxs text-secondary uppercase">{field.sectionLabel}</span>
                    <span className="font-mono text-primary">{field.label}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {details.map((detail, rowIdx) => {
            const isPinnedRow = hasTwoRows && rowIdx === 0;
            return (
              <tr key={detail.id ?? rowIdx} className="border-b border-secondary">
                <td className="sticky left-0 z-10 bg-layer-1 px-3 py-1.5 border-r border-secondary align-top">
                  <div className="flex items-center gap-2">
                    <span className="text-primary truncate max-w-[140px]">{detail.testCaseName ?? detail.id}</span>
                    <StatusBadge status={detail.executionStatus} />
                  </div>
                </td>
                {flatFields.map((field) => {
                  const val = field.values[rowIdx];
                  const raw = val?.raw ?? null;
                  const displayText = formatFieldValue(raw);

                  // Diff highlighting on active row (non-pinned)
                  let cellDiffClass = '';
                  if (hasTwoRows && !isPinnedRow && field.values.length >= 2) {
                    const pinnedRaw = field.values[0]?.raw ?? null;
                    if (!valuesAreEqual(pinnedRaw, raw)) {
                      cellDiffClass = field.isNumeric ? 'bg-warning' : 'bg-accent-secondary-alpha';
                    }
                  }

                  return (
                    <td
                      key={`${detail.id}-${field.fullKey}`}
                      className={classNames('px-3 py-1.5 align-top', cellDiffClass)}
                    >
                      {raw === null ? (
                        <span className="text-xxs text-secondary">—</span>
                      ) : raw.includes('\n') || raw.length > 100 ? (
                        <pre className="text-xxs text-primary whitespace-pre-wrap break-words overflow-y-auto max-h-[120px] font-mono">
                          {displayText}
                        </pre>
                      ) : (
                        <span className="text-xxs text-primary">{displayText}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonPivotView;
