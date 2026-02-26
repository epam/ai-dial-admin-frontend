import { FC } from 'react';

import { DialLabel } from '@epam/ai-dial-ui-kit';

interface Props {
  label?: string;
  title?: string;
  required?: boolean;
  caption?: string;
  defaultHeader?: boolean;
}

export const WidgetHeader: FC<Props> = ({ label, title, caption, required, defaultHeader }) => {
  const isInvalidLabel = /\d$/.test(label || '');

  if (defaultHeader || !isInvalidLabel) {
    return <DialLabel className="pt-3" required={required} label={title || label} caption={caption} />;
  }
  return null;
};
