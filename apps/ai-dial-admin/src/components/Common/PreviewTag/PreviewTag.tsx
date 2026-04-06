import { DialTag } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// TODO: review DialTag styles and remove overrides if possible
export const PreviewTag: FC = () => {
  const t = useI18n();

  return (
    <DialTag
      tag={t(BasicI18nKey.Preview)}
      className="text-primary !bg-info !border-blue800 !h-[16px] !text-[10px]/[12px]"
    />
  );
};
