'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Button, ButtonVariant, Spinner, NoDataContent } from '@epam/ai-dial-ui-kit';

import { updateRules } from '@/src/app/[lang]/folders-storage/actions';
import RulesList from '@/src/components/Rules/RulesList';
import UnitInfo from '@/src/components/FoldersStorage/UnitInfo';
import { EntitiesI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { OrgUnitsStatus } from '@/src/models/dial/org-unit';
import { DialRule } from '@/src/models/dial/rule';
import { isUnitFolder, normalizeFolder } from '@/src/utils/org-units/units';
import FolderInfoHeader from './FolderInfoHeader';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  isReadonly?: boolean;
}

const FolderInfo: FC<Props> = ({ isReadonly }) => {
  const t = useI18n();
  const { currentFolder, fetchedFoldersRule, filePath, fetchRules, isLoading, files, toggleFolder } = useRuleFolder();
  const { units, unitsStatus, getOwningUnit, refreshUnits } = useOrgUnits();
  const [originalRules, setOriginalRules] = useState(fetchedFoldersRule?.[filePath]);
  const [editableRules, setEditableRules] = useState(fetchedFoldersRule?.[filePath]);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isSaveDisable, setIsSaveDisable] = useState<boolean>(false);
  const getReqRef = useRef(useProtectedRequest());

  const onSave = useCallback(() => {
    getReqRef.current(updateRules, filePath, editableRules?.[filePath] as DialRule[]).then((data) => {
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
    setIsChanged(!isEqualSkippingUndefined(originalRules, editableRules));
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

  const isUnitsLoading = unitsStatus === OrgUnitsStatus.LOADING && Object.keys(units).length === 0;
  const isFetching = isLoading || files == null || isUnitsLoading;

  if (isFetching) {
    return (
      <div className="flex size-full items-center justify-center bg-layer-3 rounded">
        <Spinner size={40} fullWidth />
      </div>
    );
  }

  if (!currentFolder) {
    return <NoDataContent title={t(EntitiesI18nKey.NoFolders)} />;
  }

  if (unitsStatus === OrgUnitsStatus.ERROR) {
    return (
      <div className="flex size-full items-center justify-center bg-layer-3 rounded">
        <NoDataContent
          title={t(FoldersI18nKey.UnitsLoadError)}
          action={
            <Button
              variant={ButtonVariant.Neutral}
              label={t(FoldersI18nKey.UnitsRetry)}
              onClick={() => void refreshUnits()}
            />
          }
        />
      </div>
    );
  }

  const owningUnit = getOwningUnit(filePath);
  if (owningUnit && isUnitFolder(units, filePath)) {
    return <UnitInfo key={owningUnit.id} unit={owningUnit} isReadonly={isReadonly} />;
  }

  if (owningUnit) {
    return (
      <div className="size-full min-w-0 bg-layer-3 rounded p-4 flex flex-col gap-4 overflow-hidden">
        <FolderInfoHeader
          isChanged={false}
          title={currentFolder.name as string}
          onSave={onSave}
          onDiscard={onDiscard}
          isSaveDisable
        />
        <div className="flex flex-row flex-wrap items-center gap-3">
          <span className="dial-small-text">
            {t(FoldersI18nKey.InsideUnitNote, { unit: owningUnit.displayName || owningUnit.name })}
          </span>
          <Button
            variant={ButtonVariant.Neutral}
            label={t(FoldersI18nKey.OpenUnit)}
            onClick={() =>
              toggleFolder(
                { path: normalizeFolder(owningUnit.folder), nodeType: DialFileNodeType.FOLDER } as DialFolder,
                true,
              )
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="size-full min-w-0 bg-layer-3 rounded p-4 flex flex-col gap-4 overflow-hidden">
      <FolderInfoHeader
        isChanged={isChanged}
        title={currentFolder?.name as string}
        onSave={onSave}
        onDiscard={onDiscard}
        isSaveDisable={isSaveDisable}
      />
      <RulesList rulesMap={editableRules} onChange={onChangeRules} isReadonly={isReadonly} />
    </div>
  );
};

export default FolderInfo;
