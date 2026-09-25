'use client';

import { FC } from 'react';

import { DialGhostButton, DialGhostIconButton, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { withStrandedOption } from '@/src/components/Analytics/Pipelines/Common/utils';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { MemberSelectOrderBy, SortDirection } from '@/src/models/analytics/pipeline';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  orderBy?: MemberSelectOrderBy[];
  fields: AnalyticsEntityField[];
  onChange: (orderBy: MemberSelectOrderBy[]) => void;
}

// Rows are complete by construction, so unlike the binding editors this one holds no half-filled state.
const OrderByEditor: FC<Props> = ({ orderBy, fields, onChange }) => {
  const t = useI18n();

  const rows = orderBy ?? [];

  const fieldOptions = fields.map((field) => ({ value: field.name, label: field.name }));

  const isStranded = (name: string): boolean => Boolean(name) && !fields.some((field) => field.name === name);

  const directionOptions = [
    { value: SortDirection.Asc, label: t(AnalyticsPipelinesI18nKey.SortAscending) },
    { value: SortDirection.Desc, label: t(AnalyticsPipelinesI18nKey.SortDescending) },
  ];

  const updateRow = (index: number, patch: Partial<MemberSelectOrderBy>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div
          key={`${row.column}-${index}`}
          role="group"
          aria-label={`${t(AnalyticsPipelinesI18nKey.OrderBy)} ${index + 1}`}
          className="flex items-end gap-2"
        >
          <DialSelectField
            id={`order-by-column-${index}`}
            label={index === 0 ? t(AnalyticsPipelinesI18nKey.OrderByColumn) : undefined}
            options={withStrandedOption(fieldOptions, row.column)}
            invalid={isStranded(row.column)}
            value={row.column}
            containerClassName="flex-1"
            onChange={(v) => updateRow(index, { column: v as string })}
          />
          <DialSelectField
            id={`order-by-direction-${index}`}
            label={index === 0 ? t(AnalyticsPipelinesI18nKey.OrderByDirection) : undefined}
            options={directionOptions}
            value={row.direction}
            containerClassName="flex-1"
            onChange={(v) => updateRow(index, { direction: v as SortDirection })}
          />
          <DialGhostIconButton
            icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-error" aria-hidden />}
            aria-label={`${t(ButtonsI18nKey.Delete)} ${t(AnalyticsPipelinesI18nKey.OrderBy)} ${index + 1}`}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          />
        </div>
      ))}

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsPipelinesI18nKey.AddOrderBy)}
        disabled={!fields.length}
        onClick={() => onChange([...rows, { column: fields[0].name, direction: SortDirection.Asc }])}
      />
    </div>
  );
};

export default OrderByEditor;
