'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialGhostButton, DialGhostIconButton, DialInput } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorParamRow } from '@/src/models/analytics/evaluator';
import { toParamRows, toParams } from '@/src/utils/analytics/evaluator-dto';

interface Props {
  params: Record<string, unknown>;
  isDisabled?: boolean;
  onChange: (params: Record<string, unknown>) => void;
}

/**
 * Rows are held here rather than derived from the emitted object: two rows can share a key — or be blank —
 * while an operator is typing, and an object cannot represent that, so deriving would silently merge them
 * and lose an entry that had already been typed.
 */
const EvaluatorParamsEditor: FC<Props> = ({ params, isDisabled, onChange }) => {
  const t = useI18n();

  const [rows, setRows] = useState<EvaluatorParamRow[]>(() => toParamRows(params));
  const emittedRef = useRef(params);

  useEffect(() => {
    if (params !== emittedRef.current) {
      setRows(toParamRows(params));
      emittedRef.current = params;
    }
  }, [params]);

  const commit = (next: EvaluatorParamRow[]) => {
    setRows(next);
    const emitted = toParams(next);
    emittedRef.current = emitted;
    onChange(emitted);
  };

  const onChangeRow = (id: string, patch: Partial<EvaluatorParamRow>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-2">
      {!rows.length && <span className="text-secondary dial-small">{t(AnalyticsEvaluatorsI18nKey.NoParams)}</span>}

      {rows.map((row, index) => {
        const isFirstRow = index === 0;
        const position = index + 1;

        return (
          <div
            key={row.id}
            role="group"
            aria-label={`${t(AnalyticsEvaluatorsI18nKey.SectionParams)} ${position}`}
            className="flex flex-row items-end gap-3"
          >
            <DialInput
              id={`evaluator-param-key-${index}`}
              labelProps={isFirstRow ? { label: t(AnalyticsEvaluatorsI18nKey.ParamKey) } : undefined}
              aria-label={`${t(AnalyticsEvaluatorsI18nKey.ParamKey)} ${position}`}
              value={row.key}
              disabled={isDisabled}
              containerClassName="max-w-[220px]"
              onChange={(v) => onChangeRow(row.id, { key: v ?? '' })}
            />
            <DialInput
              id={`evaluator-param-value-${index}`}
              labelProps={isFirstRow ? { label: t(AnalyticsEvaluatorsI18nKey.ParamValue) } : undefined}
              aria-label={`${t(AnalyticsEvaluatorsI18nKey.ParamValue)} ${position}`}
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
        label={t(AnalyticsEvaluatorsI18nKey.AddParam)}
        disabled={isDisabled}
        onClick={() => commit([...rows, { id: `param-${rows.length}-${rows.length + 1}`, key: '', value: '' }])}
      />
    </div>
  );
};

export default EvaluatorParamsEditor;
