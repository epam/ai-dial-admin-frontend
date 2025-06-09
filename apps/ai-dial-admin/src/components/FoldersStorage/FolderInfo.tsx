'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { isEqual } from 'lodash';

import { updateRules } from '@/src/app/[lang]/folders-storage/actions';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import RulesList from '@/src/components/Rules/RulesList';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import FolderInfoHeader from './FolderInfoHeader';

interface Props {
  isReadonly?: boolean;
}

const FolderInfo: FC<Props> = ({ isReadonly }) => {
  const t = useI18n();
  const { currentFolder, fetchedFoldersRule, filePath, fetchRules } = useRuleFolder();
  const [originalRules, setOriginalRules] = useState(fetchedFoldersRule?.[filePath]);
  const [editableRules, setEditableRules] = useState(fetchedFoldersRule?.[filePath]);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);

  const onSave = useCallback(() => {
    updateRules(filePath, editableRules?.[filePath] as DialRule[]).then((data) => {
      if (data.success) {
        fetchRules?.(filePath);
        setOriginalRules(editableRules);
      }
    });
  }, [editableRules, fetchRules, filePath]);

  const onDiscard = useCallback(() => {
    setEditableRules(originalRules);
  }, [originalRules]);

  const onChangeRules = useCallback(
    (rules: DialRule[]) => {
      setEditableRules({
        ...editableRules,
        [filePath]: rules,
      });
    },
    [editableRules, filePath],
  );

  useEffect(() => {
    const folderRule = fetchedFoldersRule?.[filePath];
    setOriginalRules(folderRule);
    setEditableRules(folderRule);
  }, [fetchedFoldersRule, filePath]);

  useEffect(() => {
    setIsChanged(!isEqual(originalRules, editableRules));
    setIsSaveDisable(
      !!editableRules?.[filePath]?.some(
        (rule) =>
          !rule.function ||
          !rule.source ||
          !(rule.targets.length > 0) ||
          (rule.targets.length && !rule.targets[0].length),
      ),
    );
  }, [originalRules, editableRules, filePath]);

  const containerClass = classNames('w-full h-full bg-layer-3 rounded p-4 flex flex-col gap-4');

  return !currentFolder ? (
    <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoFolders)} />
  ) : (
    <div className={containerClass}>
      <FolderInfoHeader
        isChanged={isChanged}
        title={currentFolder?.name as string}
        save={onSave}
        discard={onDiscard}
        isSaveDisable={isSaveDisable}
      />
      <RulesList rulesMap={editableRules} onChange={onChangeRules} isReadonly={isReadonly} />
    </div>
  );
};

export default FolderInfo;
