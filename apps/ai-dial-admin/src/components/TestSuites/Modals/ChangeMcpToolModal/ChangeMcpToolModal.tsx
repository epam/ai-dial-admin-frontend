'use client';

import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import McpTool from '@/src/components/TestSuites/Modals/Create/McpTool';
import { buildInitialArguments } from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolDefinition } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TestSuite) => void;
}

const ChangeMcpToolModal: FC<Props> = ({ testSuite, isOpen, onClose, onSave }) => {
  const t = useI18n();
  const [pendingTool, setPendingTool] = useState<ToolDefinition | null>(null);

  const deploymentId = testSuite.mcpDeploymentRef?.id;

  const onToolSelect = useCallback((tool: ToolDefinition) => {
    setPendingTool(tool);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingTool) return;
    const updated: TestSuite = {
      ...testSuite,
      toolRef: {
        name: pendingTool.name,
        description: pendingTool.description,
        inputSchema: pendingTool.inputSchema,
        outputSchema: pendingTool.outputSchema,
      },
      argumentTemplate: {
        arguments: buildInitialArguments(pendingTool.inputSchema),
      },
    };
    onSave(updated);
  }, [pendingTool, testSuite, onSave]);

  if (!deploymentId) return null;

  return createPortal(
    <DialConfirmationPopup
      portalId="ChangeMcpToolModal"
      header={t(TestSuitesI18nKey.ChangeTool)}
      open={isOpen}
      onClose={onClose}
      confirmLabel={t(ButtonsI18nKey.Save)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={handleConfirm}
      disableConfirmButton={!pendingTool}
      size={PopupSize.Lg}
      className="h-[600px]"
    >
      <div className="size-full flex flex-col gap-4 px-6 py-4">
        <div className="flex-1 min-h-0">
          <McpTool deploymentId={deploymentId} initialToolName={testSuite.toolRef?.name} onSelect={onToolSelect} />
        </div>
      </div>
    </DialConfirmationPopup>,
    document.body,
  );
};

export default ChangeMcpToolModal;
