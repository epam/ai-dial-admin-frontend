'use client';

import { FC, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialDangerButton,
  DialPrimaryButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconDownload, IconPlus, IconTrashX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import DatasetImportFileModal from './Import/DatasetImportFileModal';

interface Props {
  datasetId: string;
  onApplyImport: (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => void;
  onAdd?: () => void;
  onExport?: () => void;
  onBatchDelete?: () => void;
  showBatchDelete?: boolean;
}

const DatasetTestCasesHeader: FC<Props> = ({
  datasetId,
  onApplyImport,
  onAdd,
  onExport,
  onBatchDelete,
  showBatchDelete,
}) => {
  const t = useI18n();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const importItems: DropdownItem[] = useMemo(() => {
    return [{ key: 'storage', label: 'From PC', onClick: () => setIsImportModalOpen(true) }];
  }, []);

  return (
    <div className="flex gap-4">
      <DialButtonDropdown
        label={t(ButtonsI18nKey.Import)}
        items={importItems}
        variant={ButtonVariant.Primary}
        appearance={ButtonAppearance.Ghost}
      />

      {onExport && (
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Export)}
          iconBefore={<IconDownload {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onExport}
          appearance={ButtonAppearance.Ghost}
        />
      )}

      <DialPrimaryButton
        label={t(ButtonsI18nKey.Add)}
        iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
        onClick={onAdd}
      />

      {showBatchDelete && (
        <DialDangerButton
          label={t(ButtonsI18nKey.Delete)}
          appearance={ButtonAppearance.Outlined}
          iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onBatchDelete}
        />
      )}

      {isImportModalOpen &&
        createPortal(
          <DatasetImportFileModal
            datasetId={datasetId}
            isModalOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onApply={onApplyImport}
          />,
          document.body,
        )}
    </div>
  );
};

export default DatasetTestCasesHeader;
