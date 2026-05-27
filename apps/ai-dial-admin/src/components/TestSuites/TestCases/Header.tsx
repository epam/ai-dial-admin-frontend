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
import { IconDownload, IconPlus, IconSettings, IconTrashX } from '@tabler/icons-react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import ImportFileModal from './Import/ImportFile';

interface Props {
  selectedTestSuiteId: string;
  onApplyImport: (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => void;
  onAdd?: () => void;
  onExport?: () => void;
  onOpenSchemaModal?: () => void;
  onBatchDelete?: () => void;
  showBatchDelete?: boolean;
}
const HeaderButtons: FC<Props> = ({
  selectedTestSuiteId,
  onApplyImport,
  onAdd,
  onExport,
  onOpenSchemaModal,
  onBatchDelete,
  showBatchDelete,
}) => {
  const t = useI18n();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const items: DropdownItem[] = useMemo(() => {
    return [{ key: 'storage', label: t(TestSuitesI18nKey.FromPC), onClick: () => setIsImportModalOpen(true) }];
  }, [t]);

  return (
    <div className="flex gap-4">
      {onOpenSchemaModal && (
        <DialPrimaryButton
          label={t(TestSuitesI18nKey.TestCaseSchema)}
          iconBefore={<IconSettings {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onOpenSchemaModal}
          appearance={ButtonAppearance.Ghost}
        />
      )}

      <DialButtonDropdown
        label={t(ButtonsI18nKey.Import)}
        items={items}
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
          <ImportFileModal
            selectedTestSuiteId={selectedTestSuiteId}
            isModalOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onApply={onApplyImport}
          />,
          document.body,
        )}
    </div>
  );
};

export default HeaderButtons;
