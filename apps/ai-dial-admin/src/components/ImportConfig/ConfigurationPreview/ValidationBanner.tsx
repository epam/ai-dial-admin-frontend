import { FC } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  count: number;
}

const ValidationBanner: FC<Props> = ({ count }) => {
  const t = useI18n();

  if (!count) return null;

  const message = (
    <span className="dial-small-text">
      <span className="dial-small-semi-text">{t(ImportI18nKey.ValidationBannerHeading, { count })}</span>{' '}
      {t(ImportI18nKey.ValidationBannerHelp)}
    </span>
  );

  return <DialAlert variant={AlertVariant.Error} message={message} />;
};

export default ValidationBanner;
