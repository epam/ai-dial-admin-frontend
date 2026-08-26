import { FC } from 'react';

import classNames from 'classnames';

import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorType } from '@/src/models/analytics/evaluator';

const TYPE_COLOR: Record<EvaluatorType, string> = {
  [EvaluatorType.Llm]: 'text-accent-primary',
  [EvaluatorType.Sql]: 'text-success',
};

const TYPE_LABEL: Record<EvaluatorType, AnalyticsEvaluatorsI18nKey> = {
  [EvaluatorType.Llm]: AnalyticsEvaluatorsI18nKey.EvaluatorTypeLlm,
  [EvaluatorType.Sql]: AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql,
};

interface Props {
  type?: EvaluatorType;
  className?: string;
}

const EvaluatorTypeBadge: FC<Props> = ({ type, className }) => {
  const t = useI18n();

  if (!type) {
    return null;
  }

  const label = TYPE_LABEL[type];

  return (
    <span
      className={classNames(
        'shrink-0 rounded bg-layer-4 px-2 py-0.5 font-semibold uppercase dial-tiny-text',
        TYPE_COLOR[type] ?? 'text-secondary',
        className,
      )}
    >
      {label ? t(label) : type}
    </span>
  );
};

export default EvaluatorTypeBadge;
