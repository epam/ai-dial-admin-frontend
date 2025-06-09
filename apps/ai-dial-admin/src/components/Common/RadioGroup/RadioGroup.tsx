'use client';

import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import classNames from 'classnames';
import { FC, Fragment, ReactNode } from 'react';
import RadioButton from '@/src/components/Common//RadioButton/RadioButton';
import Field from '@/src/components/Common//Field/Field';

export interface RadioButtonWithContent {
  id: string;
  name: string;
  content?: ReactNode;
}

interface Props {
  fieldTitle?: string;
  elementId: string;
  radioCssClass?: string;
  labelCssClass?: string;
  disabled?: boolean;
  radioButtons: RadioButtonWithContent[];
  activeRadioButton: string;
  orientation: RadioFieldOrientation;
  onChange: (radioId: string) => void;
}

const RadioGroup: FC<Props> = ({
  fieldTitle,
  radioCssClass,
  labelCssClass,
  disabled,
  elementId,
  radioButtons,
  activeRadioButton,
  orientation,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {fieldTitle && <Field fieldTitle={fieldTitle} htmlFor={elementId} />}

      <div
        key="radio-group"
        className={classNames(
          'flex',
          orientation === RadioFieldOrientation.Column ? 'flex-col gap-y-3' : 'flex-row gap-x-6',
        )}
      >
        {radioButtons.map((radio, i) => (
          <Fragment key={`${i}-wrapper`}>
            <RadioButton
              key={i}
              inputId={radio.id}
              disabled={disabled}
              cssClass={radioCssClass}
              labelCssClass={labelCssClass}
              title={radio.name}
              checked={radio.id === activeRadioButton}
              onChange={() => onChange(radio.id)}
            />
            {radio.id === activeRadioButton && radio.content && (
              <div key={`${i}-content`} className="pb-1">
                {radio.content}
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default RadioGroup;
