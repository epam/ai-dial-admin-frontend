'use client';

import { ReactNode, useEffect } from 'react';

import { Spinner } from '@epam/ai-dial-ui-kit';

import { I18nProviderClient } from '@/src/locales/client';

interface ProviderProps {
  locale: string;
  children: ReactNode;
}

export const I18nProvider = ({ locale, children }: ProviderProps) => {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nProviderClient locale={locale} fallback={<Spinner size={40} fullWidth />}>
      {children}
    </I18nProviderClient>
  );
};
