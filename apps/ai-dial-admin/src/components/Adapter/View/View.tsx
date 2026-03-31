'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import { removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import { createModel } from '@/src/app/[lang]/models/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
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
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getEndpointPostfix } from '@/src/utils/models/model-endpoint';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getAdapterTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

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
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedAdapter(cloneDeep(originalAdapter));
  }, [originalAdapter]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalAdapter, selectedAdapter));
  }, [selectedAdapter, originalAdapter]);

  const onDiscard = useCallback(() => {
    setSelectedAdapter(cloneDeep(originalAdapter));
  }, [originalAdapter]);

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
      <SimpleEntityHeader
        view={ApplicationRoute.Adapters}
        entity={selectedAdapter}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeAdapter}
      >
        <DialNeutralButton
          label={`${t(ButtonsI18nKey.Create)} ${t(CreateI18nKey.Model)}`}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => setIsModalOpen(true)}
        />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedAdapter}
            setSelectedEntity={setSelectedAdapter}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            <TabsContent activeTab={activeTab} selectedAdapter={selectedAdapter} onChangeAdapter={setSelectedAdapter} />

            {isModalOpen &&
              createPortal(
                <CreateEntity
                  route={ApplicationRoute.Models}
                  isModalOpen={isModalOpen}
                  createEntity={createModel}
                  onClose={() => {
                    setIsModalOpen(false);
                    dispatch({ type: ValidationActionType.Reset });
                  }}
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
