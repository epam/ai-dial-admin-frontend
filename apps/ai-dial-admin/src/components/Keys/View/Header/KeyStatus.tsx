import { FC } from 'react';

import classNames from 'classnames';

import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { getKeyStatus } from '@/src/utils/keys';
import { getColorClassName } from '../Properties/utils';

interface Props {
  data: DialKey;
}

const KeyViewStatus: FC<Props> = ({ data }) => {
  const t = useI18n() as (t: string) => string;
  const { currentTheme } = useTheme();
  const { title, status } = getKeyStatus(data, t);

  const colorClassName = classNames('w-[10px] h-[10px] rounded-full', getColorClassName(status, currentTheme));

  return (
    <div className="flex items-center gap-2">
      <div className={colorClassName}></div>
      <div>{title}</div>
    </div>
  );
};

export default KeyViewStatus;
