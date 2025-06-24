'use client';

import { FC } from 'react';
import classNames from 'classnames';

import Field from '@/src/components/Common/Field/Field';
import RadioButton from '@/src/components/Common/RadioButton/RadioButton';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { RadioButtonModel } from '@/src/models/radio-button';

interface Props {
  fieldTitle?: string;
  elementId: string;
  radioCssClass?: string;
  disabled?: boolean;
  radioButtons: RadioButtonModel[];
  activeRadioButton: string;
  orientation: RadioFieldOrientation;
  onChange: (radio: string) => void;
}

const RadioField: FC<Props> = ({
  fieldTitle,
  radioCssClass,
  disabled,
  elementId,
  radioButtons,
  activeRadioButton,
  orientation,
  onChange,
}) => {
  return (
    <div className="flex flex-col">
      {fieldTitle && <Field fieldTitle={fieldTitle} htmlFor={elementId} />}

      <div
        className={classNames(
          'flex mt-1',
          orientation === RadioFieldOrientation.Column ? 'flex-col gap-y-3' : 'flex-row gap-x-6',
        )}
      >
        {radioButtons.map((radio, i) => (
          <RadioButton
            key={i}
            inputId={radio.id}
            disabled={disabled}
            cssClass={radioCssClass}
            title={radio.name}
            description={radio.description}
            checked={radio.id === activeRadioButton}
            onChange={() => onChange(radio.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default RadioField;
