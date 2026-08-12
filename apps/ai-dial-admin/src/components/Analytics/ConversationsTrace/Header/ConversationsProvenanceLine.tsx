'use client';

import classNames from 'classnames';
import { FC, Fragment } from 'react';

import { IconCirclesRelation } from '@tabler/icons-react';

import { CONVERSATION_SOURCE_ENTITIES, PROVENANCE_TEXT_CLASS } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const JOIN_ICON_SIZE = 14;

const ConversationsProvenanceLine: FC = () => {
  const t = useI18n();

  return (
    <p className="flex flex-wrap items-center gap-2 dial-small-text text-secondary">
      {t(ConversationsTraceI18nKey.ComposedOver)}
      {CONVERSATION_SOURCE_ENTITIES.map((entity, index) => (
        <Fragment key={entity.name}>
          {index > 0 && <IconCirclesRelation size={JOIN_ICON_SIZE} aria-hidden />}
          <span className={classNames('font-mono', PROVENANCE_TEXT_CLASS[entity.provenance])}>{entity.name}</span>
        </Fragment>
      ))}
    </p>
  );
};

export default ConversationsProvenanceLine;
