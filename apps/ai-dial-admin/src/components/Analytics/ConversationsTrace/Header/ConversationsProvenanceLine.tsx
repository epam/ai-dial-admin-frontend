'use client';

import classNames from 'classnames';
import { FC, Fragment } from 'react';

import { IconAsterisk, IconCirclesRelation } from '@tabler/icons-react';

import {
  CONVERSATION_ENRICHMENT_ENTITY,
  CONVERSATION_SOURCE_ENTITIES,
  PROVENANCE_TEXT_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const JOIN_ICON_SIZE = 14;
const PENDING_ICON_SIZE = 10;

const ENTITIES = [...CONVERSATION_SOURCE_ENTITIES, CONVERSATION_ENRICHMENT_ENTITY];

const ConversationsProvenanceLine: FC = () => {
  const t = useI18n();

  return (
    <p className="flex flex-wrap items-center gap-2 dial-small-text text-secondary">
      {t(ConversationsTraceI18nKey.ComposedOver)}
      {ENTITIES.map((entity, index) => (
        <Fragment key={entity.name}>
          {index > 0 && <IconCirclesRelation size={JOIN_ICON_SIZE} aria-hidden />}
          <span
            className={classNames('font-mono inline-flex items-center', PROVENANCE_TEXT_CLASS[entity.provenance])}
            title={entity.isPending ? t(ConversationsTraceI18nKey.EntityPending) : undefined}
          >
            {entity.name}
            {entity.isPending && <IconAsterisk className="ml-1" size={PENDING_ICON_SIZE} aria-hidden />}
          </span>
        </Fragment>
      ))}
    </p>
  );
};

export default ConversationsProvenanceLine;
