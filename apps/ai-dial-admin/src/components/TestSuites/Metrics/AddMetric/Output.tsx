import { FC } from 'react';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { DialTag } from '@epam/ai-dial-ui-kit';

interface Props {
  fields: SchemaFieldRow[];
  title: string;
}

const MetricOutput: FC<Props> = ({ fields, title }) => {
  return fields.length ? (
    <div className="flex flex-col">
      <p className="dial-small-semi mb-4">{title}</p>
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex flex-row gap-3 items-center">
              <div className="dial-small-text text-primary">{field.name}</div>
              <DialTag tag={field.type} />
            </div>
            <span className="dial-tiny-text text-secondary line-clamp-2" title={field.description}>
              {field.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

export default MetricOutput;
