import { createI18nClient } from 'next-international/client';
import { FC, ReactNode } from 'react';

export const { useI18n, I18nProviderClient, useCurrentLocale } = createI18nClient(
  {
    en: () => import('./en'),
  },
  { segmentName: 'lang' },
) as unknown as {
  useI18n: () => (key: string, options?: Record<string, string | number>) => string;
  I18nProviderClient: FC<{ children: ReactNode; locale: string; fallback: ReactNode }>;
  useCurrentLocale: () => string;
};
