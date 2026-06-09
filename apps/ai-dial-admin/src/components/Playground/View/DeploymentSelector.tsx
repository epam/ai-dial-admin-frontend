'use client';

import { FC, useCallback, useState } from 'react';

import { DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';

import { PlaygroundI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import SelectDeploymentModal from './SelectDeploymentModal';

interface Props {
  selectedDeploymentId: string | undefined;
  onSelect: (deployment: Deployment) => void;
}

const PlaygroundDeploymentSelector: FC<Props> = ({ selectedDeploymentId, onSelect }) => {
  const t = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | undefined>();

  const onOpen = useCallback(() => setIsModalOpen(true), []);
  const onClose = useCallback(() => setIsModalOpen(false), []);

  const onApply = useCallback(
    (deployment: Deployment) => {
      setSelectedDeployment(deployment);
      onSelect(deployment);
      setIsModalOpen(false);
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col gap-y-1">
      <DialLabel label={t(PlaygroundI18nKey.Deployment)} htmlFor="deployment" />
      <DialInputPopup
        elementId="deployment"
        open={isModalOpen}
        onOpen={onOpen}
        selectedValue={selectedDeployment?.displayName}
        emptyValueText={t(PlaygroundI18nKey.SelectDeployment)}
      >
        <SelectDeploymentModal
          isOpen={isModalOpen}
          selectedDeploymentId={selectedDeploymentId ?? selectedDeployment?.deploymentId}
          onClose={onClose}
          onApply={onApply}
        />
      </DialInputPopup>
    </div>
  );
};

export default PlaygroundDeploymentSelector;
