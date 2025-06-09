'use client';

import { FC } from 'react';

import Icon from '@/public/images/403.svg';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const Page403: FC = () => {
  const t = useI18n();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-layer-2">
      <div>
        <Icon />
      </div>
      <div className="text-2xl mt-6 mb-2">{t(ErrorI18nKey.AccessForbidden)}</div>
      <div className="flex flex-col text-center text-secondary">
        <h2>{t(ErrorI18nKey.AccessDenied)}</h2>
        <h2>{t(ErrorI18nKey.AccessRefer)}</h2>
      </div>
    </div>
  );
};

export default Page403;
