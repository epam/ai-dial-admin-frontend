'use client';

import { DialInput, DialSwitch } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import AccessRestrictionField from '@/src/components/Keys/View/Properties/AccessRestrictionField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';

interface Props {
  asset: DialKeyResource;
  originalAsset: DialKeyResource;
  onChange: (asset: DialKeyResource) => void;
}

const KeyAssetProperties: FC<Props> = ({ asset, originalAsset, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeProject = useCallback(
    (project?: string) => {
      onChange({ ...asset, project: project || '' });
    },
    [asset, onChange],
  );

  const onChangeSecured = useCallback(
    (secured: boolean) => {
      onChange({ ...asset, secured });
    },
    [asset, onChange],
  );

  const onChangeAccessRestriction = useCallback(
    (allowedIpAddressRanges?: string[]) => {
      onChange({ ...asset, allowedIpAddressRanges });
    },
    [asset, onChange],
  );

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <DialInput
          id="project"
          labelProps={{ label: t(EntityFieldsI18nKey.project) }}
          placeholder={t(EntityPlaceholdersI18nKey.Project)}
          value={asset.project}
          onChange={onChangeProject}
          containerClassName={STANDARD_CONTROL_WIDTH}
          disabled={isReadOnlyAdmin}
        />

        <DialSwitch
          isOn={!!asset.secured}
          label={t(EntityFieldsI18nKey.secured)}
          switchId="secured"
          onChange={onChangeSecured}
          disabled={isReadOnlyAdmin}
        />

        <AccessRestrictionField
          elementId="ip-access-restriction"
          entity={asset}
          originalEntity={originalAsset}
          onChange={onChangeAccessRestriction}
          disabled={isReadOnlyAdmin}
          showMaskNotice
        />
      </div>
    </div>
  );
};

export default KeyAssetProperties;
