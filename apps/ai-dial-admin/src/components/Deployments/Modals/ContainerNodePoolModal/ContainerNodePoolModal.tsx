'use client';

import { FC, useEffect, useState } from 'react';
import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';
import { NodePool } from '@/src/models/deployments/node-pools';
import { useI18n } from '@/src/locales/client';

import NodePoolList from '@/src/components/Deployments/NodePool/NodePoolList';

interface Props {
  isOpen: boolean;
  pools: NodePool[];
  initialSelection: string | null;
  onClose: () => void;
  onConfirm: (poolId: string | null) => void;
}

const ContainerNodePoolModal: FC<Props> = ({ isOpen, pools, initialSelection, onClose, onConfirm }) => {
  const t = useI18n();
  const [pendingSelection, setPendingSelection] = useState<string | null>(initialSelection);

  useEffect(() => {
    if (isOpen) {
      setPendingSelection(initialSelection);
    }
  }, [isOpen, initialSelection]);

  const onApply = () => {
    onConfirm(pendingSelection);
    onClose();
  };

  return (
    <DialConfirmationPopup
      open={isOpen}
      onClose={onClose}
      onConfirm={onApply}
      header={t(DeploymentsI18nKey.NodePoolModalTitle)}
      confirmLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      size={PopupSize.Lg}
      className="h-[560px]"
      dividers
    >
      <div className="flex h-full flex-col px-6 py-4">
        <NodePoolList pools={pools} selectedId={pendingSelection} onSelect={setPendingSelection} />
      </div>
    </DialConfirmationPopup>
  );
};

export default ContainerNodePoolModal;
