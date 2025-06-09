import { FC } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  title: string;
  value?: string;
}
const ReadonlyField: FC<Props> = ({ value, title }) => {
  return (
    <TextInputField
      fieldTitle={title}
      elementId="readonlyField"
      disabled={true}
      value={value}
      iconAfterInput={<CopyButton field={value} title={title} />}
    />
  );
};

export default ReadonlyField;
