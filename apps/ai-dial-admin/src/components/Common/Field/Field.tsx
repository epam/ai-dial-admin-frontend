import { FC } from 'react';

interface Props {
  fieldTitle?: string;
  htmlFor?: string;
  optional?: boolean;
}

const Field: FC<Props> = ({ fieldTitle, htmlFor, optional }) => {
  return fieldTitle ? (
    <label className="tiny mb-2 text-secondary" htmlFor={htmlFor}>
      {fieldTitle}
      {optional && <span className="ml-1">(Optional)</span>}
    </label>
  ) : null;
};

export default Field;
