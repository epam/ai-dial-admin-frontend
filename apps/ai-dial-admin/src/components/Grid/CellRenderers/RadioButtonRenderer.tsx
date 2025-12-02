import { FC } from 'react';

import { DialRadioButton } from '@epam/ai-dial-ui-kit';

interface Props {
  inputId: string;
  isChecked: boolean;
}

const RadioButtonRenderer: FC<Props> = ({ inputId, isChecked }) => {
  return (
    <div className="h-6 w-6 flex items-center justify-center">
      <DialRadioButton
        name={inputId}
        value={inputId}
        className="w-[18px] h-[18px]"
        inputId={inputId}
        checked={isChecked}
      />
    </div>
  );
};

export default RadioButtonRenderer;
