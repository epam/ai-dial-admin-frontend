import { FC } from 'react';

interface Props {
  label?: string;
  title?: string;
  defaultHeader?: boolean;
}
export const WidgetHeader: FC<Props> = ({ label, title, defaultHeader }) => {
  const isInvalidLabel = /\d$/.test(label || '');
  if (defaultHeader || !isInvalidLabel) {
    return <p className="small pb-3">{title || label}</p>;
  }
  return null;
};
