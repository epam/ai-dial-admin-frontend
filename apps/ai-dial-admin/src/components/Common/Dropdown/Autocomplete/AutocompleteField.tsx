'use client';

import { FC } from 'react';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import { InputFieldBaseProps } from '@/src/components/Common/InputField/InputField';
import DropdownAutocomplete from './DropdownAutocomplete';

interface Props extends InputFieldBaseProps {
  items: string[];
  onChange: (value: string) => void;
}

const AutocompleteField: FC<Props> = ({ fieldTitle, elementId, optional, onChange, errorText, ...props }) => {
  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      <DropdownAutocomplete inputId={elementId} onSelectItem={onChange} {...props} />
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default AutocompleteField;
