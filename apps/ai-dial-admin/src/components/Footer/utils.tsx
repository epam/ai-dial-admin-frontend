import { DialTooltip, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangleFilled } from '@tabler/icons-react';

import { CoreVersionModalI18nKey } from '@/src/constants/i18n';
import { CoreVersions } from '@/src/models/core-version';
import { DefinitionType } from './types';
import { ReactElement } from 'react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

export const getCoreVersionElement = (
  coreVersions: CoreVersions,
  t: (s: string, options?: Record<string, string>) => string,
): ReactElement | undefined => {
  const { autoDetectedVersion, defaultVersion, manuallySetVersion } = coreVersions;
  // autoDetection on
  if (autoDetectedVersion) {
    if (autoDetectedVersion === '-1' && !defaultVersion && !manuallySetVersion) {
      return (
        <DialTooltip tooltip={t(CoreVersionModalI18nKey.NotDetectedTooltip)} triggerClassName="flex-1 cursor-pointer">
          <span className="flex flex-row items-center">
            <span className="bg-red-400 rounded-full size-[10px] mx-1"></span>
            <span>{`${t(CoreVersionModalI18nKey.NotDetected)}`}</span>
          </span>
        </DialTooltip>
      );
    }
    if (autoDetectedVersion === '-1' && defaultVersion && !manuallySetVersion) {
      return (
        <DialTooltip
          tooltip={t(CoreVersionModalI18nKey.DefaultTooltip, { version: defaultVersion })}
          triggerClassName="flex-1 cursor-pointer"
        >
          <span className="flex flex-row items-center">
            <span className="ml-1">[</span>
            <span className="bg-yellow-400 rounded-full size-[10px] mx-1"></span>
            <span>{`${t(CoreVersionModalI18nKey.Default)}]${defaultVersion}`}</span>
          </span>
        </DialTooltip>
      );
    }

    if (manuallySetVersion) {
      const isSameAsAuto = manuallySetVersion === autoDetectedVersion;
      return (
        <DialTooltip
          tooltip={t(
            isSameAsAuto ? CoreVersionModalI18nKey.ManuallySameTooltip : CoreVersionModalI18nKey.ManuallyDiffTooltip,
          )}
          triggerClassName="flex-1 cursor-pointer"
        >
          <span className="flex flex-row items-center">
            <span className="ml-1">[</span>
            {!isSameAsAuto && <IconAlertTriangleFilled className="text-warning-icon mx-1" size={14} />}
            <span>{`${t(CoreVersionModalI18nKey.SetManually)}]${manuallySetVersion}`}</span>
          </span>
        </DialTooltip>
      );
    }

    if (autoDetectedVersion !== '-1') {
      return (
        <DialTooltip
          tooltip={t(CoreVersionModalI18nKey.DetectedTooltip, { version: autoDetectedVersion })}
          triggerClassName="flex-1 cursor-pointer"
        >
          <span>{`[${t(CoreVersionModalI18nKey.Detected)}]${autoDetectedVersion}`}</span>
        </DialTooltip>
      );
    }
  } else {
    // autoDetection off
    if (manuallySetVersion) {
      return <span>{manuallySetVersion}</span>;
    }
    if (!manuallySetVersion && defaultVersion) {
      return <span className="ml-1">{`[${t(CoreVersionModalI18nKey.Default)}]${defaultVersion}`}</span>;
    }
    if (!manuallySetVersion && !defaultVersion) {
      return (
        <span className="flex flex-row items-center">
          <span className="bg-red-400 rounded-full size-[10px] mx-1"></span>
          <span>{`${t(CoreVersionModalI18nKey.Undefined)}`}</span>
        </span>
      );
    }
  }
};

export const getDefinitionTypes = (
  coreVersions: CoreVersions,
  t: (s: string, options?: Record<string, string>) => string,
): SelectOption[] => {
  const { autoDetectedVersion, defaultVersion } = coreVersions;
  const manualDefinition = {
    label: t(CoreVersionModalI18nKey.SetManually),
    value: DefinitionType.MANUAL,
  };
  const autoDefinition = {
    label: t(CoreVersionModalI18nKey.AutoDetection),
    value: DefinitionType.AUTO,
  };
  const defaultDefinition = {
    label: t(CoreVersionModalI18nKey.Default),
    value: DefinitionType.DEFAULT,
  };

  if (autoDetectedVersion) {
    return [autoDefinition, manualDefinition];
  } else if (defaultVersion) {
    return [defaultDefinition, manualDefinition];
  }
  return [manualDefinition];
};

export const getIconBefore = (coreVersions: CoreVersions, definition?: string): ReactElement | null => {
  if (
    coreVersions?.autoDetectedVersion === '-1' &&
    !coreVersions?.defaultVersion &&
    definition === DefinitionType.AUTO
  ) {
    return <span className="inline-block bg-red-400 rounded-full size-[10px] mx-1"></span>;
  }
  if (
    coreVersions?.autoDetectedVersion === '-1' &&
    coreVersions?.defaultVersion &&
    definition === DefinitionType.AUTO
  ) {
    return <span className="inline-block bg-yellow-400 rounded-full size-[10px] mx-1"></span>;
  }
  return null;
};

export const getIconAfter = (
  coreVersions: CoreVersions,
  definition: string | undefined,
  version: string | undefined,
  t: (s: string, options?: Record<string, string>) => string,
): ReactElement | null => {
  if (
    coreVersions?.autoDetectedVersion === '-1' &&
    coreVersions?.defaultVersion &&
    definition === DefinitionType.AUTO
  ) {
    return <span>default</span>;
  }
  if (version && coreVersions?.autoDetectedVersion && definition === DefinitionType.MANUAL) {
    return version === coreVersions?.autoDetectedVersion ? (
      <span className="text-secondary">detected</span>
    ) : (
      <DialTooltip
        tooltip={t(CoreVersionModalI18nKey.ManuallySetDiffTooltip, {
          version: coreVersions?.autoDetectedVersion === '-1' ? '' : coreVersions?.autoDetectedVersion,
        })}
        triggerClassName="flex-1 cursor-pointer"
      >
        <IconAlertTriangleFilled className="text-warning-icon mx-1" {...BASE_BUTTON_ICON_PROPS} />
      </DialTooltip>
    );
  }
  return null;
};
