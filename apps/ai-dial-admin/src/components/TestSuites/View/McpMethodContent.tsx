'use client';

import { FC, useCallback, useState } from 'react';

import { ButtonAppearance, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';

import ArgumentTemplate from '@/src/components/TestSuites/ArgumentTemplate/ArgumentTemplate';
import ChangeMcpToolModal from '@/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal';
import TryOutButton from '@/src/components/TestSuites/RequestTemplate/components/TryOutButton';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ArgumentTemplate as ArgumentTemplateModel, TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
}

const McpMethodContent: FC<Props> = ({ testSuite, onChange }) => {
  const t = useI18n();
  const [isChangeToolModalOpen, setIsChangeToolModalOpen] = useState(false);
  const { sidebar } = useAppContext();
  const isTryOutOpen = sidebar.show;

  const onArgumentTemplateChange = useCallback(
    (argumentTemplate: ArgumentTemplateModel) => {
      onChange({ ...testSuite, argumentTemplate }, true);
    },
    [testSuite, onChange],
  );

  const onChangeToolSave = useCallback(
    (updated: TestSuite) => {
      onChange(updated);
      setIsChangeToolModalOpen(false);
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row gap-2 items-center">
            {testSuite.mcpDeploymentRef && (
              <span className="px-2 py-1 rounded bg-secondary/10 text-sm">{testSuite.mcpDeploymentRef.name}</span>
            )}
            {testSuite.toolRef && (
              <span className="px-2 py-1 rounded bg-accent-tertiary/10 text-sm">{testSuite.toolRef.name}</span>
            )}
          </div>
          <div className="flex flex-row gap-3 items-center">
            <DialPrimaryButton
              iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
              appearance={ButtonAppearance.Ghost}
              label={t(TestSuitesI18nKey.ChangeTool)}
              disabled={isTryOutOpen}
              onClick={() => setIsChangeToolModalOpen(true)}
            />
            <TryOutButton testSuite={testSuite} />
          </div>
        </div>

        {testSuite.toolRef && (
          <ArgumentTemplate
            toolRef={testSuite.toolRef}
            argumentTemplate={testSuite.argumentTemplate || { arguments: {} }}
            testCaseSchema={testSuite.testCaseSchema}
            onChange={onArgumentTemplateChange}
          />
        )}

        {testSuite.toolRef?.outputSchema && (
          <div className="flex flex-col gap-2 border border-primary rounded p-4">
            <h3>{t(TestSuitesI18nKey.ToolOutputSchema)}</h3>
            <div className="h-[200px]">
              <EntityJsonEditor entity={testSuite.toolRef.outputSchema} readonly={true} />
            </div>
          </div>
        )}
      </div>

      {isChangeToolModalOpen && (
        <ChangeMcpToolModal
          testSuite={testSuite}
          isOpen={isChangeToolModalOpen}
          onClose={() => setIsChangeToolModalOpen(false)}
          onSave={onChangeToolSave}
        />
      )}
    </div>
  );
};

export default McpMethodContent;
