import { FC } from 'react';

import classNames from 'classnames';

import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { ValidityState } from '@/src/models/dial/base-entity';
import { getColorClassName, getValidityStatus } from './utils';

interface Props {
  validityState?: ValidityState;
}

const ValidityStatus: FC<Props> = ({ validityState }) => {
  const t = useI18n() as (t: string) => string;
  const { currentTheme } = useTheme();
  const { title, status } = getValidityStatus(validityState, t);

  const colorClassName = classNames('w-[10px] h-[10px] rounded-full', getColorClassName(status, currentTheme));

  return (
    <div className="flex items-center gap-2">
      <div className={colorClassName}></div>
      <div>{title}</div>
    </div>
  );
};

export default ValidityStatus;
