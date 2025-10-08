import { IconCopy } from '@tabler/icons-react';
import { FC, useCallback } from 'react';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  title: string;
  field: string;
}

const CopyButton: FC<Props> = ({ title, field }) => {
  const { showNotification } = useNotification();
  const t = useI18n() as (stringToTranslate: string) => string;

  const onClick = useCallback(() => {
    if (field) {
      navigator.clipboard.writeText(field);
      showNotification(getSuccessNotification(`${title} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [field, title, showNotification, t]);

  return (
    <DialButton
      ariaLabel="copy"
      cssClass="cursor-pointer text-secondary hover:text-accent-primary"
      onClick={onClick}
      iconBefore={<IconCopy {...BASE_ICON_PROPS} />}
    />
  );
};

export default CopyButton;
