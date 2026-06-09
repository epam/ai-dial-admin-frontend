'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialFormPopup, DialTabs, PopupSize } from '@epam/ai-dial-ui-kit';

import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import { TEMP_FOLDER } from '@/src/constants/file';
import { EVALUATION_DEPLOYMENTS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, MenuI18nKey, PlaygroundI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment, DeploymentType } from '@/src/models/evaluation/deployment';

enum DeploymentTab {
  Applications = 'applications',
  Models = 'models',
}

interface Props {
  isOpen: boolean;
  selectedDeploymentId: string | undefined;
  onClose: () => void;
  onApply: (deployment: Deployment) => void;
}

const SelectDeploymentModal: FC<Props> = ({ isOpen, selectedDeploymentId, onClose, onApply }) => {
  const t = useI18n();
  const [activeTab, setActiveTab] = useState<string>(DeploymentTab.Applications);
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Deployment | undefined>();
  const initialSelectedIdRef = useRef(selectedDeploymentId);
  const hasSwitchedTabRef = useRef(false);

  const tabs = useMemo(
    () => [
      { id: DeploymentTab.Applications, label: t(MenuI18nKey.Applications) },
      { id: DeploymentTab.Models, label: t(MenuI18nKey.Models) },
    ],
    [t],
  );

  const onTabClick = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const onSelect = useCallback((deployment: Deployment) => {
    setSelected(deployment);
  }, []);

  const onSubmit = useCallback(() => {
    if (selected) {
      onApply(selected);
    }
  }, [selected, onApply]);

  useEffect(() => {
    if (!isOpen) return;
    setDeployments([]);
    const type = activeTab === DeploymentTab.Applications ? DeploymentType.Application : DeploymentType.Model;
    setIsLoading(true);
    getDeployments(type).then((res) => {
      if (res?.success) {
        setDeployments(res.response?.filter((d) => d.displayName !== TEMP_FOLDER) || []);
      }
      setIsLoading(false);
    });
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (!initialSelectedIdRef.current || isLoading || deployments === null) return;
    const found = deployments.find((d) => d.deploymentId === initialSelectedIdRef.current);
    if (found) {
      setSelected(found);
      initialSelectedIdRef.current = undefined;
    } else if (activeTab === DeploymentTab.Applications && !hasSwitchedTabRef.current) {
      hasSwitchedTabRef.current = true;
      setActiveTab(DeploymentTab.Models);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployments, isLoading]);

  return (
    <DialFormPopup
      open={isOpen}
      header={t(PlaygroundI18nKey.SelectDeployment)}
      portalId="selectDeployment"
      size={PopupSize.Lg}
      className="h-[600px]"
      onClose={onClose}
      onCancel={onClose}
      onSubmit={onSubmit}
      disableSubmitButton={!selected}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex flex-col px-6 py-4 h-full gap-4">
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onTabClick} />
        <div className="flex-1 min-h-0">
          <RadioSelectGrid
            isLoading={isLoading}
            columnDefs={EVALUATION_DEPLOYMENTS_COLUMNS}
            data={deployments}
            idField="deploymentId"
            onSelect={onSelect}
            selectedId={selected?.deploymentId}
            emptyTitle={t(EntitiesI18nKey.NoApplications)}
          />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default SelectDeploymentModal;
