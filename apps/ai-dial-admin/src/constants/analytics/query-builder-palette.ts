import { QueryBuilderColor, QueryBuilderColorClasses } from '@/src/models/analytics/query-builder';

// The Query Builder palette. Teal/blue/purple/red reuse the Tailwind accent tokens; yellow and
// orange come from the Monaco JSON theme (keyword.json #F4CE46, number #D97C27 — see
// constants/editor.ts) so builder sections echo the JSON view's syntax colors. Keep every color
// reference in the rail going through this map — no ad-hoc color classes in section components.
export const QUERY_BUILDER_PALETTE: Record<QueryBuilderColor, QueryBuilderColorClasses> = {
  [QueryBuilderColor.Dimension]: {
    marker: 'bg-accent-secondary',
    text: 'text-accent-secondary',
    chipBg: 'bg-accent-secondary-alpha',
    chipText: 'text-accent-secondary',
    borderAccent: 'border-l-accent-secondary',
  },
  [QueryBuilderColor.Measure]: {
    marker: 'bg-accent-primary',
    text: 'text-accent-primary',
    chipBg: 'bg-accent-primary-alpha',
    chipText: 'text-accent-primary',
    borderAccent: 'border-l-accent-primary',
  },
  [QueryBuilderColor.Grouping]: {
    marker: 'bg-accent-tertiary',
    text: 'text-accent-tertiary',
    chipBg: 'bg-accent-tertiary-alpha',
    chipText: 'text-accent-tertiary',
    borderAccent: 'border-l-accent-tertiary',
  },
  [QueryBuilderColor.Constraint]: {
    marker: 'bg-error',
    text: 'text-error',
    chipBg: 'bg-[#F764642E]',
    chipText: 'text-error',
    borderAccent: 'border-l-error',
  },
  [QueryBuilderColor.Keyword]: {
    marker: 'bg-[#F4CE46]',
    text: 'text-[#F4CE46]',
    chipBg: 'bg-[#F4CE462E]',
    chipText: 'text-[#F4CE46]',
    borderAccent: 'border-l-[#F4CE46]',
  },
  [QueryBuilderColor.Numeric]: {
    marker: 'bg-[#D97C27]',
    text: 'text-[#D97C27]',
    chipBg: 'bg-[#D97C272E]',
    chipText: 'text-[#D97C27]',
    borderAccent: 'border-l-[#D97C27]',
  },
};

// Field dropdowns cycle these for their category group headers — the full palette, so adjacent
// categories rarely repeat a color.
export const FIELD_GROUP_COLOR_CYCLE: QueryBuilderColor[] = [
  QueryBuilderColor.Measure,
  QueryBuilderColor.Dimension,
  QueryBuilderColor.Grouping,
  QueryBuilderColor.Keyword,
  QueryBuilderColor.Constraint,
  QueryBuilderColor.Numeric,
];
