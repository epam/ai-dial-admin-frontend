import { FC } from 'react';

import RadioButton from '@/src/components/Common/RadioButton/RadioButton';

interface Props {
  inputId: string;
  isChecked: boolean;
}

const RadioButtonRenderer: FC<Props> = ({ inputId, isChecked }) => {
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      <RadioButton cssClass="w-[18px] h-[18px]" inputId={inputId} checked={isChecked} />
    </div>
  );
};

export default RadioButtonRenderer;
