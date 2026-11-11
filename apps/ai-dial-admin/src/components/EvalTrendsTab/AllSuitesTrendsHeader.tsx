'use client';

import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  suiteCount: number;
}

const AllSuitesTrendsHeader: FC<Props> = ({ suiteCount }) => {
  const t = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <h3 className="dial-body-semi-text text-primary">{t(TestSuitesI18nKey.EvalTrendsAllSuitesTitle)}</h3>
      <span className="dial-small-text text-secondary before:mx-1 before:content-['·']">
        {t(TestSuitesI18nKey.EvalTrendsSuiteCount, { count: suiteCount })}
      </span>
    </div>
  );
};

export default AllSuitesTrendsHeader;
