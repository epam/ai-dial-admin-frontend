import { FC, useCallback, useEffect, useState } from 'react';
import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

import IdControl from '@/src/components/BaseControls/Id/Id';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';

interface Props {
  title: string;
  isModalOpen: boolean;
  container: Container;
  onClose: () => void;
  onApply: (name: Container) => void;
  names: string[];
}

const ContainerDuplicate: FC<Props> = ({ title, isModalOpen, container, onClose, onApply, names }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  const [duplicate, setDuplicate] = useState<Container>({
    ...container,
    name: `${container.name?.slice(0, 31)}-copy`,
    displayName: `${container.displayName} ${t(BasicI18nKey.DuplicateCopyPostfix)}`,
  });
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean>(false);

  const onChangeName = useCallback(
    (container: Container) => {
      const error = names?.includes(container.name || '');
      setIsUniqueNameError(!!error);
      setDuplicate(container);
    },
    [names, setDuplicate],
  );

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setDuplicate({ ...duplicate, displayName: displayName || '' });
    },
    [duplicate, setDuplicate],
  );

  useEffect(() => {
    const error = names?.includes(duplicate.name || '');
    setIsUniqueNameError(!!error);
  }, [duplicate.name, names, t]);

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={title}
      portalId="DuplicateContainerModal"
      open={isModalOpen}
      onConfirm={() => {
        onApply(duplicate);
        onClose();
      }}
      confirmLabel={t(ButtonsI18nKey.Duplicate)}
      disableConfirmButton={!isValid || isUniqueNameError}
      size={PopupSize.Md}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-y-8">
        <IdControl
          entity={duplicate}
          onChangeEntity={onChangeName}
          isUniqueNameError={isUniqueNameError}
          isDeploymentId={true}
        />
        <DisplayNameControl displayName={duplicate.displayName} required onChange={onChangeDisplayName} />
      </div>
    </DialConfirmationPopup>
  );
};

export default ContainerDuplicate;
