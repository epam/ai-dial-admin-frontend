import { FC } from 'react';

import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';
import { AliasI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AliasHealthReason, ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { formatValidationWarnings } from '@/src/utils/entities/validation-warnings';

interface Props {
  entity: DialAliasResource;
  /** Core's health entry for this alias, when it lists one. */
  issue?: ConfigHealthSkippedEntity;
}

/**
 * An alias that Core reads but cannot serve: a stored body Core ignores (it comes back `invalid`, with the
 * fields at fault), or one it keeps whose target is missing or no longer fits (reported by the health endpoint).
 * Either way an admin would otherwise see a saved alias that silently never answers. Never blocks editing.
 */
const InvalidAliasBanner: FC<Props> = ({ entity, issue }) => {
  const t = useI18n();
  const isInvalid = entity._metadata?.status === DialModelResourceStatus.Invalid;
  const warnings = isInvalid ? formatValidationWarnings(entity._metadata?.validationWarnings) : '';
  const reasonMessages: Record<string, string> = {
    [AliasHealthReason.TargetMissing]: t(AliasI18nKey.TargetMissing),
    [AliasHealthReason.TargetIncompatible]: t(AliasI18nKey.TargetIncompatible),
  };
  // Any other reason is Core's own text, shown as it came.
  const reason = issue ? (reasonMessages[issue.reason] ?? issue.reason) : '';
  const message = [warnings, reason].filter(Boolean).join(' ');

  if (!isInvalid && !issue) {
    return null;
  }

  return <EntityBanner title={t(AliasI18nKey.InvalidBannerTitle)} message={message} />;
};

export default InvalidAliasBanner;
