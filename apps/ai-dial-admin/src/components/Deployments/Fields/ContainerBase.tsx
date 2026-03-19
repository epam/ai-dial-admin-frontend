import { FC, useCallback, useState } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { isEditDisabled } from '@/src/utils/deployments/containers';

import DescriptionControl from '@/src/components/BaseControls/Description';
import Maintainer from '@/src/components/BaseControls/Maintainer';
import TopicsControl from '@/src/components/BaseControls/Topics';
import IdControl from '@/src/components/BaseControls/Id/Id';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  names?: string[];
  disabled?: boolean;
}

const ContainerBase: FC<Props> = ({ container, setContainer, names, isModal = false, disabled }) => {
  const isDisabled = disabled ?? isEditDisabled(container);
  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean>(false);

  const onChangeName = useCallback(
    (container: Container) => {
      const error = names?.includes(container.name || '');
      setIsUniqueNameError(!!error);
      setContainer(container);
    },
    [names, setContainer],
  );

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      setContainer({ ...container, displayName: displayName || '' });
    },
    [container, setContainer],
  );

  return (
    <div className="flex flex-col gap-y-8">
      {isModal && (
        <IdControl
          entity={container}
          onChangeEntity={onChangeName}
          isUniqueNameError={isUniqueNameError}
          isDeploymentId={true}
          disabled={isDisabled}
        />
      )}
      <DisplayNameControl
        displayName={container.displayName}
        required
        onChange={onChangeDisplayName}
        isFullWidth={isModal}
        disabled={isDisabled}
      />
      <DescriptionControl
        entity={container}
        onChangeEntity={setContainer}
        isFullWidth={isModal}
        disabled={isDisabled}
      />
      {!isModal && (
        <>
          <Maintainer entity={container} onChangeEntity={setContainer} disabled={isDisabled} />
          <TopicsControl entity={container} onChange={setContainer} disabled={isDisabled} />
        </>
      )}
    </div>
  );
};

export default ContainerBase;
