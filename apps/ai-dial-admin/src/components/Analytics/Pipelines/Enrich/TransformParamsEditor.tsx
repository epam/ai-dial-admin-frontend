'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialGhostButton, DialGhostIconButton, DialInput } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TransformParamRow } from '@/src/models/analytics/pipeline-ui';
import { toParamRows, toParams } from '@/src/utils/analytics/transform-dto';

let counter = 0;
const nextRowId = (): string => `param-row-${++counter}`;

interface Props {
  params: Record<string, unknown>;
  isDisabled?: boolean;
  onChange: (params: Record<string, unknown>) => void;
}

/**
 * Rows are held here rather than derived from the emitted object: deriving them would silently merge two
 * rows that share a key and lose an entry that had already been typed.
 */
const TransformParamsEditor: FC<Props> = ({ params, isDisabled, onChange }) => {
  const t = useI18n();

  const [rows, setRows] = useState<TransformParamRow[]>(() => toParamRows(params));
  const emittedRef = useRef(params);

  useEffect(() => {
    if (params !== emittedRef.current) {
      setRows(toParamRows(params));
      emittedRef.current = params;
    }
  }, [params]);

  const commit = (next: TransformParamRow[]) => {
    setRows(next);
    const emitted = toParams(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };

  const onChangeRow = (id: string, patch: Partial<TransformParamRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-2">
      {!rows.length && <span className="text-secondary dial-small">{t(AnalyticsPipelinesI18nKey.NoParams)}</span>}

      {rows.map((row, index) => {
        const isFirstRow = index === 0;
        const position = index + 1;

        return (
          <div
            key={row.id}
            role="group"
            aria-label={`${t(AnalyticsPipelinesI18nKey.SectionParams)} ${position}`}
            className="flex flex-row items-end gap-3"
          >
            <DialInput
              id={`transform-param-key-${index}`}
              labelProps={isFirstRow ? { label: t(AnalyticsPipelinesI18nKey.ParamKey) } : undefined}
              aria-label={`${t(AnalyticsPipelinesI18nKey.ParamKey)} ${position}`}
              value={row.key}
              disabled={isDisabled}
              containerClassName="max-w-[220px]"
              onChange={(v) => onChangeRow(row.id, { key: v ?? '' })}
            />
            <DialInput
              id={`transform-param-value-${index}`}
              labelProps={isFirstRow ? { label: t(AnalyticsPipelinesI18nKey.ParamValue) } : undefined}
              aria-label={`${t(AnalyticsPipelinesI18nKey.ParamValue)} ${position}`}
              value={row.value}
              disabled={isDisabled}
              containerClassName="max-w-[220px]"
              onChange={(v) => onChangeRow(row.id, { value: v ?? '' })}
            />
            <DialGhostIconButton
              icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              aria-label={`${t(ButtonsI18nKey.Delete)} ${row.key || position}`}
              disabled={isDisabled}
              onClick={() => commit(rows.filter((item) => item.id !== row.id))}
            />
          </div>
        );
      })}

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddParam)}
        disabled={isDisabled}
        onClick={() => commit([...rows, { id: nextRowId(), key: '', value: '' }])}
      />
    </div>
  );
};

export default TransformParamsEditor;
