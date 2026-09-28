import { SelectOption } from '@epam/ai-dial-ui-kit';

import { ApplicationRoute } from '@/src/types/routes';

export const pipelineDetailHref = (name: string): string =>
  `${ApplicationRoute.AnalyticsPipelines}/${encodeURIComponent(name)}`;

/**
 * Keeps a stored value the option list does not offer selectable: without it the control reads as empty and
 * a save would replace a value nobody chose to change.
 */
export const withStrandedOption = (options: SelectOption[], value?: string): SelectOption[] =>
  value && !options.some((option) => option.value === value) ? [...options, { value, label: value }] : options;
