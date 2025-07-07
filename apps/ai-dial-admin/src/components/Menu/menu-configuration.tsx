import { JSX } from 'react';

import AccessManagement from '@/public/images/icons/menu/access-management.svg';
import Approvals from '@/public/images/icons/menu/approvals.svg';
import Assets from '@/public/images/icons/menu/assets.svg';
import Builders from '@/public/images/icons/menu/builders.svg';
import Deployments from '@/public/images/icons/menu/deployments.svg';
import Entities from '@/public/images/icons/menu/entities.svg';
import Evaluation from '@/public/images/icons/menu/evaluation.svg';
import Playground from '@/public/images/icons/menu/playground.svg';
import Telemetry from '@/public/images/icons/menu/telemetry.svg';
import Tools from '@/public/images/icons/menu/tools.svg';
import MlOps from '@/public/images/icons/menu/ml-ops.svg';
import { MenuI18nKey } from '@/src/constants/i18n';
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

export const MENU_CONFIGURATION = (iconSize: number): MenuGroupConfiguration[] => [
  {
    key: MenuI18nKey.Entities,
    descriptionKey: MenuI18nKey.EntitiesDescription,
    icon: <Entities width={iconSize} height={iconSize} />,
    items: [
      { key: MenuI18nKey.Models, href: ApplicationRoute.Models },
      {
        key: MenuI18nKey.Applications,
        href: ApplicationRoute.Applications,
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
    icon: <Builders width={iconSize} height={iconSize} />,
    items: [
      {
        key: MenuI18nKey.ApplicationRunners,
        href: ApplicationRoute.ApplicationRunners,
      },
      {
        key: MenuI18nKey.Interceptors,
        href: ApplicationRoute.Interceptors,
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
    icon: <Assets width={iconSize} height={iconSize} />,
    items: [
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
    key: MenuI18nKey.MLOps,
    descriptionKey: MenuI18nKey.MCPDescription,
    icon: <MlOps width={iconSize} height={iconSize} />,
    items: [],
  },
  {
    key: MenuI18nKey.AccessManagement,
    descriptionKey: MenuI18nKey.AccessManagementDescription,
    icon: <AccessManagement width={iconSize} height={iconSize} />,
    items: [
      { key: MenuI18nKey.Roles, href: ApplicationRoute.Roles },
      { key: MenuI18nKey.Keys, href: ApplicationRoute.Keys },
      { key: MenuI18nKey.FoldersStorage, href: ApplicationRoute.FoldersStorage },
    ],
  },
  {
    key: MenuI18nKey.Tools,
    descriptionKey: MenuI18nKey.ToolsDescription,
    icon: <Tools width={iconSize} height={iconSize} />,
    items: [],
  },
  {
    key: MenuI18nKey.Approvals,
    descriptionKey: MenuI18nKey.ApprovalsDescription,
    icon: <Approvals width={iconSize} height={iconSize} />,
    items: [
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
    key: MenuI18nKey.Playground,
    descriptionKey: MenuI18nKey.AccessManagementDescription,
    icon: <Playground width={iconSize} height={iconSize} />,
    items: [],
  },
  {
    key: MenuI18nKey.Deployments,
    descriptionKey: MenuI18nKey.DeploymentsDescription,
    icon: <Deployments width={iconSize} height={iconSize} />,
    items: [],
  },
  {
    key: MenuI18nKey.Evaluation,
    descriptionKey: MenuI18nKey.EvaluationDescription,
    icon: <Evaluation width={iconSize} height={iconSize} />,
    items: [],
  },
  {
    key: MenuI18nKey.Telemetry,
    descriptionKey: MenuI18nKey.TelemetryDescription,
    icon: <Telemetry width={iconSize} height={iconSize} />,
    items: [
      {
        key: MenuI18nKey.Dashboard,
        href: ApplicationRoute.Dashboard,
      },
      {
        key: MenuI18nKey.ActivityAudit,
        href: ApplicationRoute.ActivityAudit,
      },
    ],
  },
];
