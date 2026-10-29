'use client';

import { FC, useCallback, useState } from 'react';

import { Button, ButtonVariant, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';

import NewUnitModal from '@/src/components/FoldersStorage/Modals/NewUnitModal';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useOrgUnits } from '@/src/context/OrgUnitsContext';
import { useRuleFolder } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { OrgUnit, OrgUnitsStatus } from '@/src/models/dial/org-unit';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { getSuccessNotification } from '@/src/utils/notification';
import { NewUnitBlock, getNewUnitBlock, normalizeFolder } from '@/src/utils/org-units/units';

/** Creates a unit under the selected folder: the shared space itself or an existing unit. */
const NewUnitButton: FC = () => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { filePath, fetchFiles, toggleFolder } = useRuleFolder();
  const { units, unitsStatus, refreshUnits } = useOrgUnits();
  const [isOpen, setIsOpen] = useState(false);

  const parentFolder = normalizeFolder(filePath);

  const onCreated = useCallback(
    async (unit: OrgUnit) => {
      setIsOpen(false);
      await refreshUnits();
      fetchFiles(parentFolder);
      toggleFolder(
        { path: normalizeFolder(unit.folder), name: unit.name, nodeType: DialFileNodeType.FOLDER } as DialFolder,
        true,
      );
      showNotification(getSuccessNotification(t(FoldersI18nKey.UnitCreated)));
    },
    [refreshUnits, fetchFiles, parentFolder, toggleFolder, showNotification, t],
  );

  if (unitsStatus !== OrgUnitsStatus.READY) {
    return null;
  }

  const block = getNewUnitBlock(units, parentFolder);
  const tooltip = {
    [NewUnitBlock.NOT_A_UNIT_PARENT]: t(FoldersI18nKey.NewUnitBlockedNotUnit),
    [NewUnitBlock.TOO_DEEP]: t(FoldersI18nKey.NewUnitBlockedDepth),
  }[block ?? NewUnitBlock.NOT_A_UNIT_PARENT];

  return (
    <>
      <Tooltip triggerClassName="flex items-center" tooltip={block ? tooltip : ''} placement={TooltipPlacement.Top}>
        <Button
          variant={ButtonVariant.Neutral}
          label={t(FoldersI18nKey.NewUnit)}
          disabled={!!block || !filePath}
          onClick={() => setIsOpen(true)}
        />
      </Tooltip>
      {isOpen && (
        <NewUnitModal
          parentPath={removeTrailingSlash(parentFolder)}
          onClose={() => setIsOpen(false)}
          onCreated={onCreated}
        />
      )}
    </>
  );
};

export default NewUnitButton;
