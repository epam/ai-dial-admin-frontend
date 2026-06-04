'use client';

import { Dispatch, FC, SetStateAction, useEffect, useMemo, useRef } from 'react';

import classNames from 'classnames';
import { DialTag } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { DialRule, RuleDiffModel, RuleDiffStatus } from '@/src/models/dial/rule';
import { getOperationIcon, getRuleLabel } from '@/src/components/Rules/utils';

interface Props {
  rule: DialRule;
  ruleDiff?: RuleDiffModel;
  setLastValueHeight?: Dispatch<SetStateAction<number>>;
}

const RulesValueReadonly: FC<Props> = ({ rule, ruleDiff, setLastValueHeight }) => {
  const t = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const isRuleError = ruleDiff && ruleDiff.status === RuleDiffStatus.EXCLUDE && !ruleDiff.items;
  const isTargetError = ruleDiff && ruleDiff.status === RuleDiffStatus.EXCLUDE && ruleDiff.items;
  const isRuleNew = ruleDiff && ruleDiff.status === RuleDiffStatus.INCLUDE && !ruleDiff.items;

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

  const ruleLabel = useMemo(() => getRuleLabel(rule.source, t), [rule.source, t]);

  return (
    <div
      ref={ref}
      className={classNames(
        'flex-1 flex flex-row items-center dial-input py-2 px-3',
        isRuleError && 'border-error',
        isRuleNew && 'border-accent-secondary',
      )}
    >
      <div>{ruleLabel}</div>
      <div className="flex px-2">
        <span className="inline-block text-secondary mr-2">{getOperationIcon(rule.function)} </span>
        <span> {rule.function}</span>
      </div>
      <div className="flex gap-1">
        {rule.targets?.map((tag) => {
          return (
            <DialTag
              key={tag}
              label={tag}
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
