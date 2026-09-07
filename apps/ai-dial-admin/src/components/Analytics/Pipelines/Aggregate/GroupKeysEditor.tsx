'use client';
import { FC, useEffect, useRef, useState } from 'react';
import { DialGhostButton, DialGhostIconButton, DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import {
  createGroupKeyRow,
  getGroupKeyOutputName,
  getTruncUnits,
  isTruncatable,
  toGroupKeyRows,
  toGroupKeys,
} from '@/src/components/Analytics/Pipelines/Aggregate/group-keys';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { GroupKey } from '@/src/models/analytics/pipeline';
import { GroupKeyKind, GroupKeyRow } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';
interface Props {
  groupKeys?: GroupKey[];
  columns: AnalyticsTableColumn[];
  onChange: (groupKeys: GroupKey[]) => void;
}
const GroupKeysEditor: FC<Props> = ({ groupKeys, columns, onChange }) => {
  const t = useI18n();
  const [rows, setRows] = useState<GroupKeyRow[]>(() => toGroupKeyRows(groupKeys));
  const emittedRef = useRef<GroupKey[] | undefined>(groupKeys);
  useEffect(() => {
    if (groupKeys === emittedRef.current) return;
    emittedRef.current = groupKeys;
    setRows(toGroupKeyRows(groupKeys));
  }, [groupKeys]);
  const commit = (next: GroupKeyRow[]) => {
    setRows(next);
    const emitted = toGroupKeys(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };
  const updateRow = (id: string, patch: Partial<GroupKeyRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const columnOptions = columns.map((column) => ({ value: column.name, label: `${column.name} · ${column.type}` }));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const units = getTruncUnits(columns, row.column);
        const canTruncate = isTruncatable(columns, row.column);
        return (
          <div key={row.id} className="flex flex-col gap-2">
            <div className="flex flex-row flex-wrap items-end gap-3">
              <DialSelectField
                id={`group-key-column-${index}`}
                containerClassName="min-w-[180px] flex-1"
                label={t(AnalyticsPipelinesI18nKey.GroupKeyColumn)}
                options={columnOptions}
                value={row.column}
                onChange={(v) => updateRow(row.id, { column: v as string, unit: undefined })}
              />
              <DialSelectField
                id={`group-key-kind-${index}`}
                containerClassName="min-w-[180px] flex-1"
                label={t(AnalyticsPipelinesI18nKey.GroupKeyKind)}
                options={[
                  { value: GroupKeyKind.Column, label: t(AnalyticsPipelinesI18nKey.GroupKeyKindColumn) },
                  { value: GroupKeyKind.Trunc, label: t(AnalyticsPipelinesI18nKey.GroupKeyKindTrunc) },
                ]}
                value={row.kind}
                onChange={(v) => updateRow(row.id, { kind: v as GroupKeyKind, unit: undefined })}
              />
              {row.kind === GroupKeyKind.Trunc && (
                <DialSelectField
                  id={`group-key-unit-${index}`}
                  containerClassName="min-w-[180px] flex-1"
                  label={t(AnalyticsPipelinesI18nKey.GroupKeyUnit)}
                  options={units.map((unit) => ({ value: unit, label: unit }))}
                  value={row.unit ?? ''}
                  onChange={(v) => updateRow(row.id, { unit: v as GroupKeyRow['unit'] })}
                />
              )}
              <DialInput
                id={`group-key-alias-${index}`}
                containerClassName="min-w-[180px] flex-1"
                labelProps={{ label: t(AnalyticsPipelinesI18nKey.GroupKeyAlias) }}
                value={row.as ?? ''}
                onChange={(v) => updateRow(row.id, { as: v ?? '' })}
              />
              <DialGhostIconButton
                className="mb-1 shrink-0"
                icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                aria-label={t(ButtonsI18nKey.Delete)}
                onClick={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
              />
            </div>
            {row.kind === GroupKeyKind.Trunc && row.column && !canTruncate && (
              <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.GroupKeyNotTruncatable)}</span>
            )}
            {row.column && !row.as && (
              <span className="text-secondary dial-tiny-text">
                {t(AnalyticsPipelinesI18nKey.GroupKeyOutputName, { name: getGroupKeyOutputName(row) })}
              </span>
            )}
          </div>
        );
      })}
      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddGroupKey)}
        onClick={() => commit([...rows, createGroupKeyRow()])}
      />
    </div>
  );
};
export default GroupKeysEditor;
