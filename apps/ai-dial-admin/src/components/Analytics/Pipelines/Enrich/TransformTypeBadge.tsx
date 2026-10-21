import { FC } from 'react';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
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
}

const TransformTypeBadge: FC<Props> = ({ type }) => {
  const t = useI18n();

  if (!type) {
    return null;
  }

  const label = TYPE_LABEL[type];

  return <IdentityTag label={label ? t(label) : type} colorClassName={TYPE_COLOR[type]} />;
};

export default TransformTypeBadge;
