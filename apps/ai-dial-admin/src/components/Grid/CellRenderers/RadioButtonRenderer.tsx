import { FC } from 'react';

import { Radio } from '@epam/ai-dial-ui-kit';

interface Props {
  inputId: string;
  isChecked: boolean;
}

const RadioButtonRenderer: FC<Props> = ({ inputId, isChecked }) => {
  return (
    <div className="size-6 flex items-center justify-center">
      <Radio name={inputId} value={inputId} id={inputId} isSelected={isChecked} />
    </div>
  );
};

export default RadioButtonRenderer;
