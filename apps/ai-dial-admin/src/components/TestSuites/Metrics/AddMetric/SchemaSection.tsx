import { FC } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';
import { SchemaFieldRow } from '../../../Common/SchemaGrid/utils';

interface Props {
  title: string;
  fields: SchemaFieldRow[];
}

const MetricSchemaSection: FC<Props> = ({ title, fields }) => {
  return fields.length ? (
    <div className="flex flex-col gap-1">
      <p className="dial-small-semi mb-4">{title}</p>
      <div className="flex flex-col gap-1">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex flex-row gap-1 items-center">
              <div className="text-sm text-primary">{field.name}</div>
              <DialTag tag={field.type} />
            </div>
            <div className="tiny text-secondary">{field.description}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

export default MetricSchemaSection;
