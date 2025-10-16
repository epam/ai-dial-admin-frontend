import { FC } from 'react';
import type { TitleFieldProps } from '@rjsf/utils';

export const TitleTemplate: FC<TitleFieldProps> = ({ id, title }) => <h2 id={id}>{title}</h2>;
