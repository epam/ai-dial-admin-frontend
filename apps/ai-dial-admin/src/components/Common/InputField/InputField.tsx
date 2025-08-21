'use client';

import { FC, ReactNode } from 'react';

import { FieldControlProps } from '@/src/models/field-control-props';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import ErrorText from '@/src/components/Common/ErrorText/ErrorText';
import Field from '@/src/components/Common/Field/Field';
import InputWithIcon from '@/src/components/Common/Input/InputWithIcon';
import InputWithText from '@/src/components/Common/Input/InputWithText';
import { getInputValue } from '@/src/components/Common/InputField/utils';

export interface InputFieldBaseProps extends FieldControlProps {
  placeholder?: string;
  value?: string | number | null;
  elementId: string;
  elementCssClass?: string;
  containerCssClass?: string;
  disabled?: boolean;
  readonly?: boolean;
  invalid?: boolean;
  errorText?: string;
  iconAfterInput?: ReactNode;
  iconBeforeInput?: ReactNode;
  textBeforeInput?: string;
  min?: number;
  max?: number;
}

export interface InputFieldProps extends InputFieldBaseProps {
  type: string;
  onChange?: (value: string | number) => void;
}

const InputField: FC<InputFieldProps> = ({
  fieldTitle,
  errorText,
  optional,
  elementCssClass,
  elementId,
  containerCssClass,
  textBeforeInput,
  readonly,
  ...props
}) => {
  const t = useI18n();
  return (
    <div className={`flex flex-col ${containerCssClass || ''}`}>
      <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />

      {readonly ? (
        <span>{props.value || t(BasicI18nKey.None)}</span>
      ) : (
        <>
          {textBeforeInput ? (
            <InputWithText
              textBeforeInput={textBeforeInput}
              inputId={elementId}
              cssClass={elementCssClass}
              invalid={errorText != null}
              {...props}
            />
          ) : (
            <InputWithIcon inputId={elementId} cssClass={elementCssClass} invalid={errorText != null} {...props} />
          )}
          <ErrorText errorText={errorText} />
        </>
      )}
    </div>
  );
};

export interface NumberInputFieldProps extends InputFieldBaseProps {
  onChange?: (value: number | string) => void;
}

export const NumberInputField: FC<NumberInputFieldProps> = ({ onChange, value, ...props }) => {
  return (
    <InputField
      type="number"
      onChange={(inputValue) => onChange?.(getInputValue(inputValue))}
      value={value}
      {...props}
    />
  );
};

export interface TextInputFieldProps extends InputFieldBaseProps {
  onChange?: (value: string) => void;
}

export const TextInputField: FC<TextInputFieldProps> = ({ onChange, ...props }) => {
  return <InputField type="text" onChange={(v) => onChange?.(v as string)} {...props} />;
};
