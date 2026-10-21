'use client';

import { Avatar, GhostButton } from '@epam/ai-dial-ui-kit';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { FC, useMemo } from 'react';

import ContentWithLinks from '@/src/components/Common/ContentWithLinks/ContentWithLinks';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import MetricBindingsDisplay, { MetricCardFieldRow, MetricCardTag } from './MetricBindingsDisplay';
import MetricCardDescription from './MetricCardDescription';

interface Props {
  metric: Metric;
  onEdit: () => void;
  onDelete: () => void;
}

const MetricCard: FC<Props> = ({ metric, onEdit, onDelete }) => {
  const t = useI18n();

  const outputFieldNames = useMemo(
    () => (metric.outputSchema?.properties ? Object.keys(metric.outputSchema.properties) : []),
    [metric.outputSchema],
  );

  return (
    <div
      className="flex flex-row items-start gap-24 border-b border-secondary pb-4 rounded bg-layer-2"
      role="article"
      aria-label={metric.name}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-row items-center gap-2">
          <Avatar name={metric.name ?? ''} />
          <span className="dial-body-semi min-w-0 flex-1 truncate text-primary">{metric.name}</span>
        </div>

        {metric.description && (
          <MetricCardDescription className="dial-tiny-text text-secondary">
            <ContentWithLinks text={metric.description} />
          </MetricCardDescription>
        )}

        <div className="flex flex-col gap-2">
          <MetricCardFieldRow label={t(TestSuitesI18nKey.Condition)}>
            <span className="dial-tiny-text break-all text-primary py-1">
              {metric.condition?.trim() || t(TestSuitesI18nKey.ConditionAlwaysRun)}
            </span>
          </MetricCardFieldRow>

          <MetricBindingsDisplay title={t(TestSuitesI18nKey.Configuration)} bindings={metric.configBindings} />

          {outputFieldNames.length > 0 && (
            <MetricCardFieldRow label={t(TestSuitesI18nKey.Outputs)}>
              {outputFieldNames.map((fieldName) => (
                <MetricCardTag key={fieldName}>{fieldName}</MetricCardTag>
              ))}
            </MetricCardFieldRow>
          )}

          <MetricBindingsDisplay title={t(TestSuitesI18nKey.Inputs)} bindings={metric.inputBindings} align="start" />
        </div>
      </div>

      <div className="flex shrink-0 flex-row gap-2">
        <GhostButton
          label={t(ButtonsI18nKey.Delete)}
          className="text-error"
          onClick={onDelete}
          iconBefore={<IconTrash stroke={2} size={20} />}
        />
        <GhostButton
          label={t(ButtonsI18nKey.Edit)}
          className="text-accent-primary"
          onClick={onEdit}
          iconBefore={<IconEdit stroke={2} size={20} />}
        />
      </div>
    </div>
  );
};

export default MetricCard;
