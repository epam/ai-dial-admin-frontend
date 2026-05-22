'use client';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { ReadOnlyI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ReadOnlyBanner: FC = () => {
  const t = useI18n();

  return (
    <DialAlert
      variant={AlertVariant.Info}
      title={t(ReadOnlyI18nKey.BannerTitle)}
      message={t(ReadOnlyI18nKey.Description)}
      className="mb-6"
    />
  );
};

export default ReadOnlyBanner;
