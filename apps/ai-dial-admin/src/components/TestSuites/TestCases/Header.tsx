'use client';

import { FC, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconDownload, IconPlus } from '@tabler/icons-react';
import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialPrimaryButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import ImportFileModal from './Import/ImportFile';

interface Props {
  selectedTestSuiteId: string;
  onApplyImport: (file: File) => void;
  onAdd?: () => void;
  onExport?: () => void;
}
const HeaderButtons: FC<Props> = ({ selectedTestSuiteId, onApplyImport, onAdd, onExport }) => {
  const t = useI18n();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const items: DropdownItem[] = useMemo(() => {
    return [{ key: 'storage', label: t(TestSuitesI18nKey.FromPC), onClick: () => setIsImportModalOpen(true) }];
  }, [t]);

  return (
    <div className="flex gap-4">
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
