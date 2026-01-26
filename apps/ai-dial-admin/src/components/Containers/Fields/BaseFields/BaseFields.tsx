import { FC, useCallback, useEffect, useState } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getErrorForDisplayName, getErrorForName } from '@/src/utils/validation/name-error';
import { isEditDisabled } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import Maintainer from '@/src/components/EntityMainProperties/BaseProperties/Maintainer';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  isModal?: boolean;
  names?: string[];
}

const BaseFields: FC<Props> = ({ container, setContainer, names, isModal = false }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [isUniqueNameError, setIsUniqueNameError] = useState<boolean>(false);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: !getErrorForName(container.name, names, t),
    });
    dispatch({
      type: ValidationActionType.SetField,
      field: 'displayName',
      isValid: !getErrorForDisplayName(container.displayName, true, t),
    });
  }, [container.name, dispatch, isModal, names, t, container.displayName]);

  const onChangeName = useCallback(
    (container: Container) => {
      const error = names?.includes(container.name);
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !error });
      setIsUniqueNameError(!!error);
      setContainer(container);
    },
    [dispatch, names, setContainer],
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
          disabled={isEditDisabled(container)}
        />
      )}
      <DisplayNameControl
        displayName={container.displayName}
        required={true}
        onChange={onChangeDisplayName}
        isFullWidth={isModal}
        disabled={isEditDisabled(container)}
      />
      <DescriptionControl
        entity={container}
        onChangeEntity={setContainer}
        isFullWidth={isModal}
        disabled={isEditDisabled(container)}
      />
      {!isModal && <Maintainer entity={container} onChangeEntity={setContainer} disabled={isEditDisabled(container)} />}
    </div>
  );
};

export default BaseFields;
