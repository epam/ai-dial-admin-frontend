'use client';

import Link from 'next/link';
import { FC } from 'react';

import Icon from '@/public/images/404.svg';
import { ErrorI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

const Page404: FC = () => {
  const t = useI18n();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-layer-2">
      <div>
        <Icon />
      </div>
      <div className="text-2xl mt-6 mb-2">{t(ErrorI18nKey.PageNotFound)}</div>
      <div className="flex flex-col text-center text-secondary">
        <h2>{t(ErrorI18nKey.ResourceNotFound)}</h2>
        <h2>
          {t(ErrorI18nKey.CheckUrl)}
          <Link className="text-accent-primary ml-2" aria-label={t(MenuI18nKey.Homepage)} href={ApplicationRoute.Home}>
            {t(MenuI18nKey.Homepage)}
          </Link>
        </h2>
      </div>
    </div>
  );
};

export default Page404;
