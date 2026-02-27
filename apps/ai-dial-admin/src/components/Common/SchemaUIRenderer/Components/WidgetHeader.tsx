import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { IconInfoCircle } from '@tabler/icons-react';

interface Props {
  label?: string;
  title?: string;
  required?: boolean;
  caption?: string;
  defaultHeader?: boolean;
}

export const WidgetHeader: FC<Props> = ({ label, title, caption, defaultHeader }) => {
  const isInvalidLabel = /\d$/.test(label || '');

  if (defaultHeader || !isInvalidLabel) {
    return (
      <div className="flex flex-row gap-2 mb-2">
        <p className="dial-small-text">{title || label}</p>
        {caption && (
          <DialTooltip tooltip={caption || ''}>
            <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
          </DialTooltip>
        )}
      </div>
    );
  }
  return null;
};
