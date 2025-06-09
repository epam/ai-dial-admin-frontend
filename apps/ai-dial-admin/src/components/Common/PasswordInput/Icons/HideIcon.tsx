import { FC } from 'react';
import { IconEyeOff } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  onClick: () => void;
}

const HideIcon: FC<Props> = ({ onClick }) => {
  return <IconEyeOff {...BASE_ICON_PROPS} className="text-primary" onClick={onClick} />;
};

export default HideIcon;
