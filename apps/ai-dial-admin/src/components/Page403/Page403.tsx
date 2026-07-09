'use client';

import { FC } from 'react';

import Icon from '@/public/images/403.svg';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const Page403: FC = () => {
  const t = useI18n();

  return (
    <div className="size-full flex flex-col items-center justify-center bg-layer-2 p-4">
      <div className="flex flex-col items-center gap-6 px-4 py-10 bg-layer-3 border border-secondary rounded-xl shadow animate-fadeIn w-full max-w-md text-center">
        <Icon />
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 mb-2 rounded bg-accent-primary-alpha text-accent-primary">
            {t(ErrorI18nKey.Error403)}
          </span>
          <h1 className="text-2xl font-semibold text-primary">{t(ErrorI18nKey.AccessForbidden)}</h1>
          <p className="text-sm text-secondary leading-relaxed">
            {t(ErrorI18nKey.NoPermission)}
            <br />
            {t(ErrorI18nKey.ContactAdmin)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page403;
