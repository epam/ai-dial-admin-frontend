import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  label?: string;
  title?: string;
  description?: string;
  defaultHeader?: boolean;
}
export const WidgetHeader: FC<Props> = ({ label, title, description, defaultHeader }) => {
  const isInvalidLabel = /\d$/.test(label || '');
  if (defaultHeader || !isInvalidLabel) {
    return (
      <div className="flex flex-row gap-2">
        <p className="small pb-3">{title || label}</p>
        {description && (
          <DialTooltip tooltip={description || ''}>
            <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
          </DialTooltip>
        )}
      </div>
    );
  }
  return null;
};
