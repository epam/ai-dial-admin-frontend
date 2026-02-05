'use client';

import { DialSwitch } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import Authentication from '../Auth/Authentication';

interface Props {
  selectedToolset: Toolset;
  names: string[];
  onChangeToolset: (toolset: Toolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  const t = useI18n();

  return (
    <div className="pt-8 gap-y-8 flex flex-col">
      <DeploymentProperties
        entity={selectedToolset}
        onChangeEntity={onChangeToolset}
        names={names}
        isEntityImmutable={true}
        view={ApplicationRoute.Toolsets}
      />
      <DialSwitch
        isOn={selectedToolset.forwardPerRequestKey}
        label={t(EntityFieldsI18nKey.forwardPerRequestKey)}
        switchId="forwardPerRequestKey"
        onChange={(value: boolean) => {
          onChangeToolset({ ...selectedToolset, forwardPerRequestKey: value });
        }}
      />
      <MaxRetryAttempts entity={selectedToolset} onChangeEntity={onChangeToolset} />
      <Authentication toolset={selectedToolset} view={ApplicationRoute.Toolsets} onChange={onChangeToolset} />
    </div>
  );
};

export default ToolsetProperties;
