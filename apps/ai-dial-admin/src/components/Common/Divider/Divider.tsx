'use client';
import classNames from 'classnames';
import { FC } from 'react';

interface Props {
  colorClassName?: string;
  thickness?: number;
}

const Divider: FC<Props> = ({ colorClassName = 'bg-layer-4', thickness = 1 }) => {
  return <div className={classNames('w-full', colorClassName)} style={{ height: `${thickness}px` }}></div>;
};

export default Divider;
