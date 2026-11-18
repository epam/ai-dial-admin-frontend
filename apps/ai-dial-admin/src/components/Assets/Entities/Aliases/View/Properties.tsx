'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import IntroControl from '@/src/components/BaseControls/Intro';
import { AliasI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';
import InvalidAliasBanner from './InvalidAliasBanner';

interface Props {
  asset: DialAliasResource;
  healthIssue?: ConfigHealthSkippedEntity;
  onChange: (asset: DialAliasResource) => void;
}

/**
 * Properties tab of an alias: its name and how it is listed. What it forwards to and who may use it have their
 * own tabs; everything else a listing shows (pricing, features, interfaces) is the target's.
 */
const AliasProperties: FC<Props> = ({ asset, healthIssue, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const name = asset._metadata?.name ?? asset.name ?? '';

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="mt-8 flex flex-col gap-y-8">
        <InvalidAliasBanner entity={asset} issue={healthIssue} />
        <Input
          id="alias-name"
          labelProps={{ label: t(EntityFieldsI18nKey.id) }}
          value={name}
          containerClassName={STANDARD_CONTROL_WIDTH}
          disabled
        />
        <DisplayNameControl
          required
          isFullWidth={false}
          displayName={asset.displayName}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
        <Input
          id="alias-display-version"
          labelProps={{ label: t(AliasI18nKey.DisplayVersion) }}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayVersion)}
          value={asset.displayVersion ?? ''}
          containerClassName={STANDARD_CONTROL_WIDTH}
          disabled={isReadOnlyAdmin}
          onChange={(displayVersion) => onChange({ ...asset, displayVersion: displayVersion || undefined })}
        />
        <DescriptionControl isFullWidth={false} entity={asset} onChangeEntity={onChange} />
        <IntroControl isFullWidth={false} entity={asset} onChangeEntity={onChange} />
        <IconControl iconUrl={asset.iconUrl} onChange={(iconUrl) => onChange({ ...asset, iconUrl })} />
      </div>
    </div>
  );
};

export default AliasProperties;
