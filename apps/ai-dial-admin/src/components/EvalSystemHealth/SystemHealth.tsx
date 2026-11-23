'use client';

import { FC } from 'react';

import ActivityCardRow from '@/src/components/EvalSystemHealth/ActivityCardRow';
import CoverageCardRow from '@/src/components/EvalSystemHealth/CoverageCardRow';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const SystemHealth: FC = () => {
  const t = useI18n();

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto">
      <h1 className="dial-h1-text">{t(MenuI18nKey.SystemHealth)}</h1>
      <div className="flex flex-col gap-4">
        <CoverageCardRow />
        <ActivityCardRow />
      </div>
    </div>
  );
};

export default SystemHealth;
