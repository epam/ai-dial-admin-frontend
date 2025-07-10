import { ApplicationPublication } from '@/src/models/dial/publications';
import { FC } from 'react';

interface Props {
  publication: ApplicationPublication;
}

const ApplicationProperties: FC<Props> = ({ publication }) => {
  console.log('ApplicationProperties', publication);
  return <div>{publication.action}</div>;
};

export default ApplicationProperties;
