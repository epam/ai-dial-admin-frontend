'use client';

import { FC } from 'react';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import DropdownAutocomplete from './DropdownAutocomplete';
// TODO: temp - remove after use Dial UI Kit Autocomplete
import { DialInputFieldBaseProps } from '@epam/ai-dial-ui-kit/dist/src/components/InputField/InputField';

interface Props extends DialInputFieldBaseProps {
  items: string[];
  onChange: (value: string) => void;
}

const AutocompleteField: FC<Props> = ({ fieldTitle, elementId, optional, onChange, errorText, value, ...props }) => {
  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      <DropdownAutocomplete inputId={elementId} onSelectItem={onChange} autocompleteValue={value} {...props} />
      <ErrorText errorText={errorText} />
    </div>
  );
};

export default AutocompleteField;
