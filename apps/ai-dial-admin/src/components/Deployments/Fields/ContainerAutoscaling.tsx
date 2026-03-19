import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DialNumberInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { FieldError } from '@/src/models/error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getReplicasError } from '@/src/utils/deployments/validation';
import { AUTOSCALE_OPTIONS } from '@/src/constants/deployments/containers';
import { SCALING_STRATEGY_TYPE } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import {
  deriveScaling,
  isAutoscalingEnabled,
  isEditDisabled,
  isErrorPresent,
} from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const ContainerAutoscaling: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);
  const { dispatch, resetCounter, isValid, errorFields } = useSaveValidationContext();

  const scalingOptions = useMemo(() => AUTOSCALE_OPTIONS(t), [t]);
  const [replicasError, setReplicasError] = useState<FieldError | null>(null);
  const [isSectionInvalid, setSectionInvalid] = useState(false);

  const showStrategy = useMemo(
    () => isAutoscalingEnabled(container.scaling?.minReplicas, container.scaling?.maxReplicas),
    [container.scaling?.minReplicas, container.scaling?.maxReplicas],
  );

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
      if (value === '0') {
        const scaling = deriveScaling(container.scaling, { minReplicas: 1 });
        delete scaling.scaleToZeroDelaySeconds;
        const error = getReplicasError(scaling.minReplicas, scaling.maxReplicas, t);
        dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
        setReplicasError(error);
        setContainer({ ...container, scaling });
      } else {
        const scaling = deriveScaling(container.scaling, {
          scaleToZeroDelaySeconds: Number(value),
          minReplicas: 0,
        });
        const error = getReplicasError(scaling.minReplicas, scaling.maxReplicas, t);
        dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
        setReplicasError(error);
        setContainer({ ...container, scaling });
      }
    },
    [container, dispatch, setContainer, t],
  );

  const onMinScaleChange = useCallback(
    (minReplicas?: number | string) => {
      const scaling = deriveScaling(container.scaling, { minReplicas: minReplicas as number });
      const error = getReplicasError(scaling.minReplicas, scaling.maxReplicas, t);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
      setReplicasError(error);
      setContainer({ ...container, scaling });
    },
    [container, dispatch, setContainer, t],
  );

  const onMaxScaleChange = useCallback(
    (maxReplicas?: number | string) => {
      const scaling = deriveScaling(container.scaling, { maxReplicas: maxReplicas as number });
      const error = getReplicasError(scaling.minReplicas, scaling.maxReplicas, t);
      dispatch({ type: ValidationActionType.SetField, field: 'scaling', isValid: !error });
      setReplicasError(error);
      setContainer({ ...container, scaling });
    },
    [container, dispatch, setContainer, t],
  );

  const onThresholdChange = useCallback(
    (value?: number | string) => {
      setContainer({
        ...container,
        scaling: {
          ...container.scaling,
          strategy: {
            ...container.scaling?.strategy,
            $type: container.scaling?.strategy?.$type ?? SCALING_STRATEGY_TYPE.REQUESTS,
            threshold: Number(value),
          },
        },
      });
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
            disabled={isDisabled}
          />
          <div className="flex gap-4">
            <DialNumberInput
              id="minScale"
              value={container.scaling?.minReplicas}
              onChange={onMinScaleChange}
              containerClassName="max-w-[80px]"
              disabled={
                (!!container.scaling?.scaleToZeroDelaySeconds && container.scaling?.scaleToZeroDelaySeconds !== 0) ||
                isDisabled
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
              disabled={isDisabled}
            />
          </div>
        </div>
        {showStrategy && (
          <div className="flex">
            <DialNumberInput
              id="threshold"
              value={container.scaling?.strategy?.threshold}
              onChange={onThresholdChange}
              className="max-w-[80px]"
              labelProps={{ label: t(ContainersI18nKey.Threshold) }}
              disabled={isDisabled}
            />
          </div>
        )}
      </div>
    </Accordion>
  );
};

export default ContainerAutoscaling;
