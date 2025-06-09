import { IconEye } from '@tabler/icons-react';
import { FC } from 'react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  onClick: () => void;
}

const ShowIcon: FC<Props> = ({ onClick }) => {
  return <IconEye {...BASE_ICON_PROPS} className="text-primary" onClick={onClick} />;
};

export default ShowIcon;
