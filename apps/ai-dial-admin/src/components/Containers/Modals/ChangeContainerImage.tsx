import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ButtonVariant, DialButton, DialLoader, DialPopup } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { CHANGE_IMAGE_VERSION } from '@/src/constants/deployments/images';
import { ACTION_COLUMN, RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { getImageVersions } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import Grid from '@/src/components/Grid/Grid';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (id: string) => void;
  route: ApplicationRoute;
  image: Image;
}

const ChangeContainerImage: FC<Props> = ({ onClose, isModalOpen, modalTitle, route, onApply, image }) => {
  const t = useI18n() as (key: string) => string;
  const { showNotification } = useNotification();

  const [id, setId] = useState(image.id);
  const [images, setImages] = useState<ImageVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const onOpenInNewTabAction = useCallback(
    (image?: Image) => {
      onOpenInNewTab(route, image, DEPLOYMENT_ENTITY.images);
    },
    [route],
  );

  const containerClassName = classNames('flex flex-col w-full lg:max-w-[55%] md:max-w-[75%]');
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
      title={modalTitle}
      portalId="ChangeContainerImageModal"
      open={isModalOpen}
      className={containerClassName}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto max-h-[400px]">
        <>
          {loading && <DialLoader size={24} />}
          {!loading && !!images.length && (
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
          )}
        </>
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
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
