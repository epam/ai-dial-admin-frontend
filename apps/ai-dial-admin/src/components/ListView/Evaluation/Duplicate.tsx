import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { ButtonsI18nKey } from '@/src/constants/i18n';
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

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(getCloneTitle(ApplicationRoute.TestSuites, t))}
      portalId="DuplicateTestSuite"
      open={isModalOpen}
      onSubmit={() => onDuplicate(clonedEntity)}
      onCancel={onClose}
      disableSubmitButton={!isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-y-8">
        <DisplayNameControl
          displayName={clonedEntity.name}
          onChange={(name?: string) => setEntity({ ...clonedEntity, name })}
          required
        />
        <DescriptionControl
          entity={clonedEntity}
          onChangeEntity={(entity: TestSuite) => setEntity({ ...clonedEntity, description: entity.description })}
        />
      </div>
    </DialFormPopup>
  );
};

export default DuplicateTestSuite;
