import { FC } from 'react';

import { DialRadioButton } from '@epam/ai-dial-ui-kit';

interface Props {
  inputId: string;
  isChecked: boolean;
}

const RadioButtonRenderer: FC<Props> = ({ inputId, isChecked }) => {
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      <DialRadioButton cssClass="w-[18px] h-[18px]" inputId={inputId} checked={isChecked} />
    </div>
  );
};

export default RadioButtonRenderer;
