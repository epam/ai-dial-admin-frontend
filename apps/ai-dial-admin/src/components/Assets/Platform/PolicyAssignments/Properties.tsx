'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import PolicySelector from '@/src/components/Assets/Platform/PolicyAssignments/PolicySelector';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { EntityFieldsI18nKey, PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { getCostObjectFromFolder } from '@/src/utils/policies/path';
import { getExpiresAtError } from '@/src/utils/policies/validation';

interface Props {
  asset: DialPolicyAssignmentResource;
  onChange: (asset: DialPolicyAssignmentResource) => void;
}

const PolicyAssignmentAssetProperties: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const costObject = getCostObjectFromFolder(asset._metadata?.folderId) || asset.costObject || '';
  const expiresAtError = getExpiresAtError(asset.expiresAt);

  return (
    <>
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <Input
          id="costObject"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(PolicyAssignmentsI18nKey.CostObject) }}
          caption={t(PolicyAssignmentsI18nKey.CostObjectDerived)}
          value={costObject}
          disabled
        />
        <PolicySelector
          value={asset.policy}
          costObject={costObject}
          className={STANDARD_CONTROL_WIDTH}
          error={asset.policy ? undefined : t(PolicyAssignmentsI18nKey.PolicyRequired)}
          onChange={(policy) => onChange({ ...asset, policy })}
        />
        <Input
          id="source"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(PolicyAssignmentsI18nKey.Source) }}
          value={asset.source ?? ''}
          disabled={isReadOnlyAdmin}
          onChange={(source) => onChange({ ...asset, source })}
        />
        <Input
          id="ticket"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(PolicyAssignmentsI18nKey.Ticket) }}
          value={asset.ticket ?? ''}
          disabled={isReadOnlyAdmin}
          onChange={(ticket) => onChange({ ...asset, ticket })}
        />
        <Input
          id="expiresAt"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(PolicyAssignmentsI18nKey.ExpiresAt) }}
          placeholder="2027-01-01T00:00:00Z"
          value={asset.expiresAt ?? ''}
          disabled={isReadOnlyAdmin}
          error={expiresAtError ? t(expiresAtError) : undefined}
          invalid={!!expiresAtError}
          onChange={(expiresAt) => onChange({ ...asset, expiresAt })}
        />
        <Input
          id="description"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          value={asset.description ?? ''}
          disabled={isReadOnlyAdmin}
          onChange={(description) => onChange({ ...asset, description })}
        />
      </div>
    </>
  );
};

export default PolicyAssignmentAssetProperties;
