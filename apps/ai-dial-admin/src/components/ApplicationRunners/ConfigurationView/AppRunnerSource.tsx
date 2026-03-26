'use client';

import { FC } from 'react';

import { DialLabel } from '@epam/ai-dial-ui-kit';

import { DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import EndpointAndMCPContainer from '@/src/components/SourceField/Application/EndpointAndMCPContainer';
import { useI18n } from '@/src/locales/client';

export enum SourceType {
  ENDPOINT = 'endpoint',
  MCP_CONTAINER = 'mcp',
}

export interface Props {
  entity: DialApplicationScheme;
  view?: ApplicationRoute;
  isEntityImmutable?: boolean;
  isReadOnlyAdmin?: boolean;
  onChangeEntity: (entity: DialApplicationScheme) => void;
  isModal?: boolean;
}

const AppRunnerSource: FC<Props> = ({ entity, onChangeEntity, isEntityImmutable, isReadOnlyAdmin, isModal, view }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col w-full gap-2">
      <DialLabel label={t(EntitiesI18nKey.SourceType)} />
      <EndpointAndMCPContainer
        entity={entity}
        isEntityImmutable={isEntityImmutable}
        isReadOnlyAdmin={isReadOnlyAdmin}
        onChangeEntity={onChangeEntity}
        isModal={isModal}
        view={view}
      />
    </div>
  );
};

export default AppRunnerSource;
