import { IconCopy } from '@tabler/icons-react';
import { FC, useCallback } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  title: string;
  field: string;
  isFullButton?: boolean;
}

const CopyButton: FC<Props> = ({ title, field, isFullButton = false }) => {
  const { showNotification } = useNotification();
  const t = useI18n() as (stringToTranslate: string) => string;

  const onClick = useCallback(() => {
    if (field) {
      navigator.clipboard.writeText(field);
      showNotification(getSuccessNotification(`${title} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [field, title, showNotification, t]);

  const props = isFullButton
    ? { variant: ButtonVariant.Secondary, title: t(ButtonsI18nKey.Copy) }
    : { cssClass: 'cursor-pointer text-secondary hover:text-accent-primary' };

  return <DialButton ariaLabel="copy" onClick={onClick} iconBefore={<IconCopy {...BASE_ICON_PROPS} />} {...props} />;
};

export default CopyButton;
