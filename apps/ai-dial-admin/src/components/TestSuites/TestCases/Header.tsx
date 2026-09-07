'use client';

import { FC, ReactNode, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialConfirmationPopup,
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

import AdaptiveHeaderActions from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/AdaptiveHeaderActions';
import {
  AdaptiveHeaderAction,
  AdaptiveHeaderActionsConfig,
} from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/models';
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
  onBeforeAttach?: () => boolean;
  onDetachDataset?: () => void;
  datasetTag?: ReactNode;
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
  onBeforeAttach,
  onDetachDataset,
  datasetTag,
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

  const tryOpenAttachModal = useCallback(() => {
    if (onBeforeAttach && !onBeforeAttach()) {
      return;
    }
    setIsAttachModalOpen(true);
  }, [onBeforeAttach]);

  const adaptiveActions = useMemo((): AdaptiveHeaderActionsConfig => {
    if (isReadOnly) {
      const leading: AdaptiveHeaderAction[] = [
        {
          id: 'export',
          label: t(ButtonsI18nKey.ExportCsv),
          icon: <IconFileArrowRight {...BASE_BUTTON_ICON_PROPS} />,
          onClick: () => onExport?.(),
          appearance: 'ghost',
          dividerAfter: true,
        },
        {
          id: 'detach',
          label: t(TestSuitesI18nKey.DetachFromDataset),
          icon: <IconUnlink {...BASE_BUTTON_ICON_PROPS} />,
          onClick: () => setIsDetachConfirmOpen(true),
          appearance: 'ghost',
        },
        {
          id: 'change',
          label: t(TestSuitesI18nKey.ChangeDataset),
          icon: <IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />,
          onClick: tryOpenAttachModal,
          appearance: 'ghost',
        },
      ];
      return { leading };
    }

    const leading: AdaptiveHeaderAction[] = [
      {
        id: 'attach',
        label: t(TestSuitesI18nKey.AttachDataset),
        icon: <IconDatabaseImport {...BASE_BUTTON_ICON_PROPS} />,
        onClick: tryOpenAttachModal,
        appearance: 'ghost',
      },
      {
        id: 'add',
        label: t(ButtonsI18nKey.Add),
        icon: <IconPlus {...BASE_BUTTON_ICON_PROPS} />,
        onClick: () => onAdd?.(),
      },
    ];
    const trailing: AdaptiveHeaderAction[] = showBatchDelete
      ? [
          {
            id: 'delete',
            label: t(ButtonsI18nKey.Delete),
            icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} />,
            onClick: () => onBatchDelete?.(),
            appearance: 'danger',
          },
        ]
      : [];
    return { leading, trailing };
  }, [isReadOnly, t, onExport, tryOpenAttachModal, onAdd, showBatchDelete, onBatchDelete]);

  return (
    <div className="flex gap-4 items-center min-w-0 flex-1 justify-end">
      {!isReadOnly && (
        <DialButtonDropdown
          label={t(TestSuitesI18nKey.More)}
          items={moreItems}
          variant={ButtonVariant.Primary}
          appearance={ButtonAppearance.Ghost}
        />
      )}

      <AdaptiveHeaderActions actions={adaptiveActions} />

      {datasetTag}

      {isImportModalOpen &&
        createPortal(
          <ImportFileModal
            datasetId={datasetId}
            isModalOpen={isImportModalOpen}
            portalId="ImportFileModal"
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
          showWarning={!isReadOnly}
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
