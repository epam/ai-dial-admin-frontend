'use client';

import { FC, useEffect } from 'react';

import { Notification, NotificationType, NotificationVariant } from '@epam/ai-dial-ui-kit';

import SchemaManager from '@/src/components/TestSuites/TestCaseSchema/SchemaManager';
import { DatasetsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getDuplicateFieldNames } from '@/src/utils/evaluation/schema-fields';

interface Props {
  dataset: Dataset;
  isSkipRefresh?: boolean;
  isReadOnly?: boolean;
  onChange: (dataset: Dataset, isSkipRefresh?: boolean) => void;
}

const DatasetSchemaTab: FC<Props> = ({ dataset, isSkipRefresh, isReadOnly = false, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const onChangeSchema = (schema: TestCaseSchema[], skipRefresh?: boolean) => {
    onChange({ ...dataset, testCaseSchema: schema }, skipRefresh);
  };

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'testCaseSchema',
      isValid:
        !dataset.testCaseSchema?.some((item) => !item.name || !item.type) &&
        getDuplicateFieldNames(dataset.testCaseSchema).size === 0,
    });
  }, [dataset.testCaseSchema, dispatch]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {isReadOnly && (
        <Notification
          type={NotificationType.SectionMessage}
          variant={NotificationVariant.Warning}
          title={t(DatasetsI18nKey.SchemaReadOnlyTitle)}
          message={t(DatasetsI18nKey.SchemaReadOnlyMessage)}
        />
      )}
      <div className="flex-1 min-h-0">
        <SchemaManager
          testCaseSchema={dataset.testCaseSchema || []}
          onChangeTestCaseSchema={onChangeSchema}
          isSkipRefresh={isSkipRefresh}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
};

export default DatasetSchemaTab;
