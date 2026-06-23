'use client';

import { Dispatch, FC, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';
import { DialRemoveButton, DialSelectField, DialTagInput, DialInput } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ErrorI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { getAttributeItems, getOperationItems } from '@/src/components/Rules/utils';

interface Props {
  rule: DialRule;
  attributes?: string[];
  index: number;
  setLastValueHeight?: Dispatch<SetStateAction<number>>;
  onRemoveValue: () => void;
  onChangeValue: (rule: DialRule) => void;
}

const RulesValue: FC<Props> = ({ rule, attributes, index, setLastValueHeight, onRemoveValue, onChangeValue }) => {
  const t = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isFirstLine = index === 0;
  const [errorText, setErrorText] = useState('');
  const functionItems = getOperationItems(t);
  const attributeItems = getAttributeItems(t, attributes);

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
    (regex?: string) => {
      const newRule = { ...rule, targets: regex ? [regex] : [] };
      onChangeValue(newRule);
    },
    [onChangeValue, rule],
  );

  const onChangeTags = useCallback(
    (targets: string[]) => {
      const newRule = { ...rule, targets };
      onChangeValue(newRule);
    },
    [onChangeValue, rule],
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

  useEffect(() => {
    setError(rule.targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.targets]);

  return (
    <div className="flex items-start">
      <div className={classNames('h-[1px] w-[16px] bg-accent-primary', isFirstLine ? 'mt-11' : 'mt-5')}></div>
      <div ref={ref} className="flex-1 flex flex-row gap-x-2 items-start">
        <div className="shrink-0 w-[250px]">
          <DialSelectField
            value={rule.source}
            id={`rule-attribute-${index}`}
            options={attributeItems}
            label={isFirstLine ? t(FoldersI18nKey.AttributeTitle) : ''}
            placeholder={t(FoldersI18nKey.AttributePlaceholder)}
            onChange={(source) => onChangeSource(source as string)}
            containerClassName={'gap-2'}
          />
        </div>
        <div className="shrink-0 w-[160px]">
          <DialSelectField
            value={rule.function}
            id={`rule-function-${index}`}
            options={functionItems}
            label={isFirstLine ? t(FoldersI18nKey.OperationTitle) : ''}
            placeholder={t(FoldersI18nKey.OperationPlaceholder)}
            onChange={(fun) => onChangeFunction(fun as string)}
            containerClassName={'gap-2'}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          {rule.function === RuleFunction.REGEX ? (
            <DialInput
              id={`rule-regex-${index}`}
              value={rule.targets?.[0]}
              labelProps={{ label: isFirstLine ? t(BasicI18nKey.Value) : '' }}
              placeholder={t(FoldersI18nKey.RegexPlaceholder)}
              onChange={onChangeRegex}
              error={errorText}
              invalid={!!errorText}
            />
          ) : (
            <DialTagInput
              elementId={`rule-tags-${index}`}
              label={isFirstLine ? t(BasicI18nKey.Value) : ''}
              placeholder={t(FoldersI18nKey.ValuePlaceholder)}
              captionDescription={t(FoldersI18nKey.ValueCaption)}
              initialTags={rule.targets}
              onChange={onChangeTags}
              errorText={errorText}
              invalid={!!errorText}
              collapseTagOverflow
            />
          )}
        </div>
        <DialRemoveButton
          onClick={onRemoveValue}
          className={classNames('cursor-pointer', index === 0 ? 'mt-[24px]' : 'flex items-center')}
        />
      </div>
    </div>
  );
};

export default RulesValue;
