'use client';
import { Dispatch, FC, SetStateAction } from 'react';
import { IconExclamationCircle, IconCheck } from '@tabler/icons-react';

import { Step, StepStatus } from '@/src/models/step';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  steps: Step[];
  currentStep: Step;
  setCurrentStep: Dispatch<SetStateAction<Step>>;
}

const Steps: FC<Props> = ({ steps, currentStep, setCurrentStep }) => {
  const containerClass = 'flex gap-2';
  const stepClass = 'h-[32px] flex flex-1 items-center tiny border-t-2 cursor-pointer';
  const circleClass = 'w-[22px] h-[22px] flex justify-center items-center mr-2 rounded-full text-white';

  const getStepClass = (step: Step) => {
    if (currentStep.id === step.id) {
      switch (step.status) {
        case StepStatus.VALID:
          return 'border-accent-secondary text-primary';
        case StepStatus.ERROR:
          return 'border-red-900';
        default:
          return 'border-accent-primary text-primary';
      }
    } else {
      switch (step.status) {
        case StepStatus.VALID:
          return 'border-primary text-white';
        case StepStatus.ERROR:
          return 'border-red-900 text-error';
        default:
          return 'border-primary text-secondary';
      }
    }
  };

  const getCircleClass = (step: Step) => {
    if (currentStep.id === step.id) {
      switch (step.status) {
        case StepStatus.VALID:
          return 'bg-accent-secondary';
        case StepStatus.ERROR:
          return 'bg-red-400';
        default:
          return 'bg-accent-primary';
      }
    } else {
      switch (step.status) {
        case StepStatus.VALID:
          return 'bg-accent-secondary';
        case StepStatus.ERROR:
          return 'bg-red-400';
        default:
          return 'bg-layer-4';
      }
    }
  };

  const handleStepChange = (step: Step) => {
    if (step.id !== currentStep.id && currentStep.status === StepStatus.VALID) {
      setCurrentStep(step);
    }
  };

  return (
    <div id="steps" className={containerClass}>
      {steps.map((step, index) => {
        let content;
        if (currentStep.id === step.id && step.status === StepStatus.ERROR) {
          content = <IconExclamationCircle {...BASE_ICON_PROPS} widths={16} height={16} />;
        } else if (currentStep.id !== step.id && step.status === StepStatus.VALID) {
          content = <IconCheck {...BASE_ICON_PROPS} widths={16} height={16} />;
        } else {
          content = index + 1;
        }

        return (
          <button
            key={step.id}
            className={`${stepClass} ${getStepClass(step)}`}
            onClick={() => handleStepChange(step)}
            disabled={step.status === StepStatus.ERROR}
          >
            <span className={`${circleClass} ${getCircleClass(step)}`}>{content}</span>
            <span className="">{step.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Steps;
