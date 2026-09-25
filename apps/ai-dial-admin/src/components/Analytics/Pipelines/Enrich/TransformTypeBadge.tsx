import { FC } from 'react';

import classNames from 'classnames';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TransformType } from '@/src/models/analytics/pipeline';

const TYPE_COLOR: Record<TransformType, string> = {
  [TransformType.Llm]: 'text-accent-primary',
  [TransformType.Sql]: 'text-success',
};

const TYPE_LABEL: Record<TransformType, AnalyticsPipelinesI18nKey> = {
  [TransformType.Llm]: AnalyticsPipelinesI18nKey.TransformTypeLlm,
  [TransformType.Sql]: AnalyticsPipelinesI18nKey.TransformTypeSql,
};

interface Props {
  type?: TransformType;
  className?: string;
}

const TransformTypeBadge: FC<Props> = ({ type, className }) => {
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

export default TransformTypeBadge;
