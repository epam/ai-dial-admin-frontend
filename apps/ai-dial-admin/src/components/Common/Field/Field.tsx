import { DialFieldLabel } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { BasicI18nKey } from '@/src/constants/i18n';

interface Props {
  htmlFor: string;
  fieldTitle?: string;
  optional?: boolean;
}

const Field: FC<Props> = ({ ...props }) => {
  const t = useI18n();
  return <DialFieldLabel optionalText={t(BasicI18nKey.Optional)} {...props} />;
};

export default Field;
