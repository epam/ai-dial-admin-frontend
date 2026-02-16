import { DialLoader, DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';
import { GridOptions } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { ImageGroup } from '@/src/models/deployments/images';
import { CreateSteps } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getImagesWithVersions } from '@/src/app/actions/deployments';
import { CREATE_CONTAINER_STEPS } from '@/src/constants/deployments/containers';
import { IMAGES_LIST_FOR_CONTAINER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { getContainerTypeByRoute, getContainerTemplate } from '@/src/utils/deployments/containers';
import { getImageType, isValidVersion, updateSelectedVersion } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import { SINGLE_ROW_SELECTION } from '@/src/constants/ag-grid';
import { useI18n } from '@/src/locales/client';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import ContainerFields from '@/src/components/Containers/Fields/ContainerFields';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (instance: Container) => void;
  route: ApplicationRoute;
  names: string[];
}

const ContainerCreate: FC<Props> = ({ isModalOpen, modalTitle, onClose, onApply, route, names }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();
  const type = useMemo(() => getContainerTypeByRoute(route), [route]);

  const [container, setContainer] = useState<Container>(getContainerTemplate(type, resourcesDefaults) as Container);
  const [steps, setSteps] = useState(CREATE_CONTAINER_STEPS(route, t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);
  const [images, setImages] = useState<ImageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  const setStepsState = useCallback(
    (status?: StepStatus) => {
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === currentStepId);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
    },
    [currentStepId],
  );

  useEffect(() => {
    const fetchData = async () => {
      const res = await getImagesWithVersions(getImageType(route));
      if (res.success) {
        setLoading(false);
        setImages(
          (res.response as ImageGroup[]).filter((group) =>
            group.availableVersions.some((v) => v.status === IMAGE_STATUS.BUILT),
          ),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    };
    setLoading(true);
    fetchData();
  }, [showNotification, setLoading, route]);

  const onFinishClick = () => {
    onApply(container);
  };

  const onVersionsChange = useCallback(
    (id: string) => {
      setImages(updateSelectedVersion(images, id));
      setContainer({
        ...container,
        imageDefinitionId: id,
      });
    },
    [container, images],
  );

  const colDefs = useMemo(() => IMAGES_LIST_FOR_CONTAINER_COLUMNS(onVersionsChange, true), [onVersionsChange]);

  useEffect(() => {
    if (currentStepId === CreateSteps.IMAGE) {
      if (container.imageDefinitionId) {
        const image = images.find((i) => i.selectedId === container.imageDefinitionId);
        setStepsState(
          container.imageDefinitionId && image && isValidVersion(image) ? StepStatus.VALID : StepStatus.ERROR,
        );
      }
    }
  }, [container.imageDefinitionId, names, route, currentStepId, setStepsState, images]);

  useEffect(() => {
    if (currentStepId === CreateSteps.PROPERTIES) {
      setStepsState(isValid ? StepStatus.VALID : StepStatus.ERROR);
    }
  }, [currentStepId, isValid, setStepsState]);

  const options: GridOptions = {
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { selectedId: string; name: string }; name: string }) => (
        <RadioButtonRenderer
          inputId={data.data?.name || data.name}
          isChecked={data.data?.selectedId === container.imageDefinitionId}
        />
      ),
    },
    onFilterChanged: (event) => {
      setFilters(event.api.getFilterModel());
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setContainer({
          ...container,
          containerPorts: event.data?.containerPorts || container.containerPorts,
          imageDefinitionId: event.data?.selectedId,
        });
      }
    },
    onGridReady: (event) => {
      event.api?.updateGridOptions({
        rowData: images,
        columnDefs: colDefs,
      });
      event.api.setFilterModel(filters);
      event.api.forEachNode((node) => {
        if (node.data.selectedId === container.imageDefinitionId && isValidVersion(node.data as ImageGroup)) {
          node.setSelected(true);
        }
      });
    },
  };

  return (
    <DialPopup
      portalId="ContainerCreateModal"
      onClose={onClose}
      header={modalTitle}
      open={isModalOpen}
      size={PopupSize.Lg}
      footer={
        <StepperModalButtons
          steps={steps}
          currentStep={steps.find((s) => s.id === currentStepId)}
          onChangeStep={setCurrentStep}
          onFinishClick={onFinishClick}
          onClose={onClose}
        />
      }
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[450px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
        <>
          {currentStepId === CreateSteps.IMAGE && (
            <>
              {loading && <DialLoader size={40} />}
              {!loading && !!images.length && (
                <GridView rowData={images} columnDefs={colDefs} additionalGridOptions={options} />
              )}
            </>
          )}
        </>

        {currentStepId === CreateSteps.PROPERTIES && (
          <ContainerFields
            container={container}
            setContainer={setContainer}
            isModal={true}
            route={route}
            names={names}
          />
        )}
      </div>
    </DialPopup>
  );
};

export default ContainerCreate;
