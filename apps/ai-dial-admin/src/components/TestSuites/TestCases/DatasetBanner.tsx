'use client';

import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  DialConfirmationPopup,
  DialEllipsisTooltip,
  DialGhostButton,
  DialGhostIconButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconDatabaseExport, IconExternalLink, IconPencilMinus, IconUnlink } from '@tabler/icons-react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import PickPublicDataset from './PickPublicDataset';

interface Props {
  datasetName: string;
  onOpenDataset: () => void;
  onDetachDataset: () => void;
  onAttachDataset: (datasetId: string) => void;
  onBeforeAttach?: () => boolean;
}

const DatasetBanner: FC<Props> = ({ datasetName, onOpenDataset, onDetachDataset, onAttachDataset, onBeforeAttach }) => {
  const t = useI18n();
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isDetachConfirmOpen, setIsDetachConfirmOpen] = useState(false);

  const onOpenChangeModal = useCallback(() => {
    if (onBeforeAttach && !onBeforeAttach()) {
      return;
    }
    setIsChangeModalOpen(true);
  }, [onBeforeAttach]);

  const onChangeDatasetConfirm = (selectedDatasetId: string) => {
    setIsChangeModalOpen(false);
    onAttachDataset(selectedDatasetId);
  };

  const onDetachConfirm = () => {
    setIsDetachConfirmOpen(false);
    onDetachDataset();
  };

  return (
    <div className="flex items-center justify-between gap-4 min-w-0 px-3 py-2 rounded-lg bg-layer-3">
      <div className="flex items-center gap-1 min-w-0">
        <span className="flex items-center p-2 shrink-0 text-accent-primary">
          <IconDatabaseExport size={16} aria-hidden />
        </span>
        <DialEllipsisTooltip className="dial-small-semi text-primary max-w-[600px]" text={datasetName} />
        <DialGhostIconButton
          size={ElementSize.Small}
          icon={<IconExternalLink size={16} aria-hidden />}
          aria-label={t(TestSuitesI18nKey.OpenDataset)}
          onClick={onOpenDataset}
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DialGhostButton
          label={t(TestSuitesI18nKey.DetachFromDataset)}
          iconBefore={<IconUnlink {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => setIsDetachConfirmOpen(true)}
        />
        <DialGhostButton
          label={t(TestSuitesI18nKey.ChangeDataset)}
          iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onOpenChangeModal}
        />
      </div>

      {isChangeModalOpen && (
        <PickPublicDataset
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          onConfirm={onChangeDatasetConfirm}
          showWarning={false}
        />
      )}

      {isDetachConfirmOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDetachConfirmOpen}
            header={t(TestSuitesI18nKey.DetachConfirmTitle)}
            description={t(TestSuitesI18nKey.DetachConfirmDescription)}
            confirmLabel={t(TestSuitesI18nKey.DetachFromDataset)}
            onConfirm={onDetachConfirm}
            onClose={() => setIsDetachConfirmOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
};

export default DatasetBanner;
