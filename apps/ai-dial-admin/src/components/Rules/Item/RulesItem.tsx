'use client';

import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { DialRule } from '@/src/models/dial/rule';
import RulesItemBody from '@/src/components/Rules/Item/RulesItemBody';
import RulesItemHeader from '@/src/components/Rules/Item/RulesItemHeader';

interface Props {
  children?: ReactNode;
  rules: DialRule[];
  rulesToInclude?: DialRule[];
  rulesToExclude?: DialRule[];
  folderName?: string;
  folderDescription?: string;
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
  folderDescription,
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

  return (
    <div ref={ref} className={classNames('flex flex-1', !folderName && 'border border-primary')}>
      <div style={{ width: `${RULE_INDENT * indentIndex}px` }} className="flex items-center">
        <div className="h-[1px] w-full bg-accent-secondary"></div>
      </div>
      <div
        className={classNames(
          'flex-1 flex flex-col bg-layer-2 py-4 px-6 rounded',
          isAlwaysToggled && folderName && 'bg-layer-3',
        )}
      >
        <RulesItemHeader
          folderName={folderName}
          folderDescription={folderDescription}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          isAlwaysToggled={isAlwaysToggled}
        >
          {children}
        </RulesItemHeader>
        <div className={classNames('flex flex-col h-full', isCollapsed && 'hidden')}>
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
