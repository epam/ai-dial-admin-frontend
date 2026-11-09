import { FC } from 'react';

import { ApprovedResource } from '@/src/models/dial/resource-dependency';
import { formatResource } from '../utils/resources';

interface Props {
  resources: ApprovedResource[];
  ariaLabel: string;
}

const ResourceList: FC<Props> = ({ resources, ariaLabel }) => (
  <ul aria-label={ariaLabel} className="flex flex-col gap-1 dial-small-text text-primary break-words">
    {resources.map((resource, index) => (
      <li key={`${resource.path}-${index}`}>{formatResource(resource)}</li>
    ))}
  </ul>
);

export default ResourceList;
