'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { SPAN_CATEGORY_CLASS, SPAN_CATEGORY_LABEL_KEY } from '@/src/constants/analytics/conversations-trace';
import { useI18n } from '@/src/locales/client';
import { SpanCategory } from '@/src/models/analytics/conversations-trace';

interface Props {
  category: SpanCategory;
  className?: string;
}

const SpanCategoryBadge: FC<Props> = ({ category, className }) => {
  const t = useI18n();

  return (
    <span className={classNames('rounded px-2 py-0.5 dial-tiny-semi-text', SPAN_CATEGORY_CLASS[category], className)}>
      {t(SPAN_CATEGORY_LABEL_KEY[category])}
    </span>
  );
};

export default SpanCategoryBadge;
