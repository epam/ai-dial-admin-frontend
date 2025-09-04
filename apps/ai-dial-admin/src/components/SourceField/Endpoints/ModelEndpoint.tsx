import { FC, useCallback, useMemo } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialModel } from '@/src/models/dial/model';
import { DialAdapter } from '@/src/models/dial/adapter';
import { splitEndpoint } from '@/src/components/ModelView/ModelProperties/utils';
import { useI18n } from '@/src/locales/client';

import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';

interface Props {
  model: DialModel;
  adapters?: DialAdapter[];
  onChange: (model: DialModel) => void;
}

const ModelEndpoint: FC<Props> = ({ model, adapters, onChange }) => {
  const t = useI18n();

  const [prefixPart, postfixPart] = useMemo(() => {
    return splitEndpoint(model, adapters as DialAdapter[]);
  }, [model, adapters]);

  const onChangeEndpoint = useCallback(
    (value: string) => {
      onChange({ ...model, endpointDeploymentName: value });
    },
    [model, onChange],
  );

  return (
    <div className="lg:w-[75%]">
      <InputWithReadonlyParts
        inputId="endpoint"
        value={model.endpointDeploymentName}
        fullValue={`${prefixPart}${model.endpointDeploymentName ? model.endpointDeploymentName + '/' : ''}${postfixPart}`}
        title={t(EntityFieldsI18nKey.endpoint)}
        postfixPart={`/${postfixPart}`}
        prefixPart={prefixPart}
        onChange={onChangeEndpoint}
      />
    </div>
  );
};

export default ModelEndpoint;
