import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';

interface Props {
  fields: SchemaFieldRow[];
  title: string;
}

const MetricOutputs: FC<Props> = ({ fields, title }) => {
  return fields.length ? (
    <div className="flex flex-col gap-3">
      <p className="text-base font-semibold text-primary leading-6">{title}</p>
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <Badge label={field.name} variant={BadgeVariant.Filled} color={BadgeColor.Violet} />
            {field.description ? (
              <span className="dial-tiny-text text-secondary" title={field.description}>
                {field.description}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

export default MetricOutputs;
