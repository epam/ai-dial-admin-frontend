'use client';

import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import classNames from 'classnames';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule, RuleDiffModel } from '@/src/models/dial/rule';
import RulesValue from '@/src/components/Rules/Value/RulesValue';
import RulesValueReadonly from '@/src/components/Rules/Value/RulesValueReadonly';
import { generateRuleDiff } from '@/src/components/Rules/utils';

const emptyRule = { function: void 0, source: '', targets: [] } as unknown as DialRule;

interface Props {
  rules: DialRule[];
  rulesToInclude?: DialRule[];
  rulesToExclude?: DialRule[];
  isReadonly: boolean;
  setLastValueHeight?: Dispatch<SetStateAction<number>>;
  onChange?: (rules: DialRule[]) => void;
}

const RulesValueList: FC<Props> = ({
  rules,
  isReadonly,
  rulesToExclude,
  rulesToInclude,
  setLastValueHeight,
  onChange,
}) => {
  const t = useI18n();
  const { availableAttributes } = useRuleFolder();
  let ruleDiff: RuleDiffModel | undefined = void 0;

  const ruleIndentClass = classNames('flex items-center');
  const valuesClass = classNames(
    'flex-1 flex flex-col gap-4',
    (!isReadonly ? !!setLastValueHeight : rules.length) && 'mt-4',
  );
  const lineHorizontalChildClass = classNames('h-[1px] w-[16px] bg-accent-primary');

  const onAddValue = useCallback(() => {
    const newRules = [...rules];
    newRules.push(emptyRule);
    onChange?.(newRules);
  }, [onChange, rules]);

  const onRemoveValue = useCallback(
    (index: number) => {
      const newRules = [...rules];
      newRules.splice(index, 1);
      onChange?.(newRules);
    },
    [onChange, rules],
  );

  const onChangeValue = useCallback(
    (index: number, rule: DialRule) => {
      const newRules = [...rules];
      newRules.splice(index, 1, rule);
      onChange?.(newRules);
    },
    [onChange, rules],
  );

  return (
    <div className={valuesClass}>
      {!!rules.length && (
        <div className="flex flex-col gap-2">
          {rules.map((rule, i) => {
            const isLastItem = i === rules?.length - 1;
            if (rulesToExclude || rulesToInclude) {
              ruleDiff = generateRuleDiff(rule, rulesToExclude, rulesToInclude);
            }
            return (
              <div key={'rule' + i} className={classNames(ruleIndentClass)}>
                {isReadonly ? (
                  <>
                    <div className={lineHorizontalChildClass}></div>
                    <RulesValueReadonly
                      ruleDiff={ruleDiff}
                      rule={rule}
                      setLastValueHeight={isLastItem ? setLastValueHeight : void 0}
                    />
                  </>
                ) : (
                  <RulesValue
                    rule={rule}
                    attributes={availableAttributes?.filter(
                      (item) => !rules.map((r) => r.source).includes(item) || item === rule.source,
                    )}
                    index={i}
                    setLastValueHeight={isLastItem ? setLastValueHeight : void 0}
                    onRemoveValue={() => onRemoveValue(i)}
                    onChangeValue={(rule: DialRule) => onChangeValue(i, rule)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className={classNames(ruleIndentClass, isReadonly && 'hidden')}>
        <div className={lineHorizontalChildClass}></div>
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Add)}
          onClick={onAddValue}
          disable={availableAttributes?.length === rules.length}
        />
      </div>
    </div>
  );
};

export default RulesValueList;
