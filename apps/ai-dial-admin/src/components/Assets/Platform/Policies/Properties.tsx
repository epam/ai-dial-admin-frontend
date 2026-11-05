'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import BudgetFields from '@/src/components/Assets/Platform/Policies/BudgetFields';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { PoliciesI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialPolicyResource } from '@/src/models/dial/resource';

interface Props {
  asset: DialPolicyResource;
  onChange: (asset: DialPolicyResource) => void;
}

const PolicyAssetProperties: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChangeCostObject = useCallback(
    (costObject?: string) => onChange({ ...asset, costObject }),
    [asset, onChange],
  );

  return (
    <>
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <BudgetFields policy={asset} controlClassName={STANDARD_CONTROL_WIDTH} onChange={onChange} />
        <Input
          id="costObject"
          containerClassName={STANDARD_CONTROL_WIDTH}
          labelProps={{ label: t(PoliciesI18nKey.CostObject) }}
          caption={t(PoliciesI18nKey.CostObjectHint)}
          value={asset.costObject ?? ''}
          disabled={isReadOnlyAdmin}
          onChange={onChangeCostObject}
        />
      </div>
    </>
  );
};

export default PolicyAssetProperties;
