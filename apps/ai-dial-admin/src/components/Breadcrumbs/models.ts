import { MenuI18nKey } from '@/src/constants/i18n';

export interface BreadcrumbConfig {
  segments: {
    name: string;
    i18nKey?: MenuI18nKey;
    href?: boolean;
    isHidden?: boolean;
    isAdminApiOnly?: boolean;
    shouldEnrichWithFolderBreadcrumbs?: boolean;
  }[];
}

export interface Breadcrumb {
  key?: MenuI18nKey;
  name: string;
  href: string;
  callback?: (href: string) => void;
}
