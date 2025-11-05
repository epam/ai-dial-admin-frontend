'use client';
import { ButtonVariant, DialButton, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import { createModel } from '@/src/app/[lang]/models/actions';
import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { auditTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ButtonsI18nKey, CreateI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import AdapterProperties from './AdapterProperties';
import { DialModel, DialModelType } from '@/src/models/dial/model';
import { getEndpointPostfix } from '@/src/components/ModelView/ModelProperties/utils';

interface Props {
  etag: string;
  modelsNames: string[];
  originalAdapter: DialAdapter;
}

const AdapterView: FC<Props> = ({ originalAdapter, modelsNames, etag }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [propertiesTabs(t), { id: EntityViewTab.Models, name: t(TabsI18nKey.Models) }, auditTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAdapter, setSelectedAdapter] = useState(cloneDeep(originalAdapter));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setSelectedAdapter(cloneDeep(originalAdapter));
  }, [originalAdapter]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

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
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedAdapter(originalAdapter);
  }, [jsonEditorEnabled, originalAdapter, dispatch]);

  const onChangeAdapter = useCallback(
    (entity: DialAdapter) => {
      setSelectedAdapter(entity);
    },
    [setSelectedAdapter],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateAdapter(selectedAdapter, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Adapters, t),
            getUpdateNotificationDescription(ApplicationRoute.Adapters, selectedAdapter.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedAdapter, etag, showNotification, t, router]);

  const onCreateModel = useCallback((model: DialModel) => {
    return createModel({
      ...model,
      source: {
        ...model.source,
        completionEndpointPath: `${model.name}${getEndpointPostfix(DialModelType.Chat)}`,
      } as SOURCE_FIELD,
    });
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        {!jsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          view={ApplicationRoute.Adapters}
          entity={selectedAdapter}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeAdapter}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          childrenContainerClass={'flex-row-reverse'}
        >
          <DialButton
            variant={ButtonVariant.Secondary}
            title={`${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.Model)}`}
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            onClick={() => setIsModalOpen(true)}
          />
        </HeaderButtons>
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedAdapter}
            setSelectedEntity={setSelectedAdapter}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <>
                <EntityHeader entity={selectedAdapter} />
                <div className="lg:w-[35%] flex flex-col pt-4">
                  <div className="flex-1 min-h-0">
                    <AdapterProperties
                      entity={selectedAdapter}
                      onChangeAdapter={onChangeAdapter}
                      isEntityImmutable={true}
                    />
                  </div>
                </div>
              </>
            )}
            {activeTab === EntityViewTab.Models && (
              <div className="w-full h-full">
                <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
              </div>
            )}
            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedAdapter} view={ApplicationRoute.Adapters} />
            )}
            {isModalOpen &&
              createPortal(
                <CreateEntity
                  route={ApplicationRoute.Models}
                  isModalOpen={isModalOpen}
                  createEntity={onCreateModel}
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
