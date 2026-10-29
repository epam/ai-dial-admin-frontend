import type { useProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/use-project-staging';

/** Everything the owning view and the project's fields share: the staged edits, and how to save or discard them. */
export type ProjectStaging = ReturnType<typeof useProjectStaging>;
