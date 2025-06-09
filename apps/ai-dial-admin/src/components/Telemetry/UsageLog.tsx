'use client';
import { FC } from 'react';
import { useI18n } from '@/src/locales/client';
import { MenuI18nKey } from '@/src/constants/i18n';

interface Props {
  data: any[];
}

const UsageLog: FC<Props> = ({ data }) => {
  const t = useI18n();
  return (
    <div className="flex flex-col h-full w-full bg-layer-2 rounded p-4">
      <div className="flex flex-row justify-between mb-3">
        <h1>{t(MenuI18nKey.UsageLog)}</h1>
        {data}
      </div>
      <div className="flex-1 min-h-0"></div>
    </div>
  );
};

export default UsageLog;
