'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import { removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import { createModel } from '@/src/app/[lang]/models/actions';
import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModelType } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getAdapterTabs } from '@/src/utils/tabs/utils';
import AdapterProperties from './AdapterProperties';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

interface Props {
  etag: string;
  modelsNames: string[];
  originalAdapter: DialAdapter;
}

const AdapterView: FC<Props> = ({ originalAdapter, modelsNames, etag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs = getAdapterTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAdapter, setSelectedAdapter] = useState(cloneDeep(originalAdapter));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [key, setKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSelectedAdapter(cloneDeep(originalAdapter));
  }, [originalAdapter]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalAdapter, selectedAdapter));
  }, [selectedAdapter, originalAdapter]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedAdapter(originalAdapter);
  }, [isJsonEditorEnabled, originalAdapter, dispatch]);

  const onChangeAdapter = useCallback(
    (entity: DialAdapter) => {
      setSelectedAdapter(entity);
    },
    [setSelectedAdapter],
  );

  const onToggleJsonEditor = useCallback(() => {
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  const onSave = useCallback(() => {
    getReqRef.current(updateAdapter, selectedAdapter, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Adapters, t),
            getUpdateNotificationDescription(ApplicationRoute.Adapters, selectedAdapter.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedAdapter, etag, showNotification, t, router]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        <Tabs
          tabs={tabs}
          isEditorEnabled={isJsonEditorEnabled}
          activeTab={activeTab}
          onChangeActiveTab={onChangeActiveTab}
        />

        <HeaderButtons
          view={ApplicationRoute.Adapters}
          entity={selectedAdapter}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          onRemove={removeAdapter}
          isEditorEnabled={isJsonEditorEnabled}
          onToggleEditor={onToggleJsonEditor}
        >
          <DialNeutralButton
            label={`${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.Model)}`}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setIsModalOpen(true)}
          />
        </HeaderButtons>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedAdapter}
            setSelectedEntity={setSelectedAdapter}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="flex flex-col">
                <EntityHeader entity={selectedAdapter} />
                <div className="flex-1 min-h-0 pt-8">
                  <AdapterProperties
                    entity={selectedAdapter}
                    onChangeAdapter={onChangeAdapter}
                    isEntityImmutable={true}
                  />
                </div>
              </div>
            )}
            {activeTab === EntityViewTab.Models && (
              <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
            )}
            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedAdapter} view={ApplicationRoute.Adapters} />
            )}
            {isModalOpen &&
              createPortal(
                <CreateEntity
                  route={ApplicationRoute.Models}
                  isModalOpen={isModalOpen}
                  createEntity={createModel}
                  onClose={() => setIsModalOpen(false)}
                  names={modelsNames}
                  initialValues={{
                    source: {
                      $type: SOURCE_TYPE.ADAPTER,
                      adapterName: selectedAdapter.name,
                      completionEndpointPath: getEndpointPostfix(DialModelType.Chat),
                    },
                  }}
                />,
                document.body,
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdapterView;
