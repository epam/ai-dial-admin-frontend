import { FC, useCallback, useMemo } from 'react';
import InputWithReadonlyParts from '@/src/components/Common/Input/InputWithReadonlyParts';
import { EntitiesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialModel } from '@/src/models/dial/model';
import { useI18n } from '@/src/locales/client';
import { splitEndpoint } from '@/src/components/ModelView/ModelProperties/utils';
import { DialAdapter } from '@/src/models/dial/adapter';

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
        fullValue={model.endpoint}
        title={t(EntitiesI18nKey.Endpoint)}
        postfixPart={postfixPart}
        prefixPart={prefixPart}
        onChange={onChangeEndpoint}
        invalid={!model.endpointDeploymentName}
        errorText={t(ErrorI18nKey.IncorrectModelEndpointAlias)}
      />
    </div>
  );
};

export default ModelEndpoint;
