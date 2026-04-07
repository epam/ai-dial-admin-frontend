'use client';

import { FC, useCallback, useState } from 'react';

import { ButtonAppearance, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconEdit } from '@tabler/icons-react';

import ArgumentTemplate from '@/src/components/TestSuites/ArgumentTemplate/ArgumentTemplate';
import ChangeMcpToolModal from '@/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal';
import TryOutButton from '@/src/components/TestSuites/RequestTemplate/components/TryOutButton';
import McpToolSchema from '@/src/components/TestSuites/View/McpToolSchema';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ArgumentTemplate as ArgumentTemplateModel, TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const McpMethodContent: FC<Props> = ({ testSuite, onChange, isSkipRefresh }) => {
  const t = useI18n();
  const [isChangeToolModalOpen, setIsChangeToolModalOpen] = useState(false);
  const { sidebar } = useAppContext();
  const isTryOutOpen = sidebar.show;

  const onArgumentTemplateChange = useCallback(
    (argumentTemplate: ArgumentTemplateModel, isSkipRefresh?: boolean) => {
      onChange({ ...testSuite, argumentTemplate }, isSkipRefresh);
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
            onChange={onArgumentTemplateChange}
            isSkipRefresh={isSkipRefresh}
          />
        )}

        <McpToolSchema testSuite={testSuite} onChangeTestSuite={onChange} isSkipRefresh={isSkipRefresh} />
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
