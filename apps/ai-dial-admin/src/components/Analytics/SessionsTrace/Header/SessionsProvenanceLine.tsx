'use client';

import classNames from 'classnames';
import { FC, Fragment, useMemo } from 'react';

import { IconCirclesRelation } from '@tabler/icons-react';

import {
  SESSIONS_ENTITY,
  PROVENANCE_TEXT_CLASS,
  QUERIED_SOURCE_ENTITIES,
} from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { composedSourceEntities } from '@/src/utils/analytics/session-column-catalog';

const JOIN_ICON_SIZE = 14;

interface Props {
  schemaFields?: AnalyticsEntityField[] | null;
}

const SessionsProvenanceLine: FC<Props> = ({ schemaFields }) => {
  const t = useI18n();

  const entities = useMemo(
    () => composedSourceEntities(SESSIONS_ENTITY, schemaFields ?? [], QUERIED_SOURCE_ENTITIES),
    [schemaFields],
  );

  return (
    <p className="flex flex-wrap items-center gap-2 dial-small-text text-secondary">
      {t(SessionsTraceI18nKey.ComposedOver)}
      {entities.map((entity, index) => (
        <Fragment key={entity.name}>
          {index > 0 && <IconCirclesRelation size={JOIN_ICON_SIZE} aria-hidden />}
          <span className={classNames('font-mono', PROVENANCE_TEXT_CLASS[entity.provenance])}>{entity.name}</span>
        </Fragment>
      ))}
    </p>
  );
};

export default SessionsProvenanceLine;
