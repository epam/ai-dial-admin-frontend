import {
  IconDashboard,
  IconFlask,
  IconFolders,
  IconHammer,
  IconRocket,
  IconSettings2,
  IconShieldCog,
} from '@tabler/icons-react';
import { JSX } from 'react';

import Approvals from '@/public/images/icons/menu/approvals.svg';
import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';

export interface MenuGroupConfiguration {
  key: MenuI18nKey;
  descriptionKey: MenuI18nKey;
  icon?: JSX.Element;
  items: MenuItem[];
}

export interface MenuItem {
  key: MenuI18nKey;
  href: string;
}

export const MENU_CONFIGURATION = (iconSize: number, featureFlags: FeatureFlags): MenuGroupConfiguration[] => {
  const config = [
    {
      key: MenuI18nKey.Entities,
      descriptionKey: MenuI18nKey.EntitiesDescription,
      icon: <IconSettings2 width={iconSize} height={iconSize} />,
      items: [
        { key: MenuI18nKey.Models, href: ApplicationRoute.Models },
        {
          key: MenuI18nKey.Applications,
          href: ApplicationRoute.Applications,
        },
        {
          key: MenuI18nKey.Toolsets,
          href: ApplicationRoute.Toolsets,
        },
        {
          key: MenuI18nKey.Interceptors,
          href: ApplicationRoute.Interceptors,
        },
        {
          key: MenuI18nKey.Routes,
          href: ApplicationRoute.Routes,
        },
      ],
    },
    {
      key: MenuI18nKey.Builders,
      descriptionKey: MenuI18nKey.BuildersDescription,
      icon: <IconHammer width={iconSize} height={iconSize} />,
      items: [
        {
          key: MenuI18nKey.ApplicationRunners,
          href: ApplicationRoute.ApplicationRunners,
        },
        {
          key: MenuI18nKey.InterceptorTemplates,
          href: ApplicationRoute.InterceptorTemplates,
        },
        {
          key: MenuI18nKey.Adapters,
          href: ApplicationRoute.Adapters,
        },
      ],
    },
    {
      key: MenuI18nKey.Assets,
      descriptionKey: MenuI18nKey.AssetsDescription,
      icon: <IconFolders width={iconSize} height={iconSize} />,
      items: [
        {
          key: MenuI18nKey.Applications,
          href: ApplicationRoute.AssetsApplications,
        },
        {
          key: MenuI18nKey.Toolsets,
          href: ApplicationRoute.AssetsToolsets,
        },
        {
          key: MenuI18nKey.Prompts,
          href: ApplicationRoute.Prompts,
        },
        {
          key: MenuI18nKey.Files,
          href: ApplicationRoute.Files,
        },
      ],
    },
    {
      key: MenuI18nKey.Deployments,
      descriptionKey: MenuI18nKey.MCPDescription,
      icon: <IconRocket width={iconSize} height={iconSize} />,
      items: [
        ...(featureFlags.nimEnabled || featureFlags.hfEnabled
          ? [
              {
                key: MenuI18nKey.ModelServings,
                href: ApplicationRoute.ModelServings,
              },
            ]
          : []),
        {
          key: MenuI18nKey.McpContainers,
          href: ApplicationRoute.McpContainers,
        },
        {
          key: MenuI18nKey.InterceptorContainers,
          href: ApplicationRoute.InterceptorContainers,
        },
        {
          key: MenuI18nKey.AdapterContainers,
          href: ApplicationRoute.AdapterContainers,
        },
        {
          key: MenuI18nKey.ApplicationContainers,
          href: ApplicationRoute.ApplicationContainers,
        },
        {
          key: MenuI18nKey.Images,
          href: ApplicationRoute.Images,
        },
      ],
    },
    {
      key: MenuI18nKey.AccessManagement,
      descriptionKey: MenuI18nKey.AccessManagementDescription,
      icon: <IconShieldCog width={iconSize} height={iconSize} />,
      items: [
        { key: MenuI18nKey.Roles, href: ApplicationRoute.Roles },
        { key: MenuI18nKey.Keys, href: ApplicationRoute.Keys },
        { key: MenuI18nKey.FoldersStorage, href: ApplicationRoute.FoldersStorage },
      ],
    },
    {
      key: MenuI18nKey.Approvals,
      descriptionKey: MenuI18nKey.ApprovalsDescription,
      icon: <Approvals width={iconSize} height={iconSize} />,
      items: [
        {
          key: MenuI18nKey.ApplicationPublications,
          href: ApplicationRoute.ApplicationPublications,
        },
        {
          key: MenuI18nKey.ToolsetPublications,
          href: ApplicationRoute.ToolsetPublications,
        },
        {
          key: MenuI18nKey.PromptPublications,
          href: ApplicationRoute.PromptPublications,
        },
        {
          key: MenuI18nKey.FilePublications,
          href: ApplicationRoute.FilePublications,
        },
      ],
    },
    {
      key: MenuI18nKey.Evaluation,
      descriptionKey: MenuI18nKey.EvaluationDescription,
      icon: <IconFlask width={iconSize} height={iconSize} />,
      items: [
        { key: MenuI18nKey.TestSuites, href: ApplicationRoute.TestSuites },
        { key: MenuI18nKey.Runs, href: ApplicationRoute.Runs },
      ],
    },
    {
      key: MenuI18nKey.Audit,
      descriptionKey: MenuI18nKey.AuditDescription,
      icon: <IconDashboard width={iconSize} height={iconSize} />,
      items: [
        {
          key: MenuI18nKey.Dashboard,
          href: ApplicationRoute.Dashboard,
        },
        {
          key: MenuI18nKey.ActivityAudit,
          href: ApplicationRoute.ActivityAudit,
        },
        {
          key: MenuI18nKey.UsageLog,
          href: ApplicationRoute.UsageLog,
        },
      ],
    },
  ];

  let result = [...config];
  if (!featureFlags.deploymentsEnabled) {
    result = config.filter((item) => item.key !== MenuI18nKey.Deployments);
  }

  if (!featureFlags.evaluationEnabled) {
    result = config.filter((item) => item.key !== MenuI18nKey.Evaluation);
  }

  return result;
};
