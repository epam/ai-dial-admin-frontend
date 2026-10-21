import { FC } from 'react';

interface Props {
  text: string;
}

/** A group's own figure inside a checklist line, set apart from the words around it. */
const CheckValue: FC<Props> = ({ text }) => <strong className="font-semibold text-primary">{text}</strong>;

export default CheckValue;
