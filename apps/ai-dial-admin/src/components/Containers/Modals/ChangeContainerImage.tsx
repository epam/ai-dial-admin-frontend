import {
  AlertVariant,
  DialAlert,
  DialLoader,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { getImageVersions } from '@/src/app/actions/deployments';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN, RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { CHANGE_IMAGE_VERSION } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';
import { getErrorNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (id: string) => void;
  route: ApplicationRoute;
  image: Image;
  containerStatus?: CONTAINER_STATUS;
}

const ChangeContainerImage: FC<Props> = ({
  onClose,
  isModalOpen,
  modalTitle,
  route,
  onApply,
  image,
  containerStatus,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [id, setId] = useState(image.id);
  const [images, setImages] = useState<ImageVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const onOpenInNewTabAction = useCallback((image?: Image) => {
    onOpenInNewTab(ApplicationRoute.Images, image);
  }, []);

  const columnDefs = [...CHANGE_IMAGE_VERSION(t), ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction)])];

  useEffect(() => {
    const fetchData = async () => {
      const res = await getImageVersions(image.name);
      if (res.success) {
        setLoading(false);
        setImages(res.response as []);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    };

    fetchData().catch((err) => console.error(err));
  }, [showNotification, setLoading, route, image.name]);

  useEffect(() => {
    setIsValid(images.find((image) => image.id === id)?.status === IMAGE_STATUS.BUILT && id !== image.id);
  }, [id, image.id, images]);

  return (
    <DialPopup
      onClose={onClose}
      header={modalTitle}
      portalId="ChangeContainerImageModal"
      open={isModalOpen}
      className="lg:max-w-[55%] md:max-w-[75%]"
    >
      <>
        {loading && <DialLoader size={24} />}
        <div className="flex flex-col py-4 px-6">
          {!loading && !!images.length && (
            <div className="flex flex-col gap-4 overflow-auto max-h-[400px]">
              <Grid
                rowData={images}
                columnDefs={columnDefs}
                additionalGridOptions={{
                  rowSelection: { mode: 'singleRow', enableClickSelection: true },
                  selectionColumnDef: {
                    ...RADIO_BUTTON_COL_DEF,
                    cellRenderer: (data: { data?: { id: string; name: string }; name: string }) => (
                      <RadioButtonRenderer inputId={data.data?.name || data.name} isChecked={data.data?.id === id} />
                    ),
                  },
                  onRowSelected: (event) => {
                    if (event.node.isSelected()) {
                      setId(event.data?.id);
                    }
                  },
                  onGridReady: (event) => {
                    event.api?.updateGridOptions({
                      rowData: images,
                      columnDefs: columnDefs,
                    });
                    event.api.forEachNode((node) => {
                      if (node.data.id === image.id) {
                        node.setSelected(true);
                      }
                    });
                  },
                }}
              />
              {containerStatus === CONTAINER_STATUS.RUNNING && (
                <DialAlert
                  message={t(ContainersI18nKey.ContainerRestartWarning, {
                    entityType: getTranslatedDeploymentType(route, t),
                  })}
                  variant={AlertVariant.Warning}
                />
              )}
            </div>
          )}
        </div>
      </>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Apply)}
          onClick={() => {
            onApply(id);
            onClose();
          }}
          disabled={!isValid}
        />
      </div>
    </DialPopup>
  );
};

export default ChangeContainerImage;
