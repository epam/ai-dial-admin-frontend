'use client';

import { Dispatch, FC, SetStateAction, useCallback } from 'react';

import { CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import RulesItemBody from '@/src/components/Rules/RulesItemBody';
import { DialRule } from '@/src/models/dial/rule';
import { Step, StepStatus } from '@/src/models/step';

interface Props {
  rules: DialRule[];
  setRules: Dispatch<SetStateAction<DialRule[]>>;
  setSteps: Dispatch<SetStateAction<Step[]>>;
  setCurrentStep: Dispatch<SetStateAction<Step>>;
}

const FolderCreatePermissions: FC<Props> = ({ rules, setRules, setSteps, setCurrentStep }) => {
  const onChangeRules = useCallback(
    (rules: DialRule[]) => {
      setRules(rules);
      const status = rules.some(
        (rule) =>
          !rule.function ||
          !rule.source ||
          !(rule.targets.length > 0) ||
          (rule.targets.length && !rule.targets[0].length),
      )
        ? StepStatus.ERROR
        : StepStatus.VALID;
      setSteps((prev) => {
        const index = prev.findIndex((step) => step.id === CreateFolderSteps.PERMISSIONS);
        return prev.map((item, i) => (i === index ? { ...item, status } : item));
      });
      setCurrentStep((prev) => {
        return {
          ...prev,
          status,
        };
      });
    },
    [setCurrentStep, setRules, setSteps],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <RulesItemBody isLast={true} rules={rules} onChange={onChangeRules} />
    </div>
  );
};

export default FolderCreatePermissions;
