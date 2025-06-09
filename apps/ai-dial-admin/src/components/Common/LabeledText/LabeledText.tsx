import { FC, ReactNode } from 'react';

interface Props {
  label: string;
  text?: string;
  children?: ReactNode;
}

const LabeledText: FC<Props> = ({ label, text, children }) => {
  return (
    <div className="flex flex-col">
      <label className="tiny mb-2 text-secondary" htmlFor="fileInputButton">
        {label}
      </label>
      {children ? children : <p className="flex-inline truncate">{text}</p>}
    </div>
  );
};

export default LabeledText;
