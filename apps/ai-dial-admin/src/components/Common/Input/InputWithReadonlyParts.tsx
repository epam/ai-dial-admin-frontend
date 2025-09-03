'use client';

import classNames from 'classnames';
import { FC } from 'react';

import Input, { InputProps } from './Input';
import Field from '@/src/components/Common/Field/Field';
import { IconCopy } from '@tabler/icons-react';
import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import ErrorText from '../ErrorText/ErrorText';

interface Props extends InputProps {
  title: string;
  errorText?: string;
  fullValue?: string;
  prefixPart?: string;
  postfixPart?: string;
}

const InputWithReadonlyParts: FC<Props> = ({
  prefixPart,
  fullValue,
  errorText,
  postfixPart,
  cssClass,
  title,
  invalid,
  ...props
}) => {
  const t = useI18n();

  return (
    <div className="flex flex-col">
      <Field fieldTitle={title} htmlFor={props.inputId} />
      <div className="flex flex-row">
        <div
          className={classNames(
            'input-field flex flex-row items-center p-0 input max-w-full',
            postfixPart ? 'pr-2' : '',
            invalid ? 'input-error' : '',
          )}
        >
          <Input
            cssClass={classNames('border-0 border-r rounded-none h-full')}
            value={prefixPart}
            inputId={prefixPart + 'prefix'}
            tooltipTriggerClassName={'flex-1'}
          />
          <Input
            cssClass={classNames('border-0 bg-transparent', cssClass)}
            tooltipTriggerClassName={'flex-1'}
            {...props}
          />
          <p className="text-secondary small"> {postfixPart}</p>
        </div>
        <Button
          cssClass="secondary ml-2 h-[34px]"
          iconBefore={<IconCopy />}
          title={t(ButtonsI18nKey.Copy)}
          onClick={() => navigator.clipboard.writeText(fullValue || '')}
        />
      </div>
      {invalid && <ErrorText errorText={errorText} />}
    </div>
  );
};
export default InputWithReadonlyParts;
