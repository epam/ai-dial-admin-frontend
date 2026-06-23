'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';

const Page404: FC = () => {
  const t = useI18n();
  const router = useRouter();

  return (
    <div className="size-full bg-layer-2 flex items-center justify-center relative py-8 overflow-x-hidden overflow-y-hidden [@media(max-height:640px)]:overflow-y-auto [@media(max-height:640px)]:items-start">
      <div className="relative w-[min(640px,100%)]">
        <div className="absolute top-1/2 left-1/2 w-[100vw] h-[8px] bg-accent-primary rounded-r-full rotate-45 origin-left z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center bg-layer-1 rounded-full w-full aspect-square border-[6px] border-accent-primary">
          <div className="flex flex-col items-center text-center gap-5 w-[320px]">
            <h1 className="text-accent-primary text-[64px] leading-[64px] sm:text-[96px] sm:leading-[96px]">
              {t(ErrorI18nKey.Page404Code)}
            </h1>
            <h2 className="text-[22px] leading-[22px] sm:text-[28px] sm:leading-[28px] mt-3 font-semibold">
              {t(ErrorI18nKey.Page404Title)}
            </h2>
            <p className="text-sm text-secondary">{t(ErrorI18nKey.Page404Description)}</p>
            <DialPrimaryButton
              label={t(ErrorI18nKey.Page404HomeButton)}
              onClick={() => router.push(ApplicationRoute.Home)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page404;
