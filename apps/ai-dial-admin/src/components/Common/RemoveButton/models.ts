import { ButtonProps, IconButtonProps } from '@epam/ai-dial-ui-kit';

export interface RemoveIconButtonProps extends Omit<IconButtonProps, 'icon' | 'variant' | 'appearance'> {
  label?: undefined;
}

export interface RemoveLabelledButtonProps extends Omit<
  ButtonProps,
  'label' | 'variant' | 'appearance' | 'iconBefore' | 'iconAfter'
> {
  label: string;
}

export type RemoveButtonProps = RemoveIconButtonProps | RemoveLabelledButtonProps;
