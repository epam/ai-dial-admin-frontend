import { FC } from 'react';

import { DialInput, DialNeutralButton, DialSelectField } from '@epam/ai-dial-ui-kit';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity } from '@/src/models/analytics/entity';

interface Props {
  entities: AnalyticsEntity[];
  selectedEntityName: string;
  onSelectEntity: (name: string) => void;
  isComplex: boolean;
  instanceId: string;
  onChangeInstanceId: (value: string) => void;
  onLoadDetailed: () => void;
  fieldsLoaded: boolean;
  onOpenSchemaPreview: () => void;
}

const SourceSection: FC<Props> = ({
  entities,
  selectedEntityName,
  onSelectEntity,
  isComplex,
  instanceId,
  onChangeInstanceId,
  onLoadDetailed,
  fieldsLoaded,
  onOpenSchemaPreview,
}) => {
  const t = useI18n();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DialSelectField
        id="qb-entity"
        containerClassName={STANDARD_CONTROL_WIDTH}
        options={entities.map((e) => ({ value: e.name, label: e.complex ? `${e.name} (complex)` : e.name }))}
        value={selectedEntityName}
        onChange={(v) => onSelectEntity(v as string)}
      />

      {isComplex && (
        <>
          <DialInput
            id="qb-instance-id"
            labelProps={{ label: t(QueryBuilderI18nKey.InstanceId) }}
            containerClassName={STANDARD_CONTROL_WIDTH}
            value={instanceId}
            placeholder={t(QueryBuilderI18nKey.InstanceId)}
            onChange={(v) => onChangeInstanceId(v ?? '')}
          />
          <DialNeutralButton label={t(QueryBuilderI18nKey.LoadSchema)} onClick={onLoadDetailed} />
        </>
      )}

      {fieldsLoaded && <DialNeutralButton label={t(QueryBuilderI18nKey.SchemaPreview)} onClick={onOpenSchemaPreview} />}
    </div>
  );
};

export default SourceSection;
