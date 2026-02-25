'use client';

import { FC, useCallback, useEffect } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { getErrorForDisplayName } from '@/src/utils/validation/name-error';
import TopicsControl from '@/src/components/BaseControls/Topics';
import SourceField from '@/src/components/SourceField/SourceField';
import { ApplicationRoute } from '@/src/types/routes';
import { getSourceItems } from '@/src/components/SourceField/constants';
import { useAppContext } from '@/src/context/AppContext';
import { getAdapterContainers } from '@/src/app/actions/deployments';
import { EntitiesI18nKey } from '@/src/constants/i18n';

interface Props {
  entity: DialAdapter;
  names?: string[];
  isModal?: boolean;
  onChangeAdapter: (adapter: DialAdapter) => void;
}

const AdapterProperties: FC<Props> = ({ entity, names, onChangeAdapter, isModal }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const { featureFlags } = useAppContext();

  const onValidateDisplayName = useCallback(
    (displayName?: string) => {
      const error = getErrorForDisplayName(displayName, true, t);
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !error });
    },
    [dispatch, t],
  );

  useEffect(() => {
    if (!isModal) {
      onValidateDisplayName(entity.displayName);
    }
  }, [entity.displayName, isModal, onValidateDisplayName]);

  const onChangeDisplayName = useCallback(
    (displayName?: string) => {
      onChangeAdapter({ ...entity, displayName });
    },
    [onChangeAdapter, entity],
  );

  return (
    <div className="h-full flex flex-col gap-y-8">
      {isModal && <IdControl entity={entity} names={names} onChangeEntity={onChangeAdapter} />}

      <DisplayNameControl
        displayName={entity.displayName}
        required={true}
        onChange={onChangeDisplayName}
        isFullWidth={isModal}
      />

      <DescriptionControl entity={entity} onChangeEntity={onChangeAdapter} isFullWidth={isModal} />

      <SourceField
        id="sourceType"
        label={t(EntitiesI18nKey.SourceType)}
        view={ApplicationRoute.Adapters}
        entity={entity}
        onChange={onChangeAdapter}
        sourceItems={getSourceItems(ApplicationRoute.Adapters, featureFlags.deploymentsEnabled)}
        getContainers={getAdapterContainers}
        isModal={isModal}
      />

      {!isModal && <TopicsControl entity={entity} onChange={onChangeAdapter} />}
    </div>
  );
};

export default AdapterProperties;
