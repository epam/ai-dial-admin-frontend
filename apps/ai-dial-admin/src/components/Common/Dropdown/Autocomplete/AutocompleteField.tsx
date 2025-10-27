'use client';

import { FC } from 'react';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import DropdownAutocomplete, { DropdownAutocompleteProps } from './DropdownAutocomplete';

interface Props extends DropdownAutocompleteProps {
  items: string[];
  fieldTitle?: string;
  optional?: boolean;
  errorText?: string;
  value?: string | number | null;
  elementId?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const AutocompleteField: FC<Props> = ({ fieldTitle, optional, onChange, elementId, errorText, value, ...props }) => {
  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      <DropdownAutocomplete onSelectItem={onChange} autocompleteValue={value} {...props} />
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default AutocompleteField;
