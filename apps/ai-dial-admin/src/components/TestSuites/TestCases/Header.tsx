'use client';

import { FC, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialConfirmationPopup,
  DialDangerButton,
  DialGhostButton,
  DialNeutralButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import {
  IconDatabaseExport,
  IconDatabaseImport,
  IconFileArrowLeft,
  IconFileArrowRight,
  IconPencilMinus,
  IconPlus,
  IconSettings,
  IconTrashX,
  IconUnlink,
} from '@tabler/icons-react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import ImportFileModal from './Import/ImportFile';
import PickPublicDataset from './PickPublicDataset';
import PublishDatasetModal from './PublishDatasetModal';

interface Props {
  datasetId: string;
  onApplyImport: (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => void;
  onAdd?: () => void;
  onExport?: () => void;
  onBatchDelete?: () => void;
  onOpenSchemaModal?: () => void;
  testCaseCount?: number;
  showBatchDelete?: boolean;
  isReadOnly?: boolean;
  onPublish?: (displayName: string, description?: string) => void;
  onAttachDataset?: (datasetId: string) => void;
  onDetachDataset?: () => void;
}

const HeaderButtons: FC<Props> = ({
  datasetId,
  onApplyImport,
  onAdd,
  onExport,
  onBatchDelete,
  onOpenSchemaModal,
  testCaseCount = 0,
  showBatchDelete,
  isReadOnly,
  onPublish,
  onAttachDataset,
  onDetachDataset,
}) => {
  const t = useI18n();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isDetachConfirmOpen, setIsDetachConfirmOpen] = useState(false);

  const moreItems: DropdownItem[] = useMemo(() => {
    return [
      {
        key: 'schema',
        label: t(TestSuitesI18nKey.TestCaseSchema),
        icon: <IconSettings {...BASE_BUTTON_ICON_PROPS} />,
        onClick: () => onOpenSchemaModal?.(),
      },
      {
        key: 'publish',
        label: t(TestSuitesI18nKey.PublishToDataset),
        icon: <IconDatabaseExport {...BASE_BUTTON_ICON_PROPS} />,
        onClick: () => setIsPublishModalOpen(true),
      },
      {
        key: 'import',
        label: t(TestSuitesI18nKey.ImportFromPC),
        icon: <IconFileArrowLeft {...BASE_BUTTON_ICON_PROPS} />,
        onClick: () => setIsImportModalOpen(true),
      },
      {
        key: 'export',
        label: t(ButtonsI18nKey.ExportCsv),
        icon: <IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />,
        onClick: () => onExport?.(),
      },
    ];
  }, [t, onOpenSchemaModal, onExport]);

  const onPublishConfirm = (displayName: string, description?: string) => {
    setIsPublishModalOpen(false);
    onPublish?.(displayName, description);
  };

  const onChangeDatasetConfirm = (selectedDatasetId: string) => {
    setIsAttachModalOpen(false);
    onAttachDataset?.(selectedDatasetId);
  };

  return (
    <div className="flex gap-4">
      {isReadOnly && (
        <>
          <DialGhostButton
            label={t(ButtonsI18nKey.ExportCsv)}
            iconBefore={<IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onExport}
          />
          <DialGhostButton
            label={t(TestSuitesI18nKey.ChangeDataset)}
            iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsAttachModalOpen(true)}
          />
          <DialNeutralButton
            label={t(TestSuitesI18nKey.DetachFromDataset)}
            iconBefore={<IconUnlink {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsDetachConfirmOpen(true)}
          />
        </>
      )}

      {!isReadOnly && (
        <>
          <DialButtonDropdown
            label={t(TestSuitesI18nKey.More)}
            items={moreItems}
            variant={ButtonVariant.Primary}
            appearance={ButtonAppearance.Ghost}
          />
          <DialGhostButton
            label={t(TestSuitesI18nKey.AttachDataset)}
            iconBefore={<IconDatabaseImport {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsAttachModalOpen(true)}
          />
        </>
      )}

      {!isReadOnly && (
        <DialNeutralButton
          label={t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onAdd}
        />
      )}

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
            datasetId={datasetId}
            isModalOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onApply={onApplyImport}
          />,
          document.body,
        )}

      {isAttachModalOpen && (
        <PickPublicDataset
          isOpen={isAttachModalOpen}
          onClose={() => setIsAttachModalOpen(false)}
          onConfirm={onChangeDatasetConfirm}
        />
      )}

      {isPublishModalOpen && (
        <PublishDatasetModal
          isOpen={isPublishModalOpen}
          testCaseCount={testCaseCount}
          onClose={() => setIsPublishModalOpen(false)}
          onConfirm={onPublishConfirm}
        />
      )}

      {isDetachConfirmOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDetachConfirmOpen}
            header={t(TestSuitesI18nKey.DetachConfirmTitle)}
            description={t(TestSuitesI18nKey.DetachConfirmDescription)}
            confirmLabel={t(TestSuitesI18nKey.DetachFromDataset)}
            onConfirm={() => {
              setIsDetachConfirmOpen(false);
              onDetachDataset?.();
            }}
            onClose={() => setIsDetachConfirmOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
};

export default HeaderButtons;
