import type { useSkillPublicationStaging } from './use-skill-publication-staging';

/** What the Skill publication view and its tabs share: the staged edits, and how to save or discard them. */
export type SkillPublicationStaging = ReturnType<typeof useSkillPublicationStaging>;
