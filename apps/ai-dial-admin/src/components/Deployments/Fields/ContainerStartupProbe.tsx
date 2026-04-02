import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { EntityCaptionsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { isEditDisabled, isErrorPresent } from '@/src/utils/deployments/containers';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { DEFAULT_PROBE_CONFIG } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import Endpoint from '@/src/components/Deployments/Fields/ContainerStartupProbe/Endpoint';
import AdvancedTiming from '@/src/components/Deployments/Fields/ContainerStartupProbe/AdvancedTiming';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const ContainerStartupProbe: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const { errorFields, isValid } = useSaveValidationContext();

  const [isSectionInvalid, setSectionInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setSectionInvalid(
        isErrorPresent(errorFields, [
          'port',
          'path',
          'initialDelaySeconds',
          'periodSeconds',
          'timeoutSeconds',
          'failureThreshold',
        ]),
      );
    } else {
      setSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  const toggleCustomStartupProbe = useCallback(
    (enabled: boolean) => {
      const updated = { ...container };
      updated.probeProperties = { ...(updated.probeProperties || DEFAULT_PROBE_CONFIG), enabled };
      setContainer(updated);
    },
    [container, setContainer],
  );

  const onChangeEnabled = useCallback(() => {
    const currentEnabled = container.probeProperties?.enabled || false;
    toggleCustomStartupProbe(!currentEnabled);
  }, [container.probeProperties?.enabled, toggleCustomStartupProbe]);

  const isDisabled = useMemo(() => disabled ?? isEditDisabled(container), [container, disabled]);

  return (
    <Accordion title={t(EntityFieldsI18nKey.StartupProbe)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-4">
        <DialSwitch
          switchId="startup-probe"
          label={t('Enable startup probe')}
          isOn={container.probeProperties?.enabled || false}
          onChange={onChangeEnabled}
          disabled={isDisabled}
          caption={t(EntityCaptionsI18nKey.ProbeEnableCustom)}
        />
        {container.probeProperties?.enabled && (
          <>
            <Endpoint container={container} setContainer={setContainer} disabled={isDisabled} />
            <AdvancedTiming container={container} setContainer={setContainer} disabled={isDisabled} />
          </>
        )}
      </div>
    </Accordion>
  );
};

export default ContainerStartupProbe;
