import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import SchemaManager from '../TestCaseSchema/SchemaManager';

interface Props {
  isModalOpen: boolean;
  initialSchema: TestCaseSchema[];
  onClose: () => void;
  onApply: (schema: TestCaseSchema[]) => void;
}

const TestCasesSchemaModal: FC<Props> = ({ isModalOpen, initialSchema, onClose, onApply }) => {
  const t = useI18n();

  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [schema, setSchema] = useState(initialSchema);

  const onChangeTestCaseSchema = useCallback((schema: TestCaseSchema[], skipRefresh = false) => {
    setIsSkipRefresh(skipRefresh);
    setSchema(schema);
  }, []);

  return (
    <DialConfirmationPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.TestCaseSchema)}
      portalId="SchemaManagerModal"
      open={isModalOpen}
      onConfirm={() => {
        onApply(schema);
        onClose();
      }}
      confirmLabel={t(ButtonsI18nKey.Apply)}
      size={PopupSize.Lg}
      disableConfirmButton={schema.some((item) => !item.name || !item.type)}
    >
      <div className="flex flex-col h-full overflow-auto px-6 py-4 gap-y-8">
        <SchemaManager
          testCaseSchema={schema}
          onChangeTestCaseSchema={onChangeTestCaseSchema}
          isSkipRefresh={isSkipRefresh}
        />
      </div>
    </DialConfirmationPopup>
  );
};

export default TestCasesSchemaModal;
