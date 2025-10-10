import { FC } from 'react';

import { IconExclamationCircle } from '@tabler/icons-react';
import classNames from 'classnames';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { DialInputProps } from '@epam/ai-dial-ui-kit/dist/src/components/Input/Input';

interface Props extends DialInputProps {
  isInvalid?: boolean;
  errorText?: string;
  onClick?: () => void;
}

const FilledInput: FC<Props> = ({ isInvalid, iconBefore, cssClass, ...props }) => {
  const icon = <div className="mr-2">{isInvalid ? <IconExclamationCircle {...BASE_ICON_PROPS} /> : iconBefore}</div>;

  return (
    <DialInput
      iconBefore={icon}
      tooltipTriggerClassName="flex-1 min-w-0"
      cssClass={classNames(isInvalid ? 'text-error' : '', cssClass)}
      containerCssClass="border-0 bg-transparent"
      {...props}
    />
  );
};

export default FilledInput;
