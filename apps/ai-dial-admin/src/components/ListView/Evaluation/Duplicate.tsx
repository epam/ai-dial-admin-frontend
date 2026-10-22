import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useState } from 'react';

import { getTestSuiteByName } from '@/src/app/[lang]/test-suites/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  entity: TestSuite;
  isModalOpen: boolean;
  onClose: () => void;
  onDuplicate: (entity: TestSuite) => void;
}

const DuplicateTestSuite: FC<Props> = ({ entity, isModalOpen, onClose, onDuplicate }) => {
  const t = useI18n();

  const [clonedEntity, setEntity] = useState<TestSuite>({
    name: getClonedEntityName(entity.name),
    description: '',
  });
  const { isValid } = useSaveValidationContext();
  const [nameExistsError, setNameExistsError] = useState<string>();
  const [isCheckingName, setIsCheckingName] = useState(false);

  const onNameChange = useCallback(
    (name?: string) => {
      setNameExistsError(undefined);
      setEntity({ ...clonedEntity, name });
    },
    [clonedEntity],
  );

  const onCheckAndDuplicate = useCallback(async () => {
    if (!clonedEntity.name) return;

    setIsCheckingName(true);
    const res = await getTestSuiteByName(clonedEntity.name);
    setIsCheckingName(false);

    if (res && res.content?.length > 0) {
      setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
    } else {
      onDuplicate(clonedEntity);
    }
  }, [clonedEntity, onDuplicate, t]);

  return (
    <Popup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.TestSuites, t))}
      portalId="DuplicateTestSuite"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Duplicate),
        isSubmitDisabled: !isValid || isCheckingName,
        onCancel: onClose,
        onSubmit: () => onCheckAndDuplicate(),
      })}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        <DisplayNameControl
          displayName={clonedEntity.name}
          onChange={onNameChange}
          externalError={nameExistsError}
          required
        />
        <DescriptionControl
          entity={clonedEntity}
          onChangeEntity={(entity: TestSuite) => setEntity({ ...clonedEntity, description: entity.description })}
        />
      </div>
    </Popup>
  );
};

export default DuplicateTestSuite;
