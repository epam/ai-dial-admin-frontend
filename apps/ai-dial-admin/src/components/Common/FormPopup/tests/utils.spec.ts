import { ButtonVariant } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

describe('getFormPopupButtons', () => {
  const params = { cancelLabel: 'Cancel', submitLabel: 'Save', onCancel: vi.fn(), onSubmit: vi.fn() };

  test('Should return a neutral cancel and a primary submit button', () => {
    const [cancel, submit] = getFormPopupButtons(params);

    expect(cancel.label).toBe('Cancel');
    expect(cancel.variant).toBeUndefined();
    expect(submit.label).toBe('Save');
    expect(submit.variant).toBe(ButtonVariant.Primary);
    expect(submit.disabled).toBe(false);
  });

  test('Should disable submit and pass its class name', () => {
    const [, submit] = getFormPopupButtons({ ...params, isSubmitDisabled: true, submitClassName: 'w-full' });

    expect(submit.disabled).toBe(true);
    expect(submit.className).toBe('w-full');
  });

  test('Should call the matching callback on click', () => {
    const [cancel, submit] = getFormPopupButtons(params);

    cancel.onClick?.({} as never);
    submit.onClick?.({} as never);

    expect(params.onCancel).toHaveBeenCalledTimes(1);
    expect(params.onSubmit).toHaveBeenCalledTimes(1);
  });
});
