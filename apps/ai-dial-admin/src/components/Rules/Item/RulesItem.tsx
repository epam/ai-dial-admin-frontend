'use client';

import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { DialRule } from '@/src/models/dial/rule';
import RulesItemBody from './RulesItemBody';
import RulesItemHeader from './RulesItemHeader';

interface Props {
  children?: ReactNode;
  rules: DialRule[];
  rulesToInclude?: DialRule[];
  rulesToExclude?: DialRule[];
  folderName?: string;
  indentIndex: number;
  isAlwaysToggled?: boolean;
  isReadonly?: boolean;
  setLastRuleHeight?: Dispatch<SetStateAction<number>>;
  onChange?: (rules: DialRule[]) => void;
}

const RULE_INDENT = 16;

const RulesItem: FC<Props> = ({
  children,
  rules,
  rulesToInclude,
  rulesToExclude,
  folderName,
  indentIndex,
  isAlwaysToggled,
  isReadonly,
  setLastRuleHeight,
  onChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(!isAlwaysToggled ? !setLastRuleHeight : false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    setIsCollapsed(!isAlwaysToggled ? !setLastRuleHeight : false);
    const observer = new ResizeObserver(() => {
      if (ref.current) {
        const height = ref.current?.offsetHeight;
        if (height && setLastRuleHeight) {
          setLastRuleHeight(height);
        }
      }
    });
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [isAlwaysToggled, setLastRuleHeight]);

  const itemClass = classNames('flex flex-1', !folderName && 'border border-primary');
  const ruleIndentClass = classNames('flex items-center');
  const lineHorizontalClass = classNames('h-[1px] w-full bg-accent-secondary');
  const containerClass = classNames(
    'flex-1 flex flex-col bg-layer-2 p-4 rounded',
    isAlwaysToggled && folderName && 'bg-layer-3',
  );
  const ruleContainerClass = classNames('flex flex-col h-full', isCollapsed && 'hidden');

  return (
    <div ref={ref} className={itemClass}>
      <div style={{ width: `${RULE_INDENT * indentIndex}px` }} className={ruleIndentClass}>
        <div className={lineHorizontalClass}></div>
      </div>
      <div className={containerClass}>
        <RulesItemHeader
          folderName={folderName}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          isAlwaysToggled={isAlwaysToggled}
        >
          {children}
        </RulesItemHeader>
        <div className={ruleContainerClass}>
          <RulesItemBody
            rules={rules}
            rulesToExclude={rulesToExclude}
            rulesToInclude={rulesToInclude}
            folderName={folderName}
            isReadonly={isReadonly}
            isLast={!!setLastRuleHeight}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
};

export default RulesItem;
