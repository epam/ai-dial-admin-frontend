import { IconCopy } from '@tabler/icons-react';
import { FC, useCallback } from 'react';

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
    <button onClick={onClick} className="cursor-pointer hover:text-accent-primary" aria-label="copy">
      <IconCopy {...BASE_ICON_PROPS} />
    </button>
  );
};

export default CopyButton;
