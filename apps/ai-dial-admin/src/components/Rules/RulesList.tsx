'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';

import { FoldersI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { getFolderName } from '@/src/utils/files/folder';
import RulesItem from './RulesItem';
import { sortRules } from './rules';

interface Props {
  rulesMap?: Record<string, DialRule[]>;
  isReadonly?: boolean;
  onChange: (rules: DialRule[]) => void;
}

const RulesList: FC<Props> = ({ rulesMap, isReadonly, onChange }) => {
  const t = useI18n();
  const { filePath } = useRuleFolder();
  const [lastRuleHeight, setLastRuleHeight] = useState<number>(0);

  const rulesLength = (!!rulesMap && Object.keys(rulesMap).length) || 0;
  const isSingle = rulesLength === 1;

  const operatorNameClass = classNames(
    'border border-accent-secondary rounded bg-accent-secondary-alpha inline-block px-2',
  );
  const containerClass = classNames('relative flex flex-row');
  const lineVerticalClass = classNames('w-[1px] ml-1 bg-accent-secondary', isSingle && 'hidden');
  const rulesListClass = classNames('flex-1 flex flex-col gap-4', !isSingle && 'mt-4');

  const isEmpty = !!rulesMap && Object.keys(rulesMap).length === 0;
  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      {!isSingle && !isEmpty && (
        <div>
          <span className={operatorNameClass}>{t(FoldersI18nKey.And)}</span>
        </div>
      )}
      {!isEmpty && rulesMap && (
        <div className={containerClass}>
          <div style={{ height: `calc(100% - ${lastRuleHeight / 2}px)` }} className={lineVerticalClass}></div>
          <div className={rulesListClass}>
            {isSingle ? (
              <div className="small">{t(FoldersI18nKey.AllRules)}</div>
            ) : (
              sortRules(rulesMap).map(([key, value], index) => {
                const isLastItem = index === rulesLength - 1;
                return (
                  <RulesItem
                    key={key + filePath}
                    rules={value}
                    folderName={getFolderName(key) as string}
                    indentIndex={index + 1}
                    setLastRuleHeight={isLastItem ? setLastRuleHeight : undefined}
                    isReadonly={isReadonly}
                    onChange={onChange}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesList;
