import { UnitNamespace } from '@/src/models/user-access';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * The org-unit namespace a view's content belongs to. A route not listed here (Projects, every platform and
 * admin-backend page) has no namespace Core grants in a unit, so unit mode neither shows nor edits it.
 */
const ROUTE_NAMESPACES: Partial<Record<ApplicationRoute, UnitNamespace>> = {
  [ApplicationRoute.AssetsApplications]: UnitNamespace.APPLICATIONS,
  [ApplicationRoute.AssetsToolsets]: UnitNamespace.TOOLSETS,
  [ApplicationRoute.Prompts]: UnitNamespace.PROMPTS,
  [ApplicationRoute.Files]: UnitNamespace.FILES,
  [ApplicationRoute.Skills]: UnitNamespace.SKILLS,
  [ApplicationRoute.Conversations]: UnitNamespace.CONVERSATIONS,
  [ApplicationRoute.Publications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.ApplicationPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.ToolsetPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.PromptPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.FilePublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.ConversationPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.SkillPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.ProjectPublications]: UnitNamespace.PUBLICATIONS,
  [ApplicationRoute.FoldersStorage]: UnitNamespace.ORG_UNITS,
};

export const getRouteNamespace = (route: ApplicationRoute | string): UnitNamespace | undefined =>
  ROUTE_NAMESPACES[route as ApplicationRoute];
