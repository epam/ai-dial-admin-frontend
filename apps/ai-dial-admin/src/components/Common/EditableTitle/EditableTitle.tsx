'use client';

import { FC, JSX, ReactNode, useEffect, useRef, useState, MouseEvent } from 'react';

import { IconPencilMinus } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  children?: ReactNode;
  size: number;
  title: string;
  disabled?: boolean;
  changeTitle: (value: string) => void;
}

const EditableTitle: FC<Props> = ({ children, size, title, disabled, changeTitle }) => {
  const [editing, setEdit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const Tag = `h${Math.min(Math.max(size, 1), 6)}` as keyof JSX.IntrinsicElements;

  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setEdit(true);
    }
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <div className="flex gap-3 items-center group/title" onClick={onClick}>
        <Tag className={classNames(!disabled && 'cursor-pointer')}>
          {title}
          {children}
        </Tag>
        {!disabled && (
          <span className="hidden group-hover/title:inline text-secondary">
            <IconPencilMinus />
          </span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => changeTitle(e.target.value)}
      onBlur={() => setEdit(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setEdit(false);
      }}
      onClick={(e) => e.stopPropagation()}
      className="input w-full h-[38px]"
    />
  );
};

export default EditableTitle;
