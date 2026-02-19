import { FC, useCallback } from 'react';
import { DialAdapter } from '@/src/models/dial/adapter';
import { EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ReadonlyField from '@/src/components/Common/ReadonlyField/ReadonlyField';

interface Props {
  entity: DialAdapter;
  onChange: (model: DialAdapter) => void;
  prefix?: string;
  isModal?: boolean;
}

const AdapterEndpoint: FC<Props> = ({ entity, onChange, isModal, prefix }) => {
  const t = useI18n();

  const onChangeEndpoint = useCallback(
    (baseEndpoint?: string) => {
      onChange({ ...entity, baseEndpoint });
    },
    [onChange, entity],
  );

  return (
    <div className="w-full flex flex-col gap-y-8">
      {prefix ? (
        <ReadonlyField
          containerClassName={STANDARD_CONTROL_WIDTH}
          elementId="endpoint"
          title={t(EntitiesI18nKey.AdapterEndpoint)}
          value={prefix}
        />
      ) : (
        <EndpointControl
          id="baseEndpoint"
          required={true}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          fieldTitle={t(EntityFieldsI18nKey.baseEndpoint)}
          endpoint={entity.baseEndpoint}
          isFullWidth={isModal}
          onChange={onChangeEndpoint}
        />
      )}
    </div>
  );
};

export default AdapterEndpoint;
