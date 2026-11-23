import { Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const buildSteps = (statuses: Array<StepStatus | undefined>): Step[] =>
  statuses.map((status, index) => ({ id: `step-${index}`, name: `Step ${index}`, status }));

const onChangeStep = vi.fn();
const onFinishClick = vi.fn();
const onClose = vi.fn();
const onNextStep = vi.fn();

const renderButtons = (
  steps: Step[],
  currentIndex: number,
  props: Partial<React.ComponentProps<typeof StepperModalButtons>> = {},
) =>
  render(
    <StepperModalButtons
      steps={steps}
      currentStep={steps[currentIndex]}
      onChangeStep={onChangeStep}
      onFinishClick={onFinishClick}
      onClose={onClose}
      onNextStep={onNextStep}
      {...props}
    />,
  );

const queryButton = (key: string) => screen.queryByRole('button', { name: key });

describe('StepperModalButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default footer', () => {
    test('first step shows Cancel and Next, without Back', () => {
      renderButtons(buildSteps([StepStatus.VALID, undefined, undefined]), 0);

      expect(queryButton(ButtonsI18nKey.Back)).toBeNull();
      expect(queryButton(ButtonsI18nKey.Cancel)).toBeTruthy();
      expect(queryButton(ButtonsI18nKey.Next)).toBeTruthy();
      expect(queryButton(ButtonsI18nKey.Finish)).toBeNull();
    });

    test('middle step shows Back, Cancel and Next', async () => {
      const user = userEvent.setup();
      renderButtons(buildSteps([StepStatus.VALID, StepStatus.VALID, undefined]), 1);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));

      expect(onChangeStep).toHaveBeenCalledWith('step-0');
      expect(queryButton(ButtonsI18nKey.Next)).toBeTruthy();
    });

    test('Next is disabled while the current step is not valid', () => {
      renderButtons(buildSteps([undefined, undefined]), 0);

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();
    });

    test('Next without onNextStep moves to the following step', async () => {
      const user = userEvent.setup();
      const steps = buildSteps([StepStatus.VALID, undefined]);
      renderButtons(steps, 0, { onNextStep: undefined });

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

      expect(onChangeStep).toHaveBeenCalledWith('step-1');
    });

    test('last step shows Finish, disabled until every step is valid', () => {
      const { rerender } = renderButtons(buildSteps([StepStatus.VALID, undefined]), 1);

      expect(queryButton(ButtonsI18nKey.Next)).toBeNull();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeDisabled();

      const validSteps = buildSteps([StepStatus.VALID, StepStatus.VALID]);
      rerender(
        <StepperModalButtons
          steps={validSteps}
          currentStep={validSteps[1]}
          onChangeStep={onChangeStep}
          onFinishClick={onFinishClick}
          onClose={onClose}
        />,
      );

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeEnabled();
    });
  });

  describe('isLastStepInformative', () => {
    test('second-to-last step shows Finish with the supplied label and no Next', async () => {
      const user = userEvent.setup();
      renderButtons(buildSteps([StepStatus.VALID, StepStatus.VALID, undefined]), 1, {
        isLastStepInformative: true,
        finishButtonLabel: 'create-label',
      });

      expect(queryButton(ButtonsI18nKey.Next)).toBeNull();
      expect(queryButton(ButtonsI18nKey.Back)).toBeTruthy();
      expect(queryButton(ButtonsI18nKey.Cancel)).toBeTruthy();

      await user.click(screen.getByRole('button', { name: 'create-label' }));

      expect(onFinishClick).toHaveBeenCalledTimes(1);
    });

    test('Finish ignores the informative step when checking validity', () => {
      renderButtons(buildSteps([StepStatus.VALID, StepStatus.VALID, undefined]), 1, {
        isLastStepInformative: true,
      });

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeEnabled();
    });

    test('Finish is disabled while a step before the informative one is invalid', () => {
      renderButtons(buildSteps([StepStatus.VALID, undefined, undefined]), 1, { isLastStepInformative: true });

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeDisabled();
    });

    test('Finish is disabled while loading', () => {
      renderButtons(buildSteps([StepStatus.VALID, StepStatus.VALID, undefined]), 1, {
        isLastStepInformative: true,
        isLoading: true,
      });

      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeDisabled();
    });

    test('Finish shows on the first step of a two-step flow, without Back', () => {
      renderButtons(buildSteps([StepStatus.VALID, undefined]), 0, { isLastStepInformative: true });

      expect(queryButton(ButtonsI18nKey.Back)).toBeNull();
      expect(screen.getByRole('button', { name: ButtonsI18nKey.Finish })).toBeEnabled();
    });

    test('informative step shows only Close, which calls onClose', async () => {
      const user = userEvent.setup();
      renderButtons(buildSteps([StepStatus.VALID, StepStatus.VALID, StepStatus.VALID]), 2, {
        isLastStepInformative: true,
      });

      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(queryButton(ButtonsI18nKey.Back)).toBeNull();
      expect(queryButton(ButtonsI18nKey.Cancel)).toBeNull();
      expect(queryButton(ButtonsI18nKey.Finish)).toBeNull();

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Close }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
