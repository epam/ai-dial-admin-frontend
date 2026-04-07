import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconExclamationCircle } from '@tabler/icons-react';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  errorText?: string;
}

const ErrorCellRenderer: FC<Props> = ({ errorText }) => {
  const t = useI18n();

  return (
    <div className="flex w-full items-center justify-center">
      <DialTooltip tooltip={errorText || t(ErrorI18nKey.Error)}>
        <IconExclamationCircle {...BASE_BUTTON_ICON_PROPS} className="text-error" />
      </DialTooltip>
    </div>
  );
};

export default ErrorCellRenderer;
