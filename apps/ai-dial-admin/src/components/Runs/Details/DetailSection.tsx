'use client';

import { FC, ReactNode } from 'react';

import classNames from 'classnames';

interface Props {
  title: string;
  list: Array<[string, string]>;
  children?: ReactNode;
  getKeyClassName?: (key: string) => string | undefined;
  getValueClassName?: (key: string) => string | undefined;
}

const DetailSection: FC<Props> = ({ title, list, children, getKeyClassName, getValueClassName }) => {
  return (
    <section className="flex flex-col gap-2">
      <h4>{title}</h4>

      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 dial-small">
        {list.map(([key, value], index) => (
          <span key={index + '-' + title + '-' + key} className="contents">
            <p className={classNames('break-all', getKeyClassName ? getKeyClassName(key) : 'text-secondary')}>{key}</p>
            <p className={classNames('font-medium text-right break-all', getValueClassName?.(key))}>{value}</p>
          </span>
        ))}
      </div>
      {children}
    </section>
  );
};

export default DetailSection;
