import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import {
  DialGhostButton,
  DialLoader,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  DialSteps,
  PopupSize,
  Step,
  StepStatus,
} from '@epam/ai-dial-ui-kit';
import { IconArrowNarrowLeft } from '@tabler/icons-react';
import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { getContainerTemplate } from '@/src/utils/deployments/containers';
import { CREATE_CONTAINER_STEPS } from '@/src/constants/deployments/containers';
import { ImageGroup } from '@/src/models/deployments/images';
import { CreateSteps } from '@/src/types/deployments/containers';
import { getImagesWithVersions } from '@/src/app/actions/deployments';
import { getImageType, isValidVersion, updateSelectedVersion } from '@/src/utils/deployments/images';
import { getErrorNotification } from '@/src/utils/notification';
import Grid from '@/src/components/Grid/Grid';
import { RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import ContainerProperties from '@/src/components/Containers/Fields/ContainerProperties';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { IMAGES_LIST_FOR_CONTAINER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onApply: (instance: Container) => void;
  route: ApplicationRoute;
  names: string[];
}

const CreateContainer: FC<Props> = ({ isModalOpen, modalTitle, onClose, onApply, route, names }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { resourcesDefaults } = useAppContext();
  const { isValid } = useSaveValidationContext();

  const [container, setContainer] = useState<Container>(getContainerTemplate(route, resourcesDefaults) as Container);
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

  const onNextStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStepId);
    setCurrentStep(steps[stepIndex + 1].id);
  };

  const onPrevStep = () => {
    const stepIndex = steps.findIndex((s) => s.id === currentStepId);
    setCurrentStep(steps[stepIndex - 1].id);
  };

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

  return (
    <DialPopup
      onClose={onClose}
      header={modalTitle}
      portalId="AddContainerModal"
      open={isModalOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[450px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
        <>
          {currentStepId === CreateSteps.IMAGE && (
            <>
              {loading && <DialLoader size={40} />}
              {!loading && !!images.length && (
                <Grid
                  rowData={images}
                  columnDefs={colDefs}
                  additionalGridOptions={{
                    rowSelection: { mode: 'singleRow', enableClickSelection: true },
                    selectionColumnDef: {
                      ...RADIO_BUTTON_COL_DEF,
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
                        if (
                          node.data.selectedId === container.imageDefinitionId &&
                          isValidVersion(node.data as ImageGroup)
                        ) {
                          node.setSelected(true);
                        }
                      });
                    },
                  }}
                />
              )}
            </>
          )}
        </>
        <>
          {currentStepId === CreateSteps.PROPERTIES && (
            <ContainerProperties
              container={container}
              setContainer={setContainer}
              isModal={true}
              route={route}
              names={names}
            />
          )}
        </>
      </div>
      <div
        className={classNames(
          'flex flex-row w-full items-center px-6 py-4',
          currentStepId === steps[0]?.id ? 'justify-end' : 'justify-between',
        )}
      >
        {currentStepId !== steps[0]?.id && (
          <DialGhostButton
            label={t(ButtonsI18nKey.Back)}
            onClick={onPrevStep}
            iconBefore={<IconArrowNarrowLeft {...BASE_BUTTON_ICON_PROPS} />}
          />
        )}
        <div className="flex flex-row gap-2">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          {currentStepId === steps.at(-1)?.id ? (
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Finish)}
              disabled={steps.some((s) => s.status !== StepStatus.VALID) || !isValid}
              onClick={onFinishClick}
            />
          ) : (
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Next)}
              onClick={onNextStep}
              disabled={(steps?.find((s) => s.id === currentStepId) as Step).status !== StepStatus.VALID}
            />
          )}
        </div>
      </div>
    </DialPopup>
  );
};

export default CreateContainer;
