'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import TagInput from '@/src/components/Common/TagInput/TagInput';
import { ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { getAttributeItems, getOperationItems } from './rules';

interface Props {
  rule: DialRule;
  attributes?: string[];
  index: number;
  setLastValueHeight?: Dispatch<SetStateAction<number>>;
  onRemoveValue: () => void;
  onChangeValue: (rule: DialRule) => void;
}

const RulesValue: FC<Props> = ({ rule, attributes, index, setLastValueHeight, onRemoveValue, onChangeValue }) => {
  const t = useI18n() as (t: string) => string;
  const ref = useRef<HTMLDivElement>(null);
  const isFirstLine = index === 0;
  const [errorText, setErrorText] = useState('');
  const functionItems: DropdownItemsModel[] = getOperationItems(t);
  const attributeItems = getAttributeItems(t, attributes);

  const lineHorizontalChildClass = classNames('h-[1px] w-[16px] bg-accent-primary', errorText && 'mb-[18px]');
  const containerClass = classNames('flex-1 flex flex-row gap-x-2 items-center');
  const inputClass = classNames('flex-shrink-0', errorText && 'pb-[18px]');
  const iconClass = classNames(
    'cursor-pointer',
    index === 0 ? 'mt-[24px]' : 'flex items-center',
    errorText && 'pb-[18px]',
    (!rule.function || !rule.source || !(rule.targets.length > 0)) && 'pointer-events-none opacity-60',
  );

  const setError = useCallback(
    (value: string | string[]) => {
      if (value.length === 0) {
        setErrorText(t(ErrorI18nKey.EmptyField));
      } else {
        setErrorText('');
      }
    },
    [t],
  );

  const onChangeSource = useCallback(
    (source: string) => {
      const newRule = { ...rule, source };
      onChangeValue(newRule);
    },
    [onChangeValue, rule],
  );

  const onChangeFunction = useCallback(
    (func: string) => {
      const newRule = { ...rule, function: func as RuleFunction, targets: [] };
      onChangeValue(newRule);
    },
    [onChangeValue, rule],
  );

  const onChangeRegex = useCallback(
    (regex: string) => {
      const newRule = { ...rule, targets: [regex] };
      onChangeValue(newRule);
      setError(regex);
    },
    [onChangeValue, rule, setError],
  );

  const onChangeTags = useCallback(
    (targets: string[]) => {
      const newRule = { ...rule, targets };
      onChangeValue(newRule);
      setError(targets);
    },
    [onChangeValue, rule, setError],
  );

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (ref.current) {
        const height = ref.current?.offsetHeight;
        if (height && setLastValueHeight) {
          setLastValueHeight(height);
        }
      }
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [setLastValueHeight]);

  return (
    <>
      <div className={classNames(lineHorizontalChildClass, index === 0 && 'mt-[22px]')}></div>
      <div ref={ref} className={containerClass}>
        <div className={classNames(inputClass, 'w-[250px]')}>
          <DropdownField
            selectedValue={rule.source}
            elementId={'rule-attribute-' + index}
            items={attributeItems}
            fieldTitle={isFirstLine ? t(FoldersI18nKey.AttributeTitle) : ''}
            placeholder={t(FoldersI18nKey.AttributePlaceholder)}
            onChange={onChangeSource}
          />
        </div>
        <div className={classNames(inputClass, 'w-[160px]')}>
          <DropdownField
            selectedValue={rule.function}
            elementId={'rule-function-' + index}
            items={functionItems}
            fieldTitle={isFirstLine ? t(FoldersI18nKey.OperationTitle) : ''}
            placeholder={t(FoldersI18nKey.OperationPlaceholder)}
            onChange={onChangeFunction}
          />
        </div>
        <div className="w-full">
          {rule.function === RuleFunction.REGEX ? (
            <TextInputField
              elementId={'upstreamEndpoints ' + index}
              value={rule.targets?.[0]}
              fieldTitle={isFirstLine ? t(FoldersI18nKey.ValueTitle) : ''}
              placeholder={t(FoldersI18nKey.RegexPlaceholder)}
              onChange={onChangeRegex}
              errorText={errorText}
              invalid={!!errorText}
              elementCssClass="h-[38px]"
            />
          ) : (
            <TagInput
              elementId="rule-values"
              fieldTitle={isFirstLine ? t(FoldersI18nKey.ValueTitle) : ''}
              placeholder={t(FoldersI18nKey.ValuePlaceholder)}
              initialTags={rule.targets}
              onChange={onChangeTags}
              errorText={errorText}
              invalid={!!errorText}
            />
          )}
        </div>

        <button className={iconClass} onClick={onRemoveValue} aria-label="remove">
          <IconTrash {...BASE_ICON_PROPS} />
        </button>
      </div>
    </>
  );
};

export default RulesValue;
