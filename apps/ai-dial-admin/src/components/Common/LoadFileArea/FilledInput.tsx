import { FC, ReactNode } from 'react';

import { IconExclamationCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import Input, { InputProps } from '@/src/components/Common/Input/Input';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props extends InputProps {
  isInvalid?: boolean;
  errorText?: string;
  iconAfterInput?: ReactNode;
  iconBeforeInput?: ReactNode;
  onClick?: () => void;
}

const FilledInput: FC<Props> = ({
  isInvalid,
  errorText,
  iconBeforeInput,
  iconAfterInput,
  cssClass,
  onClick,
  ...props
}) => {
  return (
    <div
      className={classNames(
        'input-field flex flex-row items-center p-0',
        iconAfterInput ? 'pr-2' : '',
        iconBeforeInput ? 'pl-2' : '',
        props.disabled ? 'bg-layer-3 text-secondary' : '',
      )}
      onClick={onClick}
    >
      <Tooltip tooltip={isInvalid ? errorText : ''} placement={'bottom'}>
        <div className={classNames(isInvalid ? 'text-error' : '', 'flex items-center')}>
          {isInvalid ? <IconExclamationCircle {...BASE_ICON_PROPS} /> : iconBeforeInput}
        </div>
      </Tooltip>
      <Input
        cssClass={classNames('border-0 bg-transparent truncate', isInvalid ? 'text-error' : '', cssClass)}
        {...props}
      />
      <div className="flex items-center">{iconAfterInput}</div>
    </div>
  );
};

export default FilledInput;
