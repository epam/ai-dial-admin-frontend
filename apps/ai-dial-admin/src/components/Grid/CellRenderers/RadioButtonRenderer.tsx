import { FC } from 'react';

import { DialRadioButton } from '@epam/ai-dial-ui-kit';

interface Props {
  inputId: string;
  isChecked: boolean;
}

const RadioButtonRenderer: FC<Props> = ({ inputId, isChecked }) => {
  return (
    <div className="size-6 flex items-center justify-center">
      <DialRadioButton name={inputId} value={inputId} className="size-[18px]" inputId={inputId} checked={isChecked} />
    </div>
  );
};

export default RadioButtonRenderer;
