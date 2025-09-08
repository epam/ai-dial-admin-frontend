'use client';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import AdapterModels from '@/src/components/Adapter/ModelsView/AdapterModels';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JSONEditor';
import { auditTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { TabModel } from '@/src/models/tab';
import { JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import AdapterProperties from './AdapterProperties';

interface Props {
  originalAdapter: DialAdapter;
}

const AdapterView: FC<Props> = ({ originalAdapter }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [propertiesTabs(t), { id: EntityViewTab.Models, name: t(TabsI18nKey.Models) }, auditTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAdapter, setSelectedAdapter] = useState(cloneDeep(originalAdapter));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

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
    updateAdapter(selectedAdapter).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedAdapter, router, showNotification]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.Adapters}
          entity={selectedAdapter}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeAdapter}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          setErrorNotifications={setErrorNotifications}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedAdapter}
            errorNotifications={errorNotifications}
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdapterView;
