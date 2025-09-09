'use client';

import { FC, ReactNode } from 'react';

import Field from '@/src/components/Common/Field/Field';
import { InputFieldBaseProps } from '@/src/components/Common/InputField/InputField';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import Dropdown from './Dropdown';
import DropdownMenuItem from './DropdownItem';
import classNames from 'classnames';

interface Props extends InputFieldBaseProps {
  items: DropdownItemsModel[];
  selectedClassName?: string;
  selectedValue?: string;
  multipleValues?: string[] | null;
  onChange: (value: string) => void;
  prefix?: string;
  children?: ReactNode;
  listClassName?: string;
}

const DropdownField: FC<Props> = ({
  fieldTitle,
  optional,
  elementId,
  items,
  onChange,
  selectedValue,
  children,
  multipleValues,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  value,
  ...props
}) => {
  return (
    <div className={classNames('flex flex-col w-full', props.containerCssClass)}>
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      <Dropdown
        {...props}
        id={elementId}
        selectedValue={items.find((item) => item.id === selectedValue)}
        multipleValues={multipleValues}
      >
        {items.map((item, i) => (
          <DropdownMenuItem
            id={item.id}
            key={i}
            dropdownItem={item}
            onClick={() => onChange(item.id)}
            multipleValues={multipleValues}
          />
        ))}
        {children && <DropdownMenuItem>{children}</DropdownMenuItem>}
      </Dropdown>
    </div>
  );
};

export default DropdownField;
