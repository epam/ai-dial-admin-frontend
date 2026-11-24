'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';

import { SAVED_QUERY_SCOPE_I18N } from '@/src/constants/analytics/queries';
import { useI18n } from '@/src/locales/client';
import { SavedQueryScope } from '@/src/models/analytics/saved-query';

const SCOPE_BADGE_COLOR: Record<SavedQueryScope, BadgeColor> = {
  [SavedQueryScope.Personal]: BadgeColor.Violet,
  [SavedQueryScope.Common]: BadgeColor.Green,
};

interface Props {
  scope: SavedQueryScope;
}

const ScopeBadge: FC<Props> = ({ scope }) => {
  const t = useI18n();

  return (
    <Badge variant={BadgeVariant.Filled} color={SCOPE_BADGE_COLOR[scope]} label={t(SAVED_QUERY_SCOPE_I18N[scope])} />
  );
};

export default ScopeBadge;
