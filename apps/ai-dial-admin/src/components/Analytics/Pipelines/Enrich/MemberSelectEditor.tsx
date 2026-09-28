'use client';

import { FC, useEffect, useState } from 'react';

import { DialInput, DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import OrderByEditor from '@/src/components/Analytics/Pipelines/Enrich/OrderByEditor';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { GROUP_FETCH_MAX_ROWS, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MemberSelect } from '@/src/models/analytics/pipeline';
import { MemberScope } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { AnalyticsTable } from '@/src/models/analytics/table';

interface Props {
  memberSelect?: MemberSelect;
  fields: AnalyticsEntityField[];
  sourceName?: string;
  readSource?: AnalyticsTable | null;
  isLimitValid: boolean;
  onChange: (memberSelect?: MemberSelect) => void;
}

/**
 * Two states rather than an optional block: taking every member is a declaration in itself — it leaves the
 * assembly's own default policy in place — and an empty block reads as an unfinished one. Switching back to
 * every member keeps what was entered, so the choice is not destructive.
 */
const MemberSelectEditor: FC<Props> = ({ memberSelect, fields, sourceName, readSource, isLimitValid, onChange }) => {
  const t = useI18n();

  const [scope, setScope] = useState<MemberScope>(() => (memberSelect ? MemberScope.Selected : MemberScope.All));
  const [kept, setKept] = useState<MemberSelect | undefined>(memberSelect);

  // A discard restores the stored policy without remounting this editor, so both the scope and the kept
  // values are re-seeded whenever the prop says something they do not.
  useEffect(() => {
    const declared = scope === MemberScope.Selected ? kept : undefined;
    if (JSON.stringify(declared ?? null) === JSON.stringify(memberSelect ?? null)) return;

    setKept(memberSelect);
    setScope(memberSelect ? MemberScope.Selected : MemberScope.All);
    // `kept` and `scope` are read to compare, not to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSelect]);

  const scopeRadios: RadioButtonWithContent[] = [
    { id: MemberScope.All, name: t(AnalyticsPipelinesI18nKey.MemberScopeAll) },
    { id: MemberScope.Selected, name: t(AnalyticsPipelinesI18nKey.MemberScopeSelected) },
  ];

  const onScopeChange = (next: MemberScope) => {
    setScope(next);
    onChange(next === MemberScope.Selected ? kept : undefined);
  };

  const update = (patch: Partial<MemberSelect>) => {
    const next = { ...kept, ...patch } as MemberSelect;
    setKept(next);
    onChange(next);
  };

  // Named only when the read source has resolved: guessing the columns that carry its order would state a
  // fact the console does not have.
  const orderColumns = [readSource?.version_column, readSource?.identity_column].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col gap-4">
      <DialRadioGroup
        elementId="pipeline-member-scope"
        fieldTitle={t(AnalyticsPipelinesI18nKey.MemberScopeTitle)}
        orientation={RadioGroupOrientation.Column}
        radioButtons={scopeRadios}
        activeRadioButton={scope}
        onChange={(id) => onScopeChange(id as MemberScope)}
      />
      <span className="text-secondary dial-tiny-text">
        {scope === MemberScope.All
          ? t(AnalyticsPipelinesI18nKey.MemberScopeAllCaption)
          : t(AnalyticsPipelinesI18nKey.MemberScopeSelectedCaption)}
      </span>

      {scope === MemberScope.Selected && (
        <>
          <DialInput
            containerClassName={STANDARD_CONTROL_WIDTH}
            wrapperClassName={NUMBER_INPUT_WIDTH}
            id="pipeline-member-limit"
            type="number"
            min={1}
            max={GROUP_FETCH_MAX_ROWS}
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.MemberLimit), required: true }}
            value={kept?.limit == null ? '' : String(kept.limit)}
            caption={t(AnalyticsPipelinesI18nKey.MemberLimitCaption)}
            error={isLimitValid ? undefined : t(AnalyticsPipelinesI18nKey.MemberLimitRequired)}
            invalid={!isLimitValid}
            onChange={(v) => update({ limit: v ? Number(v) : undefined })}
          />

          <div className="flex flex-col gap-2">
            <span className="text-primary dial-small">{t(AnalyticsPipelinesI18nKey.OrderBy)}</span>
            <OrderByEditor orderBy={kept?.order_by} fields={fields} onChange={(order_by) => update({ order_by })} />
            <span className="text-secondary dial-tiny-text">
              {orderColumns
                ? `${orderColumns} · ${t(AnalyticsPipelinesI18nKey.MemberTiebreak)}`
                : t(AnalyticsPipelinesI18nKey.MemberTiebreakUnresolved)}
            </span>
          </div>

          <SqlPredicateField
            className={STANDARD_CONTROL_WIDTH}
            id="pipeline-prefer-sql"
            label={t(AnalyticsPipelinesI18nKey.PreferSql)}
            description={t(AnalyticsPipelinesI18nKey.PreferSqlCaption)}
            value={kept?.prefer_sql}
            sourceName={sourceName}
            onChange={(prefer_sql) => update({ prefer_sql })}
          />
        </>
      )}
    </div>
  );
};

export default MemberSelectEditor;
