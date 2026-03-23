import { ReactNode } from 'react';

export interface ActionLabel {
  key: string;
  label: string;
}

export interface ActionLabelWithIcon {
  key: string;
  label: string;
  icon: ReactNode;
}
