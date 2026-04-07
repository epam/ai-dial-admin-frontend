import { FC } from 'react';

import { IconExclamationCircle } from '@tabler/icons-react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  errorText?: string;
}

const ErrorCellRenderer: FC<Props> = ({ errorText }) => (
  <div className="flex w-full items-center justify-center">
    <DialTooltip tooltip={errorText || 'Error'}>
      <IconExclamationCircle {...BASE_BUTTON_ICON_PROPS} className="text-error" />
    </DialTooltip>
  </div>
);

export default ErrorCellRenderer;
