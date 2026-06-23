'use client';

import { FC } from 'react';

import Icon from '@/public/images/403.svg';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const Page403: FC = () => {
  const t = useI18n();

  return (
    <div className="size-full flex items-center justify-center bg-layer-2 overflow-x-hidden overflow-y-hidden [@media(max-height:700px)]:overflow-y-auto [@media(max-height:700px)]:items-start [@media(max-height:700px)]:py-8">
      <div className="relative w-full max-w-[564px] overflow-hidden">
        <div className="absolute top-[44%] left-0 right-0 bottom-0 bg-layer-1 rounded-[20%]" />
        <Icon className="w-full h-auto relative z-10" />
        <div className="absolute left-1/2 top-[72%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center text-center gap-5 w-full max-w-[320px]">
          <h1 className="text-[64px] leading-[64px] sm:text-[96px] sm:leading-[96px] text-accent-primary mb-2">
            {t(ErrorI18nKey.Page403Code)}
          </h1>
          <h2 className="text-[22px] leading-[22px] sm:text-[28px] sm:leading-[28px] font-semibold">
            {t(ErrorI18nKey.Page403Title)}
          </h2>
          <p className="text-sm text-secondary max-w-[250px]">{t(ErrorI18nKey.Page403Description)}</p>
        </div>
      </div>
    </div>
  );
};

export default Page403;
