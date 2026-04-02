'use client';

import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import McpTargets from '@/src/components/TestSuites/Modals/Create/McpTargets';
import McpTool from '@/src/components/TestSuites/Modals/Create/McpTool';
import { buildInitialArguments } from '@/src/components/TestSuites/ArgumentTemplate/utils';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, ToolDefinition } from '@/src/models/evaluation/deployment';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TestSuite) => void;
}

const ChangeMcpToolModal: FC<Props> = ({ testSuite, isOpen, onClose, onSave }) => {
  const t = useI18n();
  const [pendingDeployment, setPendingDeployment] = useState<Deployment | null>(null);
  const [pendingTool, setPendingTool] = useState<ToolDefinition | null>(null);

  const currentDeploymentId = testSuite.mcpDeploymentRef?.id;
  const effectiveDeploymentId = pendingDeployment?.deploymentId || currentDeploymentId;
  const effectiveDeploymentType = pendingDeployment?.$type || testSuite.mcpDeploymentRef?.type;

  const onDeploymentSelect = useCallback(
    (deployment: Deployment) => {
      setPendingDeployment(deployment);
      if (deployment.deploymentId !== currentDeploymentId) {
        setPendingTool(null);
      }
    },
    [currentDeploymentId],
  );

  const onToolSelect = useCallback((tool: ToolDefinition) => {
    setPendingTool(tool);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!pendingTool) return;
    const deployment = pendingDeployment;
    const updated: TestSuite = {
      ...testSuite,
      mcpDeploymentRef: deployment
        ? {
            id: deployment.deploymentId,
            type: deployment.$type,
            name: deployment.displayName || deployment.deploymentId,
          }
        : testSuite.mcpDeploymentRef,
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
  }, [pendingDeployment, pendingTool, testSuite, onSave]);

  const initialToolName =
    pendingDeployment && pendingDeployment.deploymentId === currentDeploymentId ? testSuite.toolRef?.name : undefined;

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
      className="h-[800px]"
    >
      <div className="size-full flex flex-col gap-4 px-6 py-4">
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <McpTargets initialDeploymentId={effectiveDeploymentId} onSelect={onDeploymentSelect} />
          </div>
          {effectiveDeploymentId && effectiveDeploymentType && (
            <div className="flex-1 min-h-0">
              <McpTool
                deploymentType={effectiveDeploymentType}
                deploymentId={effectiveDeploymentId}
                initialToolName={initialToolName}
                onSelect={onToolSelect}
              />
            </div>
          )}
        </div>
      </div>
    </DialConfirmationPopup>,
    document.body,
  );
};

export default ChangeMcpToolModal;
