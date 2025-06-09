'use client';

import { FC, ReactNode } from 'react';

import Field from '@/src/components/Common/Field/Field';
import { InputFieldBaseProps } from '@/src/components/Common/InputField/InputField';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import Dropdown from './Dropdown';
import DropdownMenuItem from './DropdownItem';

interface Props extends InputFieldBaseProps {
  items: DropdownItemsModel[];
  selectedClassName?: string;
  selectedValue?: string;
  onChange: (value: string) => void;
  prefix?: string;
  children?: ReactNode;
}

const DropdownField: FC<Props> = ({
  fieldTitle,
  optional,
  elementId,
  items,
  onChange,
  selectedValue,
  children,
  ...props
}) => {
  return (
    <div className="flex flex-col w-full">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      <Dropdown {...props} id={elementId} selectedValue={items.find((item) => item.id === selectedValue)}>
        {items.map((item, i) => (
          <DropdownMenuItem id={item.id} key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
        ))}
        {children && <DropdownMenuItem>{children}</DropdownMenuItem>}
      </Dropdown>
    </div>
  );
};

export default DropdownField;
