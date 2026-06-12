'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';

import { BasicI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { getFolderName } from '@/src/utils/files/folder';
import RulesItem from '@/src/components/Rules/Item/RulesItem';
import { sortRules } from '@/src/components/Rules/utils';

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

  const isEmpty = !!rulesMap && Object.keys(rulesMap).length === 0;
  return (
    <div className="flex flex-col size-full min-w-0 overflow-auto">
      {!isSingle && !isEmpty && (
        <div>
          <span className="border border-accent-secondary rounded bg-accent-secondary-alpha inline-block px-2">
            {t(BasicI18nKey.And)}
          </span>
        </div>
      )}
      {!isEmpty && rulesMap && (
        <div className="relative flex flex-row">
          <div
            style={{ bottom: `${lastRuleHeight / 2}px` }}
            className={classNames('absolute top-0 left-1 w-[1px] bg-accent-secondary', isSingle && 'hidden')}
          ></div>
          <div className={classNames('flex-1 flex flex-col gap-4 ml-[5px]', !isSingle && 'mt-4')}>
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
