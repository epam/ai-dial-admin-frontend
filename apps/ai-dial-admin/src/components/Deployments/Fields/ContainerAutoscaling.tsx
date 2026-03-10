import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialNumberInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import { AutoscalingStrategy, Container } from '@/src/models/deployments/containers';
import { ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getReplicasError } from '@/src/utils/deployments/validation';
import { AUTOSCALE_OPTIONS } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { isEditDisabled, isErrorPresent } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const ContainerAutoscaling: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();
  const { dispatch, resetCounter, isValid, errorFields } = useSaveValidationContext();

  const scalingOptions = useMemo(() => AUTOSCALE_OPTIONS(t), [t]);
  const [replicasError, setReplicasError] = useState<FieldError | null>(null);
  const [isSectionInvalid, setSectionInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setSectionInvalid(isErrorPresent(errorFields, ['scaling']));
    } else {
      setSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  useEffect(() => {
    if (resetCounter || (container.scaling?.maxReplicas && container.scaling.maxReplicas)) {
      const error = getReplicasError(container.scaling?.minReplicas, container.scaling?.maxReplicas, t);
      setReplicasError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
    }
  }, [container.scaling, dispatch, resetCounter, t]);

  const onScaleDelayChange = useCallback(
    (value: string | string[]) => {
      const error = getReplicasError(container.scaling?.minReplicas, container.scaling?.maxReplicas, t);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
      setReplicasError(error);
      if (value === '0') {
        const updated: Container = { ...container, scaling: { ...container.scaling, minReplicas: 1 } };
        delete updated.scaling?.scaleToZeroDelaySeconds;
        setContainer(updated);
      } else {
        setContainer({
          ...container,
          scaling: {
            ...container.scaling,
            scaleToZeroDelaySeconds: Number(value),
            minReplicas: 0,
          },
        });
      }
    },
    [container, dispatch, setContainer, t],
  );

  const onMinScaleChange = useCallback(
    (minReplicas?: number | string) => {
      const error = getReplicasError(minReplicas as number, container.scaling?.maxReplicas, t);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
      setReplicasError(error);
      setContainer({
        ...container,
        scaling: {
          ...container.scaling,
          minReplicas: minReplicas as number,
        },
      });
    },
    [container, dispatch, setContainer, t],
  );
  const onMaxScaleChange = useCallback(
    (maxReplicas?: number | string) => {
      const error = getReplicasError(container.scaling?.minReplicas, maxReplicas as number, t);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
      setReplicasError(error);
      setContainer({
        ...container,
        scaling: {
          ...container.scaling,
          maxReplicas: maxReplicas as number,
        },
      });
    },
    [container, dispatch, setContainer, t],
  );
  const onThresholdChange = useCallback(
    (value?: number | string) => {
      if (value === '0') {
        const updated: Container = { ...container, scaling: { ...container.scaling } };
        delete updated.scaling?.scaleToZeroDelaySeconds;
        setContainer(updated);
      } else {
        setContainer({
          ...container,
          scaling: {
            ...container.scaling,
            strategy: {
              ...(container.scaling?.strategy as AutoscalingStrategy),
              threshold: Number(value),
            },
          },
        });
      }
    },
    [container, setContainer],
  );

  return (
    <Accordion title={t(EntityFieldsI18nKey.Autoscaling)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 flex-col lg:flex-row">
          <DialSelectField
            id="scaleToZero"
            options={scalingOptions}
            value={container.scaling?.scaleToZeroDelaySeconds?.toString() || scalingOptions[0].value}
            onChange={onScaleDelayChange}
            label={t(ContainersI18nKey.ScaleToZero)}
            containerClassName="max-w-[280px]"
            disabled={isEditDisabled(container)}
          />
          <div className="flex gap-4">
            <DialNumberInput
              id="minScale"
              value={container.scaling?.minReplicas}
              onChange={onMinScaleChange}
              containerClassName="max-w-[80px]"
              disabled={
                (!!container.scaling?.scaleToZeroDelaySeconds && container.scaling?.scaleToZeroDelaySeconds !== 0) ||
                isEditDisabled(container)
              }
              labelProps={{ label: t(ContainersI18nKey.MinReplicas) }}
            />
            <DialNumberInput
              id="maxScale"
              min={1}
              value={container.scaling?.maxReplicas}
              onChange={onMaxScaleChange}
              className="max-w-[80px]"
              labelProps={{ label: t(ContainersI18nKey.MaxReplicas) }}
              error={replicasError?.text}
              invalid={!!replicasError}
              disabled={isEditDisabled(container)}
            />
          </div>
        </div>
        {container.scaling?.minReplicas !== container.scaling?.maxReplicas && (
          <div className="flex">
            <DialNumberInput
              id="threshold"
              value={container.scaling?.strategy?.threshold}
              onChange={onThresholdChange}
              className="max-w-[80px]"
              labelProps={{ label: t(ContainersI18nKey.Threshold) }}
              disabled={isEditDisabled(container)}
            />
          </div>
        )}
      </div>
    </Accordion>
  );
};

export default ContainerAutoscaling;
