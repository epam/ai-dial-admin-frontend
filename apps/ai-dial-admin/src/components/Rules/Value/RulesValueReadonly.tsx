'use client';

import { Dispatch, FC, SetStateAction, useEffect, useRef } from 'react';

import classNames from 'classnames';
import { DialTag } from '@epam/ai-dial-ui-kit';

import { FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRule, RuleDiffModel, RuleDiffStatus, RuleSource } from '@/src/models/dial/rule';
import { getOperationIcon } from '@/src/components/Rules/utils';

interface Props {
  rule: DialRule;
  ruleDiff?: RuleDiffModel;
  setLastValueHeight?: Dispatch<SetStateAction<number>>;
}

const RulesValueReadonly: FC<Props> = ({ rule, ruleDiff, setLastValueHeight }) => {
  const t = useI18n() as (t: string) => string;
  const ref = useRef<HTMLDivElement>(null);
  const isRuleError = ruleDiff && ruleDiff.status === RuleDiffStatus.EXCLUDE && !ruleDiff.items;
  const isTargetError = ruleDiff && ruleDiff.status === RuleDiffStatus.EXCLUDE && ruleDiff.items;
  const isRuleNew = ruleDiff && ruleDiff.status === RuleDiffStatus.INCLUDE && !ruleDiff.items;

  const containerClassName = classNames(
    'flex-1 flex flex-row items-center dial-input py-2 px-3',
    isRuleError && 'border-error',
    isRuleNew && 'border-accent-secondary',
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
    <div ref={ref} className={containerClassName}>
      <div>{t(FoldersI18nKey[RuleSource[rule.source as keyof typeof RuleSource]])}</div>
      <div className="flex px-2">
        <span className="inline-block text-secondary mr-2">{getOperationIcon(rule.function)} </span>
        <span> {rule.function}</span>
      </div>
      <div className="flex gap-1">
        {rule.targets?.map((tag) => {
          return (
            <DialTag
              key={tag}
              tag={tag}
              className={
                ruleDiff?.items?.includes(tag)
                  ? isTargetError
                    ? 'border-error'
                    : 'border-accent-secondary'
                  : 'border-primary'
              }
            />
          );
        })}
      </div>
    </div>
  );
};

export default RulesValueReadonly;
