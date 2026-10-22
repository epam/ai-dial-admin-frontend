import { RadioButtonWithContent, RadioGroupItem } from '@epam/ai-dial-ui-kit';

export const toRadioItems = (buttons: RadioButtonWithContent[]): RadioGroupItem[] =>
  buttons.map(({ id, name, content, caption }) => ({
    value: id,
    label: name,
    content,
    caption: typeof caption === 'string' ? caption : undefined,
  }));
