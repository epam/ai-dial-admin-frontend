'use client';

import { FC, useState } from 'react';

import { DialRule } from '@/src/models/dial/rule';
import RulesItemOperator from '@/src/components/Rules/Item/RulesItemOperator';
import RulesValueList from '@/src/components/Rules/Value/RulesValueList';

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

  return (
    <>
      <RulesItemOperator folderName={folderName} isEmpty={!rules.length} isReadonly={!isLast} />
      <div className="relative flex flex-row">
        <div
          style={{ height: `calc(100% - ${isLast ? 19 : lastValueHeight / 2}px)` }}
          className="w-[px] ml-1 bg-accent-primary"
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
