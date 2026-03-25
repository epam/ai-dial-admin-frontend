'use client';

import { FC, useMemo } from 'react';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';

interface Props {
  importMode: TestCaseImportMode;
  conflictStrategy: TestCaseConflictStrategy;
  onImportModeChange: (value: TestCaseImportMode) => void;
  onConflictStrategyChange: (value: TestCaseConflictStrategy) => void;
}

const ImportOptionsStep: FC<Props> = ({
  importMode,
  conflictStrategy,
  onImportModeChange,
  onConflictStrategyChange,
}) => {
  const t = useI18n();
  const importModeOptions: RadioButtonWithContent[] = useMemo(
    () => [
      {
        id: TestCaseImportMode.OVERRIDE,
        name: t(TestSuitesI18nKey.ImportModeOverride),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ImportModeOverrideDesc)}</div>,
      },
      {
        id: TestCaseImportMode.APPEND,
        name: t(TestSuitesI18nKey.ImportModeAppend),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ImportModeAppendDesc)}</div>,
      },
      {
        id: TestCaseImportMode.MERGE,
        name: t(TestSuitesI18nKey.ImportModeMerge),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ImportModeMergeDesc)}</div>,
      },
    ],
    [t],
  );

  const conflictStrategyOptions: RadioButtonWithContent[] = useMemo(
    () => [
      {
        id: TestCaseConflictStrategy.FAIL,
        name: t(TestSuitesI18nKey.ConflictStrategyFail),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ConflictStrategyFailDesc)}</div>,
      },
      {
        id: TestCaseConflictStrategy.SKIP,
        name: t(TestSuitesI18nKey.ConflictStrategySkip),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ConflictStrategySkipDesc)}</div>,
      },
      {
        id: TestCaseConflictStrategy.OVERRIDE,
        name: t(TestSuitesI18nKey.ConflictStrategyOverride),
        content: <div className="dial-tiny-text ml-[33px]">{t(TestSuitesI18nKey.ConflictStrategyOverrideDesc)}</div>,
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h3 className="mb-4">{t(TestSuitesI18nKey.ImportMode)}</h3>
        <DialRadioGroup
          orientation={RadioGroupOrientation.Column}
          radioButtons={importModeOptions}
          activeRadioButton={importMode}
          elementId="import-mode"
          onChange={(value) => onImportModeChange(value as TestCaseImportMode)}
        />
      </div>

      <div className="flex flex-col">
        <h3 className="mb-4">{t(TestSuitesI18nKey.OnNameCollision)}</h3>
        <DialRadioGroup
          orientation={RadioGroupOrientation.Column}
          radioButtons={conflictStrategyOptions}
          activeRadioButton={conflictStrategy}
          elementId="conflict-strategy"
          onChange={(value) => onConflictStrategyChange(value as TestCaseConflictStrategy)}
        />
      </div>
    </div>
  );
};

export default ImportOptionsStep;
