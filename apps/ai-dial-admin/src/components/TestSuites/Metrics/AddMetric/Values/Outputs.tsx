import { FC } from 'react';

import { DialTag } from '@epam/ai-dial-ui-kit';

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
            <DialTag
              label={field.name}
              className="bg-accent-tertiary-alpha border border-accent-tertiary rounded-sm shrink-0 w-fit"
            />
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
