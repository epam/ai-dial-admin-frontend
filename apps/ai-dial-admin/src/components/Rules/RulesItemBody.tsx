'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';

import { DialRule } from '@/src/models/dial/rule';
import RulesItemOperator from './RulesItemOperator';
import RulesValueList from './RulesValueList';

interface Props {
  rules: DialRule[];
  rulesToInclude?: DialRule[];
  rulesToExclude?: DialRule[];
  folderName?: string;
  isReadonly?: boolean;
  isLast?: boolean;
  onChange?: (rules: DialRule[]) => void;
}

const RulesItemBody: FC<Props> = ({
  rules,
  rulesToInclude,
  rulesToExclude,
  folderName,
  isReadonly,
  isLast,
  onChange,
}) => {
  const [lastValueHeight, setLastValueHeight] = useState<number>(0);
  const ruleClass = classNames('relative flex flex-row');
  const lineVerticalClass = classNames('w-[1px] ml-1 bg-accent-primary');

  return (
    <>
      <RulesItemOperator folderName={folderName} isEmpty={!rules.length} isReadonly={!isLast} />
      <div className={ruleClass}>
        <div
          style={{ height: `calc(100% - ${isLast ? 19 : lastValueHeight / 2}px)` }}
          className={lineVerticalClass}
        ></div>
        <RulesValueList
          rules={rules}
          rulesToInclude={rulesToInclude}
          rulesToExclude={rulesToExclude}
          setLastValueHeight={setLastValueHeight}
          isReadonly={isReadonly || !isLast}
          onChange={onChange}
        />
      </div>
    </>
  );
};

export default RulesItemBody;
